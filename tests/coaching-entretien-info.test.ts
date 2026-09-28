import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Fiche d'entretien (FICHE_ENTRETIEN_ET_SUIVI_COACHING.md) : updateEntretienInfo
// est la première brique de données pour "Synthèse et proposition" (prix
// réel et périmètre convenus pour CE client, distincts du produit acheté).
// Comme pour le défaut d'audit n°2 déjà corrigé sur les sections van, la
// version doit être vérifiée ET écrite dans la même requête — ce test le
// prouve avec le vrai service transpilé (aucune base réelle), plus la
// validation du prix et la journalisation d'événement.

function httpErrorStubs() {
  class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return {
    badRequest: (message: string) => new HttpError(400, message),
    notFound: (message: string) => new HttpError(404, message),
    conflict: (message: string) => new HttpError(409, message),
  };
}

function makeFakePrisma(initial: { id: string; entretienUpdatedAt: Date }) {
  const project: Record<string, unknown> = { ...initial };
  const tx = {
    coachingProject: {
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        if (where.id !== project.id) return { count: 0 };
        const expected = where.entretienUpdatedAt as Date;
        const current = project.entretienUpdatedAt as Date;
        if (expected.getTime() !== current.getTime()) return { count: 0 };
        Object.assign(project, data);
        return { count: 1 };
      },
      findUnique: async ({ where }: { where: { id: string } }) => (where.id === project.id ? { id: project.id } : null),
      findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
        if (where.id !== project.id) throw new Error("not found");
        return { ...project };
      },
    },
  };
  return { prisma: { $transaction: async (cb: (tx: unknown) => unknown) => cb(tx) }, project };
}

function loadService(fakePrisma: unknown, events: { type: string }[]) {
  const source = ts.transpileModule(readFileSync("lib/services/coaching-project.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} as Record<string, (...args: unknown[]) => Promise<unknown>> };
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    require: (id: string) => {
      if (id === "@/lib/http-errors") return httpErrorStubs();
      if (id === "@/lib/prisma") return fakePrisma;
      if (id === "@/lib/services/coaching-project-events") {
        return { logCoachingProjectEvent: async (_tx: unknown, _projectId: string, type: string) => { events.push({ type }); } };
      }
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return loadedModule.exports;
}

test("updateEntretienInfo: version+ID vérifiés et écrits en une seule requête, événement journalisé", async () => {
  const originalVersion = new Date("2026-01-01T00:00:00Z");
  const { prisma, project } = makeFakePrisma({ id: "project-1", entretienUpdatedAt: originalVersion });
  const events: { type: string }[] = [];
  const service = loadService({ prisma }, events);

  const updated = (await service.updateEntretienInfo({
    projectId: "project-1",
    expectedEntretienUpdatedAt: originalVersion,
    fields: { preoccupations: "Craint de mal dimensionner la batterie", accordPrixCents: 19900, accordPerimetre: "Relecture du schéma" },
    actor: { kind: "coach" },
  })) as Record<string, unknown>;

  assert.equal(updated.preoccupations, "Craint de mal dimensionner la batterie");
  assert.equal(updated.accordPrixCents, 19900);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "ENTRETIEN");
  const newVersion = project.entretienUpdatedAt as Date;
  assert.notEqual(newVersion.getTime(), originalVersion.getTime());

  // Rejeu avec l'ancienne version : conflit, aucune donnée déjà enregistrée écrasée.
  await assert.rejects(
    () =>
      service.updateEntretienInfo({
        projectId: "project-1",
        expectedEntretienUpdatedAt: originalVersion,
        fields: { preoccupations: "valeur rejouée à tort" },
        actor: { kind: "coach" },
      }),
    /modifiée entre-temps/
  );
  assert.equal(project.preoccupations, "Craint de mal dimensionner la batterie");

  // Projet inexistant : erreur dédiée, pas un conflit trompeur.
  await assert.rejects(
    () =>
      service.updateEntretienInfo({
        projectId: "does-not-exist",
        expectedEntretienUpdatedAt: originalVersion,
        fields: { preoccupations: "x" },
        actor: { kind: "coach" },
      }),
    /introuvable/
  );
});

test("updateEntretienInfo: refuse un prix convenu négatif ou non entier", async () => {
  const originalVersion = new Date("2026-01-01T00:00:00Z");
  const { prisma } = makeFakePrisma({ id: "project-1", entretienUpdatedAt: originalVersion });
  const service = loadService({ prisma }, []);

  await assert.rejects(
    () =>
      service.updateEntretienInfo({
        projectId: "project-1",
        expectedEntretienUpdatedAt: originalVersion,
        fields: { accordPrixCents: -100 },
        actor: { kind: "coach" },
      }),
    /invalide/
  );
});

test("createCoachingActionItem: enregistre le responsable (coach/client) quand il est fourni", async () => {
  const created: Record<string, unknown>[] = [];
  const prisma = {
    coachingProject: { findUnique: async () => ({ id: "project-1" }) },
    coachingActionItem: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return { id: "action-1", ...data };
      },
    },
  };
  const service = loadService({ prisma }, []);

  await service.createCoachingActionItem({ projectId: "project-1", label: "Ajouter une photo de la batterie", responsible: "CLIENT" });
  await service.createCoachingActionItem({ projectId: "project-1", label: "Relire le dossier" });

  assert.equal(created[0].responsible, "CLIENT");
  assert.equal(created[1].responsible, null, "aucune valeur inventée quand le responsable n'est pas précisé");
});

test("addQuickCoachingNote: une seule opération crée la séance déjà réalisée et l'action suivante, sans rendez-vous préalable", async () => {
  const createdSessions: Record<string, unknown>[] = [];
  const createdActions: Record<string, unknown>[] = [];
  const projectUpdates: Record<string, unknown>[] = [];
  const events: { type: string; note?: string }[] = [];
  let sessionSeq = 0;

  const tx = {
    coachingSession: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const session = { id: `session-${++sessionSeq}`, ...data };
        createdSessions.push(session);
        return session;
      },
    },
    coachingActionItem: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const action = { id: "action-1", ...data };
        createdActions.push(action);
        return action;
      },
    },
    coachingProject: {
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        projectUpdates.push({ ...where, ...data });
      },
    },
  };
  const prisma = {
    coachingProject: { findUnique: async () => ({ id: "project-1" }) },
    $transaction: async (cb: (tx: unknown) => unknown) => cb(tx),
  };
  const service = loadService({ prisma }, events);

  const result = (await service.addQuickCoachingNote({
    projectId: "project-1",
    channel: "WhatsApp",
    subject: "Emplacement du matériel",
    conclusion: "Le client envoie une photo avant de poursuivre.",
    nextAction: { label: "Envoyer une photo du compartiment batterie", responsible: "CLIENT" },
    actor: { kind: "coach" },
  })) as { session: Record<string, unknown>; action: Record<string, unknown> | null };

  assert.equal(createdSessions.length, 1);
  assert.equal(result.session.status, "REALISEE", "jamais un rendez-vous fictif à venir");
  assert.equal(result.session.channel, "WhatsApp");
  assert.equal(result.session.sharedWithClient, false, "privé par défaut, jamais partagé sans action explicite");

  assert.equal(createdActions.length, 1);
  assert.equal(result.action?.responsible, "CLIENT");
  assert.equal(result.action?.sessionId, result.session.id, "l'action suivante est rattachée à cette note");

  assert.equal(projectUpdates.length, 1);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "QUICK_NOTE");
});

test("addQuickCoachingNote: sans prochaine action fournie, aucune CoachingActionItem n'est créée", async () => {
  const tx = {
    coachingSession: { create: async ({ data }: { data: Record<string, unknown> }) => ({ id: "session-1", ...data }) },
    coachingActionItem: { create: async () => { throw new Error("must not be called"); } },
    coachingProject: { update: async () => {} },
  };
  const prisma = { coachingProject: { findUnique: async () => ({ id: "project-1" }) }, $transaction: async (cb: (tx: unknown) => unknown) => cb(tx) };
  const service = loadService({ prisma }, []);

  const result = (await service.addQuickCoachingNote({
    projectId: "project-1",
    channel: "Visio",
    subject: "Point rapide",
    conclusion: "Rien à signaler.",
    actor: { kind: "coach" },
  })) as { action: unknown };

  assert.equal(result.action, null);
});

test("listActiveProjectsWithoutNextAction: ne retient que les projets actifs sans aucune action A_FAIRE ouverte", async () => {
  let capturedWhere: Record<string, unknown> | null = null;
  const prisma = {
    coachingProject: {
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        capturedWhere = where;
        return [{ id: "project-1" }];
      },
    },
  };
  const service = loadService({ prisma }, []);

  const result = (await service.listActiveProjectsWithoutNextAction()) as unknown[];

  assert.equal(result.length, 1);
  // JSON.stringify plutôt que deepEqual : capturedWhere est construit par le
  // code transpilé dans un contexte vm distinct (realm différent), ce que
  // deepEqual signale comme "not reference-equal" même à structure identique.
  assert.equal(
    JSON.stringify(capturedWhere),
    JSON.stringify({ status: { in: ["A_DEMARRER", "EN_COURS"] }, actions: { none: { status: "A_FAIRE" } } })
  );
});

test("getCoachingClient: inclut le prospect d'origine (historique accessible sans être recopié)", async () => {
  let capturedInclude: Record<string, unknown> | null = null;
  const prisma = {
    customer: {
      findUnique: async ({ include }: { include: Record<string, unknown> }) => {
        capturedInclude = include;
        return {
          id: "cust-1",
          coachingProjects: [],
          convertedFromProspect: { id: "prospect-1", source: "FACEBOOK", events: [] },
        };
      },
    },
  };
  const service = loadService({ prisma }, []);

  const result = (await service.getCoachingClient("cust-1")) as { convertedFromProspect: { id: string } | null };

  assert.equal(result.convertedFromProspect?.id, "prospect-1");
  assert.ok(capturedInclude && "convertedFromProspect" in capturedInclude, "the prospect relation must be requested");
});

test("closeCoachingProject: enregistre la synthèse, l'horodatage, le statut et journalise un événement", async () => {
  const events: { type: string; note?: string }[] = [];
  const updates: Record<string, unknown>[] = [];
  const tx = {
    coachingProject: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data);
        return { id: "project-1", ...data };
      },
    },
  };
  const prisma = {
    coachingProject: { findUnique: async () => ({ id: "project-1" }) },
    $transaction: async (cb: (tx: unknown) => unknown) => cb(tx),
  };
  const service = loadService({ prisma }, events);

  const result = (await service.closeCoachingProject({
    projectId: "project-1",
    resume: "  Installation terminée, deux points restent à la charge du client.  ",
    actor: { kind: "coach" },
  })) as { status: string; clotureResume: string; clotureAt: Date };

  assert.equal(result.status, "TERMINE");
  assert.equal(result.clotureResume, "Installation terminée, deux points restent à la charge du client.");
  // `instanceof Date` échouerait ici : l'objet vient du code transpilé
  // exécuté dans un contexte vm distinct (realm différent, sa propre classe
  // Date). On vérifie la forme plutôt que la classe exacte.
  assert.equal(typeof (updates[0].clotureAt as { getTime?: unknown })?.getTime, "function");
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "CLOTURE");
});

test("closeCoachingProject: une synthèse vide n'invente pas de texte (null explicite)", async () => {
  const tx = { coachingProject: { update: async ({ data }: { data: Record<string, unknown> }) => ({ id: "project-1", ...data }) } };
  const prisma = {
    coachingProject: { findUnique: async () => ({ id: "project-1" }) },
    $transaction: async (cb: (tx: unknown) => unknown) => cb(tx),
  };
  const service = loadService({ prisma }, []);

  const result = (await service.closeCoachingProject({ projectId: "project-1", actor: { kind: "coach" } })) as {
    clotureResume: string | null;
    bilanCeQuiAAide: string | null;
    bilanCeQuiAPrisDuTemps: string | null;
    bilanAAmeliorer: string | null;
  };
  assert.equal(result.clotureResume, null);
  assert.equal(result.bilanCeQuiAAide, null);
  assert.equal(result.bilanCeQuiAPrisDuTemps, null);
  assert.equal(result.bilanAAmeliorer, null);
});

// Bilan interne (PLAN_EXECUTION_CRM_CLAUDE.md §4 lot E) — distinct de
// clotureResume : jamais exposé au client, sert uniquement à Fabien pour
// améliorer son offre au fil des accompagnements.
test("closeCoachingProject: enregistre le bilan interne (ce qui a aidé / pris du temps / à changer) sans le mêler à la synthèse partagée", async () => {
  const updates: Record<string, unknown>[] = [];
  const tx = {
    coachingProject: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data);
        return { id: "project-1", ...data };
      },
    },
  };
  const prisma = {
    coachingProject: { findUnique: async () => ({ id: "project-1" }) },
    $transaction: async (cb: (tx: unknown) => unknown) => cb(tx),
  };
  const service = loadService({ prisma }, []);

  const result = (await service.closeCoachingProject({
    projectId: "project-1",
    resume: "Synthèse partagée avec le client.",
    bilanCeQuiAAide: "  Le client avait déjà fait ses recherches  ",
    bilanCeQuiAPrisDuTemps: "Trouver le bon convertisseur",
    bilanAAmeliorer: "Demander la marque du frigo dès le premier échange",
    actor: { kind: "coach" },
  })) as {
    clotureResume: string;
    bilanCeQuiAAide: string;
    bilanCeQuiAPrisDuTemps: string;
    bilanAAmeliorer: string;
  };

  assert.equal(result.clotureResume, "Synthèse partagée avec le client.");
  assert.equal(result.bilanCeQuiAAide, "Le client avait déjà fait ses recherches");
  assert.equal(result.bilanCeQuiAPrisDuTemps, "Trouver le bon convertisseur");
  assert.equal(result.bilanAAmeliorer, "Demander la marque du frigo dès le premier échange");
  assert.notEqual(
    updates[0].clotureResume,
    updates[0].bilanCeQuiAAide,
    "the internal bilan must never be folded into the client-facing summary field"
  );
});

test("reopenCoachingProject: refuse un projet qui n'est pas clôturé, sinon repasse en cours sans effacer la synthèse", async () => {
  const events: { type: string }[] = [];
  let currentStatus = "EN_COURS";
  const tx = {
    coachingProject: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        currentStatus = data.status as string;
        return { id: "project-1", ...data };
      },
    },
  };
  const prisma = {
    coachingProject: { findUnique: async () => ({ id: "project-1", status: currentStatus }) },
    $transaction: async (cb: (tx: unknown) => unknown) => cb(tx),
  };
  const service = loadService({ prisma }, events);

  await assert.rejects(() => service.reopenCoachingProject({ projectId: "project-1", actor: { kind: "coach" } }), /n'est pas clôturé/);

  currentStatus = "TERMINE";
  const result = (await service.reopenCoachingProject({ projectId: "project-1", actor: { kind: "coach" } })) as { status: string };
  assert.equal(result.status, "EN_COURS");
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "REOUVERTURE");
});

test("listAcceptedProposalsAwaitingPayment: ne retient que les accords acceptés dont le paiement n'est pas complet", async () => {
  let capturedWhere: Record<string, unknown> | null = null;
  const prisma = {
    coachingProposal: {
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        capturedWhere = where;
        return [{ id: "proposal-1" }];
      },
    },
  };
  const service = loadService({ prisma }, []);

  const result = (await service.listAcceptedProposalsAwaitingPayment()) as unknown[];

  assert.equal(result.length, 1);
  assert.equal(
    JSON.stringify(capturedWhere),
    JSON.stringify({ status: "ACCEPTEE", paymentStatus: { not: "PAYE" } })
  );
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Etape 3 de PROMPT_REPRISE_CLAUDE_CRM.md : "preparer une reprise
// idempotente, avec simulation a blanc, correspondances explicites,
// comptages et cas ambigus signales". Ce test exécute le vrai service
// transpilé (aucune base réelle) et prouve, sur un jeu de dossiers
// représentatif : (1) un dry run ne fait STRICTEMENT aucune écriture ; (2)
// un dossier sans commande (« découverte ») est toujours signalé, jamais
// migré automatiquement ; (3) un client ayant déjà un CoachingProject non
// lié est signalé comme ambigu, jamais fusionné par supposition ; (4) le
// cas limpide (commande sans aucun CoachingProject existant pour ce client)
// est créé avec ses événements/documents/rendez-vous correctement repris ;
// (5) rejouer la migration après coup est idempotent (plus de doublon) ;
// (6) un document en collision de bucket/path est ignoré et signalé, jamais
// écrasé ni dupliqué.

function loadMigrationService(deps: Record<string, unknown>) {
  const source = ts.transpileModule(readFileSync("lib/services/coaching-dossier-migration.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = {
    exports: {} as {
      planOrRunDossierClientMigration: (options: { dryRun: boolean }) => Promise<{
        dryRun: boolean;
        outcomes: Array<Record<string, unknown>>;
        counts: Record<string, number>;
      }>;
    },
  };
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    require: (id: string) => {
      if (id in deps) return deps[id];
      // Notification best-effort (retour utilisateur : "rajoute automatique
      // des contacts à mon téléphone") — pas l'objet de ce test, neutralisée
      // ici pour ne pas re-router chaque scénario existant.
      if (id === "@/lib/services/coaching-project") return { notifyCoachOfNewCoachingClient: async () => {} };
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return loadedModule.exports;
}

type FakeDossier = {
  id: string;
  customerId: string;
  orderId: string | null;
  offre: "DECOUVERTE" | "CONSEIL" | "GUIDE" | "CONCEPTION";
  whatsapp: string | null;
  statutSimple: string | null;
  compteRendu: string | null;
  etapeActuelle: string | null;
  etapeOverride: string | null;
  iterationCount: number;
  dateLivraison: Date | null;
  consentementPartage: boolean;
  consentementPartageAt: Date | null;
  temoignageDemande: boolean;
  temoignageRecu: boolean;
  j30MessageEnvoye: boolean;
  purgeWarningSentAt: Date | null;
  confirmationEmailSentAt: Date | null;
  besoinVehicule: string | null;
  besoinDescription: string | null;
  besoinProgress: string | null;
  besoinDeadline: string | null;
  besoinAutre: string | null;
  notesInternes: string | null;
  derniereActivite: Date;
  createdAt: Date;
  events: { type: string; fromEtape: string | null; toEtape: string | null; note: string | null; authorName: string; createdAt: Date }[];
  documents: {
    id: string;
    filename: string;
    bucket: string;
    path: string;
    contentType: string | null;
    sizeBytes: number;
    uploadedBy: string;
    createdAt: Date;
  }[];
  appointments: { id: string; scheduledAt: Date; durationMinutes: number; compteRendu: string | null; createdAt: Date; updatedAt: Date }[];
};

function baseDossier(overrides: Partial<FakeDossier> & Pick<FakeDossier, "id" | "customerId" | "orderId" | "offre">): FakeDossier {
  const now = new Date("2027-01-01T00:00:00Z");
  return {
    whatsapp: null,
    statutSimple: null,
    compteRendu: null,
    etapeActuelle: null,
    etapeOverride: null,
    iterationCount: 0,
    dateLivraison: null,
    consentementPartage: false,
    consentementPartageAt: null,
    temoignageDemande: false,
    temoignageRecu: false,
    j30MessageEnvoye: false,
    purgeWarningSentAt: null,
    confirmationEmailSentAt: null,
    besoinVehicule: null,
    besoinDescription: null,
    besoinProgress: null,
    besoinDeadline: null,
    besoinAutre: null,
    notesInternes: null,
    derniereActivite: now,
    createdAt: now,
    events: [],
    documents: [],
    appointments: [],
    ...overrides,
  };
}

function makeFakePrisma(dossiers: FakeDossier[], existingCoachingProjects: { id: string; customerId: string; orderId: string | null }[]) {
  const createdProjects: Record<string, unknown>[] = [];
  const createdEvents: Record<string, unknown>[] = [];
  const createdDocuments: Record<string, unknown>[] = [];
  const createdSessions: Record<string, unknown>[] = [];
  const projectsByOrderId = new Map(existingCoachingProjects.filter((p) => p.orderId).map((p) => [p.orderId as string, p]));
  const documentIndex = new Set<string>(); // "bucket:path" déjà pris, tous circuits confondus

  let nextId = 1;

  const tx = {
    coachingProject: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const id = `new-project-${nextId++}`;
        const record = { id, ...data };
        createdProjects.push(record);
        if (data.orderId) projectsByOrderId.set(data.orderId as string, { id, customerId: data.customerId as string, orderId: data.orderId as string });
        return record;
      },
    },
    coachingProjectEvent: {
      createMany: async ({ data }: { data: Record<string, unknown>[] }) => {
        createdEvents.push(...data);
      },
    },
    coachingProjectDocument: {
      findUnique: async ({ where }: { where: { bucket_path: { bucket: string; path: string } } }) => {
        const key = `${where.bucket_path.bucket}:${where.bucket_path.path}`;
        return documentIndex.has(key) ? { id: "existing" } : null;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        documentIndex.add(`${data.bucket}:${data.path}`);
        createdDocuments.push(data);
      },
    },
    coachingSession: {
      createMany: async ({ data }: { data: Record<string, unknown>[] }) => {
        createdSessions.push(...data);
      },
    },
  };

  const prisma = {
    dossierClient: {
      findMany: async () => dossiers.map((d) => ({ id: d.id })),
      findUnique: async ({ where }: { where: { id: string } }) => dossiers.find((d) => d.id === where.id) ?? null,
    },
    coachingProject: {
      findUnique: async ({ where }: { where: { orderId: string } }) => projectsByOrderId.get(where.orderId) ?? null,
      findMany: async ({ where }: { where: { customerId: string; orderId: null } }) =>
        existingCoachingProjects.filter((p) => p.customerId === where.customerId && p.orderId === null),
    },
    $transaction: async (cb: (tx: unknown) => unknown) => cb(tx),
  };

  return { prisma, createdProjects, createdEvents, createdDocuments, createdSessions };
}

test("dry run: aucune écriture, tous les cas correctement classés", async () => {
  const dossiers: FakeDossier[] = [
    baseDossier({ id: "d-clean", customerId: "cust-1", orderId: "order-1", offre: "GUIDE" }),
    baseDossier({ id: "d-decouverte", customerId: "cust-2", orderId: null, offre: "DECOUVERTE" }),
    baseDossier({ id: "d-ambiguous", customerId: "cust-3", orderId: "order-3", offre: "CONSEIL" }),
    baseDossier({ id: "d-already", customerId: "cust-4", orderId: "order-4", offre: "CONCEPTION" }),
  ];
  const existing = [
    { id: "crm-project-3", customerId: "cust-3", orderId: null }, // candidat ambigu pour cust-3
    { id: "crm-project-4", customerId: "cust-4", orderId: "order-4" }, // déjà migré
  ];
  const { prisma, createdProjects, createdEvents, createdDocuments, createdSessions } = makeFakePrisma(dossiers, existing);
  const { planOrRunDossierClientMigration } = loadMigrationService({ "@/lib/prisma": { prisma } });

  const report = await planOrRunDossierClientMigration({ dryRun: true });

  assert.deepEqual(createdProjects, [], "dry run must not create anything");
  assert.deepEqual(createdEvents, []);
  assert.deepEqual(createdDocuments, []);
  assert.deepEqual(createdSessions, []);

  assert.equal(report.counts.would_create, 1);
  assert.equal(report.counts.ambiguous_no_order, 1);
  assert.equal(report.counts.ambiguous_existing_candidates, 1);
  assert.equal(report.counts.already_migrated, 1);

  const byId = Object.fromEntries(report.outcomes.map((o) => [o.dossierId, o]));
  assert.equal(byId["d-clean"].status, "would_create");
  assert.equal(byId["d-decouverte"].status, "ambiguous_no_order");
  assert.equal(byId["d-ambiguous"].status, "ambiguous_existing_candidates");
  assert.deepEqual(byId["d-ambiguous"].candidateIds, ["crm-project-3"]);
  assert.equal(byId["d-already"].status, "already_migrated");
  assert.equal(byId["d-already"].coachingProjectId, "crm-project-4");
});

test("apply: crée le dossier limpide avec ses satellites, laisse les cas ambigus intacts, et rejouer est idempotent", async () => {
  const dossiers: FakeDossier[] = [
    baseDossier({
      id: "d-clean",
      customerId: "cust-1",
      orderId: "order-1",
      offre: "GUIDE",
      whatsapp: "+33600000000",
      events: [{ type: "ETAPE", fromEtape: "A", toEtape: "B", note: "note libre", authorName: "FabSystem", createdAt: new Date("2026-06-01T00:00:00Z") }],
      documents: [
        { id: "doc-1", filename: "schema.pdf", bucket: "b1", path: "p1", contentType: "application/pdf", sizeBytes: 100, uploadedBy: "Client", createdAt: new Date() },
      ],
      appointments: [
        { id: "appt-1", scheduledAt: new Date("2026-05-01T10:00:00Z"), durationMinutes: 30, compteRendu: "Point fait", createdAt: new Date(), updatedAt: new Date() },
        { id: "appt-2", scheduledAt: new Date("2026-06-01T10:00:00Z"), durationMinutes: 30, compteRendu: null, createdAt: new Date(), updatedAt: new Date() },
      ],
    }),
    baseDossier({ id: "d-decouverte", customerId: "cust-2", orderId: null, offre: "DECOUVERTE" }),
    baseDossier({ id: "d-ambiguous", customerId: "cust-3", orderId: "order-3", offre: "CONSEIL" }),
  ];
  const existing = [{ id: "crm-project-3", customerId: "cust-3", orderId: null }];
  const { prisma, createdProjects, createdEvents, createdDocuments, createdSessions } = makeFakePrisma(dossiers, existing);
  const { planOrRunDossierClientMigration } = loadMigrationService({ "@/lib/prisma": { prisma } });

  const firstRun = await planOrRunDossierClientMigration({ dryRun: false });

  assert.equal(createdProjects.length, 1, "only the unambiguous dossier is created");
  const project = createdProjects[0] as { id: string; title: string; orderId: string; whatsapp: string };
  assert.equal(project.title, "Accompagnement guidé");
  assert.equal(project.orderId, "order-1");
  assert.equal(project.whatsapp, "+33600000000");

  assert.equal(createdEvents.length, 1);
  assert.equal((createdEvents[0] as { type: string }).type, "LEGACY_DOSSIER:ETAPE");

  assert.equal(createdDocuments.length, 1);
  assert.equal((createdDocuments[0] as { filename: string }).filename, "schema.pdf");

  assert.equal(createdSessions.length, 2);
  const sessionsByLegacyId = Object.fromEntries(
    (createdSessions as { legacyDossierAppointmentId: string; status: string }[]).map((s) => [s.legacyDossierAppointmentId, s])
  );
  assert.equal(sessionsByLegacyId["appt-1"].status, "REALISEE", "compte-rendu rempli => déduit REALISEE");
  assert.equal(sessionsByLegacyId["appt-2"].status, "PREVUE", "pas de compte-rendu => PREVUE, jamais ANNULEE inventée");

  const byId = Object.fromEntries(firstRun.outcomes.map((o) => [o.dossierId, o]));
  assert.equal(byId["d-clean"].status, "created");
  assert.equal(byId["d-decouverte"].status, "ambiguous_no_order", "jamais migré automatiquement");
  assert.equal(byId["d-ambiguous"].status, "ambiguous_existing_candidates", "jamais fusionné par supposition");

  // Rejeu : le dossier déjà créé doit être retrouvé par orderId et jamais
  // recréé — les deux cas ambigus restent ambigus tant qu'ils ne sont pas
  // résolus explicitement (aucune résolution automatique n'existe encore).
  const secondRun = await planOrRunDossierClientMigration({ dryRun: false });
  assert.equal(createdProjects.length, 1, "no duplicate CoachingProject on replay");
  const byId2 = Object.fromEntries(secondRun.outcomes.map((o) => [o.dossierId, o]));
  assert.equal(byId2["d-clean"].status, "already_migrated");
  assert.equal(byId2["d-decouverte"].status, "ambiguous_no_order");
  assert.equal(byId2["d-ambiguous"].status, "ambiguous_existing_candidates");
});

test("apply: un document en collision de bucket/path est ignoré et signalé, jamais écrasé", async () => {
  const dossiers: FakeDossier[] = [
    baseDossier({
      id: "d-with-conflict",
      customerId: "cust-1",
      orderId: "order-1",
      offre: "CONCEPTION",
      documents: [
        { id: "doc-ok", filename: "a.pdf", bucket: "b1", path: "already-taken", contentType: null, sizeBytes: 10, uploadedBy: "Client", createdAt: new Date() },
        { id: "doc-conflict", filename: "b.pdf", bucket: "b1", path: "already-taken", contentType: null, sizeBytes: 20, uploadedBy: "Client", createdAt: new Date() },
      ],
    }),
  ];
  const { prisma, createdDocuments } = makeFakePrisma(dossiers, []);
  const { planOrRunDossierClientMigration } = loadMigrationService({ "@/lib/prisma": { prisma } });

  const report = await planOrRunDossierClientMigration({ dryRun: false });

  // Le premier document du même chemin passe, le second (même bucket+path)
  // est détecté en collision par le service lui-même et jamais écrit.
  assert.equal(createdDocuments.length, 1);
  const outcome = report.outcomes[0];
  assert.equal(outcome.status, "created");
  // Array.from : le tableau vient du code transpilé exécuté dans un
  // contexte vm distinct (realm différent) — deepEqual échoue sinon sur des
  // tableaux structurellement identiques mais de prototypes différents.
  assert.deepEqual(Array.from(outcome.documentConflicts as string[]), ["doc-conflict"]);
});

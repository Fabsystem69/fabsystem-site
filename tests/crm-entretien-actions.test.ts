import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Câblage des actions serveur CRM pour la fiche d'entretien et la note
// rapide (docs/03-DATABASE.md, "couche de données de la fiche d'entretien").
// Exécute le vrai code transpilé (aucune base réelle) — même méthode que
// tests/crm-invitation-action.test.ts. updateEntretienInfoAction/
// addQuickCoachingNoteAction vivent dans project-lifecycle-actions.ts,
// createCoachingActionItemAction dans actions.ts (voir loadActions).

class RedirectSignal extends Error {
  target: string;
  constructor(target: string) {
    super("redirect");
    this.target = target;
  }
}

function httpErrorStubs() {
  class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return {
    HttpError,
    badRequest: (message: string) => new HttpError(400, message),
    isHttpError: (error: unknown) => error instanceof HttpError,
  };
}

function loadActions(
  coachingProjectDeps: Record<string, unknown>,
  httpErrors: Record<string, unknown> = httpErrorStubs(),
  // updateEntretienInfoAction/addQuickCoachingNoteAction vivent dans
  // project-lifecycle-actions.ts depuis l'extraction qui a gardé
  // actions.ts sous la limite de 800 lignes (règle de style du dépôt) —
  // createCoachingActionItemAction, lui, est resté dans actions.ts.
  filePath = "app/dashboard/crm/actions.ts"
) {
  const deps: Record<string, unknown> = {
    "@/lib/require-session": { requireSession: async () => {} },
    "@/lib/http-errors": httpErrors,
    "@/lib/coaching-vehicle-form": {
      parseOptionalEuroBudget: (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return null;
        return Math.round(Number(trimmed.replace(",", ".")) * 100);
      },
      parseAdminVehicleFields: () => ({}),
    },
    "@/lib/prisma": { prisma: {} },
    "@/lib/services/coaching-project": coachingProjectDeps,
    "next/navigation": {
      redirect: (target: string) => {
        throw new RedirectSignal(target);
      },
    },
    "next/cache": { revalidatePath: () => {} },
  };
  const source = ts.transpileModule(readFileSync(filePath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} as Record<string, (formData: FormData) => Promise<void>> };
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    require: (id: string) => {
      if (id in deps) return deps[id];
      if (id.startsWith("@/") || id === "next/cache") return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return loadedModule.exports;
}

async function invokeAndCaptureRedirect(action: (formData: FormData) => Promise<void>, formData: FormData) {
  try {
    await action(formData);
    throw new Error("expected a redirect");
  } catch (error) {
    if (error instanceof RedirectSignal) return error.target;
    throw error;
  }
}

test("updateEntretienInfoAction transmet les champs et convertit le prix en centimes", async () => {
  const calls: Record<string, unknown>[] = [];
  const actions = loadActions(
    {
      updateEntretienInfo: async (input: Record<string, unknown>) => {
        calls.push(input);
      },
    },
    httpErrorStubs(),
    "app/dashboard/crm/project-lifecycle-actions.ts"
  );

  const form = new FormData();
  form.set("projectId", "project-1");
  form.set("expectedEntretienUpdatedAt", "2026-01-01T00:00:00.000Z");
  form.set("preoccupations", "Craint de mal dimensionner");
  form.set("accordPrixEuros", "199");
  form.set("accordPerimetre", "Relecture du schéma");
  form.set("resumePartage", "Voici où vous en êtes.");

  const target = await invokeAndCaptureRedirect(actions.updateEntretienInfoAction, form);

  assert.equal(calls.length, 1);
  const call = calls[0] as { projectId: string; actor: { kind: string }; fields: Record<string, unknown> };
  assert.equal(call.projectId, "project-1");
  assert.equal(call.actor.kind, "coach");
  assert.equal(call.fields.accordPrixCents, 19900);
  assert.equal(call.fields.preoccupations, "Craint de mal dimensionner");
  assert.match(target, /success/);
});

test("updateEntretienInfoAction reporte un conflit de version sans faire planter l'action", async () => {
  // Même instance de HttpError que celle vue par actions.ts (via
  // @/lib/http-errors) : sinon isHttpError() échoue par instanceof
  // cross-module et retombe sur le message générique.
  const { HttpError, badRequest, isHttpError } = httpErrorStubs();
  const actions = loadActions(
    { updateEntretienInfo: async () => { throw new HttpError(409, "Cette section a été modifiée entre-temps"); } },
    { HttpError, badRequest, isHttpError },
    "app/dashboard/crm/project-lifecycle-actions.ts"
  );

  const form = new FormData();
  form.set("projectId", "project-1");
  form.set("expectedEntretienUpdatedAt", "2026-01-01T00:00:00.000Z");

  const target = await invokeAndCaptureRedirect(actions.updateEntretienInfoAction, form);
  assert.match(target, /error=/);
  assert.match(decodeURIComponent(target), /modifiée entre-temps/);
});

// D13 (AUDIT_INDEPENDANT_FABSYSTEM.md) : "la saisie en cours n'est pas
// reprise" en cas d'erreur — corrigé pour la fiche d'entretien en renvoyant
// la saisie brute dans l'URL de redirection plutôt qu'en la laissant
// disparaître derrière le seul message d'erreur.
test("updateEntretienInfoAction renvoie la saisie tapée dans l'URL d'erreur, sans rien perdre", async () => {
  const actions = loadActions(
    { updateEntretienInfo: async () => { throw new Error("Le budget doit être un montant positif avec au plus deux décimales."); } },
    httpErrorStubs(),
    "app/dashboard/crm/project-lifecycle-actions.ts"
  );

  const form = new FormData();
  form.set("projectId", "project-1");
  form.set("expectedEntretienUpdatedAt", "2026-01-01T00:00:00.000Z");
  form.set("preoccupations", "Craint de mal dimensionner la batterie");
  form.set("accordPrixEuros", "199,99,99");
  form.set("accordPerimetre", "Relecture complète du schéma");
  form.set("accordMiseAuPropre", "Incluse");
  form.set("resumePartage", "Bilan transmis, en attente de votre retour.");

  const target = await invokeAndCaptureRedirect(actions.updateEntretienInfoAction, form);

  const url = new URL(target, "http://localhost");
  const draft = JSON.parse(decodeURIComponent(url.searchParams.get("entretienDraft") ?? "")) as Record<string, string>;
  assert.equal(draft.preoccupations, "Craint de mal dimensionner la batterie");
  assert.equal(draft.accordPrixEuros, "199,99,99");
  assert.equal(draft.accordPerimetre, "Relecture complète du schéma");
  assert.equal(draft.accordMiseAuPropre, "Incluse");
  assert.equal(draft.resumePartage, "Bilan transmis, en attente de votre retour.");
});

test("addQuickCoachingNoteAction renvoie la note tapée dans l'URL d'erreur, sans rien perdre", async () => {
  const actions = loadActions(
    { addQuickCoachingNote: async () => { throw new Error("Canal requis."); } },
    httpErrorStubs(),
    "app/dashboard/crm/project-lifecycle-actions.ts"
  );

  const form = new FormData();
  form.set("projectId", "project-1");
  form.set("channel", "WhatsApp");
  form.set("subject", "Emplacement du matériel");
  form.set("conclusion", "Le client envoie une photo avant de poursuivre.");
  form.set("nextActionLabel", "Envoyer la photo");
  form.set("nextActionResponsible", "CLIENT");
  form.set("nextActionDueDate", "2026-10-01");
  form.set("sharedWithClient", "true");

  const target = await invokeAndCaptureRedirect(actions.addQuickCoachingNoteAction, form);

  const url = new URL(target, "http://localhost");
  const draft = JSON.parse(decodeURIComponent(url.searchParams.get("noteDraft") ?? "")) as Record<string, string>;
  assert.equal(draft.channel, "WhatsApp");
  assert.equal(draft.subject, "Emplacement du matériel");
  assert.equal(draft.conclusion, "Le client envoie une photo avant de poursuivre.");
  assert.equal(draft.nextActionLabel, "Envoyer la photo");
  assert.equal(draft.nextActionResponsible, "CLIENT");
  assert.equal(draft.nextActionDueDate, "2026-10-01");
  assert.equal(draft.sharedWithClient, "true");
});

test("addQuickCoachingNoteAction transmet la note et l'action suivante quand fournie", async () => {
  const calls: Record<string, unknown>[] = [];
  const actions = loadActions(
    {
      addQuickCoachingNote: async (input: Record<string, unknown>) => {
        calls.push(input);
        return { session: { id: "session-1" }, action: { id: "action-1" } };
      },
    },
    httpErrorStubs(),
    "app/dashboard/crm/project-lifecycle-actions.ts"
  );

  const form = new FormData();
  form.set("projectId", "project-1");
  form.set("channel", "WhatsApp");
  form.set("subject", "Emplacement du matériel");
  form.set("conclusion", "Le client envoie une photo.");
  form.set("nextActionLabel", "Envoyer la photo");
  form.set("nextActionResponsible", "CLIENT");
  form.set("sharedWithClient", "true");

  const target = await invokeAndCaptureRedirect(actions.addQuickCoachingNoteAction, form);

  assert.equal(calls.length, 1);
  const call = calls[0] as { channel: string; nextAction: { label: string; responsible: string; dueDate: unknown } | null; sharedWithClient: boolean };
  assert.equal(call.channel, "WhatsApp");
  // Comparaison propriété par propriété plutôt que deepEqual sur l'objet :
  // celui-ci est construit par le code transpilé exécuté dans un contexte vm
  // distinct (realm différent), ce que deepEqual signale comme "not
  // reference-equal" même à structure identique.
  assert.equal(call.nextAction?.label, "Envoyer la photo");
  assert.equal(call.nextAction?.responsible, "CLIENT");
  assert.equal(call.nextAction?.dueDate, null);
  assert.equal(call.sharedWithClient, true);
  assert.match(target, /success/);
});

test("addQuickCoachingNoteAction n'envoie aucune prochaine action quand le libellé est vide", async () => {
  const calls: Record<string, unknown>[] = [];
  const actions = loadActions(
    {
      addQuickCoachingNote: async (input: Record<string, unknown>) => {
        calls.push(input);
        return { session: { id: "session-1" }, action: null };
      },
    },
    httpErrorStubs(),
    "app/dashboard/crm/project-lifecycle-actions.ts"
  );

  const form = new FormData();
  form.set("projectId", "project-1");
  form.set("channel", "Visio");
  form.set("subject", "Point rapide");
  form.set("conclusion", "Rien à signaler.");

  await invokeAndCaptureRedirect(actions.addQuickCoachingNoteAction, form);

  const call = calls[0] as { nextAction: unknown };
  assert.equal(call.nextAction, null);
});

test("createCoachingActionItemAction transmet le responsable choisi", async () => {
  const calls: Record<string, unknown>[] = [];
  const actions = loadActions({
    createCoachingActionItem: async (input: Record<string, unknown>) => {
      calls.push(input);
    },
  });

  const form = new FormData();
  form.set("projectId", "project-1");
  form.set("label", "Ajouter une photo de la batterie");
  form.set("responsible", "CLIENT");

  await invokeAndCaptureRedirect(actions.createCoachingActionItemAction, form);

  assert.equal((calls[0] as { responsible: string }).responsible, "CLIENT");
});

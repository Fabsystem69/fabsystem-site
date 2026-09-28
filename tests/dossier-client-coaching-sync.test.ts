import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Pont temporaire de la consolidation (docs/03-DATABASE.md, "Bascule
// d'écriture et coexistence temporaire") : createDossierClientForOrder doit
// désormais aussi rattacher/créer le CoachingProject correspondant dès la
// création réelle du DossierClient, SANS jamais faire échouer la création du
// dossier ni son e-mail de confirmation si ce rattachement échoue ou est
// ambigu. Ce test exécute le vrai service transpilé (aucune base réelle).

function loadDossierClientService(deps: Record<string, unknown>) {
  const source = ts.transpileModule(readFileSync("lib/services/dossier-client.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exports: {} as any,
  };
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    process,
    require: (id: string) => {
      if (id in deps) return deps[id];
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return loadedModule.exports;
}

// Fabrique un faux prisma couvrant à la fois l'écriture principale
// DossierClient (findUnique/update/$transaction) ET les requêtes propres à
// mirrorIntoCoachingProject (dossierClient.findUnique select orderId,
// coachingProject.findUnique select id) — un seul dossier "en mémoire" pour
// les deux, comme en base réelle où c'est la même ligne.
// Reproduit le raccourci Prisma { increment: N } utilisé par
// addDossierIteration — un faux "update" naïf stockerait l'objet littéral
// au lieu du nombre incrémenté.
function applyPrismaData(current: Record<string, unknown>, data: Record<string, unknown>) {
  const resolved: Record<string, unknown> = { ...data };
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && "increment" in (value as Record<string, unknown>)) {
      resolved[key] = (Number(current[key]) || 0) + Number((value as { increment: number }).increment);
    }
  }
  return { ...current, ...resolved };
}

function makeMirrorFakePrisma(options: { orderId: string | null; linkedProjectId: string | null; offre?: string }) {
  let dossier: Record<string, unknown> = {
    id: "dossier-1",
    offre: options.offre ?? "GUIDE",
    etapeActuelle: "prise-de-contact",
    orderId: options.orderId,
    iterationCount: 0,
    whatsapp: null,
    notesInternes: null,
    dateLivraison: null,
    statutSimple: null,
    compteRendu: null,
  };
  const dossierEvents: Record<string, unknown>[] = [];
  const coachingProjectUpdates: Record<string, unknown>[] = [];

  const tx = {
    dossierClient: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        dossier = applyPrismaData(dossier, data);
        return { ...dossier };
      },
    },
    dossierEvent: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        dossierEvents.push(data);
      },
    },
    coachingProject: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        coachingProjectUpdates.push(data);
      },
    },
  };

  const prisma = {
    dossierClient: {
      findUnique: async () => ({ ...dossier }),
      update: async ({ data }: { data: Record<string, unknown> }) => {
        dossier = applyPrismaData(dossier, data);
        return { ...dossier };
      },
    },
    coachingProject: {
      findUnique: async () => (options.linkedProjectId ? { id: options.linkedProjectId } : null),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(tx),
  };

  return { prisma, dossierEvents, coachingProjectUpdates, getDossier: () => ({ ...dossier }) };
}

const coachingEventDeps = (events: Record<string, unknown>[]) => ({
  "@/lib/services/coaching-project-events": {
    logCoachingProjectEvent: async (_tx: unknown, projectId: string, type: string, actor: unknown, note?: string) => {
      events.push({ projectId, type, actor, note });
    },
  },
});

function makeFakePrisma() {
  const order = {
    id: "order-1",
    customerId: "customer-1",
    customerEmail: "client@example.invalid",
    customerName: "Client",
    items: [{ productSlug: "accompagnement-guide" }],
  };
  let dossier: { id: string; offre: string; confirmationEmailSentAt: Date | null } | null = null;

  const prisma = {
    order: { findUnique: async () => order },
    product: { findUnique: async () => ({ includedEditorAccessDays: 0 }) },
    dossierClient: {
      findUnique: async () => (dossier ? { ...dossier } : null),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        dossier = { id: "dossier-1", offre: data.offre as string, confirmationEmailSentAt: null };
        return { ...dossier };
      },
      update: async ({ data }: { data: { confirmationEmailSentAt: Date } }) => {
        if (dossier) dossier.confirmationEmailSentAt = data.confirmationEmailSentAt;
      },
    },
  };

  return { prisma };
}

test("createDossierClientForOrder rattache le CoachingProject correspondant à la création", async () => {
  const { prisma } = makeFakePrisma();
  const syncCalls: string[] = [];
  const { createDossierClientForOrder } = loadDossierClientService({
    "@/lib/prisma": { prisma },
    "@/lib/server-log": { logServerEvent: () => {} },
    "@/lib/services/email-templates": { renderEmailTemplate: async () => ({ subject: "s", text: "t", html: "h" }) },
    "@/lib/services/coaching-dossier-migration": {
      migrateOneDossierClient: async (dossierId: string) => {
        syncCalls.push(dossierId);
        return { status: "created", coachingProjectId: "cp-1" };
      },
    },
  });

  const result = await createDossierClientForOrder("order-1", {}, { sendMailImpl: async () => {} });

  assert.equal(result.status, "created");
  assert.deepEqual(syncCalls, ["dossier-1"], "the newly created dossier is synced into a CoachingProject");
});

test("un échec ou une ambiguïté du rattachement CoachingProject ne casse jamais la création du dossier", async () => {
  const { prisma } = makeFakePrisma();
  const loggedErrors: string[] = [];
  const { createDossierClientForOrder } = loadDossierClientService({
    "@/lib/prisma": { prisma },
    "@/lib/server-log": {
      logServerEvent: (level: string, message: string) => {
        if (level === "error") loggedErrors.push(message);
      },
    },
    "@/lib/services/email-templates": { renderEmailTemplate: async () => ({ subject: "s", text: "t", html: "h" }) },
    "@/lib/services/coaching-dossier-migration": {
      migrateOneDossierClient: async () => {
        throw new Error("ambiguous case, needs a human decision");
      },
    },
  });

  const result = await createDossierClientForOrder("order-1", {}, { sendMailImpl: async () => {} });

  assert.equal(result.status, "created", "dossier creation succeeds regardless of the coaching sync outcome");
  assert.equal(result.dossierId, "dossier-1");
  assert.ok(loggedErrors.some((m) => m.includes("sync dossier into coaching project")));
});

// Les fonctions ci-dessous couvrent le pont continu ajouté après la
// création initiale (mirrorIntoCoachingProject) : chaque mutation ultérieure
// d'un DossierClient déjà rattaché doit aussi se refléter dans le
// CoachingProject lié, sans jamais bloquer/casser l'écriture principale.

test("mirrorIntoCoachingProject est ignoré silencieusement quand le dossier n'a pas de orderId (dossier découverte)", async () => {
  const { prisma, coachingProjectUpdates } = makeMirrorFakePrisma({ orderId: null, linkedProjectId: "cp-1", offre: "CONSEIL" });
  const events: Record<string, unknown>[] = [];
  const { updateDossierSimpleStatus } = loadDossierClientService({
    "@/lib/prisma": { prisma },
    "@/lib/http-errors": { badRequest: (m: string) => new Error(m), notFound: (m: string) => new Error(m) },
    ...coachingEventDeps(events),
  });

  await updateDossierSimpleStatus({ dossierId: "dossier-1", statutSimple: "FAIT", compteRendu: "ok" });

  assert.equal(coachingProjectUpdates.length, 0, "no CoachingProject write attempted without an orderId");
  assert.equal(events.length, 0);
});

test("mirrorIntoCoachingProject est ignoré silencieusement quand aucun CoachingProject n'est lié à la commande", async () => {
  const { prisma, coachingProjectUpdates } = makeMirrorFakePrisma({ orderId: "order-1", linkedProjectId: null, offre: "CONSEIL" });
  const events: Record<string, unknown>[] = [];
  const { updateDossierSimpleStatus } = loadDossierClientService({
    "@/lib/prisma": { prisma },
    "@/lib/http-errors": { badRequest: (m: string) => new Error(m), notFound: (m: string) => new Error(m) },
    ...coachingEventDeps(events),
  });

  const updated = await updateDossierSimpleStatus({ dossierId: "dossier-1", statutSimple: "FAIT", compteRendu: "ok" });

  assert.equal(updated.statutSimple, "FAIT", "the primary DossierClient write still succeeds");
  assert.equal(coachingProjectUpdates.length, 0, "no CoachingProject write attempted without a linked project");
  assert.equal(events.length, 0);
});

test("updateDossierSimpleStatus reflète statutSimple/compteRendu dans le CoachingProject lié", async () => {
  const { prisma, coachingProjectUpdates } = makeMirrorFakePrisma({ orderId: "order-1", linkedProjectId: "cp-1", offre: "CONSEIL" });
  const events: Record<string, unknown>[] = [];
  const { updateDossierSimpleStatus } = loadDossierClientService({
    "@/lib/prisma": { prisma },
    "@/lib/http-errors": { badRequest: (m: string) => new Error(m), notFound: (m: string) => new Error(m) },
    ...coachingEventDeps(events),
  });

  await updateDossierSimpleStatus({ dossierId: "dossier-1", statutSimple: "FAIT", compteRendu: "Bilan transmis" });

  assert.equal(coachingProjectUpdates.length, 1);
  assert.equal(coachingProjectUpdates[0].statutSimple, "FAIT");
  assert.equal(coachingProjectUpdates[0].compteRendu, "Bilan transmis");
  assert.equal(events.length, 0, "no event log for a simple status mirror (matches the original function's own behavior)");
});

test("un échec du miroir ne casse jamais l'écriture principale du DossierClient", async () => {
  const { prisma, getDossier } = makeMirrorFakePrisma({ orderId: "order-1", linkedProjectId: "cp-1", offre: "CONSEIL" });
  const brokenPrisma = {
    ...prisma,
    coachingProject: {
      findUnique: async () => {
        throw new Error("database unreachable");
      },
    },
  };
  const loggedErrors: unknown[] = [];
  const { updateDossierSimpleStatus } = loadDossierClientService({
    "@/lib/prisma": { prisma: brokenPrisma },
    "@/lib/http-errors": { badRequest: (m: string) => new Error(m), notFound: (m: string) => new Error(m) },
    "@/lib/server-log": {
      logServerEvent: (level: string, message: string) => {
        if (level === "error") loggedErrors.push(message);
      },
    },
  });

  const updated = await updateDossierSimpleStatus({ dossierId: "dossier-1", statutSimple: "FAIT", compteRendu: "ok" });

  assert.equal(updated.statutSimple, "FAIT", "the primary write must succeed regardless of the mirror failing");
  assert.equal(getDossier().statutSimple, "FAIT");
  assert.ok(
    loggedErrors.some((m) => typeof m === "string" && m.includes("mirror")),
    "the mirror failure is logged, not thrown"
  );
});

test("advanceDossierStep reflète l'étape et journalise un événement LEGACY_DOSSIER:STEP_CHANGE", async () => {
  const { prisma, coachingProjectUpdates } = makeMirrorFakePrisma({ orderId: "order-1", linkedProjectId: "cp-1" });
  const events: Record<string, unknown>[] = [];
  const { advanceDossierStep } = loadDossierClientService({
    "@/lib/prisma": { prisma },
    "@/lib/http-errors": { badRequest: (m: string) => new Error(m), notFound: (m: string) => new Error(m) },
    "@/lib/dossier-client": { getDossierSteps: () => [{ key: "prise-de-contact" }, { key: "etape-2" }] },
    ...coachingEventDeps(events),
  });

  await advanceDossierStep({ dossierId: "dossier-1", stepKey: "etape-2", note: "Rendez-vous fait" });

  assert.equal(coachingProjectUpdates.length, 1);
  assert.equal(coachingProjectUpdates[0].etapeActuelle, "etape-2");
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "LEGACY_DOSSIER:STEP_CHANGE");
  assert.match(String(events[0].note), /prise-de-contact -> etape-2/);
});

test("addDossierIteration reflète iterationCount et journalise un événement LEGACY_DOSSIER:ITERATION", async () => {
  const { prisma, coachingProjectUpdates } = makeMirrorFakePrisma({ orderId: "order-1", linkedProjectId: "cp-1" });
  const events: Record<string, unknown>[] = [];
  const { addDossierIteration } = loadDossierClientService({
    "@/lib/prisma": { prisma },
    "@/lib/http-errors": { badRequest: (m: string) => new Error(m), notFound: (m: string) => new Error(m) },
    ...coachingEventDeps(events),
  });

  await addDossierIteration({ dossierId: "dossier-1", note: "Nouvelle révision envoyée" });

  assert.equal(coachingProjectUpdates.length, 1);
  assert.equal(coachingProjectUpdates[0].iterationCount, 1);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "LEGACY_DOSSIER:ITERATION");
  assert.equal(events[0].note, "Nouvelle révision envoyée");
});

test("updateDossierNotesInternes reflète les notes internes sans journaliser d'événement", async () => {
  const { prisma, coachingProjectUpdates } = makeMirrorFakePrisma({ orderId: "order-1", linkedProjectId: "cp-1" });
  const events: Record<string, unknown>[] = [];
  const { updateDossierNotesInternes } = loadDossierClientService({
    "@/lib/prisma": { prisma },
    "@/lib/http-errors": { badRequest: (m: string) => new Error(m), notFound: (m: string) => new Error(m) },
    ...coachingEventDeps(events),
  });

  await updateDossierNotesInternes({ dossierId: "dossier-1", notesInternes: "Client difficile à joindre" });

  assert.equal(coachingProjectUpdates.length, 1);
  assert.equal(coachingProjectUpdates[0].notesInternes, "Client difficile à joindre");
  assert.equal(events.length, 0, "matches the original function's own lack of a dossierEvent");
});

test("setDossierWhatsapp reflète le numéro whatsapp sans journaliser d'événement", async () => {
  const { prisma, coachingProjectUpdates } = makeMirrorFakePrisma({ orderId: "order-1", linkedProjectId: "cp-1" });
  const events: Record<string, unknown>[] = [];
  const { setDossierWhatsapp } = loadDossierClientService({
    "@/lib/prisma": { prisma },
    "@/lib/http-errors": { badRequest: (m: string) => new Error(m), notFound: (m: string) => new Error(m) },
    ...coachingEventDeps(events),
  });

  await setDossierWhatsapp({ dossierId: "dossier-1", whatsapp: "+33600000000" });

  assert.equal(coachingProjectUpdates.length, 1);
  assert.equal(coachingProjectUpdates[0].whatsapp, "+33600000000");
  assert.equal(events.length, 0);
});

test("setDossierDelivered reflète dateLivraison et journalise un événement LEGACY_DOSSIER:NOTE", async () => {
  const { prisma, coachingProjectUpdates } = makeMirrorFakePrisma({ orderId: "order-1", linkedProjectId: "cp-1" });
  const events: Record<string, unknown>[] = [];
  const { setDossierDelivered } = loadDossierClientService({
    "@/lib/prisma": { prisma },
    "@/lib/http-errors": { badRequest: (m: string) => new Error(m), notFound: (m: string) => new Error(m) },
    ...coachingEventDeps(events),
  });

  await setDossierDelivered({ dossierId: "dossier-1", delivered: true });

  assert.equal(coachingProjectUpdates.length, 1);
  assert.ok(coachingProjectUpdates[0].dateLivraison, "dateLivraison is mirrored as a set date");
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "LEGACY_DOSSIER:NOTE");
  assert.equal(events[0].note, "Dossier marqué comme livré.");
});

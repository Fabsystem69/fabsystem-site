import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// resolveAmbiguousDossierMigration : résolution assistée des cas signalés
// "ambiguous_no_order"/"ambiguous_existing_candidates" par
// migrateOneDossierClient — jamais automatique, toujours une décision
// explicite passée en paramètre. Ce test exécute le vrai service transpilé
// (aucune base réelle) et prouve : "create_new" ignore l'ambiguïté sur
// décision humaine ; "attach_to" ne fusionne un dossier "découverte" que sur
// un projet cible choisi explicitement, ne perd aucune commande déjà liée à
// un autre projet, ne écrase jamais un champ déjà renseigné et différent
// (le signale à la place), et concatène les notes internes plutôt que de
// les remplacer.

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
    notFound: (message: string) => new HttpError(404, message),
  };
}

function loadService(deps: Record<string, unknown>) {
  const source = ts.transpileModule(readFileSync("lib/services/coaching-dossier-migration.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} as Record<string, (...args: unknown[]) => Promise<unknown>> };
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    require: (id: string) => {
      if (id in deps) return deps[id];
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return loadedModule.exports;
}

function makeFakePrisma(dossier: Record<string, unknown>, targets: Record<string, Record<string, unknown>>) {
  const createdProjects: Record<string, unknown>[] = [];
  const updates: { id: string; data: Record<string, unknown> }[] = [];
  const createdEvents: Record<string, unknown>[] = [];
  let nextId = 1;

  const tx = {
    coachingProject: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const id = `new-project-${nextId++}`;
        const record = { id, ...data };
        createdProjects.push(record);
        return record;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        updates.push({ id: where.id, data });
        Object.assign(targets[where.id], data);
      },
    },
    coachingProjectEvent: { createMany: async ({ data }: { data: Record<string, unknown>[] }) => { createdEvents.push(...data); } },
    coachingProjectDocument: {
      findUnique: async () => null,
      create: async () => {},
    },
    coachingSession: { createMany: async () => {} },
  };

  const prisma = {
    dossierClient: { findUnique: async () => dossier },
    coachingProject: {
      findUnique: async ({ where }: { where: { id: string } }) => targets[where.id] ?? null,
    },
    $transaction: async (cb: (tx: unknown) => unknown) => cb(tx),
  };

  return { prisma, createdProjects, updates, createdEvents, targets };
}

function baseDossier(overrides: Record<string, unknown> = {}) {
  return {
    id: "dossier-1",
    customerId: "cust-1",
    orderId: "order-1",
    offre: "GUIDE",
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
    derniereActivite: new Date(),
    createdAt: new Date(),
    events: [],
    documents: [],
    appointments: [],
    ...overrides,
  };
}

test("create_new: crée un CoachingProject malgré l'ambiguïté, sur décision humaine explicite", async () => {
  const dossier = baseDossier({ whatsapp: "+33600000000" });
  const { prisma, createdProjects } = makeFakePrisma(dossier, {});
  const { resolveAmbiguousDossierMigration } = loadService({ "@/lib/http-errors": httpErrorStubs(), "@/lib/prisma": { prisma } });

  const result = (await resolveAmbiguousDossierMigration("dossier-1", { kind: "create_new" })) as {
    coachingProjectId: string;
    fieldConflicts: string[];
  };

  assert.equal(createdProjects.length, 1);
  assert.equal((createdProjects[0] as { whatsapp: string }).whatsapp, "+33600000000");
  assert.equal(result.fieldConflicts.length, 0);
});

test("attach_to: refuse un projet déjà rattaché à une autre commande", async () => {
  const dossier = baseDossier({ orderId: "order-1" });
  const target = { id: "target-1", orderId: "order-OTHER", notesInternes: null };
  const { prisma, updates } = makeFakePrisma(dossier, { "target-1": target });
  const { resolveAmbiguousDossierMigration } = loadService({ "@/lib/http-errors": httpErrorStubs(), "@/lib/prisma": { prisma } });

  await assert.rejects(
    () => resolveAmbiguousDossierMigration("dossier-1", { kind: "attach_to", coachingProjectId: "target-1" }),
    /déjà rattaché/
  );
  assert.deepEqual(updates, []);
});

test("attach_to: complète les champs vides, ne jamais écraser un champ déjà différent, concatène les notes internes", async () => {
  const dossier = baseDossier({
    orderId: "order-1",
    whatsapp: "+33600000000", // le dossier a une valeur, le projet cible aussi mais différente -> conflit signalé, pas écrasé
    besoinVehicule: "Van L2H2", // le projet cible n'a rien -> complété
    notesInternes: "Note du dossier repris.",
    iterationCount: 3,
  });
  const target = {
    id: "target-1",
    orderId: null,
    whatsapp: "+33699999999",
    besoinVehicule: null,
    notesInternes: "Note déjà présente sur le projet CRM.",
    iterationCount: 1,
  };
  const { prisma, updates, targets } = makeFakePrisma(dossier, { "target-1": target });
  const { resolveAmbiguousDossierMigration } = loadService({ "@/lib/http-errors": httpErrorStubs(), "@/lib/prisma": { prisma } });

  const result = (await resolveAmbiguousDossierMigration("dossier-1", { kind: "attach_to", coachingProjectId: "target-1" })) as {
    coachingProjectId: string;
    fieldConflicts: string[];
  };

  assert.equal(result.coachingProjectId, "target-1");
  assert.deepEqual(Array.from(result.fieldConflicts as string[]), ["whatsapp"], "conflicting field reported, not silently overwritten");
  assert.equal(targets["target-1"].whatsapp, "+33699999999", "target's differing value is preserved, never overwritten");
  assert.equal(targets["target-1"].besoinVehicule, "Van L2H2", "empty field on target is completed from the dossier");
  assert.equal(targets["target-1"].orderId, "order-1", "the order link is attached since the target had none");
  assert.equal(targets["target-1"].iterationCount, 3, "the higher iteration count is kept");
  assert.match(targets["target-1"].notesInternes as string, /Note déjà présente sur le projet CRM\./);
  assert.match(targets["target-1"].notesInternes as string, /Note du dossier repris\./);
  assert.equal(updates.length, 1);
});

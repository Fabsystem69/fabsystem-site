import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Rattachement à l'éditeur de schéma existant (Project/ProjectSchema,
// docs/03-DATABASE.md §4, NOTE_CLAUDE_REUTILISER_EDITEUR_EXISTANT.md) :
// CoachingProject.linkedProjectId existait déjà dans le schéma depuis un
// lot précédent de cette session, mais n'était lu/écrit nulle part —
// linkCoachingProjectToSchemaProject/unlinkCoachingProjectSchemaProject sont
// le premier code à l'exploiter réellement. Le point le plus important à
// prouver : on ne peut jamais rattacher le projet technique d'UN client à
// l'accompagnement d'UN AUTRE — même règle d'ownership serveur que partout
// ailleurs dans ce dossier cette session. Vrai service transpilé, aucune
// base réelle.

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

function makeFakePrisma(options: {
  coachingProject: { id: string; customerId: string } | null;
  targetProject: { id: string; customerId: string; linkedCoachingProjectId: string | null } | null;
}) {
  const coachingProjectUpdates: Record<string, unknown>[] = [];
  const tx = {
    coachingProject: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        coachingProjectUpdates.push(data);
        return { id: options.coachingProject?.id, ...data };
      },
    },
  };
  const prisma = {
    coachingProject: {
      findUnique: async () => options.coachingProject,
    },
    project: {
      findUnique: async () => {
        if (!options.targetProject) return null;
        return {
          id: options.targetProject.id,
          customerId: options.targetProject.customerId,
          linkedCoachingProject: options.targetProject.linkedCoachingProjectId
            ? { id: options.targetProject.linkedCoachingProjectId }
            : null,
        };
      },
    },
    $transaction: async (cb: (tx: unknown) => unknown) => cb(tx),
  };
  return { prisma, coachingProjectUpdates };
}

test("linkCoachingProjectToSchemaProject: rattache un projet technique du même client, journalise SCHEMA_LIE", async () => {
  const { prisma, coachingProjectUpdates } = makeFakePrisma({
    coachingProject: { id: "coaching-1", customerId: "customer-1" },
    targetProject: { id: "project-1", customerId: "customer-1", linkedCoachingProjectId: null },
  });
  const events: { type: string }[] = [];
  const service = loadService({ prisma }, events);

  await service.linkCoachingProjectToSchemaProject({ coachingProjectId: "coaching-1", projectId: "project-1", actor: { kind: "coach" } });

  assert.equal(coachingProjectUpdates.length, 1);
  assert.equal(coachingProjectUpdates[0].linkedProjectId, "project-1");
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "SCHEMA_LIE");
});

test("linkCoachingProjectToSchemaProject: refuse un projet technique appartenant à un AUTRE client", async () => {
  const { prisma, coachingProjectUpdates } = makeFakePrisma({
    coachingProject: { id: "coaching-1", customerId: "customer-1" },
    targetProject: { id: "project-1", customerId: "customer-OTHER", linkedCoachingProjectId: null },
  });
  const service = loadService({ prisma }, []);

  await assert.rejects(
    () => service.linkCoachingProjectToSchemaProject({ coachingProjectId: "coaching-1", projectId: "project-1", actor: { kind: "coach" } }),
    /même client/
  );
  assert.equal(coachingProjectUpdates.length, 0, "no write must happen when ownership does not match");
});

test("linkCoachingProjectToSchemaProject: refuse un projet technique déjà rattaché à un autre accompagnement", async () => {
  const { prisma, coachingProjectUpdates } = makeFakePrisma({
    coachingProject: { id: "coaching-1", customerId: "customer-1" },
    targetProject: { id: "project-1", customerId: "customer-1", linkedCoachingProjectId: "coaching-OTHER" },
  });
  const service = loadService({ prisma }, []);

  await assert.rejects(
    () => service.linkCoachingProjectToSchemaProject({ coachingProjectId: "coaching-1", projectId: "project-1", actor: { kind: "coach" } }),
    /déjà rattaché/
  );
  assert.equal(coachingProjectUpdates.length, 0);
});

test("linkCoachingProjectToSchemaProject: re-rattacher au même accompagnement déjà lié est accepté (idempotent)", async () => {
  const { prisma, coachingProjectUpdates } = makeFakePrisma({
    coachingProject: { id: "coaching-1", customerId: "customer-1" },
    targetProject: { id: "project-1", customerId: "customer-1", linkedCoachingProjectId: "coaching-1" },
  });
  const service = loadService({ prisma }, []);

  await service.linkCoachingProjectToSchemaProject({ coachingProjectId: "coaching-1", projectId: "project-1", actor: { kind: "coach" } });

  assert.equal(coachingProjectUpdates.length, 1);
});

test("linkCoachingProjectToSchemaProject: accompagnement introuvable", async () => {
  const { prisma } = makeFakePrisma({ coachingProject: null, targetProject: { id: "project-1", customerId: "customer-1", linkedCoachingProjectId: null } });
  const service = loadService({ prisma }, []);

  await assert.rejects(
    () => service.linkCoachingProjectToSchemaProject({ coachingProjectId: "missing", projectId: "project-1", actor: { kind: "coach" } }),
    /introuvable/
  );
});

test("linkCoachingProjectToSchemaProject: projet technique introuvable", async () => {
  const { prisma } = makeFakePrisma({ coachingProject: { id: "coaching-1", customerId: "customer-1" }, targetProject: null });
  const service = loadService({ prisma }, []);

  await assert.rejects(
    () => service.linkCoachingProjectToSchemaProject({ coachingProjectId: "coaching-1", projectId: "missing", actor: { kind: "coach" } }),
    /introuvable/
  );
});

test("unlinkCoachingProjectSchemaProject: détache et journalise SCHEMA_DELIE", async () => {
  const { prisma, coachingProjectUpdates } = makeFakePrisma({
    coachingProject: { id: "coaching-1", customerId: "customer-1" },
    targetProject: null,
  });
  const events: { type: string }[] = [];
  const service = loadService({ prisma }, events);

  await service.unlinkCoachingProjectSchemaProject({ coachingProjectId: "coaching-1", actor: { kind: "coach" } });

  assert.equal(coachingProjectUpdates.length, 1);
  assert.equal(coachingProjectUpdates[0].linkedProjectId, null);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "SCHEMA_DELIE");
});

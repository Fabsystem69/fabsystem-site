import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Constat d'audit repris dans PROMPT_REPRISE_CLAUDE_CRM.md : deleteDevice/
// deleteMaterial supprimaient par ID seul, sans vérifier que la ressource
// appartient bien au projet déjà revérifié côté appelant (assertOwnedProject
// ne prouve que la propriété du projectId transmis, jamais du deviceId/
// materialId), et sans laisser de trace dans l'historique du projet. Un
// formulaire falsifié pouvait donc viser la ressource d'un autre client, et
// une suppression légitime pouvait disparaître sans que le coach ou le
// client en garde le souvenir. Ce test exécute le vrai service (transpilé,
// sans base de données réelle) pour prouver le rejet croisé et la
// journalisation après correction.

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
    forbidden: (message: string) => new HttpError(403, message),
    notFound: (message: string) => new HttpError(404, message),
    conflict: (message: string) => new HttpError(409, message),
  };
}

type LoggedEvent = { projectId: string; type: string; actor: unknown; note?: string };

function loadModule<T>(sourcePath: string, deps: Record<string, unknown>): T {
  const source = ts.transpileModule(readFileSync(sourcePath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} as T };
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

test("deleteDevice refuses a device from another client's project and logs a legitimate deletion", async () => {
  const devices: Record<string, { id: string; projectId: string; name: string }> = {
    "device-A": { id: "device-A", projectId: "project-A", name: "Frigo" },
  };
  const projectActivity: Record<string, number> = {};
  const deletedIds: string[] = [];
  const events: LoggedEvent[] = [];
  const prismaDevice = {
    findUnique: async ({ where }: { where: { id: string } }) => devices[where.id] ?? null,
    delete: async ({ where }: { where: { id: string } }) => {
      deletedIds.push(where.id);
      delete devices[where.id];
    },
  };
  const prismaProject = {
    update: async ({ where }: { where: { id: string } }) => {
      projectActivity[where.id] = (projectActivity[where.id] ?? 0) + 1;
    },
  };
  const { deleteDevice } = loadModule<{
    deleteDevice: (deviceId: string, projectId: string, actor: { kind: string }) => Promise<unknown>;
  }>("lib/services/coaching-van-dossier.ts", {
    "@/lib/http-errors": httpErrorStubs(),
    "@/lib/services/coaching-project-events": {
      logCoachingProjectEvent: async (_tx: unknown, projectId: string, type: string, actor: unknown, note?: string) => {
        events.push({ projectId, type, actor, note });
      },
    },
    "@/lib/prisma": {
      prisma: {
        coachingDevice: prismaDevice,
        coachingProject: prismaProject,
        $transaction: async (cb: (tx: unknown) => unknown) => cb({ coachingDevice: prismaDevice, coachingProject: prismaProject }),
      },
    },
  });

  // Client B, propriétaire prouvé de project-B, forge un formulaire visant
  // device-A (appartenant à project-A, un autre client).
  await assert.rejects(
    () => deleteDevice("device-A", "project-B", { kind: "client" }),
    (error: Error) => {
      assert.match(error.message, /n'appartient pas/);
      return true;
    }
  );
  assert.deepEqual(deletedIds, [], "device must not be deleted across projects");
  assert.equal(events.length, 0, "no event should be logged for a rejected cross-project attempt");

  // Le même appareil reste supprimable par son propriétaire légitime, et la
  // suppression laisse une trace exploitable pour la relecture.
  await deleteDevice("device-A", "project-A", { kind: "coach" });
  assert.deepEqual(deletedIds, ["device-A"]);
  assert.equal(projectActivity["project-A"], 1);
  assert.equal(events.length, 1);
  assert.equal(events[0].projectId, "project-A");
  assert.equal(events[0].type, "DEVICE");
  assert.match(events[0].note ?? "", /Frigo/);
});

test("deleteMaterial refuses a material from another client's project and logs a legitimate deletion", async () => {
  const materials: Record<string, { id: string; projectId: string; category: string; brand: string | null; reference: string | null }> = {
    "material-A": { id: "material-A", projectId: "project-A", category: "BATTERY", brand: "Victron", reference: null },
  };
  const projectActivity: Record<string, number> = {};
  const deletedIds: string[] = [];
  const events: LoggedEvent[] = [];
  const prismaMaterial = {
    findUnique: async ({ where }: { where: { id: string } }) => materials[where.id] ?? null,
    delete: async ({ where }: { where: { id: string } }) => {
      deletedIds.push(where.id);
      delete materials[where.id];
    },
  };
  const prismaProject = {
    update: async ({ where }: { where: { id: string } }) => {
      projectActivity[where.id] = (projectActivity[where.id] ?? 0) + 1;
    },
  };
  const { deleteMaterial } = loadModule<{
    deleteMaterial: (materialId: string, projectId: string, actor: { kind: string }) => Promise<unknown>;
  }>("lib/services/coaching-material.ts", {
    "@/lib/http-errors": httpErrorStubs(),
    "@/lib/services/coaching-project-events": {
      logCoachingProjectEvent: async (_tx: unknown, projectId: string, type: string, actor: unknown, note?: string) => {
        events.push({ projectId, type, actor, note });
      },
    },
    "@/lib/prisma": {
      prisma: {
        coachingMaterial: prismaMaterial,
        coachingProject: prismaProject,
        $transaction: async (cb: (tx: unknown) => unknown) => cb({ coachingMaterial: prismaMaterial, coachingProject: prismaProject }),
      },
    },
  });

  await assert.rejects(
    () => deleteMaterial("material-A", "project-B", { kind: "client" }),
    (error: Error) => {
      assert.match(error.message, /n'appartient pas/);
      return true;
    }
  );
  assert.deepEqual(deletedIds, [], "material must not be deleted across projects");
  assert.equal(events.length, 0, "no event should be logged for a rejected cross-project attempt");

  await deleteMaterial("material-A", "project-A", { kind: "coach" });
  assert.deepEqual(deletedIds, ["material-A"]);
  assert.equal(projectActivity["project-A"], 1);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "MATERIAL");
  assert.match(events[0].note ?? "", /Victron/);
});

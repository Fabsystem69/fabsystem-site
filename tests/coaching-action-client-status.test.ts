import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Le client peut désormais cocher ses propres actions ("Ce qu'il vous reste
// à faire", app/mon-compte/mon-van/[projectId]/page.tsx) — jusqu'ici en
// lecture seule. updateCoachingActionStatusByClient est le premier chemin
// d'écriture client sur CoachingActionItem : le point le plus important à
// prouver est qu'un client ne peut jamais cocher l'action d'un AUTRE
// client, ni une action interne du coach (responsible !== CLIENT), même en
// devinant un actionId — même rigueur d'ownership que le reste de cette
// session. Vrai service transpilé, aucune base réelle.

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
    forbidden: (message: string) => new HttpError(403, message),
  };
}

function loadService(fakePrisma: unknown, events: { type: string; note?: string }[]) {
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
        return {
          logCoachingProjectEvent: async (_tx: unknown, _projectId: string, type: string, _actor: unknown, note?: string) => {
            events.push({ type, note });
          },
        };
      }
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return loadedModule.exports;
}

function makeFakePrisma(action: {
  id: string;
  label: string;
  responsible: "CLIENT" | "COACH" | null;
  projectId: string;
  customerId: string;
} | null) {
  const updates: Record<string, unknown>[] = [];
  const tx = {
    coachingActionItem: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data);
        return { id: action?.id, label: action?.label, ...data };
      },
    },
  };
  const prisma = {
    coachingActionItem: {
      findUnique: async () =>
        action
          ? { id: action.id, label: action.label, responsible: action.responsible, project: { id: action.projectId, customerId: action.customerId } }
          : null,
    },
    $transaction: async (cb: (tx: unknown) => unknown) => cb(tx),
  };
  return { prisma, updates };
}

test("updateCoachingActionStatusByClient: le propriétaire peut cocher sa propre action CLIENT", async () => {
  const { prisma, updates } = makeFakePrisma({ id: "action-1", label: "Ajouter une photo", responsible: "CLIENT", projectId: "project-1", customerId: "customer-1" });
  const events: { type: string; note?: string }[] = [];
  const service = loadService({ prisma }, events);

  await service.updateCoachingActionStatusByClient({ actionId: "action-1", customerId: "customer-1", status: "FAIT" });

  assert.equal(updates.length, 1);
  assert.equal(updates[0].status, "FAIT");
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "ACTION_CLIENT");
});

test("updateCoachingActionStatusByClient: refuse l'action d'un AUTRE client (ownership)", async () => {
  const { prisma, updates } = makeFakePrisma({ id: "action-1", label: "Ajouter une photo", responsible: "CLIENT", projectId: "project-1", customerId: "customer-A" });
  const service = loadService({ prisma }, []);

  await assert.rejects(
    () => service.updateCoachingActionStatusByClient({ actionId: "action-1", customerId: "customer-B", status: "FAIT" }),
    /appartient pas/
  );
  assert.equal(updates.length, 0, "no write must happen when ownership does not match");
});

test("updateCoachingActionStatusByClient: refuse une action interne du coach (responsible !== CLIENT)", async () => {
  const { prisma, updates } = makeFakePrisma({ id: "action-1", label: "Préparer le schéma", responsible: "COACH", projectId: "project-1", customerId: "customer-1" });
  const service = loadService({ prisma }, []);

  await assert.rejects(
    () => service.updateCoachingActionStatusByClient({ actionId: "action-1", customerId: "customer-1", status: "FAIT" }),
    /pas modifiable/
  );
  assert.equal(updates.length, 0);
});

test("updateCoachingActionStatusByClient: refuse une action sans responsable assigné (null)", async () => {
  const { prisma, updates } = makeFakePrisma({ id: "action-1", label: "Ancienne action", responsible: null, projectId: "project-1", customerId: "customer-1" });
  const service = loadService({ prisma }, []);

  await assert.rejects(() => service.updateCoachingActionStatusByClient({ actionId: "action-1", customerId: "customer-1", status: "FAIT" }));
  assert.equal(updates.length, 0);
});

test("updateCoachingActionStatusByClient: action introuvable", async () => {
  const { prisma } = makeFakePrisma(null);
  const service = loadService({ prisma }, []);

  await assert.rejects(
    () => service.updateCoachingActionStatusByClient({ actionId: "missing", customerId: "customer-1", status: "FAIT" }),
    /introuvable/
  );
});

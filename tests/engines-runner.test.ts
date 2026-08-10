import assert from "node:assert/strict";
import test from "node:test";
import type { Project } from "@/lib/generated/prisma/client";
import { CalculationError, ValidationError } from "@/lib/engines/errors";
import { createEngineRunner } from "@/lib/engines/runner";
import type { BaseEngine, EngineContext, EngineResult } from "@/lib/engines/types";
import type { OwnershipActor } from "@/lib/ownership";

function createProjectRecord(overrides: Partial<Project> = {}): Project {
  const now = new Date("2026-08-11T00:00:00.000Z");

  return {
    id: overrides.id ?? "proj_1",
    customerId: overrides.customerId ?? "cust_1",
    name: overrides.name ?? "Mon bateau",
    assetType: overrides.assetType ?? "BOAT",
    voltage: overrides.voltage ?? "UNKNOWN",
    status: overrides.status ?? "ACTIVE",
    archivedAt: overrides.archivedAt ?? null,
    deleteScheduledAt: overrides.deleteScheduledAt ?? null,
    preScheduleStatus: overrides.preScheduleStatus ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

const OWNER: OwnershipActor = { role: "customer", customerId: "cust_1" };

type Harness = {
  runner: ReturnType<typeof createEngineRunner>;
  getProjectCalls: Array<{ actor: OwnershipActor; projectId: string }>;
  retainedCalls: Array<{ projectId: string; key: string; value: unknown; simulatedValue?: unknown; source?: string | null }>;
  dependencyCalls: Array<{ projectId: string; dependentKey: string; dependsOnKey: string }>;
  propagationCalls: Array<{ projectId: string; changedKey: string }>;
};

function createHarness(project: Project = createProjectRecord()): Harness {
  const getProjectCalls: Harness["getProjectCalls"] = [];
  const retainedCalls: Harness["retainedCalls"] = [];
  const dependencyCalls: Harness["dependencyCalls"] = [];
  const propagationCalls: Harness["propagationCalls"] = [];

  const runner = createEngineRunner({
    getProject: async (actor, projectId) => {
      getProjectCalls.push({ actor, projectId });
      return project;
    },
    retainValue: (async (input: {
      projectId: string;
      key: string;
      value: unknown;
      simulatedValue?: unknown;
      source?: string | null;
    }) => {
      retainedCalls.push(input);
      return {} as never;
    }) as never,
    declareDependency: (async (input: {
      projectId: string;
      dependentKey: string;
      dependsOnKey: string;
    }) => {
      dependencyCalls.push(input);
      return {} as never;
    }) as never,
    // Aucune valeur préexistante en base pour ce test double : chaque
    // proposition est donc traitée comme "changée" par le Runner, ce que
    // les tests dédiés à la propagation (Phase 4.5.2) vérifient séparément.
    getProjectValues: (async () => []) as never,
    markDependentsObsolete: (async (projectId: string, changedKey: string) => {
      propagationCalls.push({ projectId, changedKey });
      return [];
    }) as never,
  });

  return { runner, getProjectCalls, retainedCalls, dependencyCalls, propagationCalls };
}

// Moteur fictif utilisé uniquement pour tester le framework — ce n'est pas
// un moteur métier réel et il n'est jamais enregistré dans un registry
// applicatif.
function createDummyEngine(
  handler: (context: EngineContext, input: { value: number }) => EngineResult<{ doubled: number }>
): BaseEngine<{ value: number }, { doubled: number }> {
  return {
    id: "fixture.dummy",
    run: handler,
  };
}

test("run prepares the context from the resolved project and calls the engine", async () => {
  const project = createProjectRecord({ id: "proj_99" });
  const { runner, getProjectCalls } = createHarness(project);

  let receivedContext: EngineContext | undefined;
  const engine = createDummyEngine((context, input) => {
    receivedContext = context;
    return { output: { doubled: input.value * 2 } };
  });

  const result = await runner.run(OWNER, "proj_99", engine, { value: 21 });

  assert.deepEqual(getProjectCalls, [{ actor: OWNER, projectId: "proj_99" }]);
  assert.equal(receivedContext?.project.id, "proj_99");
  assert.equal(result.output.doubled, 42);
});

test("run persists every retained value proposed by the engine", async () => {
  const { runner, retainedCalls } = createHarness();
  const engine = createDummyEngine(() => ({
    output: { doubled: 0 },
    retainedValues: [
      { key: "battery.capacity", value: { ah: 200 }, simulatedValue: { ah: 187 } },
    ],
  }));

  await runner.run(OWNER, "proj_1", engine, { value: 0 });

  assert.equal(retainedCalls.length, 1);
  assert.equal(retainedCalls[0]?.projectId, "proj_1");
  assert.equal(retainedCalls[0]?.key, "battery.capacity");
  assert.deepEqual(retainedCalls[0]?.value, { ah: 200 });
  assert.deepEqual(retainedCalls[0]?.simulatedValue, { ah: 187 });
});

test("run defaults the retained value source to the engine id when not provided", async () => {
  const { runner, retainedCalls } = createHarness();
  const engine = createDummyEngine(() => ({
    output: { doubled: 0 },
    retainedValues: [{ key: "battery.capacity", value: { ah: 200 } }],
  }));

  await runner.run(OWNER, "proj_1", engine, { value: 0 });

  assert.equal(retainedCalls[0]?.source, "fixture.dummy");
});

test("run keeps an explicit source provided by the engine", async () => {
  const { runner, retainedCalls } = createHarness();
  const engine = createDummyEngine(() => ({
    output: { doubled: 0 },
    retainedValues: [{ key: "battery.capacity", value: { ah: 200 }, source: "custom.source" }],
  }));

  await runner.run(OWNER, "proj_1", engine, { value: 0 });

  assert.equal(retainedCalls[0]?.source, "custom.source");
});

test("run persists every dependency declared by the engine", async () => {
  const { runner, dependencyCalls } = createHarness();
  const engine = createDummyEngine(() => ({
    output: { doubled: 0 },
    dependencies: [{ dependentKey: "battery.recharge", dependsOnKey: "battery.capacity" }],
  }));

  await runner.run(OWNER, "proj_1", engine, { value: 0 });

  assert.deepEqual(dependencyCalls, [
    { projectId: "proj_1", dependentKey: "battery.recharge", dependsOnKey: "battery.capacity" },
  ]);
});

test("run does not persist anything when the engine proposes no value or dependency", async () => {
  const { runner, retainedCalls, dependencyCalls } = createHarness();
  const engine = createDummyEngine(() => ({ output: { doubled: 0 } }));

  await runner.run(OWNER, "proj_1", engine, { value: 0 });

  assert.equal(retainedCalls.length, 0);
  assert.equal(dependencyCalls.length, 0);
});

test("run returns the full EngineResult, including warnings/errors/debug", async () => {
  const { runner } = createHarness();
  const engine = createDummyEngine(() => ({
    output: { doubled: 0 },
    warnings: [{ code: "LOW_CONFIDENCE", message: "Hypothèse non vérifiée" }],
    errors: [{ code: "PARTIAL_DATA", message: "Donnée secondaire manquante" }],
    debug: { intermediate: 12 },
  }));

  const result = await runner.run(OWNER, "proj_1", engine, { value: 0 });

  assert.deepEqual(result.warnings, [{ code: "LOW_CONFIDENCE", message: "Hypothèse non vérifiée" }]);
  assert.deepEqual(result.errors, [{ code: "PARTIAL_DATA", message: "Donnée secondaire manquante" }]);
  assert.deepEqual(result.debug, { intermediate: 12 });
});

test("run propagates an EngineError thrown by the engine unchanged", async () => {
  const { runner } = createHarness();
  const engine = createDummyEngine(() => {
    throw new ValidationError("tension manquante");
  });

  await assert.rejects(
    () => runner.run(OWNER, "proj_1", engine, { value: 0 }),
    (error: unknown) => error instanceof ValidationError && error.message === "tension manquante"
  );
});

test("run wraps a non-EngineError thrown by the engine into a CalculationError", async () => {
  const { runner } = createHarness();
  const engine = createDummyEngine(() => {
    throw new Error("boom");
  });

  await assert.rejects(
    () => runner.run(OWNER, "proj_1", engine, { value: 0 }),
    (error: unknown) =>
      error instanceof CalculationError &&
      error.code === "CALCULATION_ERROR" &&
      /fixture\.dummy/.test(error.message) &&
      (error.cause as Error | undefined)?.message === "boom"
  );
});

test("run does not persist anything when the engine throws", async () => {
  const { runner, retainedCalls, dependencyCalls } = createHarness();
  const engine = createDummyEngine(() => {
    throw new Error("boom");
  });

  await assert.rejects(() => runner.run(OWNER, "proj_1", engine, { value: 0 }));

  assert.equal(retainedCalls.length, 0);
  assert.equal(dependencyCalls.length, 0);
});

test("run supports an async engine", async () => {
  const { runner } = createHarness();
  const engine: BaseEngine<{ value: number }, { doubled: number }> = {
    id: "fixture.async-dummy",
    async run(_context, input) {
      await Promise.resolve();
      return { output: { doubled: input.value * 2 } };
    },
  };

  const result = await runner.run(OWNER, "proj_1", engine, { value: 5 });

  assert.equal(result.output.doubled, 10);
});

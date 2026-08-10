import assert from "node:assert/strict";
import test from "node:test";
import type { Project, ProjectRetainedValue } from "@/lib/generated/prisma/client";
import {
  CIRCUIT_ENGINE_ID,
  createCircuitEngine,
  type CircuitEngineOutput,
} from "@/lib/engines/circuit-engine";
import { DependencyError, ValidationError } from "@/lib/engines/errors";
import { createEngineRunner } from "@/lib/engines/runner";
import type { EngineContext } from "@/lib/engines/types";
import type { OwnershipActor } from "@/lib/ownership";

function createProjectRecord(overrides: Partial<Project> = {}): Project {
  const now = new Date("2026-08-19T00:00:00.000Z");

  return {
    id: overrides.id ?? "proj_1",
    customerId: overrides.customerId ?? "cust_1",
    name: overrides.name ?? "Mon bateau",
    assetType: overrides.assetType ?? "BOAT",
    voltage: overrides.voltage ?? "V12",
    status: overrides.status ?? "ACTIVE",
    archivedAt: overrides.archivedAt ?? null,
    deleteScheduledAt: overrides.deleteScheduledAt ?? null,
    preScheduleStatus: overrides.preScheduleStatus ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createRetainedValueRecord(
  overrides: Partial<ProjectRetainedValue> = {}
): ProjectRetainedValue {
  const now = new Date("2026-08-19T00:00:00.000Z");

  return {
    id: overrides.id ?? "val_1",
    projectId: overrides.projectId ?? "proj_1",
    key: overrides.key ?? "energy.consumers",
    value:
      overrides.value ?? [
        { name: "Frigo", quantity: 1, voltageV: 12, totalPowerW: 60, totalCurrentA: 5 },
      ],
    simulatedValue: overrides.simulatedValue ?? null,
    status: overrides.status ?? "ACTIVE",
    source: overrides.source ?? "energy.consumption",
    retainedAt: overrides.retainedAt ?? now,
    obsoletedAt: overrides.obsoletedAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createFakeContext(
  project: Project,
  retainedValues: Record<string, ProjectRetainedValue | null>
): EngineContext {
  return {
    project,
    now: () => new Date("2026-08-19T12:00:00.000Z"),
    getRetainedValue: async (key: string) =>
      Object.prototype.hasOwnProperty.call(retainedValues, key) ? retainedValues[key] : null,
    getRetainedValues: async () =>
      Object.values(retainedValues).filter((v): v is ProjectRetainedValue => v !== null),
    getDependencies: async () => [],
  };
}

const TWO_CONSUMERS: Record<string, ProjectRetainedValue | null> = {
  "energy.consumers": createRetainedValueRecord({
    key: "energy.consumers",
    value: [
      { name: "Frigo", quantity: 1, voltageV: 12, totalPowerW: 60, totalCurrentA: 5 },
      { name: "Pompe", quantity: 1, voltageV: 12, totalPowerW: 36, totalCurrentA: 3 },
    ],
  }),
};

// ── Id ──────────────────────────────────────────────────────────────

test("l'engine a un id stable", () => {
  assert.equal(createCircuitEngine().id, CIRCUIT_ENGINE_ID);
});

// ── energy.consumers absent / obsolète / de forme inattendue ──────────

test("energy.consumers absent : DependencyError", async () => {
  const engine = createCircuitEngine();
  const context = createFakeContext(createProjectRecord(), { "energy.consumers": null });

  await assert.rejects(
    () =>
      Promise.resolve(
        engine.run(context, { circuits: [{ name: "Frigo", consumerNames: ["Frigo"] }] })
      ),
    (error: unknown) => error instanceof DependencyError && error.code === "ENERGY_DATA_MISSING"
  );
});

test("energy.consumers obsolète : DependencyError", async () => {
  const engine = createCircuitEngine();
  const context = createFakeContext(createProjectRecord(), {
    "energy.consumers": createRetainedValueRecord({ status: "OBSOLETE" }),
  });

  await assert.rejects(
    () =>
      Promise.resolve(
        engine.run(context, { circuits: [{ name: "Frigo", consumerNames: ["Frigo"] }] })
      ),
    (error: unknown) => error instanceof DependencyError && error.code === "ENERGY_DATA_OBSOLETE"
  );
});

test("energy.consumers de forme inattendue : DependencyError", async () => {
  const engine = createCircuitEngine();
  const context = createFakeContext(createProjectRecord(), {
    "energy.consumers": createRetainedValueRecord({ value: { not: "an array" } }),
  });

  await assert.rejects(
    () =>
      Promise.resolve(
        engine.run(context, { circuits: [{ name: "Frigo", consumerNames: ["Frigo"] }] })
      ),
    (error: unknown) => error instanceof DependencyError && error.code === "ENERGY_DATA_INCOMPATIBLE"
  );
});

// ── Valeurs retenues et dépendances proposées ──────────────────────────

test("valeurs retenues proposées : une clé circuit.<id> par circuit", async () => {
  const engine = createCircuitEngine();
  const context = createFakeContext(createProjectRecord(), TWO_CONSUMERS);

  const result = await engine.run(context, {
    circuits: [
      { name: "Frigo", consumerNames: ["Frigo"] },
      { name: "Pompe", consumerNames: ["Pompe"] },
    ],
  });

  const keys = result.retainedValues?.map((proposal) => proposal.key).sort();
  assert.deepEqual(keys, ["circuit.frigo", "circuit.pompe"]);

  for (const proposal of result.retainedValues ?? []) {
    assert.ok(proposal.key.startsWith("circuit."));
    assert.deepEqual(proposal.value, proposal.simulatedValue);
  }
});

test("dépendances proposées : chaque circuit dépend uniquement de energy.consumers", async () => {
  const engine = createCircuitEngine();
  const context = createFakeContext(createProjectRecord(), TWO_CONSUMERS);

  const result = await engine.run(context, {
    circuits: [
      { name: "Frigo", consumerNames: ["Frigo"] },
      { name: "Pompe", consumerNames: ["Pompe"] },
    ],
  });

  assert.deepEqual(
    [...(result.dependencies ?? [])].sort((a, b) => a.dependentKey.localeCompare(b.dependentKey)),
    [
      { dependentKey: "circuit.frigo", dependsOnKey: "energy.consumers" },
      { dependentKey: "circuit.pompe", dependsOnKey: "energy.consumers" },
    ]
  );
});

test("aucun circuit défini : aucune valeur retenue ni dépendance proposée", async () => {
  const engine = createCircuitEngine();
  const context = createFakeContext(createProjectRecord(), TWO_CONSUMERS);

  const result = await engine.run(context, { circuits: [] });

  assert.deepEqual(result.retainedValues, []);
  assert.deepEqual(result.dependencies, []);
});

// ── Intégration via EngineRunner (Phase 4.0/4.5.2), sans base de données ─

const OWNER: OwnershipActor = { role: "customer", customerId: "cust_1" };

test("le moteur fonctionne via EngineRunner : contexte préparé, résultat persisté", async () => {
  const project = createProjectRecord({ id: "proj_circuit", voltage: "V12" });
  const retainedCalls: Array<{ projectId: string; key: string }> = [];
  const dependencyCalls: Array<{ projectId: string; dependentKey: string; dependsOnKey: string }> = [];

  const runner = createEngineRunner({
    getProject: async () => project,
    retainValue: (async (input: { projectId: string; key: string }) => {
      retainedCalls.push({ projectId: input.projectId, key: input.key });
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
    getProjectValues: (async () => []) as never,
    markDependentsObsolete: (async () => []) as never,
  });

  const engine = createCircuitEngine();

  // EngineRunnerDeps n'expose pas d'injection pour les lecteurs
  // energy.* du contexte lui-même (qui, par défaut, interrogent la vraie
  // base). Ce test vérifie donc ce qui relève réellement du Runner via
  // un moteur équivalent qui lit des valeurs fixes plutôt que la base.
  const wrappedEngine = {
    id: engine.id,
    run: async () =>
      engine.run(createFakeContext(project, TWO_CONSUMERS), {
        circuits: [
          { name: "Frigo", consumerNames: ["Frigo"] },
          { name: "Pompe", consumerNames: ["Pompe"] },
        ],
      }),
  };

  const result = await runner.run(OWNER, "proj_circuit", wrappedEngine, { circuits: [] });

  assert.equal(retainedCalls.length, 2);
  assert.equal(dependencyCalls.length, 2);
  assert.ok(retainedCalls.every((call) => call.projectId === "proj_circuit"));
  assert.equal((result.output as CircuitEngineOutput).circuits.length, 2);
});

test("propagation des erreurs à travers EngineRunner : une ValidationError du moteur traverse le runner", async () => {
  const project = createProjectRecord({ voltage: "V12" });

  const runner = createEngineRunner({
    getProject: async () => project,
    retainValue: (async () => ({}) as never) as never,
    declareDependency: (async () => ({}) as never) as never,
    getProjectValues: (async () => []) as never,
    markDependentsObsolete: (async () => []) as never,
  });

  const engine = createCircuitEngine();
  const wrappedEngine = {
    id: engine.id,
    run: async () =>
      engine.run(createFakeContext(project, TWO_CONSUMERS), {
        circuits: [{ name: "Vide", consumerNames: [] }],
      }),
  };

  await assert.rejects(
    () => runner.run(OWNER, "proj_1", wrappedEngine, { circuits: [] }),
    (error: unknown) => (error as { code?: string }).code === "CIRCUIT_EMPTY"
  );
});

test("l'engine ne lève que des ValidationError/CalculationError/DependencyError (EngineError)", async () => {
  const engine = createCircuitEngine();
  const context = createFakeContext(createProjectRecord(), TWO_CONSUMERS);

  await assert.rejects(
    () =>
      Promise.resolve(
        engine.run(context, { circuits: [{ name: "Vide", consumerNames: [] }] })
      ),
    (error: unknown) => error instanceof ValidationError
  );
});

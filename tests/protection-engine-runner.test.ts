import assert from "node:assert/strict";
import test from "node:test";
import type { Project, ProjectRetainedValue } from "@/lib/generated/prisma/client";
import {
  PROTECTION_ENGINE_ID,
  createProtectionEngine,
  type ProtectionEngineOutput,
} from "@/lib/engines/protection-engine";
import { DependencyError, ValidationError } from "@/lib/engines/errors";
import { createEngineRunner } from "@/lib/engines/runner";
import type { EngineContext } from "@/lib/engines/types";
import type { OwnershipActor } from "@/lib/ownership";

function createProjectRecord(overrides: Partial<Project> = {}): Project {
  const now = new Date("2026-08-21T00:00:00.000Z");

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
  const now = new Date("2026-08-21T00:00:00.000Z");

  return {
    id: overrides.id ?? "val_1",
    projectId: overrides.projectId ?? "proj_1",
    key: overrides.key ?? "circuit.frigo",
    value: overrides.value ?? {},
    simulatedValue: overrides.simulatedValue ?? null,
    status: overrides.status ?? "ACTIVE",
    source: overrides.source ?? "circuit.structure",
    retainedAt: overrides.retainedAt ?? now,
    obsoletedAt: overrides.obsoletedAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function circuitValue(overrides: Record<string, unknown> = {}) {
  return {
    id: "frigo",
    name: "Frigo",
    circuitType: null,
    consumerNames: ["Frigo"],
    cumulatedPowerW: 60,
    cumulatedCurrentA: 5,
    voltageV: 12,
    ...overrides,
  };
}

function cableValue(overrides: Record<string, unknown> = {}) {
  return {
    circuitId: "frigo",
    referenceCurrentA: 5,
    electricalLengthM: 6,
    voltageV: 12,
    maxVoltageDropV: 0.36,
    minimumSectionMm2: 1.2,
    retainedSectionMm2: 2.5,
    computedVoltageDropV: 0.2625,
    computedVoltageDropPercentage: 2.1875,
    ...overrides,
  };
}

function createFakeContext(
  project: Project,
  retainedValues: Record<string, ProjectRetainedValue | null>
): EngineContext {
  return {
    project,
    now: () => new Date("2026-08-21T12:00:00.000Z"),
    getRetainedValue: async (key: string) =>
      Object.prototype.hasOwnProperty.call(retainedValues, key) ? retainedValues[key] : null,
    getRetainedValues: async () =>
      Object.values(retainedValues).filter((v): v is ProjectRetainedValue => v !== null),
    getDependencies: async () => [],
  };
}

const TWO_CIRCUITS_WITH_CABLES: Record<string, ProjectRetainedValue | null> = {
  "circuit.frigo": createRetainedValueRecord({ key: "circuit.frigo", value: circuitValue() }),
  "cable.frigo": createRetainedValueRecord({ key: "cable.frigo", source: "cable.sizing", value: cableValue() }),
  "circuit.pompe": createRetainedValueRecord({
    key: "circuit.pompe",
    value: circuitValue({ id: "pompe", name: "Pompe", cumulatedPowerW: 36, cumulatedCurrentA: 12 }),
  }),
  "cable.pompe": createRetainedValueRecord({
    key: "cable.pompe",
    source: "cable.sizing",
    value: cableValue({ circuitId: "pompe", referenceCurrentA: 12, retainedSectionMm2: 4 }),
  }),
};

const CATALOG = [
  { type: "fusible", ratingA: 5 },
  { type: "fusible", ratingA: 10 },
  { type: "disjoncteur", ratingA: 15 },
  { type: "disjoncteur", ratingA: 20 },
];

function protectionDef(circuitId: string, overrides: Record<string, unknown> = {}) {
  return {
    circuitId,
    minMarginRatio: 1,
    maxMarginRatio: 2,
    catalog: CATALOG,
    ...overrides,
  };
}

// ── Id ──────────────────────────────────────────────────────────────

test("l'engine a un id stable", () => {
  assert.equal(createProtectionEngine().id, PROTECTION_ENGINE_ID);
});

// ── circuit.<id> / cable.<id> absent / obsolète / de forme inattendue ──

test("circuit.<id> absent : DependencyError", async () => {
  const engine = createProtectionEngine();
  const context = createFakeContext(createProjectRecord(), { "circuit.frigo": null, "cable.frigo": null });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, { protections: [protectionDef("frigo")] })),
    (error: unknown) => error instanceof DependencyError && error.code === "CIRCUIT_DATA_MISSING"
  );
});

test("cable.<id> absent : DependencyError", async () => {
  const engine = createProtectionEngine();
  const context = createFakeContext(createProjectRecord(), {
    "circuit.frigo": createRetainedValueRecord({ key: "circuit.frigo", value: circuitValue() }),
    "cable.frigo": null,
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, { protections: [protectionDef("frigo")] })),
    (error: unknown) => error instanceof DependencyError && error.code === "CABLE_DATA_MISSING"
  );
});

test("circuit.<id> obsolète : DependencyError", async () => {
  const engine = createProtectionEngine();
  const context = createFakeContext(createProjectRecord(), {
    "circuit.frigo": createRetainedValueRecord({ key: "circuit.frigo", status: "OBSOLETE", value: circuitValue() }),
    "cable.frigo": createRetainedValueRecord({ key: "cable.frigo", value: cableValue() }),
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, { protections: [protectionDef("frigo")] })),
    (error: unknown) => error instanceof DependencyError && error.code === "CIRCUIT_DATA_OBSOLETE"
  );
});

test("cable.<id> obsolète : DependencyError", async () => {
  const engine = createProtectionEngine();
  const context = createFakeContext(createProjectRecord(), {
    "circuit.frigo": createRetainedValueRecord({ key: "circuit.frigo", value: circuitValue() }),
    "cable.frigo": createRetainedValueRecord({ key: "cable.frigo", status: "OBSOLETE", value: cableValue() }),
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, { protections: [protectionDef("frigo")] })),
    (error: unknown) => error instanceof DependencyError && error.code === "CABLE_DATA_OBSOLETE"
  );
});

test("circuit.<id> de forme inattendue : DependencyError", async () => {
  const engine = createProtectionEngine();
  const context = createFakeContext(createProjectRecord(), {
    "circuit.frigo": createRetainedValueRecord({ key: "circuit.frigo", value: { not: "a circuit" } }),
    "cable.frigo": createRetainedValueRecord({ key: "cable.frigo", value: cableValue() }),
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, { protections: [protectionDef("frigo")] })),
    (error: unknown) => error instanceof DependencyError && error.code === "CIRCUIT_DATA_INCOMPATIBLE"
  );
});

test("cable.<id> de forme inattendue : DependencyError", async () => {
  const engine = createProtectionEngine();
  const context = createFakeContext(createProjectRecord(), {
    "circuit.frigo": createRetainedValueRecord({ key: "circuit.frigo", value: circuitValue() }),
    "cable.frigo": createRetainedValueRecord({ key: "cable.frigo", value: { not: "a cable" } }),
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, { protections: [protectionDef("frigo")] })),
    (error: unknown) => error instanceof DependencyError && error.code === "CABLE_DATA_INCOMPATIBLE"
  );
});

// ── Valeurs retenues et dépendances proposées ──────────────────────────

test("valeurs retenues proposées : une clé protection.<circuitId> par circuit protégé", async () => {
  const engine = createProtectionEngine();
  const context = createFakeContext(createProjectRecord(), TWO_CIRCUITS_WITH_CABLES);

  const result = await engine.run(context, {
    protections: [protectionDef("frigo"), protectionDef("pompe")],
  });

  const keys = result.retainedValues?.map((proposal) => proposal.key).sort();
  assert.deepEqual(keys, ["protection.frigo", "protection.pompe"]);

  for (const proposal of result.retainedValues ?? []) {
    assert.ok(proposal.key.startsWith("protection."));
    assert.deepEqual(proposal.value, proposal.simulatedValue);
  }
});

test("dépendances proposées : chaque protection dépend de son circuit.<id> et cable.<id>", async () => {
  const engine = createProtectionEngine();
  const context = createFakeContext(createProjectRecord(), TWO_CIRCUITS_WITH_CABLES);

  const result = await engine.run(context, {
    protections: [protectionDef("frigo"), protectionDef("pompe")],
  });

  assert.deepEqual(
    [...(result.dependencies ?? [])].sort(
      (a, b) => a.dependentKey.localeCompare(b.dependentKey) || a.dependsOnKey.localeCompare(b.dependsOnKey)
    ),
    [
      { dependentKey: "protection.frigo", dependsOnKey: "cable.frigo" },
      { dependentKey: "protection.frigo", dependsOnKey: "circuit.frigo" },
      { dependentKey: "protection.pompe", dependsOnKey: "cable.pompe" },
      { dependentKey: "protection.pompe", dependsOnKey: "circuit.pompe" },
    ]
  );
});

test("aucune protection définie : aucune valeur retenue ni dépendance proposée", async () => {
  const engine = createProtectionEngine();
  const context = createFakeContext(createProjectRecord(), TWO_CIRCUITS_WITH_CABLES);

  const result = await engine.run(context, { protections: [] });

  assert.deepEqual(result.retainedValues, []);
  assert.deepEqual(result.dependencies, []);
});

// ── Intégration via EngineRunner (Phase 4.0/4.5.2), sans base de données ─

const OWNER: OwnershipActor = { role: "customer", customerId: "cust_1" };

test("le moteur fonctionne via EngineRunner : contexte préparé, résultat persisté", async () => {
  const project = createProjectRecord({ id: "proj_protection", voltage: "V12" });
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

  const engine = createProtectionEngine();

  // EngineRunnerDeps n'expose pas d'injection pour les lecteurs
  // circuit.*/cable.* du contexte lui-même (qui, par défaut, interrogent
  // la vraie base). Ce test vérifie donc ce qui relève réellement du
  // Runner via un moteur équivalent qui lit des valeurs fixes plutôt que
  // la base.
  const wrappedEngine = {
    id: engine.id,
    run: async () =>
      engine.run(createFakeContext(project, TWO_CIRCUITS_WITH_CABLES), {
        protections: [protectionDef("frigo"), protectionDef("pompe")],
      }),
  };

  const result = await runner.run(OWNER, "proj_protection", wrappedEngine, { protections: [] });

  assert.equal(retainedCalls.length, 2);
  assert.equal(dependencyCalls.length, 4);
  assert.ok(retainedCalls.every((call) => call.projectId === "proj_protection"));
  assert.equal((result.output as ProtectionEngineOutput).protections.length, 2);
});

test("propagation des erreurs à travers EngineRunner : une CalculationError du moteur traverse le runner", async () => {
  const project = createProjectRecord({ voltage: "V12" });

  const runner = createEngineRunner({
    getProject: async () => project,
    retainValue: (async () => ({}) as never) as never,
    declareDependency: (async () => ({}) as never) as never,
    getProjectValues: (async () => []) as never,
    markDependentsObsolete: (async () => []) as never,
  });

  const engine = createProtectionEngine();
  const wrappedEngine = {
    id: engine.id,
    run: async () =>
      engine.run(createFakeContext(project, TWO_CIRCUITS_WITH_CABLES), {
        protections: [
          protectionDef("frigo", { minMarginRatio: 1, maxMarginRatio: 1.01, catalog: [{ type: "fusible", ratingA: 100 }] }),
        ],
      }),
  };

  await assert.rejects(
    () => runner.run(OWNER, "proj_1", wrappedEngine, { protections: [] }),
    (error: unknown) => (error as { code?: string }).code === "PROTECTION_NO_COMPATIBLE_DEVICE"
  );
});

test("l'engine ne lève que des ValidationError/CalculationError/DependencyError (EngineError)", async () => {
  const engine = createProtectionEngine();
  const context = createFakeContext(createProjectRecord(), TWO_CIRCUITS_WITH_CABLES);

  await assert.rejects(
    () =>
      Promise.resolve(
        engine.run(context, { protections: [protectionDef("frigo", { minMarginRatio: 0 })] })
      ),
    (error: unknown) => error instanceof ValidationError
  );
});

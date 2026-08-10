import assert from "node:assert/strict";
import test from "node:test";
import type { Project, ProjectRetainedValue } from "@/lib/generated/prisma/client";
import {
  CABLE_ENGINE_ID,
  createCableEngine,
  type CableEngineOutput,
} from "@/lib/engines/cable-engine";
import { DependencyError, ValidationError } from "@/lib/engines/errors";
import { createEngineRunner } from "@/lib/engines/runner";
import type { EngineContext } from "@/lib/engines/types";
import type { OwnershipActor } from "@/lib/ownership";

function createProjectRecord(overrides: Partial<Project> = {}): Project {
  const now = new Date("2026-08-20T00:00:00.000Z");

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
  const now = new Date("2026-08-20T00:00:00.000Z");

  return {
    id: overrides.id ?? "val_1",
    projectId: overrides.projectId ?? "proj_1",
    key: overrides.key ?? "circuit.frigo",
    value:
      overrides.value ?? {
        id: "frigo",
        name: "Frigo",
        circuitType: null,
        consumerNames: ["Frigo"],
        cumulatedPowerW: 60,
        cumulatedCurrentA: 5,
        voltageV: 12,
      },
    simulatedValue: overrides.simulatedValue ?? null,
    status: overrides.status ?? "ACTIVE",
    source: overrides.source ?? "circuit.structure",
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
    now: () => new Date("2026-08-20T12:00:00.000Z"),
    getRetainedValue: async (key: string) =>
      Object.prototype.hasOwnProperty.call(retainedValues, key) ? retainedValues[key] : null,
    getRetainedValues: async () =>
      Object.values(retainedValues).filter((v): v is ProjectRetainedValue => v !== null),
    getDependencies: async () => [],
  };
}

const TWO_CIRCUITS: Record<string, ProjectRetainedValue | null> = {
  "circuit.frigo": createRetainedValueRecord({
    key: "circuit.frigo",
    value: {
      id: "frigo",
      name: "Frigo",
      circuitType: null,
      consumerNames: ["Frigo"],
      cumulatedPowerW: 60,
      cumulatedCurrentA: 5,
      voltageV: 12,
    },
  }),
  "circuit.pompe": createRetainedValueRecord({
    key: "circuit.pompe",
    value: {
      id: "pompe",
      name: "Pompe",
      circuitType: null,
      consumerNames: ["Pompe"],
      cumulatedPowerW: 36,
      cumulatedCurrentA: 3,
      voltageV: 12,
    },
  }),
};

const STANDARD_SECTIONS = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50];
const COPPER_RESISTIVITY = 0.0175;

function cableDef(circuitId: string, overrides: Record<string, unknown> = {}) {
  return {
    circuitId,
    oneWayLengthM: 3,
    maxVoltageDropPercentage: 3,
    conductorResistivityOhmMm2PerM: COPPER_RESISTIVITY,
    availableSectionsMm2: STANDARD_SECTIONS,
    ...overrides,
  };
}

// ── Id ──────────────────────────────────────────────────────────────

test("l'engine a un id stable", () => {
  assert.equal(createCableEngine().id, CABLE_ENGINE_ID);
});

// ── circuit.<id> absent / obsolète / de forme inattendue ──────────

test("circuit.<id> absent : DependencyError", async () => {
  const engine = createCableEngine();
  const context = createFakeContext(createProjectRecord(), { "circuit.frigo": null });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, { cables: [cableDef("frigo")] })),
    (error: unknown) => error instanceof DependencyError && error.code === "CIRCUIT_DATA_MISSING"
  );
});

test("circuit.<id> obsolète : DependencyError", async () => {
  const engine = createCableEngine();
  const context = createFakeContext(createProjectRecord(), {
    "circuit.frigo": createRetainedValueRecord({ key: "circuit.frigo", status: "OBSOLETE" }),
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, { cables: [cableDef("frigo")] })),
    (error: unknown) => error instanceof DependencyError && error.code === "CIRCUIT_DATA_OBSOLETE"
  );
});

test("circuit.<id> de forme inattendue : DependencyError", async () => {
  const engine = createCableEngine();
  const context = createFakeContext(createProjectRecord(), {
    "circuit.frigo": createRetainedValueRecord({ key: "circuit.frigo", value: { not: "a circuit" } }),
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, { cables: [cableDef("frigo")] })),
    (error: unknown) => error instanceof DependencyError && error.code === "CIRCUIT_DATA_INCOMPATIBLE"
  );
});

// ── Valeurs retenues et dépendances proposées ──────────────────────────

test("valeurs retenues proposées : une clé cable.<circuitId> par circuit câblé", async () => {
  const engine = createCableEngine();
  const context = createFakeContext(createProjectRecord(), TWO_CIRCUITS);

  const result = await engine.run(context, {
    cables: [cableDef("frigo"), cableDef("pompe")],
  });

  const keys = result.retainedValues?.map((proposal) => proposal.key).sort();
  assert.deepEqual(keys, ["cable.frigo", "cable.pompe"]);

  for (const proposal of result.retainedValues ?? []) {
    assert.ok(proposal.key.startsWith("cable."));
    assert.deepEqual(proposal.value, proposal.simulatedValue);
  }
});

test("dépendances proposées : chaque cable dépend uniquement de son circuit.<id>", async () => {
  const engine = createCableEngine();
  const context = createFakeContext(createProjectRecord(), TWO_CIRCUITS);

  const result = await engine.run(context, {
    cables: [cableDef("frigo"), cableDef("pompe")],
  });

  assert.deepEqual(
    [...(result.dependencies ?? [])].sort((a, b) => a.dependentKey.localeCompare(b.dependentKey)),
    [
      { dependentKey: "cable.frigo", dependsOnKey: "circuit.frigo" },
      { dependentKey: "cable.pompe", dependsOnKey: "circuit.pompe" },
    ]
  );
});

test("aucun câble défini : aucune valeur retenue ni dépendance proposée", async () => {
  const engine = createCableEngine();
  const context = createFakeContext(createProjectRecord(), TWO_CIRCUITS);

  const result = await engine.run(context, { cables: [] });

  assert.deepEqual(result.retainedValues, []);
  assert.deepEqual(result.dependencies, []);
});

// ── Intégration via EngineRunner (Phase 4.0/4.5.2), sans base de données ─

const OWNER: OwnershipActor = { role: "customer", customerId: "cust_1" };

test("le moteur fonctionne via EngineRunner : contexte préparé, résultat persisté", async () => {
  const project = createProjectRecord({ id: "proj_cable", voltage: "V12" });
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

  const engine = createCableEngine();

  // EngineRunnerDeps n'expose pas d'injection pour les lecteurs circuit.*
  // du contexte lui-même (qui, par défaut, interrogent la vraie base). Ce
  // test vérifie donc ce qui relève réellement du Runner via un moteur
  // équivalent qui lit des valeurs fixes plutôt que la base.
  const wrappedEngine = {
    id: engine.id,
    run: async () =>
      engine.run(createFakeContext(project, TWO_CIRCUITS), {
        cables: [cableDef("frigo"), cableDef("pompe")],
      }),
  };

  const result = await runner.run(OWNER, "proj_cable", wrappedEngine, { cables: [] });

  assert.equal(retainedCalls.length, 2);
  assert.equal(dependencyCalls.length, 2);
  assert.ok(retainedCalls.every((call) => call.projectId === "proj_cable"));
  assert.equal((result.output as CableEngineOutput).cables.length, 2);
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

  const engine = createCableEngine();
  const wrappedEngine = {
    id: engine.id,
    run: async () =>
      engine.run(createFakeContext(project, TWO_CIRCUITS), {
        cables: [
          cableDef("frigo", {
            oneWayLengthM: 100,
            maxVoltageDropPercentage: 1,
            availableSectionsMm2: [0.5, 1, 1.5],
          }),
        ],
      }),
  };

  await assert.rejects(
    () => runner.run(OWNER, "proj_1", wrappedEngine, { cables: [] }),
    (error: unknown) => (error as { code?: string }).code === "CABLE_SECTION_OUT_OF_RANGE"
  );
});

test("l'engine ne lève que des ValidationError/CalculationError/DependencyError (EngineError)", async () => {
  const engine = createCableEngine();
  const context = createFakeContext(createProjectRecord(), TWO_CIRCUITS);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, { cables: [cableDef("frigo", { oneWayLengthM: 0 })] })),
    (error: unknown) => error instanceof ValidationError
  );
});

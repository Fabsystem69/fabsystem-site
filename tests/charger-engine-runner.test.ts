import assert from "node:assert/strict";
import test from "node:test";
import type { Project, ProjectRetainedValue } from "@/lib/generated/prisma/client";
import {
  CHARGER_ENGINE_ID,
  createChargerEngine,
  type ChargerEngineInput,
  type ChargerEngineOutput,
} from "@/lib/engines/charger-engine";
import { CalculationError, DependencyError, ValidationError } from "@/lib/engines/errors";
import { createEngineRunner } from "@/lib/engines/runner";
import type { EngineContext } from "@/lib/engines/types";
import type { OwnershipActor } from "@/lib/ownership";

function createProjectRecord(overrides: Partial<Project> = {}): Project {
  const now = new Date("2026-08-16T00:00:00.000Z");

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
  const now = new Date("2026-08-16T00:00:00.000Z");

  return {
    id: overrides.id ?? "val_1",
    projectId: overrides.projectId ?? "proj_1",
    key: overrides.key ?? "energy.dailyConsumption",
    value: overrides.value ?? { totalPowerW: 60, dailyWh: 400, dailyAh: 33.3, complete: true },
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
    now: () => new Date("2026-08-16T12:00:00.000Z"),
    getRetainedValue: async (key: string) =>
      Object.prototype.hasOwnProperty.call(retainedValues, key) ? retainedValues[key] : null,
    getRetainedValues: async () =>
      Object.values(retainedValues).filter((v): v is ProjectRetainedValue => v !== null),
    getDependencies: async () => [],
  };
}

function validInput(overrides: Partial<ChargerEngineInput> = {}): ChargerEngineInput {
  return {
    nominalPowerW: overrides.nominalPowerW ?? 300,
    maxCurrentA: overrides.maxCurrentA ?? 25,
    outputVoltageV: overrides.outputVoltageV ?? 12,
    systemEfficiencyRatio: overrides.systemEfficiencyRatio ?? 0.9,
    chargingDurationHours: overrides.chargingDurationHours ?? 4,
  };
}

const COMPLETE_SOURCES: Record<string, ProjectRetainedValue | null> = {
  "energy.dailyConsumption": createRetainedValueRecord({
    key: "energy.dailyConsumption",
    value: { totalPowerW: 60, dailyWh: 400, dailyAh: 33.3, complete: true },
  }),
  "battery.usefulCapacity": createRetainedValueRecord({
    key: "battery.usefulCapacity",
    value: { usefulCapacityAh: 40 },
    source: "battery.sizing",
  }),
};

// ── Id et isolation de domaine ──────────────────────────────────────────

test("l'engine a un id stable", () => {
  assert.equal(createChargerEngine().id, CHARGER_ENGINE_ID);
});

// ── Données absentes / obsolètes (DependencyError) ──────────────────────

test("énergie absente : DependencyError si energy.dailyConsumption n'existe pas", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), {
    "energy.dailyConsumption": null,
    "battery.usefulCapacity": COMPLETE_SOURCES["battery.usefulCapacity"],
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput())),
    (error: unknown) => error instanceof DependencyError && error.code === "ENERGY_DATA_MISSING"
  );
});

test("batterie absente : DependencyError si battery.usefulCapacity n'existe pas", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), {
    "energy.dailyConsumption": COMPLETE_SOURCES["energy.dailyConsumption"],
    "battery.usefulCapacity": null,
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput())),
    (error: unknown) => error instanceof DependencyError && error.code === "BATTERY_DATA_MISSING"
  );
});

test("énergie obsolète : DependencyError si le statut n'est pas ACTIVE", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), {
    "energy.dailyConsumption": createRetainedValueRecord({ status: "OBSOLETE" }),
    "battery.usefulCapacity": COMPLETE_SOURCES["battery.usefulCapacity"],
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput())),
    (error: unknown) => error instanceof DependencyError && error.code === "ENERGY_DATA_OBSOLETE"
  );
});

test("batterie obsolète : DependencyError si le statut n'est pas ACTIVE", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), {
    "energy.dailyConsumption": COMPLETE_SOURCES["energy.dailyConsumption"],
    "battery.usefulCapacity": createRetainedValueRecord({
      key: "battery.usefulCapacity",
      value: { usefulCapacityAh: 40 },
      status: "OBSOLETE",
    }),
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput())),
    (error: unknown) => error instanceof DependencyError && error.code === "BATTERY_DATA_OBSOLETE"
  );
});

test("forme inattendue de battery.usefulCapacity : DependencyError", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), {
    "energy.dailyConsumption": COMPLETE_SOURCES["energy.dailyConsumption"],
    "battery.usefulCapacity": createRetainedValueRecord({
      key: "battery.usefulCapacity",
      value: { unexpected: true },
    }),
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput())),
    (error: unknown) => error instanceof DependencyError && error.code === "BATTERY_DATA_INVALID_SHAPE"
  );
});

// ── Calcul impossible ────────────────────────────────────────────────

test("énergie incomplète (complete:false) : CalculationError, calcul refusé", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), {
    "energy.dailyConsumption": createRetainedValueRecord({
      value: { totalPowerW: 60, dailyWh: 400, dailyAh: 33.3, complete: false },
    }),
    "battery.usefulCapacity": COMPLETE_SOURCES["battery.usefulCapacity"],
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput())),
    (error: unknown) => error instanceof CalculationError && error.code === "ENERGY_DATA_INCOMPLETE"
  );
});

// ── Paramètres invalides / manquants ────────────────────────────────────

test("paramètre manquant : chargingDurationHours absente", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_SOURCES);
  const { chargingDurationHours, ...rest } = validInput();

  await assert.rejects(
    () => Promise.resolve(engine.run(context, rest as ChargerEngineInput)),
    (error: unknown) => error instanceof ValidationError && error.code === "CHARGER_PARAMETER_MISSING"
  );
});

test("puissance invalide : nominalPowerW négatif ou nul", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_SOURCES);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput({ nominalPowerW: 0 }))),
    (error: unknown) => error instanceof ValidationError && error.code === "CHARGER_POWER_INVALID"
  );
});

test("courant invalide : maxCurrentA négatif ou nul", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_SOURCES);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput({ maxCurrentA: 0 }))),
    (error: unknown) => error instanceof ValidationError && error.code === "CHARGER_CURRENT_INVALID"
  );
});

test("courant invalide : outputVoltageV négatif ou nul", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_SOURCES);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput({ outputVoltageV: 0 }))),
    (error: unknown) => error instanceof ValidationError && error.code === "CHARGER_CURRENT_INVALID"
  );
});

test("rendement invalide : supérieur à 1", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_SOURCES);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput({ systemEfficiencyRatio: 1.5 }))),
    (error: unknown) => error instanceof ValidationError && error.code === "CHARGER_EFFICIENCY_INVALID"
  );
});

test("rendement invalide : négatif ou nul", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_SOURCES);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput({ systemEfficiencyRatio: 0 }))),
    (error: unknown) => error instanceof ValidationError && error.code === "CHARGER_EFFICIENCY_INVALID"
  );
});

test("durée invalide : négative", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_SOURCES);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput({ chargingDurationHours: -1 }))),
    (error: unknown) => error instanceof ValidationError && error.code === "CHARGER_DURATION_INVALID"
  );
});

test("durée invalide : supérieure à 24h", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_SOURCES);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput({ chargingDurationHours: 25 }))),
    (error: unknown) => error instanceof ValidationError && error.code === "CHARGER_DURATION_INVALID"
  );
});

// ── Valeurs retenues et dépendances proposées ──────────────────────────

test("valeurs retenues proposées : cinq clés charger.*", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_SOURCES);

  const result = await engine.run(context, validInput());

  const keys = result.retainedValues?.map((proposal) => proposal.key).sort();
  assert.deepEqual(keys, [
    "charger.availablePower",
    "charger.chargingCurrent",
    "charger.coverage",
    "charger.rechargeTime",
    "charger.rechargeableEnergy",
  ]);

  for (const proposal of result.retainedValues ?? []) {
    assert.ok(proposal.key.startsWith("charger."));
    assert.deepEqual(proposal.value, proposal.simulatedValue);
  }
});

test("dépendances proposées : uniquement charger.* → energy.*/battery.*", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_SOURCES);

  const result = await engine.run(context, validInput());

  for (const dependency of result.dependencies ?? []) {
    assert.ok(dependency.dependentKey.startsWith("charger."));
    assert.ok(
      dependency.dependsOnKey.startsWith("energy.") || dependency.dependsOnKey.startsWith("battery.")
    );
  }
});

test("graphe de dépendances exact : deux arêtes précises, aucune de plus", async () => {
  const engine = createChargerEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_SOURCES);

  const result = await engine.run(context, validInput());

  assert.deepEqual(
    [...(result.dependencies ?? [])].sort((a, b) => a.dependentKey.localeCompare(b.dependentKey)),
    [
      { dependentKey: "charger.coverage", dependsOnKey: "energy.dailyConsumption" },
      { dependentKey: "charger.rechargeTime", dependsOnKey: "battery.usefulCapacity" },
    ]
  );
});

// ── Intégration via EngineRunner (Phase 4.0), sans base de données ────

const OWNER: OwnershipActor = { role: "customer", customerId: "cust_1" };

test("le moteur fonctionne via EngineRunner : contexte préparé, résultat persisté", async () => {
  const project = createProjectRecord({ id: "proj_charger", voltage: "V12" });
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

  const engine = createChargerEngine();

  // EngineRunnerDeps (Phase 4.0) n'expose pas d'injection pour les
  // lecteurs energy.*/battery.* du contexte lui-même (qui, par défaut,
  // interrogent la vraie base). Ce test vérifie donc ce qui relève
  // réellement du Runner — préparer le contexte à partir du Project
  // résolu, appeler le moteur, persister ce qu'il propose, propager
  // l'obsolescence (Phase 4.5.2) — via un moteur équivalent qui lit des
  // valeurs fixes plutôt que la base.
  const wrappedEngine = {
    id: engine.id,
    run: async () => engine.run(createFakeContext(project, COMPLETE_SOURCES), validInput()),
  };

  const result = await runner.run(OWNER, "proj_charger", wrappedEngine, validInput());

  assert.equal(retainedCalls.length, 5);
  assert.equal(dependencyCalls.length, 2);
  assert.ok(retainedCalls.every((call) => call.projectId === "proj_charger"));
  assert.equal((result.output as ChargerEngineOutput).availablePowerW, 270);
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

  const engine = createChargerEngine();
  const wrappedEngine = {
    id: engine.id,
    run: async () =>
      engine.run(createFakeContext(project, COMPLETE_SOURCES), validInput({ systemEfficiencyRatio: 2 })),
  };

  await assert.rejects(
    () => runner.run(OWNER, "proj_1", wrappedEngine, validInput()),
    (error: unknown) => (error as { code?: string }).code === "CHARGER_EFFICIENCY_INVALID"
  );
});

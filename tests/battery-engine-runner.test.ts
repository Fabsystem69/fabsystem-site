import assert from "node:assert/strict";
import test from "node:test";
import type {
  Project,
  ProjectRetainedValue,
} from "@/lib/generated/prisma/client";
import {
  BATTERY_ENGINE_ID,
  createBatteryEngine,
  type BatteryEngineInput,
  type BatteryEngineOutput,
} from "@/lib/engines/battery-engine";
import { CalculationError, DependencyError, ValidationError } from "@/lib/engines/errors";
import { createEngineRunner } from "@/lib/engines/runner";
import type { EngineContext } from "@/lib/engines/types";
import type { OwnershipActor } from "@/lib/ownership";

function createProjectRecord(overrides: Partial<Project> = {}): Project {
  const now = new Date("2026-08-13T00:00:00.000Z");

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
  const now = new Date("2026-08-13T00:00:00.000Z");

  return {
    id: overrides.id ?? "val_1",
    projectId: overrides.projectId ?? "proj_1",
    key: overrides.key ?? "energy.dailyConsumption",
    value: overrides.value ?? { totalPowerW: 60, dailyWh: 120, dailyAh: 10, complete: true },
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
    now: () => new Date("2026-08-13T12:00:00.000Z"),
    getRetainedValue: async (key: string) =>
      Object.prototype.hasOwnProperty.call(retainedValues, key) ? retainedValues[key] : null,
    getRetainedValues: async () => Object.values(retainedValues).filter((v): v is ProjectRetainedValue => v !== null),
    getDependencies: async () => [],
  };
}

function validInput(overrides: Partial<BatteryEngineInput> = {}): BatteryEngineInput {
  return {
    technology: overrides.technology ?? "AGM",
    maxDepthOfDischarge: overrides.maxDepthOfDischarge ?? 0.5,
    desiredAutonomyDays: overrides.desiredAutonomyDays ?? 1,
    systemVoltageV: overrides.systemVoltageV ?? 12,
  };
}

const COMPLETE_ENERGY: Record<string, ProjectRetainedValue | null> = {
  "energy.dailyConsumption": createRetainedValueRecord({
    key: "energy.dailyConsumption",
    value: { totalPowerW: 60, dailyWh: 120, dailyAh: 10, complete: true },
  }),
  "energy.maxCurrent": createRetainedValueRecord({
    key: "energy.maxCurrent",
    value: { maxCurrentA: 5, complete: true },
  }),
};

// ── Id et isolation de domaine ──────────────────────────────────────────

test("l'engine a un id stable", () => {
  assert.equal(createBatteryEngine().id, BATTERY_ENGINE_ID);
});

// ── Énergie absente / obsolète (DependencyError) ────────────────────────

test("énergie absente : DependencyError si energy.dailyConsumption n'existe pas", async () => {
  const engine = createBatteryEngine();
  const context = createFakeContext(createProjectRecord(), { "energy.dailyConsumption": null, "energy.maxCurrent": null });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput())),
    (error: unknown) => error instanceof DependencyError && error.code === "ENERGY_DATA_MISSING"
  );
});

test("énergie absente : DependencyError si energy.maxCurrent n'existe pas", async () => {
  const engine = createBatteryEngine();
  const context = createFakeContext(createProjectRecord(), {
    "energy.dailyConsumption": COMPLETE_ENERGY["energy.dailyConsumption"],
    "energy.maxCurrent": null,
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput())),
    (error: unknown) => error instanceof DependencyError && error.code === "ENERGY_DATA_MISSING"
  );
});

test("énergie obsolète : DependencyError si le statut n'est pas ACTIVE", async () => {
  const engine = createBatteryEngine();
  const context = createFakeContext(createProjectRecord(), {
    "energy.dailyConsumption": createRetainedValueRecord({ status: "OBSOLETE" }),
    "energy.maxCurrent": COMPLETE_ENERGY["energy.maxCurrent"],
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput())),
    (error: unknown) => error instanceof DependencyError && error.code === "ENERGY_DATA_OBSOLETE"
  );
});

test("forme inattendue de la valeur energy.* : DependencyError", async () => {
  const engine = createBatteryEngine();
  const context = createFakeContext(createProjectRecord(), {
    "energy.dailyConsumption": createRetainedValueRecord({ value: { unexpected: true } }),
    "energy.maxCurrent": COMPLETE_ENERGY["energy.maxCurrent"],
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput())),
    (error: unknown) => error instanceof DependencyError && error.code === "ENERGY_DATA_INVALID_SHAPE"
  );
});

test("le moteur ne recalcule jamais l'énergie : dailyWh/dailyAh proviennent tels quels de energy.*", async () => {
  const engine = createBatteryEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_ENERGY);

  const result = await engine.run(context, validInput());
  const output = result.output as BatteryEngineOutput;

  assert.equal(output.dailyWh, 120);
  assert.equal(output.dailyAh, 10);
  assert.equal(output.maxCurrentA, 5);
});

// ── Calcul impossible : énergie incomplète ──────────────────────────────

test("énergie incomplète (complete:false) : CalculationError, calcul refusé", async () => {
  const engine = createBatteryEngine();
  const context = createFakeContext(createProjectRecord(), {
    "energy.dailyConsumption": createRetainedValueRecord({
      value: { totalPowerW: 60, dailyWh: 120, dailyAh: 10, complete: false },
    }),
    "energy.maxCurrent": COMPLETE_ENERGY["energy.maxCurrent"],
  });

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput())),
    (error: unknown) => error instanceof CalculationError && error.code === "ENERGY_DATA_INCOMPLETE"
  );
});

// ── Paramètres invalides / manquants ────────────────────────────────────

test("paramètre manquant : technology absente", async () => {
  const engine = createBatteryEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_ENERGY);
  const { technology, ...rest } = validInput();

  await assert.rejects(
    () => Promise.resolve(engine.run(context, rest as BatteryEngineInput)),
    (error: unknown) => error instanceof ValidationError && error.code === "BATTERY_PARAMETER_MISSING"
  );
});

test("paramètre invalide : technologie inconnue", async () => {
  const engine = createBatteryEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_ENERGY);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput({ technology: "NI_MH" as never }))),
    (error: unknown) => error instanceof ValidationError && error.code === "BATTERY_PARAMETER_INVALID"
  );
});

test("profondeur de décharge invalide : négative", async () => {
  const engine = createBatteryEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_ENERGY);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput({ maxDepthOfDischarge: -0.1 }))),
    (error: unknown) => error instanceof ValidationError && error.code === "BATTERY_DOD_INVALID"
  );
});

test("profondeur de décharge invalide : supérieure à 1", async () => {
  const engine = createBatteryEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_ENERGY);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput({ maxDepthOfDischarge: 1.2 }))),
    (error: unknown) => error instanceof ValidationError && error.code === "BATTERY_DOD_INVALID"
  );
});

test("paramètre invalide : desiredAutonomyDays nul ou négatif", async () => {
  const engine = createBatteryEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_ENERGY);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput({ desiredAutonomyDays: 0 }))),
    (error: unknown) => error instanceof ValidationError && error.code === "BATTERY_PARAMETER_INVALID"
  );
});

test("tension incompatible : systemVoltageV ne correspond pas à la tension du Project", async () => {
  const engine = createBatteryEngine();
  const context = createFakeContext(createProjectRecord({ voltage: "V12" }), COMPLETE_ENERGY);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, validInput({ systemVoltageV: 24 }))),
    (error: unknown) => error instanceof ValidationError && error.code === "BATTERY_VOLTAGE_INCOMPATIBLE"
  );
});

test("tension système Project UNKNOWN : aucune incompatibilité ne peut être détectée, le calcul continue", async () => {
  const engine = createBatteryEngine();
  const context = createFakeContext(createProjectRecord({ voltage: "UNKNOWN" }), COMPLETE_ENERGY);

  const result = await engine.run(context, validInput({ systemVoltageV: 24 }));

  assert.equal((result.output as BatteryEngineOutput).systemVoltageV, 24);
});

// ── Valeurs retenues et dépendances proposées ──────────────────────────

test("valeurs retenues proposées : quatre clés battery.*", async () => {
  const engine = createBatteryEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_ENERGY);

  const result = await engine.run(context, validInput());

  const keys = result.retainedValues?.map((proposal) => proposal.key).sort();
  assert.deepEqual(keys, [
    "battery.autonomy",
    "battery.nominalCapacity",
    "battery.usefulCapacity",
    "battery.usefulEnergy",
  ]);

  for (const proposal of result.retainedValues ?? []) {
    assert.ok(proposal.key.startsWith("battery."));
    assert.deepEqual(proposal.value, proposal.simulatedValue);
  }
});

test("dépendances proposées : uniquement battery.* → energy.*", async () => {
  const engine = createBatteryEngine();
  const context = createFakeContext(createProjectRecord(), COMPLETE_ENERGY);

  const result = await engine.run(context, validInput());

  assert.equal(result.dependencies?.length, 8);
  for (const dependency of result.dependencies ?? []) {
    assert.ok(dependency.dependentKey.startsWith("battery."));
    assert.ok(dependency.dependsOnKey.startsWith("energy."));
  }
  // Aucune dépendance battery-interne, ni vers solar/alternator/cable/protection/Volta.
  const dependsOnKeys = new Set(result.dependencies?.map((d) => d.dependsOnKey));
  assert.deepEqual([...dependsOnKeys].sort(), ["energy.dailyConsumption", "energy.maxCurrent"]);
});

// ── Intégration via EngineRunner (Phase 4.0), sans base de données ────

const OWNER: OwnershipActor = { role: "customer", customerId: "cust_1" };

test("le moteur fonctionne via EngineRunner : contexte préparé, résultat persisté", async () => {
  const project = createProjectRecord({ id: "proj_battery", voltage: "V12" });
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

  const engine = createBatteryEngine();

  // EngineRunnerDeps (Phase 4.0) ne permet pas d'injecter les lecteurs
  // energy.* du contexte lui-même (qui, par défaut, interrogent la vraie
  // base via lib/services/project-values.ts). Ce test vérifie donc ce qui
  // est réellement sous la responsabilité du Runner — préparer le contexte
  // à partir du Project résolu, appeler le moteur, persister ce qu'il
  // propose, propager l'obsolescence (Phase 4.5.2) — via un moteur
  // équivalent qui lit des valeurs energy.* fixes plutôt que la base, sans
  // toucher au Runner lui-même.
  const wrappedEngine = {
    id: engine.id,
    run: async () =>
      engine.run(createFakeContext(project, COMPLETE_ENERGY), validInput()),
  };

  const result = await runner.run(OWNER, "proj_battery", wrappedEngine, validInput());

  assert.equal(retainedCalls.length, 4);
  assert.equal(dependencyCalls.length, 8);
  assert.ok(retainedCalls.every((call) => call.projectId === "proj_battery"));
  assert.equal((result.output as BatteryEngineOutput).nominalCapacityAh, 20);
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

  const engine = createBatteryEngine();
  const wrappedEngine = {
    id: engine.id,
    run: async () => engine.run(createFakeContext(project, COMPLETE_ENERGY), validInput({ maxDepthOfDischarge: 2 })),
  };

  await assert.rejects(
    () => runner.run(OWNER, "proj_1", wrappedEngine, validInput()),
    (error: unknown) => (error as { code?: string }).code === "BATTERY_DOD_INVALID"
  );
});

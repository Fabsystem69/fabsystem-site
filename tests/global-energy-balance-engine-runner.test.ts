import assert from "node:assert/strict";
import test from "node:test";
import type { Project, ProjectRetainedValue } from "@/lib/generated/prisma/client";
import {
  GLOBAL_ENERGY_BALANCE_ENGINE_ID,
  createGlobalEnergyBalanceEngine,
  type GlobalEnergyBalanceEngineOutput,
} from "@/lib/engines/global-energy-balance-engine";
import { CalculationError, DependencyError } from "@/lib/engines/errors";
import { createEngineRunner } from "@/lib/engines/runner";
import type { EngineContext } from "@/lib/engines/types";
import type { OwnershipActor } from "@/lib/ownership";

function createProjectRecord(overrides: Partial<Project> = {}): Project {
  const now = new Date("2026-08-18T00:00:00.000Z");

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
  const now = new Date("2026-08-18T00:00:00.000Z");

  return {
    id: overrides.id ?? "val_1",
    projectId: overrides.projectId ?? "proj_1",
    key: overrides.key ?? "energy.dailyConsumption",
    value: overrides.value ?? { totalPowerW: 60, dailyWh: 400, dailyAh: 33.3, complete: true },
    simulatedValue: overrides.simulatedValue ?? null,
    status: overrides.status ?? "ACTIVE",
    source: overrides.source ?? "fixture",
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
    now: () => new Date("2026-08-18T12:00:00.000Z"),
    getRetainedValue: async (key: string) =>
      Object.prototype.hasOwnProperty.call(retainedValues, key) ? retainedValues[key] : null,
    getRetainedValues: async () =>
      Object.values(retainedValues).filter((v): v is ProjectRetainedValue => v !== null),
    getDependencies: async () => [],
  };
}

const ALL_SOURCES: Record<string, ProjectRetainedValue | null> = {
  "energy.dailyConsumption": createRetainedValueRecord({
    key: "energy.dailyConsumption",
    value: { totalPowerW: 60, dailyWh: 400, dailyAh: 33.3, complete: true },
  }),
  "battery.usefulEnergy": createRetainedValueRecord({
    key: "battery.usefulEnergy",
    value: { usefulEnergyWh: 2000 },
    source: "battery.sizing",
  }),
  "alternator.rechargeableEnergy": createRetainedValueRecord({
    key: "alternator.rechargeableEnergy",
    value: { rechargeableEnergyWh: 100 },
    source: "alternator.charging",
  }),
  "solar.dailyEnergy": createRetainedValueRecord({
    key: "solar.dailyEnergy",
    value: { dailySolarEnergyWh: 150 },
    source: "solar.production",
  }),
  "charger.rechargeableEnergy": createRetainedValueRecord({
    key: "charger.rechargeableEnergy",
    value: { rechargeableEnergyWh: 50 },
    source: "charger.recharging",
  }),
};

// ── Id ──────────────────────────────────────────────────────────────

test("l'engine a un id stable", () => {
  assert.equal(createGlobalEnergyBalanceEngine().id, GLOBAL_ENERGY_BALANCE_ENGINE_ID);
});

// ── Toutes les sources disponibles ─────────────────────────────────────

test("toutes les sources disponibles : agrégation complète, aucune erreur", async () => {
  const engine = createGlobalEnergyBalanceEngine();
  const context = createFakeContext(createProjectRecord(), ALL_SOURCES);

  const result = await engine.run(context, {});
  const output = result.output as GlobalEnergyBalanceEngineOutput;

  assert.equal(output.totalRechargeableEnergyWh, 300);
  assert.equal(output.totalAvailableEnergyWh, 2000);
});

// ── Source(s) absente(s) ────────────────────────────────────────────

test("une source absente : DependencyError (solar manquant)", async () => {
  const engine = createGlobalEnergyBalanceEngine();
  const sources = { ...ALL_SOURCES, "solar.dailyEnergy": null };
  const context = createFakeContext(createProjectRecord(), sources);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, {})),
    (error: unknown) => error instanceof DependencyError && error.code === "SOLAR_DATA_MISSING"
  );
});

test("plusieurs sources absentes : la première source manquante rencontrée est signalée", async () => {
  const engine = createGlobalEnergyBalanceEngine();
  const sources = { ...ALL_SOURCES, "battery.usefulEnergy": null, "charger.rechargeableEnergy": null };
  const context = createFakeContext(createProjectRecord(), sources);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, {})),
    (error: unknown) => error instanceof DependencyError && error.code === "BATTERY_DATA_MISSING"
  );
});

test("chacune des cinq sources déclenche son propre code de domaine si absente", async () => {
  const engine = createGlobalEnergyBalanceEngine();
  const expectations: Array<[string, string]> = [
    ["energy.dailyConsumption", "ENERGY_DATA_MISSING"],
    ["battery.usefulEnergy", "BATTERY_DATA_MISSING"],
    ["alternator.rechargeableEnergy", "ALTERNATOR_DATA_MISSING"],
    ["solar.dailyEnergy", "SOLAR_DATA_MISSING"],
    ["charger.rechargeableEnergy", "CHARGER_DATA_MISSING"],
  ];

  for (const [missingKey, expectedCode] of expectations) {
    const sources = { ...ALL_SOURCES, [missingKey]: null };
    const context = createFakeContext(createProjectRecord(), sources);

    await assert.rejects(
      () => Promise.resolve(engine.run(context, {})),
      (error: unknown) => error instanceof DependencyError && error.code === expectedCode,
      `expected ${expectedCode} when ${missingKey} is missing`
    );
  }
});

// ── Données obsolètes / forme inattendue ───────────────────────────────

test("données obsolètes : DependencyError si une source n'est pas ACTIVE", async () => {
  const engine = createGlobalEnergyBalanceEngine();
  const sources = {
    ...ALL_SOURCES,
    "alternator.rechargeableEnergy": createRetainedValueRecord({
      key: "alternator.rechargeableEnergy",
      value: { rechargeableEnergyWh: 100 },
      status: "OBSOLETE",
    }),
  };
  const context = createFakeContext(createProjectRecord(), sources);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, {})),
    (error: unknown) => error instanceof DependencyError && error.code === "ALTERNATOR_DATA_OBSOLETE"
  );
});

test("données incompatibles : DependencyError si la forme d'une source est inattendue", async () => {
  const engine = createGlobalEnergyBalanceEngine();
  const sources = {
    ...ALL_SOURCES,
    "charger.rechargeableEnergy": createRetainedValueRecord({
      key: "charger.rechargeableEnergy",
      value: { unexpected: true },
    }),
  };
  const context = createFakeContext(createProjectRecord(), sources);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, {})),
    (error: unknown) => error instanceof DependencyError && error.code === "CHARGER_DATA_INCOMPATIBLE"
  );
});

test("énergie incomplète (complete:false) : CalculationError, calcul refusé", async () => {
  const engine = createGlobalEnergyBalanceEngine();
  const sources = {
    ...ALL_SOURCES,
    "energy.dailyConsumption": createRetainedValueRecord({
      value: { totalPowerW: 60, dailyWh: 400, dailyAh: 33.3, complete: false },
    }),
  };
  const context = createFakeContext(createProjectRecord(), sources);

  await assert.rejects(
    () => Promise.resolve(engine.run(context, {})),
    (error: unknown) => error instanceof CalculationError && error.code === "ENERGY_DATA_INCOMPLETE"
  );
});

// ── Valeurs retenues et dépendances proposées ──────────────────────────

test("valeurs retenues proposées : cinq clés energyBalance.*", async () => {
  const engine = createGlobalEnergyBalanceEngine();
  const context = createFakeContext(createProjectRecord(), ALL_SOURCES);

  const result = await engine.run(context, {});

  const keys = result.retainedValues?.map((proposal) => proposal.key).sort();
  assert.deepEqual(keys, [
    "energyBalance.autonomy",
    "energyBalance.balance",
    "energyBalance.coverage",
    "energyBalance.totalAvailableEnergy",
    "energyBalance.totalRechargeableEnergy",
  ]);

  for (const proposal of result.retainedValues ?? []) {
    assert.ok(proposal.key.startsWith("energyBalance."));
    assert.deepEqual(proposal.value, proposal.simulatedValue);
  }
});

test("dépendances proposées : uniquement energyBalance.* → energy.*/battery.*/alternator.*/solar.*/charger.*", async () => {
  const engine = createGlobalEnergyBalanceEngine();
  const context = createFakeContext(createProjectRecord(), ALL_SOURCES);

  const result = await engine.run(context, {});

  const allowedPrefixes = ["energy.", "battery.", "alternator.", "solar.", "charger."];
  for (const dependency of result.dependencies ?? []) {
    assert.ok(dependency.dependentKey.startsWith("energyBalance."));
    assert.ok(allowedPrefixes.some((prefix) => dependency.dependsOnKey.startsWith(prefix)));
  }
});

test("graphe de dépendances exact", async () => {
  const engine = createGlobalEnergyBalanceEngine();
  const context = createFakeContext(createProjectRecord(), ALL_SOURCES);

  const result = await engine.run(context, {});

  const sorted = [...(result.dependencies ?? [])].sort((a, b) =>
    `${a.dependentKey}->${a.dependsOnKey}`.localeCompare(`${b.dependentKey}->${b.dependsOnKey}`)
  );

  assert.deepEqual(sorted, [
    { dependentKey: "energyBalance.autonomy", dependsOnKey: "alternator.rechargeableEnergy" },
    { dependentKey: "energyBalance.autonomy", dependsOnKey: "battery.usefulEnergy" },
    { dependentKey: "energyBalance.autonomy", dependsOnKey: "charger.rechargeableEnergy" },
    { dependentKey: "energyBalance.autonomy", dependsOnKey: "energy.dailyConsumption" },
    { dependentKey: "energyBalance.autonomy", dependsOnKey: "solar.dailyEnergy" },
    { dependentKey: "energyBalance.balance", dependsOnKey: "alternator.rechargeableEnergy" },
    { dependentKey: "energyBalance.balance", dependsOnKey: "charger.rechargeableEnergy" },
    { dependentKey: "energyBalance.balance", dependsOnKey: "energy.dailyConsumption" },
    { dependentKey: "energyBalance.balance", dependsOnKey: "solar.dailyEnergy" },
    { dependentKey: "energyBalance.coverage", dependsOnKey: "alternator.rechargeableEnergy" },
    { dependentKey: "energyBalance.coverage", dependsOnKey: "charger.rechargeableEnergy" },
    { dependentKey: "energyBalance.coverage", dependsOnKey: "energy.dailyConsumption" },
    { dependentKey: "energyBalance.coverage", dependsOnKey: "solar.dailyEnergy" },
    { dependentKey: "energyBalance.totalAvailableEnergy", dependsOnKey: "battery.usefulEnergy" },
    { dependentKey: "energyBalance.totalRechargeableEnergy", dependsOnKey: "alternator.rechargeableEnergy" },
    { dependentKey: "energyBalance.totalRechargeableEnergy", dependsOnKey: "charger.rechargeableEnergy" },
    { dependentKey: "energyBalance.totalRechargeableEnergy", dependsOnKey: "solar.dailyEnergy" },
  ]);
});

// ── Intégration via EngineRunner (Phase 4.0), sans base de données ────

const OWNER: OwnershipActor = { role: "customer", customerId: "cust_1" };

test("le moteur fonctionne via EngineRunner : contexte préparé, résultat persisté", async () => {
  const project = createProjectRecord({ id: "proj_balance", voltage: "V12" });
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

  const engine = createGlobalEnergyBalanceEngine();

  // EngineRunnerDeps n'expose pas d'injection pour les lecteurs
  // energy.*/battery.*/alternator.*/solar.*/charger.* du contexte
  // lui-même (qui, par défaut, interrogent la vraie base). Ce test
  // vérifie donc ce qui relève réellement du Runner via un moteur
  // équivalent qui lit des valeurs fixes plutôt que la base.
  const wrappedEngine = {
    id: engine.id,
    run: async () => engine.run(createFakeContext(project, ALL_SOURCES), {}),
  };

  const result = await runner.run(OWNER, "proj_balance", wrappedEngine, {});

  assert.equal(retainedCalls.length, 5);
  assert.equal(dependencyCalls.length, 17);
  assert.ok(retainedCalls.every((call) => call.projectId === "proj_balance"));
  assert.equal((result.output as GlobalEnergyBalanceEngineOutput).totalRechargeableEnergyWh, 300);
});

test("propagation des erreurs à travers EngineRunner : une DependencyError du moteur traverse le runner", async () => {
  const project = createProjectRecord({ voltage: "V12" });

  const runner = createEngineRunner({
    getProject: async () => project,
    retainValue: (async () => ({}) as never) as never,
    declareDependency: (async () => ({}) as never) as never,
    getProjectValues: (async () => []) as never,
    markDependentsObsolete: (async () => []) as never,
  });

  const engine = createGlobalEnergyBalanceEngine();
  const wrappedEngine = {
    id: engine.id,
    run: async () =>
      engine.run(createFakeContext(project, { ...ALL_SOURCES, "solar.dailyEnergy": null }), {}),
  };

  await assert.rejects(
    () => runner.run(OWNER, "proj_1", wrappedEngine, {}),
    (error: unknown) => (error as { code?: string }).code === "SOLAR_DATA_MISSING"
  );
});

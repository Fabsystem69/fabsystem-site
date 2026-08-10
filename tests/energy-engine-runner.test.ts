import assert from "node:assert/strict";
import test from "node:test";
import type { Project, ProjectRetainedValue, ProjectValueDependency } from "@/lib/generated/prisma/client";
import { createEnergyEngine, ENERGY_ENGINE_ID, type EnergyEngineOutput } from "@/lib/engines/energy-engine";
import type { EngineContext } from "@/lib/engines/types";
import { createEngineRunner } from "@/lib/engines/runner";
import type { OwnershipActor } from "@/lib/ownership";

function createProjectRecord(overrides: Partial<Project> = {}): Project {
  const now = new Date("2026-08-12T00:00:00.000Z");

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

function createFakeContext(project: Project): EngineContext {
  return {
    project,
    now: () => new Date("2026-08-12T12:00:00.000Z"),
    getRetainedValue: async () => null,
    getRetainedValues: async () => [],
    getDependencies: async () => [],
  };
}

// ── BaseEngine.run() direct (sans Runner) ──────────────────────────────

test("l'engine a un id stable et n'utilise aucune donnée hors de son domaine", () => {
  const engine = createEnergyEngine();

  assert.equal(engine.id, ENERGY_ENGINE_ID);
});

test("valeurs retenues proposées : trois clés energy.* avec value et simulatedValue", async () => {
  const engine = createEnergyEngine();
  const context = createFakeContext(createProjectRecord({ voltage: "V12" }));

  const result = await engine.run(context, {
    consumers: [{ name: "Frigo", powerW: 60, dailyUsageHours: 10 }],
  });

  assert.equal(result.retainedValues?.length, 3);
  const keys = result.retainedValues?.map((proposal) => proposal.key).sort();
  assert.deepEqual(keys, ["energy.consumers", "energy.dailyConsumption", "energy.maxCurrent"]);

  for (const proposal of result.retainedValues ?? []) {
    assert.ok("simulatedValue" in proposal);
    assert.deepEqual(proposal.value, proposal.simulatedValue);
  }
});

test("dépendances proposées : energy.dailyConsumption dépend de energy.consumers, energy.maxCurrent dépend de energy.dailyConsumption", async () => {
  const engine = createEnergyEngine();
  const context = createFakeContext(createProjectRecord({ voltage: "V12" }));

  const result = await engine.run(context, { consumers: [] });

  assert.deepEqual(result.dependencies, [
    { dependentKey: "energy.dailyConsumption", dependsOnKey: "energy.consumers" },
    { dependentKey: "energy.maxCurrent", dependsOnKey: "energy.dailyConsumption" },
  ]);
});

test("le moteur ne déclare que ses propres clés energy.* (jamais battery/solar/...)", async () => {
  const engine = createEnergyEngine();
  const context = createFakeContext(createProjectRecord({ voltage: "V12" }));

  const result = await engine.run(context, {
    consumers: [{ name: "Frigo", powerW: 60, dailyUsageHours: 10 }],
  });

  const keys = [
    ...(result.retainedValues?.map((proposal) => proposal.key) ?? []),
    ...(result.dependencies?.flatMap((dependency) => [dependency.dependentKey, dependency.dependsOnKey]) ?? []),
  ];

  assert.ok(keys.every((key) => key.startsWith("energy.")));
});

test("tension système UNKNOWN : le moteur fonctionne toujours (Projet incomplet autorisé)", async () => {
  const engine = createEnergyEngine();
  const context = createFakeContext(createProjectRecord({ voltage: "UNKNOWN" }));

  const result = await engine.run(context, {
    consumers: [{ name: "Frigo", powerW: 60, dailyUsageHours: 10 }],
  });

  assert.equal((result.output as EnergyEngineOutput).complete, false);
  assert.equal(result.errors?.length, 1);
});

// ── Intégration via EngineRunner (Phase 4.0), sans base de données ────

const OWNER: OwnershipActor = { role: "customer", customerId: "cust_1" };

test("le moteur fonctionne via EngineRunner : contexte préparé, résultat persisté", async () => {
  const project = createProjectRecord({ id: "proj_energy", voltage: "V12" });
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
  });

  const engine = createEnergyEngine();

  const result = await runner.run(OWNER, "proj_energy", engine, {
    consumers: [
      { name: "Frigo", powerW: 60, dailyUsageHours: 10 },
      { name: "Éclairage", powerW: 20, dailyUsageHours: 5, quantity: 3 },
    ],
  });

  const output = result.output as EnergyEngineOutput;
  assert.equal(output.totalPowerW, 60 + 20 * 3);
  assert.equal(retainedCalls.length, 3);
  assert.equal(dependencyCalls.length, 2);
  assert.ok(retainedCalls.every((call) => call.projectId === "proj_energy"));
});

test("propagation des erreurs à travers EngineRunner : une ValidationError du moteur traverse le runner", async () => {
  const project = createProjectRecord({ voltage: "V12" });

  const runner = createEngineRunner({
    getProject: async () => project,
    retainValue: (async () => ({}) as never) as never,
    declareDependency: (async () => ({}) as never) as never,
  });

  const engine = createEnergyEngine();

  await assert.rejects(
    () =>
      runner.run(OWNER, "proj_1", engine, {
        consumers: [{ name: "", powerW: 10, dailyUsageHours: 1 }],
      }),
    (error: unknown) => (error as { code?: string }).code === "CONSUMER_INVALID_VALUE"
  );
});

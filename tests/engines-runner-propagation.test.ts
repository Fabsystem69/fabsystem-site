import assert from "node:assert/strict";
import test from "node:test";
import type { Project, ProjectRetainedValue } from "@/lib/generated/prisma/client";
import { createEngineRunner } from "@/lib/engines/runner";
import type { BaseEngine, EngineResult } from "@/lib/engines/types";
import type { OwnershipActor } from "@/lib/ownership";

// Phase 4.5.2 : tests dédiés à la propagation d'obsolescence du Runner.
// Le moteur fictif ci-dessous n'est utilisé que pour piloter précisément
// les propositions de valeurs retenues d'un run — ce n'est pas un moteur
// métier réel.

function createProjectRecord(overrides: Partial<Project> = {}): Project {
  const now = new Date("2026-08-17T00:00:00.000Z");

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
  const now = new Date("2026-08-17T00:00:00.000Z");

  return {
    id: overrides.id ?? "val_1",
    projectId: overrides.projectId ?? "proj_1",
    key: overrides.key ?? "fixture.a",
    value: overrides.value ?? { n: 1 },
    simulatedValue: overrides.simulatedValue ?? null,
    status: overrides.status ?? "ACTIVE",
    source: overrides.source ?? "fixture.engine",
    retainedAt: overrides.retainedAt ?? now,
    obsoletedAt: overrides.obsoletedAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

const OWNER: OwnershipActor = { role: "customer", customerId: "cust_1" };

function createFixtureEngine(
  retainedValues: EngineResult<unknown>["retainedValues"]
): BaseEngine<unknown, unknown> {
  return {
    id: "fixture.engine",
    run: () => ({ output: {}, retainedValues }),
  };
}

function createHarness(existingValues: ProjectRetainedValue[] = []) {
  const project = createProjectRecord();
  const propagationCalls: string[] = [];
  const getProjectValuesCalls: string[] = [];
  const persistedKeys: string[] = [];

  const runner = createEngineRunner({
    getProject: async () => project,
    retainValue: (async (input: { key: string }) => {
      persistedKeys.push(input.key);
      return {} as never;
    }) as never,
    declareDependency: (async () => ({}) as never) as never,
    getProjectValues: (async (projectId: string) => {
      getProjectValuesCalls.push(projectId);
      return existingValues;
    }) as never,
    markDependentsObsolete: (async (_projectId: string, changedKey: string) => {
      propagationCalls.push(changedKey);
      return [];
    }) as never,
  });

  return { runner, project, propagationCalls, getProjectValuesCalls, persistedKeys };
}

// ── Détection de changement ─────────────────────────────────────────────

test("aucune valeur modifiée : aucune propagation", async () => {
  const existing = createRetainedValueRecord({ key: "fixture.a", value: { n: 1 } });
  const { runner, project, propagationCalls } = createHarness([existing]);
  const engine = createFixtureEngine([{ key: "fixture.a", value: { n: 1 } }]);

  await runner.run(OWNER, project.id, engine, {});

  assert.deepEqual(propagationCalls, []);
});

test("une seule valeur modifiée : une seule propagation, pour cette clé", async () => {
  const existing = createRetainedValueRecord({ key: "fixture.a", value: { n: 1 } });
  const { runner, project, propagationCalls } = createHarness([existing]);
  const engine = createFixtureEngine([{ key: "fixture.a", value: { n: 2 } }]);

  await runner.run(OWNER, project.id, engine, {});

  assert.deepEqual(propagationCalls, ["fixture.a"]);
});

test("plusieurs valeurs modifiées : chacune propagée", async () => {
  const existing = [
    createRetainedValueRecord({ key: "fixture.a", value: { n: 1 } }),
    createRetainedValueRecord({ key: "fixture.b", value: { n: 10 } }),
    createRetainedValueRecord({ key: "fixture.c", value: { n: 100 } }),
  ];
  const { runner, project, propagationCalls } = createHarness(existing);
  const engine = createFixtureEngine([
    { key: "fixture.a", value: { n: 2 } }, // changé
    { key: "fixture.b", value: { n: 10 } }, // inchangé
    { key: "fixture.c", value: { n: 200 } }, // changé
  ]);

  await runner.run(OWNER, project.id, engine, {});

  assert.deepEqual([...propagationCalls].sort(), ["fixture.a", "fixture.c"]);
});

test("nouvelle clé jamais retenue auparavant : traitée comme modifiée", async () => {
  const { runner, project, propagationCalls } = createHarness([]);
  const engine = createFixtureEngine([{ key: "fixture.new", value: { n: 1 } }]);

  await runner.run(OWNER, project.id, engine, {});

  assert.deepEqual(propagationCalls, ["fixture.new"]);
});

test("seules les métadonnées changent (retainedAt, simulatedValue) : aucune propagation", async () => {
  const existing = createRetainedValueRecord({
    key: "fixture.a",
    value: { n: 1 },
    simulatedValue: { n: 999 },
    retainedAt: new Date("2020-01-01T00:00:00.000Z"),
  });
  const { runner, project, propagationCalls } = createHarness([existing]);
  // Même `value`, mais un `simulatedValue` différent : ne doit pas compter
  // comme un changement de la donnée métier réellement retenue.
  const engine = createFixtureEngine([{ key: "fixture.a", value: { n: 1 }, simulatedValue: { n: 1 } }]);

  await runner.run(OWNER, project.id, engine, {});

  assert.deepEqual(propagationCalls, []);
});

test("ordre des clés dans l'objet sans incidence sur la comparaison", async () => {
  const existing = createRetainedValueRecord({ key: "fixture.a", value: { a: 1, b: 2 } });
  const { runner, project, propagationCalls } = createHarness([existing]);
  const engine = createFixtureEngine([{ key: "fixture.a", value: { b: 2, a: 1 } }]);

  await runner.run(OWNER, project.id, engine, {});

  assert.deepEqual(propagationCalls, []);
});

// ── Dépendances / absence de dépendance ────────────────────────────────

test("dépendances multiples : le Runner délègue entièrement au service de dépendances existant", async () => {
  // markDependentsObsolete (Phase 3, injecté ici) peut résoudre plusieurs
  // dépendants pour une seule clé modifiée — le Runner n'a besoin que
  // d'appeler ce service une fois par clé changée, sans connaître combien
  // de dépendants existent ni comment ils sont résolus.
  const existing = createRetainedValueRecord({ key: "fixture.a", value: { n: 1 } });
  const project = createProjectRecord();
  const obsoletedByCall: Record<string, string[]> = {};

  const runner = createEngineRunner({
    getProject: async () => project,
    retainValue: (async () => ({}) as never) as never,
    declareDependency: (async () => ({}) as never) as never,
    getProjectValues: (async () => [existing]) as never,
    markDependentsObsolete: (async (_projectId: string, changedKey: string) => {
      const obsoleted = ["fixture.dependent1", "fixture.dependent2", "fixture.dependent3"];
      obsoletedByCall[changedKey] = obsoleted;
      return obsoleted;
    }) as never,
  });

  const engine = createFixtureEngine([{ key: "fixture.a", value: { n: 2 } }]);
  await runner.run(OWNER, project.id, engine, {});

  assert.deepEqual(obsoletedByCall, {
    "fixture.a": ["fixture.dependent1", "fixture.dependent2", "fixture.dependent3"],
  });
});

test("aucune dépendance : la propagation est appelée mais ne produit aucun effet", async () => {
  const existing = createRetainedValueRecord({ key: "fixture.a", value: { n: 1 } });
  const { runner, project, propagationCalls } = createHarness([existing]);
  const engine = createFixtureEngine([{ key: "fixture.a", value: { n: 2 } }]);

  await runner.run(OWNER, project.id, engine, {});

  // Le Runner appelle le service une fois pour la clé changée ; c'est au
  // service de dépendances (Phase 3, réutilisé tel quel) de constater
  // l'absence de dépendant et de ne rien marquer.
  assert.deepEqual(propagationCalls, ["fixture.a"]);
});

// ── Unicité et absence de traitement inutile ───────────────────────────

test("propagation unique : une clé proposée deux fois n'est propagée qu'une seule fois", async () => {
  const { runner, project, propagationCalls } = createHarness([]);
  const engine = createFixtureEngine([
    { key: "fixture.a", value: { n: 1 } },
    { key: "fixture.a", value: { n: 1 } },
  ]);

  await runner.run(OWNER, project.id, engine, {});

  assert.deepEqual(propagationCalls, ["fixture.a"]);
});

test("absence de propagation inutile : aucune proposition ⇒ aucune lecture ni propagation", async () => {
  const { runner, project, propagationCalls, getProjectValuesCalls } = createHarness([]);
  const engine = createFixtureEngine(undefined);

  await runner.run(OWNER, project.id, engine, {});

  assert.deepEqual(propagationCalls, []);
  assert.deepEqual(getProjectValuesCalls, []);
});

// ── Performance : une seule lecture groupée, jamais une par proposition ─

test("une seule lecture groupée de l'existant, quel que soit le nombre de propositions", async () => {
  const existing = [
    createRetainedValueRecord({ key: "fixture.a", value: { n: 1 } }),
    createRetainedValueRecord({ key: "fixture.b", value: { n: 1 } }),
  ];
  const { runner, project, getProjectValuesCalls } = createHarness(existing);
  const engine = createFixtureEngine([
    { key: "fixture.a", value: { n: 2 } },
    { key: "fixture.b", value: { n: 2 } },
    { key: "fixture.c", value: { n: 2 } },
  ]);

  await runner.run(OWNER, project.id, engine, {});

  assert.equal(getProjectValuesCalls.length, 1);
});

// ── Persistance inchangée (non-régression) ─────────────────────────────

test("chaque proposition reste persistée, modifiée ou non", async () => {
  const existing = createRetainedValueRecord({ key: "fixture.a", value: { n: 1 } });
  const { runner, project, persistedKeys } = createHarness([existing]);
  const engine = createFixtureEngine([
    { key: "fixture.a", value: { n: 1 } }, // inchangé, persisté quand même
    { key: "fixture.b", value: { n: 1 } }, // nouveau
  ]);

  await runner.run(OWNER, project.id, engine, {});

  assert.deepEqual(persistedKeys, ["fixture.a", "fixture.b"]);
});

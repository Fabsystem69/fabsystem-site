import assert from "node:assert/strict";
import test from "node:test";
import type { ProjectValueDependency } from "@/lib/generated/prisma/client";
import {
  computeDirectDependents,
  createProjectDependenciesService,
  type ProjectDependenciesDb,
} from "@/lib/services/project-dependencies";

function createDependencyRecord(
  overrides: Partial<ProjectValueDependency> = {}
): ProjectValueDependency {
  return {
    id: overrides.id ?? "dep_1",
    projectId: overrides.projectId ?? "proj_1",
    dependentKey: overrides.dependentKey ?? "battery.recharge",
    dependsOnKey: overrides.dependsOnKey ?? "battery.capacity",
    createdAt: overrides.createdAt ?? new Date("2026-08-10T00:00:00.000Z"),
  };
}

function createMockProjectDependenciesDb(seed?: { dependencies?: ProjectValueDependency[] }) {
  const dependencies = [...(seed?.dependencies ?? [])];

  const db: ProjectDependenciesDb = {
    async createDependency(data) {
      const dependency = createDependencyRecord({
        id: `dep_${dependencies.length + 1}`,
        ...data,
      });
      dependencies.push(dependency);
      return dependency;
    },
    async findDependency(projectId, dependentKey, dependsOnKey) {
      return (
        dependencies.find(
          (edge) =>
            edge.projectId === projectId &&
            edge.dependentKey === dependentKey &&
            edge.dependsOnKey === dependsOnKey
        ) ?? null
      );
    },
    async listDependents(projectId, dependsOnKey) {
      return dependencies.filter(
        (edge) => edge.projectId === projectId && edge.dependsOnKey === dependsOnKey
      );
    },
    async listDependencies(projectId) {
      return dependencies.filter((edge) => edge.projectId === projectId);
    },
  };

  return { db, getDependencies: () => dependencies };
}

test("computeDirectDependents returns only the direct dependents of the changed key", () => {
  const edges = [
    createDependencyRecord({ dependentKey: "battery.recharge", dependsOnKey: "battery.capacity" }),
    createDependencyRecord({ dependentKey: "solar.time", dependsOnKey: "solar.power" }),
  ];

  const result = computeDirectDependents(edges, "battery.capacity");

  assert.deepEqual(result, ["battery.recharge"]);
});

test("computeDirectDependents does not cascade transitively (MASTER-06 §30, dépendances ciblées)", () => {
  // battery.recharge depends on battery.capacity, and recharge.time depends
  // on battery.recharge. Changing battery.capacity must only flag
  // battery.recharge, never recharge.time (single hop only).
  const edges = [
    createDependencyRecord({ dependentKey: "battery.recharge", dependsOnKey: "battery.capacity" }),
    createDependencyRecord({ dependentKey: "recharge.time", dependsOnKey: "battery.recharge" }),
  ];

  const result = computeDirectDependents(edges, "battery.capacity");

  assert.deepEqual(result, ["battery.recharge"]);
});

test("declareDependency creates a new edge", async () => {
  const { db, getDependencies } = createMockProjectDependenciesDb();
  const service = createProjectDependenciesService(db);

  const edge = await service.declareDependency({
    projectId: "proj_1",
    dependentKey: "battery.recharge",
    dependsOnKey: "battery.capacity",
  });

  assert.equal(edge.dependentKey, "battery.recharge");
  assert.equal(getDependencies().length, 1);
});

test("declareDependency is idempotent for an already declared edge", async () => {
  const existing = createDependencyRecord();
  const { db, getDependencies } = createMockProjectDependenciesDb({ dependencies: [existing] });
  const service = createProjectDependenciesService(db);

  const edge = await service.declareDependency({
    projectId: existing.projectId,
    dependentKey: existing.dependentKey,
    dependsOnKey: existing.dependsOnKey,
  });

  assert.equal(edge.id, existing.id);
  assert.equal(getDependencies().length, 1);
});

test("markDependentsObsolete marks only the direct dependents that have a retained value", async () => {
  const edge = createDependencyRecord({
    projectId: "proj_1",
    dependentKey: "battery.recharge",
    dependsOnKey: "battery.capacity",
  });
  const { db } = createMockProjectDependenciesDb({ dependencies: [edge] });

  const obsoletedCalls: Array<{ projectId: string; key: string }> = [];
  const service = createProjectDependenciesService(db, {
    markValueObsolete: async (projectId, key) => {
      obsoletedCalls.push({ projectId, key });
      return undefined;
    },
  });

  const result = await service.markDependentsObsolete("proj_1", "battery.capacity");

  assert.deepEqual(result, ["battery.recharge"]);
  assert.deepEqual(obsoletedCalls, [{ projectId: "proj_1", key: "battery.recharge" }]);
});

test("markDependentsObsolete silently ignores dependents that have no retained value yet", async () => {
  const edge = createDependencyRecord({
    projectId: "proj_1",
    dependentKey: "battery.recharge",
    dependsOnKey: "battery.capacity",
  });
  const { db } = createMockProjectDependenciesDb({ dependencies: [edge] });
  const service = createProjectDependenciesService(db, {
    markValueObsolete: async () => {
      throw new Error("no retained value for this key");
    },
  });

  const result = await service.markDependentsObsolete("proj_1", "battery.capacity");

  assert.deepEqual(result, []);
});

test("markDependentsObsolete does not touch a key that does not depend on the changed key", async () => {
  const edge = createDependencyRecord({
    projectId: "proj_1",
    dependentKey: "solar.time",
    dependsOnKey: "solar.power",
  });
  const { db } = createMockProjectDependenciesDb({ dependencies: [edge] });
  const obsoletedCalls: string[] = [];
  const service = createProjectDependenciesService(db, {
    markValueObsolete: async (_projectId, key) => {
      obsoletedCalls.push(key);
    },
  });

  await service.markDependentsObsolete("proj_1", "battery.capacity");

  assert.deepEqual(obsoletedCalls, []);
});

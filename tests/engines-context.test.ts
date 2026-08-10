import assert from "node:assert/strict";
import test from "node:test";
import type { Project, ProjectRetainedValue, ProjectValueDependency } from "@/lib/generated/prisma/client";
import { createEngineContext } from "@/lib/engines/context";

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

function createValueRecord(overrides: Partial<ProjectRetainedValue> = {}): ProjectRetainedValue {
  const now = new Date("2026-08-11T00:00:00.000Z");

  return {
    id: overrides.id ?? "val_1",
    projectId: overrides.projectId ?? "proj_1",
    key: overrides.key ?? "battery.capacity",
    value: overrides.value ?? { ah: 200 },
    simulatedValue: overrides.simulatedValue ?? null,
    status: overrides.status ?? "ACTIVE",
    source: overrides.source ?? null,
    retainedAt: overrides.retainedAt ?? now,
    obsoletedAt: overrides.obsoletedAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createDependencyRecord(
  overrides: Partial<ProjectValueDependency> = {}
): ProjectValueDependency {
  return {
    id: overrides.id ?? "dep_1",
    projectId: overrides.projectId ?? "proj_1",
    dependentKey: overrides.dependentKey ?? "battery.recharge",
    dependsOnKey: overrides.dependsOnKey ?? "battery.capacity",
    createdAt: overrides.createdAt ?? new Date("2026-08-11T00:00:00.000Z"),
  };
}

test("createEngineContext exposes the project as-is", () => {
  const project = createProjectRecord();
  const context = createEngineContext(project);

  assert.equal(context.project.id, "proj_1");
  assert.equal(context.project.name, "Mon bateau");
});

test("createEngineContext.now defaults to the current time when not overridden", () => {
  const project = createProjectRecord();
  const before = Date.now();
  const context = createEngineContext(project);
  const after = Date.now();

  const nowValue = context.now().getTime();
  assert.ok(nowValue >= before && nowValue <= after);
});

test("createEngineContext.now uses the injected clock when provided", () => {
  const project = createProjectRecord();
  const fixedNow = new Date("2026-08-11T12:00:00.000Z");
  const context = createEngineContext(project, { now: () => fixedNow });

  assert.equal(context.now().getTime(), fixedNow.getTime());
});

test("getRetainedValue delegates to the injected reader, scoped to the project id", async () => {
  const project = createProjectRecord({ id: "proj_42" });
  const calls: Array<{ projectId: string; key: string }> = [];
  const value = createValueRecord({ projectId: "proj_42", key: "battery.capacity" });

  const context = createEngineContext(project, {
    getRetainedValue: async (projectId, key) => {
      calls.push({ projectId, key });
      return value;
    },
  });

  const result = await context.getRetainedValue("battery.capacity");

  assert.deepEqual(calls, [{ projectId: "proj_42", key: "battery.capacity" }]);
  assert.equal(result, value);
});

test("getRetainedValues delegates to the injected reader, scoped to the project id", async () => {
  const project = createProjectRecord({ id: "proj_42" });
  const values = [createValueRecord({ projectId: "proj_42" })];
  let calledWith: string | undefined;

  const context = createEngineContext(project, {
    getRetainedValues: async (projectId) => {
      calledWith = projectId;
      return values;
    },
  });

  const result = await context.getRetainedValues();

  assert.equal(calledWith, "proj_42");
  assert.equal(result, values);
});

test("getDependencies delegates to the injected reader, scoped to the project id", async () => {
  const project = createProjectRecord({ id: "proj_42" });
  const dependencies = [createDependencyRecord({ projectId: "proj_42" })];
  let calledWith: string | undefined;

  const context = createEngineContext(project, {
    getDependencies: async (projectId) => {
      calledWith = projectId;
      return dependencies;
    },
  });

  const result = await context.getDependencies();

  assert.equal(calledWith, "proj_42");
  assert.equal(result, dependencies);
});

test("the context carries no business logic: no field beyond project, now, and the three readers", () => {
  const project = createProjectRecord();
  const context = createEngineContext(project);

  assert.deepEqual(
    Object.keys(context).sort(),
    ["getDependencies", "getRetainedValue", "getRetainedValues", "now", "project"]
  );
});

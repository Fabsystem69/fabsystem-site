import assert from "node:assert/strict";
import test from "node:test";
import type { ProjectRetainedValue } from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import { createProjectValuesService, type ProjectValuesDb } from "@/lib/services/project-values";

function createValueRecord(overrides: Partial<ProjectRetainedValue> = {}): ProjectRetainedValue {
  const now = new Date("2026-08-10T00:00:00.000Z");

  return {
    id: overrides.id ?? "val_1",
    projectId: overrides.projectId ?? "proj_1",
    key: overrides.key ?? "battery.capacity",
    value: overrides.value ?? { ah: 200, chemistry: "LiFePO4" },
    simulatedValue: overrides.simulatedValue ?? null,
    status: overrides.status ?? "ACTIVE",
    source: overrides.source ?? null,
    retainedAt: overrides.retainedAt ?? now,
    obsoletedAt: overrides.obsoletedAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createMockProjectValuesDb(seed?: { values?: ProjectRetainedValue[] }) {
  const values = [...(seed?.values ?? [])];

  const db: ProjectValuesDb = {
    async upsertRetainedValue(data) {
      const existing = values.find(
        (value) => value.projectId === data.projectId && value.key === data.key
      );

      if (existing) {
        Object.assign(existing, {
          value: data.value,
          simulatedValue: data.simulatedValue,
          source: data.source,
          status: "ACTIVE",
          retainedAt: data.retainedAt,
          obsoletedAt: null,
        });
        return existing;
      }

      const created = createValueRecord({
        id: `val_${values.length + 1}`,
        projectId: data.projectId,
        key: data.key,
        value: data.value as ProjectRetainedValue["value"],
        simulatedValue: data.simulatedValue as ProjectRetainedValue["simulatedValue"],
        source: data.source,
        retainedAt: data.retainedAt,
      });
      values.push(created);
      return created;
    },
    async findRetainedValue(projectId, key) {
      return values.find((value) => value.projectId === projectId && value.key === key) ?? null;
    },
    async updateRetainedValueStatus(id, data) {
      const value = values.find((item) => item.id === id);
      if (!value) throw new Error("Value not found in mock");
      Object.assign(value, data);
      return value;
    },
    async listRetainedValues(projectId) {
      return values.filter((value) => value.projectId === projectId);
    },
  };

  return { db, getValues: () => values };
}

const NOW = new Date("2026-08-10T12:00:00.000Z");

test("retainValue creates a new ACTIVE retained value, distinct from the simulation", async () => {
  const { db } = createMockProjectValuesDb();
  const service = createProjectValuesService(db, { now: () => NOW });

  const result = await service.retainValue({
    projectId: "proj_1",
    key: "battery.capacity",
    value: { ah: 200, chemistry: "LiFePO4" },
    simulatedValue: { ah: 187 },
  });

  assert.deepEqual(result.value, { ah: 200, chemistry: "LiFePO4" });
  assert.deepEqual(result.simulatedValue, { ah: 187 });
  assert.equal(result.status, "ACTIVE");
  assert.equal(result.retainedAt.toISOString(), NOW.toISOString());
});

test("retainValue overwrites the previous retained value for the same key (explicit action)", async () => {
  const { db, getValues } = createMockProjectValuesDb();
  const service = createProjectValuesService(db);

  await service.retainValue({ projectId: "proj_1", key: "battery.capacity", value: { ah: 187 } });
  await service.retainValue({ projectId: "proj_1", key: "battery.capacity", value: { ah: 200 } });

  assert.equal(getValues().length, 1);
  assert.deepEqual(getValues()[0]?.value, { ah: 200 });
});

test("retainValue reactivates a previously obsolete value", async () => {
  const value = createValueRecord({ status: "OBSOLETE", obsoletedAt: new Date("2026-08-09T00:00:00.000Z") });
  const { db } = createMockProjectValuesDb({ values: [value] });
  const service = createProjectValuesService(db, { now: () => NOW });

  const result = await service.retainValue({
    projectId: value.projectId,
    key: value.key,
    value: { ah: 250 },
  });

  assert.equal(result.status, "ACTIVE");
  assert.equal(result.obsoletedAt, null);
});

test("markValueObsolete marks an existing value as OBSOLETE without changing its retained value", async () => {
  const value = createValueRecord();
  const { db } = createMockProjectValuesDb({ values: [value] });
  const service = createProjectValuesService(db, { now: () => NOW });

  const result = await service.markValueObsolete(value.projectId, value.key);

  assert.equal(result.status, "OBSOLETE");
  assert.equal(result.obsoletedAt?.toISOString(), NOW.toISOString());
  assert.deepEqual(result.value, value.value);
});

test("markValueObsolete is idempotent", async () => {
  const value = createValueRecord({ status: "OBSOLETE", obsoletedAt: new Date("2026-08-09T00:00:00.000Z") });
  const { db } = createMockProjectValuesDb({ values: [value] });
  const service = createProjectValuesService(db);

  const result = await service.markValueObsolete(value.projectId, value.key);

  assert.equal(result.obsoletedAt?.toISOString(), "2026-08-09T00:00:00.000Z");
});

test("markValueObsolete throws a 404 when no value was ever retained for this key", async () => {
  const { db } = createMockProjectValuesDb();
  const service = createProjectValuesService(db);

  await assert.rejects(
    () => service.markValueObsolete("proj_1", "unknown.key"),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("getProjectValues lists all retained values for a project", async () => {
  const valueA = createValueRecord({ id: "val_a", projectId: "proj_1", key: "battery.capacity" });
  const valueB = createValueRecord({ id: "val_b", projectId: "proj_1", key: "solar.power" });
  const valueOther = createValueRecord({ id: "val_c", projectId: "proj_2", key: "battery.capacity" });
  const { db } = createMockProjectValuesDb({ values: [valueA, valueB, valueOther] });
  const service = createProjectValuesService(db);

  const result = await service.getProjectValues("proj_1");

  assert.deepEqual(
    result.map((value) => value.id).sort(),
    ["val_a", "val_b"]
  );
});

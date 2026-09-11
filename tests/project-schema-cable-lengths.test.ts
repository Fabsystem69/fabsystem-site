import assert from "node:assert/strict";
import test from "node:test";
import type { Project, ProjectSchema } from "@/lib/generated/prisma/client";
import type { OwnershipActor } from "@/lib/ownership";
import { createProjectSchemaService, type ProjectSchemaDb } from "@/lib/services/project-schema";

function createProjectRecord(overrides: Partial<Project> = {}): Project {
  const now = new Date("2026-08-10T00:00:00.000Z");
  return {
    id: overrides.id ?? "proj_1",
    customerId: overrides.customerId ?? "cust_1",
    name: overrides.name ?? "Projet schema",
    assetType: overrides.assetType ?? "VAN",
    voltage: overrides.voltage ?? "V12",
    status: overrides.status ?? "ACTIVE",
    archivedAt: overrides.archivedAt ?? null,
    deleteScheduledAt: overrides.deleteScheduledAt ?? null,
    preScheduleStatus: overrides.preScheduleStatus ?? null,
    followUpStepOverride: overrides.followUpStepOverride ?? null,
    kitId: overrides.kitId ?? null,
    createdByAdmin: overrides.createdByAdmin ?? false,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createProjectSchemaRecord(overrides: Partial<ProjectSchema> = {}): ProjectSchema {
  const now = new Date("2026-08-10T00:00:00.000Z");
  return {
    id: overrides.id ?? "schema_1",
    projectId: overrides.projectId ?? "proj_1",
    projectName: overrides.projectName ?? "Projet schema",
    nodes: overrides.nodes ?? [],
    edges: overrides.edges ?? [],
    thumbnail: overrides.thumbnail ?? null,
    shareToken: overrides.shareToken ?? null,
    shareEnabledAt: overrides.shareEnabledAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

const OWNER: OwnershipActor = { role: "customer", customerId: "cust_1" };
const PROJECT = createProjectRecord();

const NODES = [
  { id: "n1", data: { componentType: "mppt", label: "Régulateur MPPT" } },
  { id: "n2", data: { componentType: "battery", label: "Batterie" } },
  { id: "n3", data: { componentType: "solar-panel", label: "Panneau solaire" } },
];

function baseDb(overrides: Partial<ProjectSchemaDb> = {}): ProjectSchemaDb {
  return {
    async findByProjectId() {
      return createProjectSchemaRecord();
    },
    async upsert(_projectId, data) {
      return createProjectSchemaRecord({ nodes: data.nodes as never, edges: data.edges as never });
    },
    async findSummariesByProjectIds() {
      return [];
    },
    ...overrides,
  };
}

test("listMissingCableLengths returns only cables without a positive length", async () => {
  const edges = [
    { id: "e1", source: "n1", target: "n2", data: { length: 2.5 } },
    { id: "e2", source: "n3", target: "n1", data: {} },
    { id: "e3", source: "n2", target: "n3", data: { length: 0 } },
  ];
  const db = baseDb({
    async findByProjectId() {
      return createProjectSchemaRecord({ nodes: NODES as never, edges: edges as never });
    },
  });
  const service = createProjectSchemaService(db, { assertOwnedProject: async () => PROJECT });

  const missing = await service.listMissingCableLengths(OWNER, PROJECT.id);

  assert.equal(missing.length, 2);
  assert.deepEqual(
    missing.map((m) => m.edgeId).sort(),
    ["e2", "e3"]
  );
  assert.equal(missing.find((m) => m.edgeId === "e2")?.label, "Panneau solaire → Régulateur MPPT");
});

test("listMissingCableLengths returns an empty list when there is no schema yet", async () => {
  const db = baseDb({
    async findByProjectId() {
      return null;
    },
  });
  const service = createProjectSchemaService(db, { assertOwnedProject: async () => PROJECT });

  const missing = await service.listMissingCableLengths(OWNER, PROJECT.id);

  assert.deepEqual(missing, []);
});

test("setCableLengths writes only the provided positive lengths, leaving other edges untouched", async () => {
  const edges = [
    { id: "e1", source: "n1", target: "n2", data: { length: 2.5 } },
    { id: "e2", source: "n3", target: "n1", data: {} },
  ];
  let savedEdges: unknown = null;
  const db = baseDb({
    async findByProjectId() {
      return createProjectSchemaRecord({ nodes: NODES as never, edges: edges as never });
    },
    async upsert(_projectId, data) {
      savedEdges = data.edges;
      return createProjectSchemaRecord({ nodes: data.nodes as never, edges: data.edges as never });
    },
  });
  const service = createProjectSchemaService(db, {
    assertOwnedProject: async () => PROJECT,
    checkProjectReadOnly: async () => false,
  });

  await service.setCableLengths(OWNER, PROJECT.id, { e2: 4.2, e404: 99 });

  const result = savedEdges as Array<{ id: string; data?: { length?: number } }>;
  assert.equal(result.find((e) => e.id === "e1")?.data?.length, 2.5);
  assert.equal(result.find((e) => e.id === "e2")?.data?.length, 4.2);
});

test("setCableLengths ignores zero/negative/missing values instead of overwriting", async () => {
  const edges = [{ id: "e1", source: "n1", target: "n2", data: { length: 2.5 } }];
  let savedEdges: unknown = null;
  const db = baseDb({
    async findByProjectId() {
      return createProjectSchemaRecord({ nodes: NODES as never, edges: edges as never });
    },
    async upsert(_projectId, data) {
      savedEdges = data.edges;
      return createProjectSchemaRecord({ nodes: data.nodes as never, edges: data.edges as never });
    },
  });
  const service = createProjectSchemaService(db, {
    assertOwnedProject: async () => PROJECT,
    checkProjectReadOnly: async () => false,
  });

  await service.setCableLengths(OWNER, PROJECT.id, { e1: -1 });

  const result = savedEdges as Array<{ id: string; data?: { length?: number } }>;
  assert.equal(result.find((e) => e.id === "e1")?.data?.length, 2.5);
});

test("setCableLengths throws when there is no schema yet", async () => {
  const db = baseDb({
    async findByProjectId() {
      return null;
    },
  });
  const service = createProjectSchemaService(db, {
    assertOwnedProject: async () => PROJECT,
    checkProjectReadOnly: async () => false,
  });

  await assert.rejects(
    () => service.setCableLengths(OWNER, PROJECT.id, { e1: 3 }),
    /Sch.ma introuvable/
  );
});

test("setCableLengths respects the read-only lock for non-admin actors", async () => {
  const edges = [{ id: "e1", source: "n1", target: "n2", data: {} }];
  const db = baseDb({
    async findByProjectId() {
      return createProjectSchemaRecord({ nodes: NODES as never, edges: edges as never });
    },
  });
  const service = createProjectSchemaService(db, {
    assertOwnedProject: async () => PROJECT,
    checkProjectReadOnly: async () => true,
  });

  await assert.rejects(
    () => service.setCableLengths(OWNER, PROJECT.id, { e1: 3 }),
    /read-only/
  );
});

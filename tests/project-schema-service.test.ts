import assert from "node:assert/strict";
import test from "node:test";
import type { Project, ProjectSchema } from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import type { OwnershipActor } from "@/lib/ownership";
import {
  createProjectSchemaService,
  type ProjectSchemaDb,
} from "@/lib/services/project-schema";

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
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

const OWNER: OwnershipActor = { role: "customer", customerId: "cust_1" };
const PROJECT = createProjectRecord();
const MISSING_PROJECT_SCHEMA_TABLE_ERROR = {
  code: "P2021",
  meta: { modelName: "ProjectSchema" },
  message: "The table `public.ProjectSchema` does not exist in the current database.",
};

test("listProjectSchemaSummaries falls back to an empty map when ProjectSchema storage is missing", async () => {
  const reports: string[] = [];

  const db: ProjectSchemaDb = {
    async findByProjectId() {
      return createProjectSchemaRecord();
    },
    async upsert() {
      return createProjectSchemaRecord();
    },
    async findSummariesByProjectIds() {
      throw MISSING_PROJECT_SCHEMA_TABLE_ERROR;
    },
  };

  const service = createProjectSchemaService(db, {
    reportSchemaStorageMissing(operation) {
      reports.push(operation);
    },
  });

  const summaries = await service.listProjectSchemaSummaries([PROJECT.id]);

  assert.equal(summaries.size, 0);
  assert.deepEqual(reports, ["listProjectSchemaSummaries"]);
});

test("getProjectSchema returns null when ProjectSchema storage is missing", async () => {
  const reports: string[] = [];

  const db: ProjectSchemaDb = {
    async findByProjectId() {
      throw MISSING_PROJECT_SCHEMA_TABLE_ERROR;
    },
    async upsert() {
      return createProjectSchemaRecord();
    },
    async findSummariesByProjectIds() {
      return [];
    },
  };

  const service = createProjectSchemaService(db, {
    assertOwnedProject: async () => PROJECT,
    reportSchemaStorageMissing(operation) {
      reports.push(operation);
    },
  });

  const schema = await service.getProjectSchema(OWNER, PROJECT.id);

  assert.equal(schema, null);
  assert.deepEqual(reports, ["getProjectSchema"]);
});

test("saveProjectSchema throws a 503 when ProjectSchema storage is missing", async () => {
  const reports: string[] = [];

  const db: ProjectSchemaDb = {
    async findByProjectId() {
      return createProjectSchemaRecord();
    },
    async upsert() {
      throw MISSING_PROJECT_SCHEMA_TABLE_ERROR;
    },
    async findSummariesByProjectIds() {
      return [];
    },
  };

  const service = createProjectSchemaService(db, {
    assertOwnedProject: async () => PROJECT,
    reportSchemaStorageMissing(operation) {
      reports.push(operation);
    },
  });

  await assert.rejects(
    () =>
      service.saveProjectSchema(OWNER, PROJECT.id, {
        projectName: PROJECT.name,
        nodes: [],
        edges: [],
        thumbnail: null,
      }),
    (error: unknown) =>
      error instanceof HttpError &&
      error.status === 503 &&
      error.code === "SERVICE_UNAVAILABLE" &&
      error.message.includes("migration Prisma")
  );

  assert.deepEqual(reports, ["saveProjectSchema"]);
});

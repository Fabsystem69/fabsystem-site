import assert from "node:assert/strict";
import test from "node:test";
import type { Project } from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import type { OwnershipActor } from "@/lib/ownership";
import {
  createProjectService,
  STANDARD_PROJECT_LIMIT,
  type ProjectDb,
} from "@/lib/services/project";

function createProjectRecord(overrides: Partial<Project> = {}): Project {
  const now = new Date("2026-08-10T00:00:00.000Z");

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

function createMockProjectDb(seed?: { projects?: Project[] }) {
  const projects = [...(seed?.projects ?? [])];
  const state = {
    created: [] as Project[],
    deleted: [] as string[],
  };

  const db: ProjectDb = {
    async createProject(data) {
      const project = createProjectRecord({
        id: `proj_${projects.length + 1}`,
        ...data,
      });
      projects.push(project);
      state.created.push(project);
      return project;
    },
    async findProjectById(id) {
      return projects.find((project) => project.id === id) ?? null;
    },
    async countCustomerProjects(customerId) {
      return projects.filter((project) => project.customerId === customerId).length;
    },
    async listCustomerProjects(customerId) {
      return projects.filter((project) => project.customerId === customerId);
    },
    async updateProjectFields(id, data) {
      const project = projects.find((item) => item.id === id);
      if (!project) throw new Error("Project not found in mock");
      Object.assign(project, data);
      return project;
    },
    async updateProjectState(id, data) {
      const project = projects.find((item) => item.id === id);
      if (!project) throw new Error("Project not found in mock");
      Object.assign(project, data);
      return project;
    },
    async deleteProject(id) {
      const index = projects.findIndex((project) => project.id === id);
      if (index === -1) throw new Error("Project not found in mock");
      projects.splice(index, 1);
      state.deleted.push(id);
    },
  };

  return { db, state, getProjects: () => projects };
}

const OWNER: OwnershipActor = { role: "customer", customerId: "cust_1" };
const STRANGER: OwnershipActor = { role: "customer", customerId: "cust_2" };
const ADMIN: OwnershipActor = { role: "admin" };
const NOW = new Date("2026-08-10T12:00:00.000Z");

function assertForbidden(error: unknown) {
  return error instanceof HttpError && error.status === 403 && error.code === "FORBIDDEN";
}

// ── Création ────────────────────────────────────────────────────────────

test("createProject creates an ACTIVE project for its owner", async () => {
  const { db, state } = createMockProjectDb();
  const service = createProjectService(db, { now: () => NOW });

  const project = await service.createProject(OWNER, {
    customerId: "cust_1",
    name: "Mon bateau",
    assetType: "BOAT",
    voltage: "UNKNOWN",
  });

  assert.equal(project.customerId, "cust_1");
  assert.equal(project.status, "ACTIVE");
  assert.equal(state.created.length, 1);
});

test("createProject accepts 'Je ne sais pas' (UNKNOWN) for voltage without blocking", async () => {
  const { db } = createMockProjectDb();
  const service = createProjectService(db);

  const project = await service.createProject(OWNER, {
    customerId: "cust_1",
    name: "Mon van",
    assetType: "VAN",
    voltage: "UNKNOWN",
  });

  assert.equal(project.voltage, "UNKNOWN");
});

test("createProject refuses a customer creating a project for someone else", async () => {
  const { db } = createMockProjectDb();
  const service = createProjectService(db);

  await assert.rejects(
    () =>
      service.createProject(STRANGER, {
        customerId: "cust_1",
        name: "Mon bateau",
        assetType: "BOAT",
        voltage: "UNKNOWN",
      }),
    assertForbidden
  );
});

test("createProject allows an Admin to create a project on behalf of a customer", async () => {
  const { db, state } = createMockProjectDb();
  const service = createProjectService(db);

  const project = await service.createProject(ADMIN, {
    customerId: "cust_1",
    name: "Mon bateau",
    assetType: "BOAT",
    voltage: "UNKNOWN",
  });

  assert.equal(project.customerId, "cust_1");
  assert.equal(state.created.length, 1);
});

test(`createProject enforces the standard limit of ${STANDARD_PROJECT_LIMIT} projects`, async () => {
  const existing = Array.from({ length: STANDARD_PROJECT_LIMIT }, (_, index) =>
    createProjectRecord({ id: `proj_existing_${index}`, customerId: "cust_1" })
  );
  const { db } = createMockProjectDb({ projects: existing });
  const service = createProjectService(db);

  await assert.rejects(
    () =>
      service.createProject(OWNER, {
        customerId: "cust_1",
        name: "Projet de trop",
        assetType: "BOAT",
        voltage: "UNKNOWN",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("createProject counts archived projects toward the limit (MASTER-06 §7)", async () => {
  const existing = Array.from({ length: STANDARD_PROJECT_LIMIT }, (_, index) =>
    createProjectRecord({ id: `proj_existing_${index}`, customerId: "cust_1", status: "ARCHIVED" })
  );
  const { db } = createMockProjectDb({ projects: existing });
  const service = createProjectService(db);

  await assert.rejects(
    () =>
      service.createProject(OWNER, {
        customerId: "cust_1",
        name: "Projet de trop",
        assetType: "BOAT",
        voltage: "UNKNOWN",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

// ── Lecture ─────────────────────────────────────────────────────────────

test("getProject returns the project for its owner", async () => {
  const project = createProjectRecord();
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  const result = await service.getProject(OWNER, project.id);

  assert.equal(result.id, project.id);
});

test("getProject returns the project for an Admin", async () => {
  const project = createProjectRecord();
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  const result = await service.getProject(ADMIN, project.id);

  assert.equal(result.id, project.id);
});

test("getProject refuses a third-party customer", async () => {
  const project = createProjectRecord();
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  await assert.rejects(() => service.getProject(STRANGER, project.id), assertForbidden);
});

test("getProject throws a 404 for an unknown project id", async () => {
  const { db } = createMockProjectDb();
  const service = createProjectService(db);

  await assert.rejects(
    () => service.getProject(OWNER, "missing"),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("a bare project id never grants access on its own (MASTER-10 §40)", async () => {
  const project = createProjectRecord({ customerId: "resource-owner" });
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);
  const unrelatedActor: OwnershipActor = { role: "customer", customerId: "someone-else" };

  await assert.rejects(() => service.getProject(unrelatedActor, project.id), assertForbidden);
});

// ── Modification ────────────────────────────────────────────────────────

test("updateProject updates only the provided fields", async () => {
  const project = createProjectRecord({ name: "Ancien nom", voltage: "UNKNOWN" });
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  const result = await service.updateProject(OWNER, project.id, { name: "Nouveau nom" });

  assert.equal(result.name, "Nouveau nom");
  assert.equal(result.voltage, "UNKNOWN");
});

test("updateProject refuses a third-party customer", async () => {
  const project = createProjectRecord();
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  await assert.rejects(
    () => service.updateProject(STRANGER, project.id, { name: "Hack" }),
    assertForbidden
  );
});

// ── Archivage ───────────────────────────────────────────────────────────

test("archiveProject archives an ACTIVE project", async () => {
  const project = createProjectRecord({ status: "ACTIVE" });
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db, { now: () => NOW });

  const result = await service.archiveProject(OWNER, project.id);

  assert.equal(result.status, "ARCHIVED");
  assert.equal(result.archivedAt?.toISOString(), NOW.toISOString());
});

test("archiveProject is idempotent for an already ARCHIVED project", async () => {
  const project = createProjectRecord({ status: "ARCHIVED" });
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  const result = await service.archiveProject(OWNER, project.id);

  assert.equal(result.status, "ARCHIVED");
});

test("archiveProject refuses a project pending deletion", async () => {
  const project = createProjectRecord({ status: "DELETE_SCHEDULED" });
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  await assert.rejects(
    () => service.archiveProject(OWNER, project.id),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("archiveProject refuses a third-party customer", async () => {
  const project = createProjectRecord();
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  await assert.rejects(() => service.archiveProject(STRANGER, project.id), assertForbidden);
});

// ── Suppression immédiate ───────────────────────────────────────────────

test("deleteProject requires explicit confirmation", async () => {
  const project = createProjectRecord();
  const { db, state } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  await assert.rejects(
    () => service.deleteProject(OWNER, project.id, { confirm: false }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
  assert.equal(state.deleted.length, 0);
});

test("deleteProject deletes the project definitively once confirmed", async () => {
  const project = createProjectRecord();
  const { db, state, getProjects } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  const result = await service.deleteProject(OWNER, project.id, { confirm: true });

  assert.equal(result.projectId, project.id);
  assert.equal(state.deleted.length, 1);
  assert.equal(getProjects().length, 0);
});

test("deleteProject allows an Admin to delete a project", async () => {
  const project = createProjectRecord();
  const { db, getProjects } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  await service.deleteProject(ADMIN, project.id, { confirm: true });

  assert.equal(getProjects().length, 0);
});

test("deleteProject refuses a third-party customer", async () => {
  const project = createProjectRecord();
  const { db, getProjects } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  await assert.rejects(
    () => service.deleteProject(STRANGER, project.id, { confirm: true }),
    assertForbidden
  );
  assert.equal(getProjects().length, 1);
});

test("deleteProject refuses a project pending deletion (cancel first)", async () => {
  const project = createProjectRecord({ status: "DELETE_SCHEDULED" });
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  await assert.rejects(
    () => service.deleteProject(OWNER, project.id, { confirm: true }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

// ── Programmation suppression 72h ──────────────────────────────────────

test("scheduleDeletion persists status DELETE_SCHEDULED and deleteScheduledAt +72h", async () => {
  const project = createProjectRecord({ status: "ACTIVE" });
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db, { now: () => NOW });

  const result = await service.scheduleDeletion(OWNER, project.id, { confirm: true });

  assert.equal(result.status, "DELETE_SCHEDULED");
  assert.equal(result.preScheduleStatus, "ACTIVE");
  assert.equal(
    result.deleteScheduledAt?.toISOString(),
    new Date(NOW.getTime() + 72 * 60 * 60 * 1000).toISOString()
  );
});

test("scheduleDeletion remembers ARCHIVED as the state to restore", async () => {
  const project = createProjectRecord({ status: "ARCHIVED" });
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db, { now: () => NOW });

  const result = await service.scheduleDeletion(OWNER, project.id, { confirm: true });

  assert.equal(result.preScheduleStatus, "ARCHIVED");
});

test("scheduleDeletion requires explicit confirmation", async () => {
  const project = createProjectRecord();
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  await assert.rejects(
    () => service.scheduleDeletion(OWNER, project.id, { confirm: false }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("scheduleDeletion never deletes any data (MASTER-10 §54)", async () => {
  const project = createProjectRecord();
  const { db, state } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  await service.scheduleDeletion(OWNER, project.id, { confirm: true });

  assert.equal(state.deleted.length, 0);
});

test("scheduleDeletion refuses a project already pending deletion", async () => {
  const project = createProjectRecord({ status: "DELETE_SCHEDULED" });
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  await assert.rejects(
    () => service.scheduleDeletion(OWNER, project.id, { confirm: true }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("scheduleDeletion refuses a third-party customer", async () => {
  const project = createProjectRecord();
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  await assert.rejects(
    () => service.scheduleDeletion(STRANGER, project.id, { confirm: true }),
    assertForbidden
  );
});

// ── Annulation suppression ──────────────────────────────────────────────

test("cancelDeletion restores the ACTIVE state recorded before scheduling", async () => {
  const project = createProjectRecord({
    status: "DELETE_SCHEDULED",
    preScheduleStatus: "ACTIVE",
    deleteScheduledAt: new Date("2026-08-13T12:00:00.000Z"),
  });
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  const result = await service.cancelDeletion(OWNER, project.id);

  assert.equal(result.status, "ACTIVE");
  assert.equal(result.deleteScheduledAt, null);
  assert.equal(result.preScheduleStatus, null);
});

test("cancelDeletion restores the ARCHIVED state recorded before scheduling", async () => {
  const project = createProjectRecord({
    status: "DELETE_SCHEDULED",
    preScheduleStatus: "ARCHIVED",
    deleteScheduledAt: new Date("2026-08-13T12:00:00.000Z"),
  });
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  const result = await service.cancelDeletion(OWNER, project.id);

  assert.equal(result.status, "ARCHIVED");
});

test("cancelDeletion is available to an Admin as well as the owner", async () => {
  const project = createProjectRecord({
    status: "DELETE_SCHEDULED",
    preScheduleStatus: "ACTIVE",
    deleteScheduledAt: new Date("2026-08-13T12:00:00.000Z"),
  });
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  const result = await service.cancelDeletion(ADMIN, project.id);

  assert.equal(result.status, "ACTIVE");
});

test("cancelDeletion refuses a third-party customer", async () => {
  const project = createProjectRecord({
    status: "DELETE_SCHEDULED",
    preScheduleStatus: "ACTIVE",
    deleteScheduledAt: new Date("2026-08-13T12:00:00.000Z"),
  });
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  await assert.rejects(() => service.cancelDeletion(STRANGER, project.id), assertForbidden);
});

test("cancelDeletion refuses a project with no scheduled deletion", async () => {
  const project = createProjectRecord({ status: "ACTIVE" });
  const { db } = createMockProjectDb({ projects: [project] });
  const service = createProjectService(db);

  await assert.rejects(
    () => service.cancelDeletion(OWNER, project.id),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

// ── Liste ───────────────────────────────────────────────────────────────

test("listProjectsForCustomer refuses a third-party customer", async () => {
  const { db } = createMockProjectDb();
  const service = createProjectService(db);

  await assert.rejects(
    () => service.listProjectsForCustomer(STRANGER, "cust_1"),
    assertForbidden
  );
});

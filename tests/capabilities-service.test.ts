import assert from "node:assert/strict";
import test from "node:test";
import type { CustomerCapability } from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import { createCapabilitiesService, type CapabilitiesDb } from "@/lib/services/capabilities";

function createCapabilityRecord(overrides: Partial<CustomerCapability> = {}): CustomerCapability {
  const now = new Date("2026-08-10T00:00:00.000Z");

  return {
    id: overrides.id ?? "cap_1",
    customerId: overrides.customerId ?? "cust_1",
    capability: overrides.capability ?? "project.access",
    scope: overrides.scope ?? "CUSTOMER",
    scopeId: overrides.scopeId ?? null,
    status: overrides.status ?? "ACTIVE",
    source: overrides.source ?? null,
    startsAt: overrides.startsAt ?? now,
    expiresAt: overrides.expiresAt ?? null,
    revokedAt: overrides.revokedAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createMockCapabilitiesDb(seed?: { capabilities?: CustomerCapability[] }) {
  const capabilities = [...(seed?.capabilities ?? [])];
  const state = {
    created: [] as CustomerCapability[],
    updated: [] as Array<{ id: string; data: Record<string, unknown> }>,
  };

  const db: CapabilitiesDb = {
    async createCapability(data) {
      const capability = createCapabilityRecord({
        id: `cap_${capabilities.length + 1}`,
        ...data,
      });
      capabilities.push(capability);
      state.created.push(capability);
      return capability;
    },
    async findCapabilityById(id) {
      return capabilities.find((capability) => capability.id === id) ?? null;
    },
    async updateCapabilityStatus(id, data) {
      const capability = capabilities.find((item) => item.id === id);
      if (!capability) {
        throw new Error("Capability not found in mock");
      }
      Object.assign(capability, data);
      state.updated.push({ id, data });
      return capability;
    },
    async listCapabilitiesByCustomerId(customerId) {
      return capabilities.filter((capability) => capability.customerId === customerId);
    },
  };

  return { db, state, getCapabilities: () => capabilities };
}

test("grantCapability creates a CUSTOMER-scoped ACTIVE capability by default", async () => {
  const { db, state } = createMockCapabilitiesDb();
  const service = createCapabilitiesService(db, {
    now: () => new Date("2026-08-10T12:00:00.000Z"),
  });

  const capability = await service.grantCapability({
    customerId: "cust_1",
    capability: "project.access",
  });

  assert.equal(capability.customerId, "cust_1");
  assert.equal(capability.capability, "project.access");
  assert.equal(capability.scope, "CUSTOMER");
  assert.equal(capability.scopeId, null);
  assert.equal(capability.status, "ACTIVE");
  assert.equal(capability.startsAt.toISOString(), "2026-08-10T12:00:00.000Z");
  assert.equal(capability.expiresAt, null);
  assert.equal(state.created.length, 1);
});

test("grantCapability accepts an explicit scope, scopeId, source and expiresAt", async () => {
  const { db } = createMockCapabilitiesDb();
  const service = createCapabilitiesService(db);

  const capability = await service.grantCapability({
    customerId: "cust_1",
    capability: "fabien.access",
    scope: "PROJECT",
    scopeId: "future_project_id",
    source: "accompagnement_orientation",
    expiresAt: new Date("2026-09-10T00:00:00.000Z"),
  });

  assert.equal(capability.scope, "PROJECT");
  assert.equal(capability.scopeId, "future_project_id");
  assert.equal(capability.source, "accompagnement_orientation");
  assert.equal(capability.expiresAt?.toISOString(), "2026-09-10T00:00:00.000Z");
});

test("grantCapability rejects an empty customerId or capability", async () => {
  const { db } = createMockCapabilitiesDb();
  const service = createCapabilitiesService(db);

  await assert.rejects(
    () => service.grantCapability({ customerId: "  ", capability: "project.access" }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );

  await assert.rejects(
    () => service.grantCapability({ customerId: "cust_1", capability: "  " }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("revokeCapability sets status REVOKED and revokedAt", async () => {
  const capability = createCapabilityRecord();
  const { db } = createMockCapabilitiesDb({ capabilities: [capability] });
  const service = createCapabilitiesService(db, {
    now: () => new Date("2026-08-10T15:00:00.000Z"),
  });

  const revoked = await service.revokeCapability(capability.id);

  assert.equal(revoked.status, "REVOKED");
  assert.equal(revoked.revokedAt?.toISOString(), "2026-08-10T15:00:00.000Z");
});

test("revokeCapability is idempotent for an already REVOKED capability", async () => {
  const capability = createCapabilityRecord({
    status: "REVOKED",
    revokedAt: new Date("2026-08-01T00:00:00.000Z"),
  });
  const { db, state } = createMockCapabilitiesDb({ capabilities: [capability] });
  const service = createCapabilitiesService(db);

  const result = await service.revokeCapability(capability.id);

  assert.equal(result.status, "REVOKED");
  assert.equal(state.updated.length, 0);
});

test("revokeCapability refuses an unknown capability id", async () => {
  const { db } = createMockCapabilitiesDb();
  const service = createCapabilitiesService(db);

  await assert.rejects(
    () => service.revokeCapability("missing_cap"),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("listCustomerCapabilities returns only the requested Customer's capabilities", async () => {
  const capabilityA = createCapabilityRecord({ id: "cap_a", customerId: "cust_1" });
  const capabilityB = createCapabilityRecord({ id: "cap_b", customerId: "cust_2" });
  const { db } = createMockCapabilitiesDb({ capabilities: [capabilityA, capabilityB] });
  const service = createCapabilitiesService(db);

  const result = await service.listCustomerCapabilities("cust_1");

  assert.deepEqual(
    result.map((capability) => capability.id),
    ["cap_a"]
  );
});

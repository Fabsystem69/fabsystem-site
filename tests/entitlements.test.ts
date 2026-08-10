import assert from "node:assert/strict";
import test from "node:test";
import type { CustomerCapability } from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import { computeActiveEntitlements, createEntitlementsService } from "@/lib/entitlements";

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

const NOW = new Date("2026-08-10T12:00:00.000Z");

test("computeActiveEntitlements keeps an ACTIVE capability with no expiry", () => {
  const capability = createCapabilityRecord();

  const result = computeActiveEntitlements([capability], NOW);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.capability, "project.access");
});

test("computeActiveEntitlements excludes a REVOKED capability", () => {
  const capability = createCapabilityRecord({ status: "REVOKED" });

  const result = computeActiveEntitlements([capability], NOW);

  assert.equal(result.length, 0);
});

test("computeActiveEntitlements excludes a capability that has not started yet", () => {
  const capability = createCapabilityRecord({
    startsAt: new Date("2026-09-01T00:00:00.000Z"),
  });

  const result = computeActiveEntitlements([capability], NOW);

  assert.equal(result.length, 0);
});

test("computeActiveEntitlements excludes an expired capability", () => {
  const capability = createCapabilityRecord({
    expiresAt: new Date("2026-08-01T00:00:00.000Z"),
  });

  const result = computeActiveEntitlements([capability], NOW);

  assert.equal(result.length, 0);
});

test("computeActiveEntitlements keeps a capability whose expiresAt is still in the future", () => {
  const capability = createCapabilityRecord({
    expiresAt: new Date("2026-08-11T00:00:00.000Z"),
  });

  const result = computeActiveEntitlements([capability], NOW);

  assert.equal(result.length, 1);
});

test("computeActiveEntitlements excludes a capability expiring exactly now", () => {
  const capability = createCapabilityRecord({ expiresAt: NOW });

  const result = computeActiveEntitlements([capability], NOW);

  assert.equal(result.length, 0);
});

function createEntitlementsServiceWithCapabilities(capabilities: CustomerCapability[]) {
  return createEntitlementsService({
    listCustomerCapabilities: async (customerId: string) =>
      capabilities.filter((capability) => capability.customerId === customerId),
  });
}

test("getCustomerCapabilities returns the raw list, including revoked/expired entries", async () => {
  const capabilities = [
    createCapabilityRecord({ id: "cap_active", customerId: "cust_1" }),
    createCapabilityRecord({ id: "cap_revoked", customerId: "cust_1", status: "REVOKED" }),
  ];
  const service = createEntitlementsServiceWithCapabilities(capabilities);

  const result = await service.getCustomerCapabilities("cust_1");

  assert.deepEqual(
    result.map((capability) => capability.id).sort(),
    ["cap_active", "cap_revoked"]
  );
});

test("getCustomerEntitlements filters out inactive capabilities", async () => {
  const capabilities = [
    createCapabilityRecord({ id: "cap_active", customerId: "cust_1" }),
    createCapabilityRecord({ id: "cap_revoked", customerId: "cust_1", status: "REVOKED" }),
  ];
  const service = createEntitlementsServiceWithCapabilities(capabilities);

  const result = await service.getCustomerEntitlements("cust_1", NOW);

  assert.deepEqual(
    result.map((entitlement) => entitlement.id),
    ["cap_active"]
  );
});

test("hasCapability returns true for an active capability present for this Customer", async () => {
  const capabilities = [
    createCapabilityRecord({ customerId: "cust_1", capability: "project.access" }),
  ];
  const service = createEntitlementsServiceWithCapabilities(capabilities);

  const result = await service.hasCapability("cust_1", "project.access", { now: NOW });

  assert.equal(result, true);
});

test("hasCapability returns false when the capability is absent", async () => {
  const capabilities = [
    createCapabilityRecord({ customerId: "cust_1", capability: "project.access" }),
  ];
  const service = createEntitlementsServiceWithCapabilities(capabilities);

  const result = await service.hasCapability("cust_1", "fabien.access", { now: NOW });

  assert.equal(result, false);
});

test("hasCapability returns false for a capability that belongs to another Customer", async () => {
  const capabilities = [
    createCapabilityRecord({ customerId: "cust_2", capability: "project.access" }),
  ];
  const service = createEntitlementsServiceWithCapabilities(capabilities);

  const result = await service.hasCapability("cust_1", "project.access", { now: NOW });

  assert.equal(result, false);
});

test("hasCapability returns false for a revoked capability", async () => {
  const capabilities = [
    createCapabilityRecord({ customerId: "cust_1", capability: "project.access", status: "REVOKED" }),
  ];
  const service = createEntitlementsServiceWithCapabilities(capabilities);

  const result = await service.hasCapability("cust_1", "project.access", { now: NOW });

  assert.equal(result, false);
});

test("hasCapability returns false for an expired capability", async () => {
  const capabilities = [
    createCapabilityRecord({
      customerId: "cust_1",
      capability: "project.access",
      expiresAt: new Date("2026-08-01T00:00:00.000Z"),
    }),
  ];
  const service = createEntitlementsServiceWithCapabilities(capabilities);

  const result = await service.hasCapability("cust_1", "project.access", { now: NOW });

  assert.equal(result, false);
});

test("hasCapability honors an explicit scope/scopeId filter", async () => {
  const capabilities = [
    createCapabilityRecord({
      customerId: "cust_1",
      capability: "project.access",
      scope: "PROJECT",
      scopeId: "project_a",
    }),
  ];
  const service = createEntitlementsServiceWithCapabilities(capabilities);

  const matching = await service.hasCapability("cust_1", "project.access", {
    now: NOW,
    scope: "PROJECT",
    scopeId: "project_a",
  });
  const nonMatching = await service.hasCapability("cust_1", "project.access", {
    now: NOW,
    scope: "PROJECT",
    scopeId: "project_b",
  });

  assert.equal(matching, true);
  assert.equal(nonMatching, false);
});

test("requireCapability resolves silently when the capability is active", async () => {
  const capabilities = [
    createCapabilityRecord({ customerId: "cust_1", capability: "project.access" }),
  ];
  const service = createEntitlementsServiceWithCapabilities(capabilities);

  await assert.doesNotReject(() =>
    service.requireCapability("cust_1", "project.access", { now: NOW })
  );
});

test("requireCapability throws a 403 HttpError when the capability is missing", async () => {
  const service = createEntitlementsServiceWithCapabilities([]);

  await assert.rejects(
    () => service.requireCapability("cust_1", "project.access", { now: NOW }),
    (error: unknown) =>
      error instanceof HttpError && error.status === 403 && error.code === "FORBIDDEN"
  );
});

test("entitlements engine behaves identically for a PURCHASE-origin and an ADMIN-origin Customer", async () => {
  // Le moteur de droits ne doit dépendre que du CustomerCapability, jamais
  // de l'origine du compte (MASTER-10 §11 : origine du compte ≠ droits du
  // compte). On simule ici les deux origines possibles d'un Customer et on
  // vérifie que le calcul d'entitlement est strictement identique.
  const capabilities = [
    createCapabilityRecord({ id: "cap_purchase", customerId: "cust_purchase" }),
    createCapabilityRecord({ id: "cap_admin", customerId: "cust_admin" }),
  ];
  const service = createEntitlementsServiceWithCapabilities(capabilities);

  const purchaseResult = await service.hasCapability("cust_purchase", "project.access", { now: NOW });
  const adminResult = await service.hasCapability("cust_admin", "project.access", { now: NOW });

  assert.equal(purchaseResult, true);
  assert.equal(adminResult, true);
});

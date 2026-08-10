import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "@/lib/http-errors";
import {
  canAccessOwnedResource,
  isAdminActor,
  isResourceOwner,
  requireOwnerOrAdmin,
  type OwnershipActor,
} from "@/lib/ownership";

test("isAdminActor is true only for an admin actor", () => {
  const admin: OwnershipActor = { role: "admin" };
  const customer: OwnershipActor = { role: "customer", customerId: "cust_1" };

  assert.equal(isAdminActor(admin), true);
  assert.equal(isAdminActor(customer), false);
});

test("isResourceOwner is true only when the customer ids match", () => {
  const owner: OwnershipActor = { role: "customer", customerId: "cust_1" };
  const stranger: OwnershipActor = { role: "customer", customerId: "cust_2" };
  const admin: OwnershipActor = { role: "admin" };

  assert.equal(isResourceOwner(owner, "cust_1"), true);
  assert.equal(isResourceOwner(stranger, "cust_1"), false);
  assert.equal(isResourceOwner(admin, "cust_1"), false);
});

test("canAccessOwnedResource grants access to the owner", () => {
  const owner: OwnershipActor = { role: "customer", customerId: "cust_1" };

  assert.equal(canAccessOwnedResource(owner, "cust_1"), true);
});

test("canAccessOwnedResource grants access to an admin regardless of ownership", () => {
  const admin: OwnershipActor = { role: "admin" };

  assert.equal(canAccessOwnedResource(admin, "cust_1"), true);
});

test("canAccessOwnedResource denies access to a different customer", () => {
  const stranger: OwnershipActor = { role: "customer", customerId: "cust_2" };

  assert.equal(canAccessOwnedResource(stranger, "cust_1"), false);
});

test("requireOwnerOrAdmin resolves silently for the owner", () => {
  const owner: OwnershipActor = { role: "customer", customerId: "cust_1" };

  assert.doesNotThrow(() => requireOwnerOrAdmin(owner, "cust_1"));
});

test("requireOwnerOrAdmin resolves silently for an admin", () => {
  const admin: OwnershipActor = { role: "admin" };

  assert.doesNotThrow(() => requireOwnerOrAdmin(admin, "cust_1"));
});

test("requireOwnerOrAdmin throws a 403 HttpError (access denied) for a different customer", () => {
  const stranger: OwnershipActor = { role: "customer", customerId: "cust_2" };

  assert.throws(
    () => requireOwnerOrAdmin(stranger, "cust_1"),
    (error: unknown) =>
      error instanceof HttpError && error.status === 403 && error.code === "FORBIDDEN"
  );
});

test("a bare resource id never grants access on its own (MASTER-10 §40)", () => {
  // Connaître un identifiant ne suffit jamais : sans acteur correspondant au
  // propriétaire ni rôle admin, l'accès est refusé.
  const unrelatedActor: OwnershipActor = { role: "customer", customerId: "someone-else" };

  assert.equal(canAccessOwnedResource(unrelatedActor, "resource-owner-id"), false);
});

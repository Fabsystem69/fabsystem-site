import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "@/lib/http-errors";
import {
  createOrderPurgeService,
  evaluatePendingOrderPurgeEligibility,
  getPendingOrderAgeDays,
  isPendingOrderPurgeTier,
  PENDING_ORDER_PURGE_THRESHOLD_DAYS,
} from "@/lib/services/order-purge";

type MockOrderRow = {
  id: string;
  orderNumber: string;
  status: "DRAFT" | "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "REFUNDED";
  createdAt: Date;
  customerEmail: string;
  totalCents: number;
  currency: string;
  payments: Array<{ status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED" }>;
  _count: { downloadGrants: number; discountRedemptions: number };
};

function createOrderRow(overrides: Partial<MockOrderRow> = {}): MockOrderRow {
  return {
    id: overrides.id ?? "order_1",
    orderNumber: overrides.orderNumber ?? "FS-20260801-AAA111",
    status: overrides.status ?? "PENDING_PAYMENT",
    createdAt: overrides.createdAt ?? new Date("2026-08-01T00:00:00.000Z"),
    customerEmail: overrides.customerEmail ?? "buyer@example.com",
    totalCents: overrides.totalCents ?? 2900,
    currency: overrides.currency ?? "EUR",
    payments: overrides.payments ?? [{ status: "FAILED" }],
    _count: overrides._count ?? { downloadGrants: 0, discountRedemptions: 0 },
  };
}

function createMockOrderPurgeDb(seed?: { orders?: MockOrderRow[] }) {
  const orders = [...(seed?.orders ?? [])];
  const deletedIds: string[] = [];
  const failingIds = new Set<string>();

  const db = {
    async findPendingPaymentOrders() {
      return orders.filter((order) => order.status === "PENDING_PAYMENT");
    },
    async findOrderForPurgeById(orderId: string) {
      return orders.find((order) => order.id === orderId) ?? null;
    },
    async deleteOrder(orderId: string) {
      if (failingIds.has(orderId)) {
        throw new Error("simulated foreign key violation");
      }
      deletedIds.push(orderId);
    },
  };

  return { db, deletedIds, failingIds };
}

// --- evaluatePendingOrderPurgeEligibility -----------------------------------

test("evaluatePendingOrderPurgeEligibility accepts an abandoned checkout with a failed payment", () => {
  const result = evaluatePendingOrderPurgeEligibility({
    status: "PENDING_PAYMENT",
    totalCents: 2900,
    payments: [{ status: "FAILED" }],
    downloadGrantsCount: 0,
    discountRedemptionsCount: 0,
  });

  assert.deepEqual(result, { eligible: true });
});

test("evaluatePendingOrderPurgeEligibility accepts an order with no payment attempt at all", () => {
  const result = evaluatePendingOrderPurgeEligibility({
    status: "PENDING_PAYMENT",
    totalCents: 2900,
    payments: [],
    downloadGrantsCount: 0,
    discountRedemptionsCount: 0,
  });

  assert.deepEqual(result, { eligible: true });
});

test("evaluatePendingOrderPurgeEligibility never purges a PAID order", () => {
  const result = evaluatePendingOrderPurgeEligibility({
    status: "PAID",
    totalCents: 2900,
    payments: [{ status: "SUCCEEDED" }],
    downloadGrantsCount: 0,
    discountRedemptionsCount: 0,
  });

  assert.equal(result.eligible, false);
});

test("evaluatePendingOrderPurgeEligibility never purges a free/offered order", () => {
  const result = evaluatePendingOrderPurgeEligibility({
    status: "PENDING_PAYMENT",
    totalCents: 0,
    payments: [],
    downloadGrantsCount: 0,
    discountRedemptionsCount: 0,
  });

  assert.equal(result.eligible, false);
});

test("evaluatePendingOrderPurgeEligibility never purges an order that granted a download", () => {
  const result = evaluatePendingOrderPurgeEligibility({
    status: "PENDING_PAYMENT",
    totalCents: 2900,
    payments: [{ status: "FAILED" }],
    downloadGrantsCount: 1,
    discountRedemptionsCount: 0,
  });

  assert.equal(result.eligible, false);
});

test("evaluatePendingOrderPurgeEligibility never purges an order that consumed a discount code", () => {
  const result = evaluatePendingOrderPurgeEligibility({
    status: "PENDING_PAYMENT",
    totalCents: 2900,
    payments: [{ status: "FAILED" }],
    downloadGrantsCount: 0,
    discountRedemptionsCount: 1,
  });

  assert.equal(result.eligible, false);
});

test("evaluatePendingOrderPurgeEligibility never purges an order with a successful payment", () => {
  const result = evaluatePendingOrderPurgeEligibility({
    status: "PENDING_PAYMENT",
    totalCents: 2900,
    payments: [{ status: "FAILED" }, { status: "SUCCEEDED" }],
    downloadGrantsCount: 0,
    discountRedemptionsCount: 0,
  });

  assert.equal(result.eligible, false);
});

test("evaluatePendingOrderPurgeEligibility never purges an order with a payment still in flight", () => {
  const result = evaluatePendingOrderPurgeEligibility({
    status: "PENDING_PAYMENT",
    totalCents: 2900,
    payments: [{ status: "PENDING" }],
    downloadGrantsCount: 0,
    discountRedemptionsCount: 0,
  });

  assert.equal(result.eligible, false);
});

// --- age helpers -------------------------------------------------------------

test("isPendingOrderPurgeTier is false just under the threshold and true at/after it", () => {
  const createdAt = new Date("2026-08-01T00:00:00.000Z");
  const justUnder = new Date(
    createdAt.getTime() + (PENDING_ORDER_PURGE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000 - 1000)
  );
  const exactly = new Date(
    createdAt.getTime() + PENDING_ORDER_PURGE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
  );

  assert.equal(isPendingOrderPurgeTier(createdAt, justUnder), false);
  assert.equal(isPendingOrderPurgeTier(createdAt, exactly), true);
});

test("getPendingOrderAgeDays computes whole days elapsed", () => {
  const createdAt = new Date("2026-08-01T00:00:00.000Z");
  const now = new Date("2026-08-04T12:00:00.000Z");

  assert.equal(getPendingOrderAgeDays(createdAt, now), 3);
});

// --- listPendingOrdersForPurge -----------------------------------------------

test("listPendingOrdersForPurge reports age, purge tier and eligibility per order", async () => {
  const now = new Date("2026-08-10T00:00:00.000Z");
  const recentEligible = createOrderRow({ id: "order_recent", createdAt: new Date("2026-08-08T00:00:00.000Z") });
  const oldEligible = createOrderRow({
    id: "order_old",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
  });
  const oldIneligible = createOrderRow({
    id: "order_old_grant",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    _count: { downloadGrants: 1, discountRedemptions: 0 },
  });
  const { db } = createMockOrderPurgeDb({ orders: [recentEligible, oldEligible, oldIneligible] });
  const service = createOrderPurgeService(db, { now: () => now });

  const summaries = await service.listPendingOrdersForPurge();
  const byId = new Map(summaries.map((summary) => [summary.id, summary]));

  assert.equal(byId.get("order_recent")?.isPurgeTier, false);
  assert.equal(byId.get("order_recent")?.eligibility.eligible, true);

  assert.equal(byId.get("order_old")?.isPurgeTier, true);
  assert.equal(byId.get("order_old")?.eligibility.eligible, true);

  assert.equal(byId.get("order_old_grant")?.isPurgeTier, true);
  assert.equal(byId.get("order_old_grant")?.eligibility.eligible, false);
});

// --- deletePendingOrder (individual) ------------------------------------------

test("deletePendingOrder deletes an eligible order regardless of its age", async () => {
  const recentEligible = createOrderRow({
    id: "order_recent",
    createdAt: new Date("2026-08-09T00:00:00.000Z"),
  });
  const { db, deletedIds } = createMockOrderPurgeDb({ orders: [recentEligible] });
  const service = createOrderPurgeService(db, { now: () => new Date("2026-08-10T00:00:00.000Z") });

  const result = await service.deletePendingOrder("order_recent");

  assert.deepEqual(result, { orderId: "order_recent", orderNumber: recentEligible.orderNumber });
  assert.deepEqual(deletedIds, ["order_recent"]);
});

test("deletePendingOrder refuses a missing order", async () => {
  const { db } = createMockOrderPurgeDb({ orders: [] });
  const service = createOrderPurgeService(db);

  await assert.rejects(
    () => service.deletePendingOrder("missing"),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("deletePendingOrder refuses a PAID order", async () => {
  const paidOrder = createOrderRow({ id: "order_paid", status: "PAID", payments: [{ status: "SUCCEEDED" }] });
  const { db, deletedIds } = createMockOrderPurgeDb({ orders: [paidOrder] });
  const service = createOrderPurgeService(db);

  await assert.rejects(
    () => service.deletePendingOrder("order_paid"),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
  assert.deepEqual(deletedIds, []);
});

test("deletePendingOrder refuses an order that already granted a download", async () => {
  const order = createOrderRow({ id: "order_grant", _count: { downloadGrants: 1, discountRedemptions: 0 } });
  const { db, deletedIds } = createMockOrderPurgeDb({ orders: [order] });
  const service = createOrderPurgeService(db);

  await assert.rejects(
    () => service.deletePendingOrder("order_grant"),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
  assert.deepEqual(deletedIds, []);
});

test("deletePendingOrder refuses an order with a payment still pending", async () => {
  const order = createOrderRow({ id: "order_inflight", payments: [{ status: "PENDING" }] });
  const { db, deletedIds } = createMockOrderPurgeDb({ orders: [order] });
  const service = createOrderPurgeService(db);

  await assert.rejects(
    () => service.deletePendingOrder("order_inflight"),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
  assert.deepEqual(deletedIds, []);
});

// --- purgeAllEligiblePendingOrders (bulk) -------------------------------------

test("purgeAllEligiblePendingOrders only deletes eligible orders at or past the 5-day threshold", async () => {
  const now = new Date("2026-08-10T00:00:00.000Z");
  const tooRecent = createOrderRow({ id: "order_recent", createdAt: new Date("2026-08-08T00:00:00.000Z") });
  const eligibleOld = createOrderRow({ id: "order_old_ok", createdAt: new Date("2026-08-01T00:00:00.000Z") });
  const ineligibleOld = createOrderRow({
    id: "order_old_grant",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    _count: { downloadGrants: 1, discountRedemptions: 0 },
  });
  const { db, deletedIds } = createMockOrderPurgeDb({
    orders: [tooRecent, eligibleOld, ineligibleOld],
  });
  const service = createOrderPurgeService(db, { now: () => now });

  const result = await service.purgeAllEligiblePendingOrders();

  assert.deepEqual(deletedIds, ["order_old_ok"]);
  assert.equal(result.deletedCount, 1);
  assert.deepEqual(result.deletedOrderNumbers, [eligibleOld.orderNumber]);
  assert.equal(result.skipped.length, 1);
  assert.equal(result.skipped[0]?.orderId, "order_old_grant");
});

test("purgeAllEligiblePendingOrders never touches a PAID or free order even if old", async () => {
  const now = new Date("2026-08-10T00:00:00.000Z");
  const paidOld = createOrderRow({
    id: "order_paid_old",
    status: "PAID",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    payments: [{ status: "SUCCEEDED" }],
  });
  const { db, deletedIds } = createMockOrderPurgeDb({ orders: [paidOld] });
  const service = createOrderPurgeService(db, { now: () => now });

  const result = await service.purgeAllEligiblePendingOrders();

  assert.deepEqual(deletedIds, []);
  assert.equal(result.deletedCount, 0);
});

test("purgeAllEligiblePendingOrders reports a database refusal instead of throwing", async () => {
  const now = new Date("2026-08-10T00:00:00.000Z");
  const eligibleOld = createOrderRow({ id: "order_old_fk", createdAt: new Date("2026-08-01T00:00:00.000Z") });
  const { db, failingIds, deletedIds } = createMockOrderPurgeDb({ orders: [eligibleOld] });
  failingIds.add("order_old_fk");
  const service = createOrderPurgeService(db, { now: () => now });

  const result = await service.purgeAllEligiblePendingOrders();

  assert.deepEqual(deletedIds, []);
  assert.equal(result.deletedCount, 0);
  assert.equal(result.skipped.length, 1);
  assert.equal(result.skipped[0]?.orderId, "order_old_fk");
});

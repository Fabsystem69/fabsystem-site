import assert from "node:assert/strict";
import test from "node:test";
import type { DownloadGrant, Order, Payment } from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import { createAdminOrdersService } from "@/lib/services/admin-orders";
import { createAdminRefundsService } from "@/lib/services/admin-refunds";

type RefundOrderRecord = Order & {
  payments: Payment[];
  downloadGrants: DownloadGrant[];
};

function createOrderRecord(overrides: Partial<Order> = {}): Order {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "order_1",
    orderNumber: overrides.orderNumber ?? "FS-20260806-AAA111",
    status: overrides.status ?? "PAID",
    customerId: overrides.customerId ?? "customer_1",
    discountCodeId: overrides.discountCodeId ?? null,
    customerEmail: overrides.customerEmail ?? "buyer@example.com",
    customerName: overrides.customerName ?? "Buyer Example",
    currency: overrides.currency ?? "EUR",
    subtotalCents: overrides.subtotalCents ?? 2900,
    discountTotalCents: overrides.discountTotalCents ?? 0,
    totalCents: overrides.totalCents ?? 2900,
    cartId: overrides.cartId ?? "cart_1",
    projectId: overrides.projectId ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    paidAt: overrides.paidAt ?? now,
    cancelledAt: overrides.cancelledAt ?? null,
    refundedAt: overrides.refundedAt ?? null,
  };
}

function createPaymentRecord(overrides: Partial<Payment> = {}): Payment {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "payment_1",
    orderId: overrides.orderId ?? "order_1",
    provider: overrides.provider ?? "STRIPE",
    status: overrides.status ?? "SUCCEEDED",
    amountCents: overrides.amountCents ?? 2900,
    currency: overrides.currency ?? "EUR",
    stripeCheckoutSessionId: overrides.stripeCheckoutSessionId ?? "cs_test_1234567890",
    stripePaymentIntentId: overrides.stripePaymentIntentId ?? "pi_refundable_123456",
    stripeCustomerId: overrides.stripeCustomerId ?? "cus_123456",
    rawProviderStatus: overrides.rawProviderStatus ?? "paid",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    succeededAt: overrides.succeededAt ?? now,
    failedAt: overrides.failedAt ?? null,
    refundedAt: overrides.refundedAt ?? null,
  };
}

function createGrantRecord(overrides: Partial<DownloadGrant> = {}): DownloadGrant {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "grant_1",
    orderId: overrides.orderId ?? "order_1",
    orderItemId: overrides.orderItemId ?? "item_1",
    productId: overrides.productId ?? "prod_1",
    assetId: overrides.assetId ?? "asset_1",
    customerEmail: overrides.customerEmail ?? "buyer@example.com",
    status: overrides.status ?? "ACTIVE",
    downloadCount: overrides.downloadCount ?? 0,
    maxDownloads: overrides.maxDownloads ?? 10,
    expiresAt: overrides.expiresAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    revokedAt: overrides.revokedAt ?? null,
    lastDownloadedAt: overrides.lastDownloadedAt ?? null,
  };
}

function createMockAdminRefundsDb(seed?: { orders?: RefundOrderRecord[] }) {
  const state = {
    orders: [...(seed?.orders ?? [])],
    refundCallCount: 0,
    revokeCallCount: 0,
  };

  const db = {
    async findOrderById(orderId: string) {
      const order = state.orders.find((entry) => entry.id === orderId);
      return order
        ? {
            ...order,
            payments: order.payments.map((payment) => ({ ...payment })),
            downloadGrants: order.downloadGrants.map((grant) => ({ ...grant })),
          }
        : null;
    },
    async transaction<T>(
      callback: (tx: {
        markPaymentRefunded(
          paymentId: string,
          refundedAt: Date,
          rawProviderStatus: string | null
        ): Promise<void>;
        markOrderRefunded(orderId: string, refundedAt: Date): Promise<void>;
        revokeActiveDownloadGrantsForOrder(orderId: string, revokedAt: Date): Promise<number>;
      }) => Promise<T>
    ) {
      return callback({
        async markPaymentRefunded(paymentId, refundedAt, rawProviderStatus) {
          const payment = state.orders
            .flatMap((order) => order.payments)
            .find((entry) => entry.id === paymentId);

          if (!payment) {
            throw new Error("Payment not found");
          }

          payment.status = "REFUNDED";
          payment.refundedAt = refundedAt;
          payment.rawProviderStatus = rawProviderStatus;
        },
        async markOrderRefunded(orderId, refundedAt) {
          const order = state.orders.find((entry) => entry.id === orderId);

          if (!order) {
            throw new Error("Order not found");
          }

          order.status = "REFUNDED";
          order.refundedAt = refundedAt;
        },
        async revokeActiveDownloadGrantsForOrder(orderId, revokedAt) {
          state.revokeCallCount += 1;

          const order = state.orders.find((entry) => entry.id === orderId);

          if (!order) {
            throw new Error("Order not found");
          }

          let updated = 0;

          for (const grant of order.downloadGrants) {
            if (grant.status === "ACTIVE") {
              grant.status = "REVOKED";
              grant.revokedAt = revokedAt;
              updated += 1;
            }
          }

          return updated;
        },
      });
    },
  };

  return { db, state };
}

test("refundOrderInFull rejects an invalid confirmation text", async () => {
  const order = createOrderRecord();
  const { db } = createMockAdminRefundsDb({
    orders: [
      {
        ...order,
        payments: [createPaymentRecord({ orderId: order.id })],
        downloadGrants: [],
      },
    ],
  });
  const service = createAdminRefundsService(db);

  await assert.rejects(
    () =>
      service.refundOrderInFull({
        orderId: order.id,
        confirmationText: "CONFIRMER",
      }),
    (error: unknown) =>
      error instanceof HttpError &&
      error.status === 400 &&
      /REMBOURSER/.test(error.message)
  );
});

test("refundOrderInFull refuses a non-paid order", async () => {
  const order = createOrderRecord({
    status: "PENDING_PAYMENT",
    paidAt: null,
  });
  const { db } = createMockAdminRefundsDb({
    orders: [
      {
        ...order,
        payments: [createPaymentRecord({ orderId: order.id, status: "PENDING" })],
        downloadGrants: [],
      },
    ],
  });
  const service = createAdminRefundsService(db);

  await assert.rejects(
    () =>
      service.refundOrderInFull({
        orderId: order.id,
        confirmationText: "REMBOURSER",
      }),
    (error: unknown) =>
      error instanceof HttpError && error.status === 409 && /payee/i.test(error.message)
  );
});

test("refundOrderInFull is idempotent for an already refunded order", async () => {
  const order = createOrderRecord({
    status: "REFUNDED",
    refundedAt: new Date("2026-08-06T12:00:00.000Z"),
  });
  let stripeCalls = 0;
  const { db } = createMockAdminRefundsDb({
    orders: [
      {
        ...order,
        payments: [
          createPaymentRecord({
            orderId: order.id,
            status: "REFUNDED",
            refundedAt: new Date("2026-08-06T12:00:00.000Z"),
          }),
        ],
        downloadGrants: [createGrantRecord({ orderId: order.id, status: "REVOKED" })],
      },
    ],
  });
  const service = createAdminRefundsService(db, {
    createRefund: async () => {
      stripeCalls += 1;
      return { id: "re_should_not_run", status: "succeeded" };
    },
  });

  const result = await service.refundOrderInFull({
    orderId: order.id,
    confirmationText: "REMBOURSER",
  });

  assert.equal(result.alreadyRefunded, true);
  assert.equal(result.status, "REFUNDED");
  assert.equal(result.refundedGrantCount, 0);
  assert.equal(stripeCalls, 0);
});

test("refundOrderInFull refunds Stripe, updates order and revokes active grants", async () => {
  const refundedAt = new Date("2026-08-06T16:00:00.000Z");
  const order = createOrderRecord();
  const payment = createPaymentRecord({ orderId: order.id, amountCents: 5900 });
  const activeGrant = createGrantRecord({ orderId: order.id, id: "grant_active", status: "ACTIVE" });
  const revokedGrant = createGrantRecord({
    orderId: order.id,
    id: "grant_revoked",
    status: "REVOKED",
    revokedAt: new Date("2026-08-05T16:00:00.000Z"),
  });
  let capturedRefundInput: {
    paymentIntentId: string;
    amountCents: number;
    orderId: string;
    orderNumber: string;
    idempotencyKey: string;
  } | null = null;
  const { db, state } = createMockAdminRefundsDb({
    orders: [
      {
        ...order,
        totalCents: 5900,
        payments: [payment],
        downloadGrants: [activeGrant, revokedGrant],
      },
    ],
  });
  const service = createAdminRefundsService(db, {
    now: () => refundedAt,
    createRefund: async (input) => {
      capturedRefundInput = input;
      state.refundCallCount += 1;
      return { id: "re_123456", status: "succeeded" };
    },
  });

  const result = await service.refundOrderInFull({
    orderId: order.id,
    confirmationText: "REMBOURSER",
  });

  assert.equal(result.alreadyRefunded, false);
  assert.equal(result.status, "REFUNDED");
  assert.equal(result.refundedGrantCount, 1);
  assert.deepEqual(capturedRefundInput, {
    paymentIntentId: "pi_refundable_123456",
    amountCents: 5900,
    orderId: order.id,
    orderNumber: order.orderNumber,
    idempotencyKey: `order-refund-full:${order.id}`,
  });
  assert.equal(state.refundCallCount, 1);
  assert.equal(state.revokeCallCount, 1);
  assert.equal(state.orders[0]?.status, "REFUNDED");
  assert.deepEqual(state.orders[0]?.refundedAt, refundedAt);
  assert.equal(state.orders[0]?.payments[0]?.status, "REFUNDED");
  assert.deepEqual(state.orders[0]?.payments[0]?.refundedAt, refundedAt);
  assert.equal(state.orders[0]?.downloadGrants[0]?.status, "REVOKED");
  assert.deepEqual(state.orders[0]?.downloadGrants[0]?.revokedAt, refundedAt);
  assert.equal(state.orders[0]?.downloadGrants[1]?.status, "REVOKED");
});

test("refundOrderInFull does not mutate local state if Stripe refund fails", async () => {
  const order = createOrderRecord();
  const payment = createPaymentRecord({ orderId: order.id });
  const grant = createGrantRecord({ orderId: order.id, status: "ACTIVE" });
  const { db, state } = createMockAdminRefundsDb({
    orders: [
      {
        ...order,
        payments: [payment],
        downloadGrants: [grant],
      },
    ],
  });
  const service = createAdminRefundsService(db, {
    createRefund: async () => {
      throw new Error("stripe failure");
    },
  });

  await assert.rejects(() =>
    service.refundOrderInFull({
      orderId: order.id,
      confirmationText: "REMBOURSER",
    })
  );

  assert.equal(state.orders[0]?.status, "PAID");
  assert.equal(state.orders[0]?.payments[0]?.status, "SUCCEEDED");
  assert.equal(state.orders[0]?.downloadGrants[0]?.status, "ACTIVE");
});

test("refundOrderInFull makes refund readiness false after a successful refund", async () => {
  const order = createOrderRecord();
  const payment = createPaymentRecord({ orderId: order.id });
  const { db, state } = createMockAdminRefundsDb({
    orders: [
      {
        ...order,
        payments: [payment],
        downloadGrants: [],
      },
    ],
  });
  const refundService = createAdminRefundsService(db, {
    createRefund: async () => ({ id: "re_123456", status: "succeeded" }),
  });
  const ordersService = createAdminOrdersService({
    async listOrders() {
      return state.orders.map((entry) => ({
        ...entry,
        items: [],
        payments: entry.payments.map((currentPayment) => ({ ...currentPayment })),
        discountCode: null,
      }));
    },
    async findOrderById(orderId: string) {
      const current = state.orders.find((entry) => entry.id === orderId);

      if (!current) {
        return null;
      }

      return {
        ...current,
        items: [],
        payments: current.payments.map((currentPayment) => ({ ...currentPayment })),
        downloadGrants: [],
        discountCode: null,
      };
    },
  });

  await refundService.refundOrderInFull({
    orderId: order.id,
    confirmationText: "REMBOURSER",
  });

  const detail = await ordersService.getDashboardOrderDetail(order.id);

  assert.equal(detail.refundReadiness.canRefund, false);
  assert.match(detail.refundReadiness.reason ?? "", /deja remboursee/i);
});

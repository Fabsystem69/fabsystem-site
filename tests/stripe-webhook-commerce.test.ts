import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import type { DiscountCode, Order, Payment } from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import {
  createStripeWebhookCommerceService,
  isCommerceCheckoutSession,
  type CommerceWebhookDb,
} from "@/lib/services/stripe-webhook-commerce";

type PaymentWithOrder = Payment & {
  order: Order;
};

function createOrderRecord(overrides: Partial<Order> = {}): Order {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "order_1",
    orderNumber: overrides.orderNumber ?? "FS-20260806-ABC123",
    status: overrides.status ?? "PENDING_PAYMENT",
    customerId: overrides.customerId ?? null,
    discountCodeId: overrides.discountCodeId ?? null,
    customerEmail: overrides.customerEmail ?? "buyer@example.com",
    customerName: overrides.customerName ?? null,
    currency: overrides.currency ?? "EUR",
    subtotalCents: overrides.subtotalCents ?? 2900,
    discountTotalCents: overrides.discountTotalCents ?? 0,
    totalCents: overrides.totalCents ?? 2900,
    cartId: overrides.cartId ?? "cart_1",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    paidAt: overrides.paidAt ?? null,
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
    status: overrides.status ?? "PENDING",
    amountCents: overrides.amountCents ?? 2900,
    currency: overrides.currency ?? "EUR",
    stripeCheckoutSessionId: overrides.stripeCheckoutSessionId ?? "cs_test_123",
    stripePaymentIntentId: overrides.stripePaymentIntentId ?? null,
    stripeCustomerId: overrides.stripeCustomerId ?? null,
    rawProviderStatus: overrides.rawProviderStatus ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    succeededAt: overrides.succeededAt ?? null,
    failedAt: overrides.failedAt ?? null,
    refundedAt: overrides.refundedAt ?? null,
  };
}

function createCheckoutSession(
  overrides: Partial<Stripe.Checkout.Session> = {}
): Stripe.Checkout.Session {
  return {
    id: overrides.id ?? "cs_test_123",
    object: "checkout.session",
    metadata: overrides.metadata ?? {
      orderId: "order_1",
      orderNumber: "FS-20260806-ABC123",
      paymentId: "payment_1",
    },
    payment_status: overrides.payment_status ?? "paid",
    amount_total: overrides.amount_total ?? 2900,
    currency: overrides.currency ?? "eur",
    payment_intent: overrides.payment_intent ?? "pi_123",
    customer: overrides.customer ?? "cus_123",
    ...overrides,
  } as Stripe.Checkout.Session;
}

function createDiscountCodeRecord(overrides: Partial<DiscountCode> = {}): DiscountCode {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "discount_1",
    code: overrides.code ?? "COACH-ABC123",
    status: overrides.status ?? "ACTIVE",
    type: overrides.type ?? "FIXED_AMOUNT",
    amountOffCents: overrides.amountOffCents ?? 1000,
    percentOff: overrides.percentOff ?? null,
    currency: overrides.currency ?? "EUR",
    maxRedemptions: overrides.maxRedemptions ?? 1,
    redeemedCount: overrides.redeemedCount ?? 0,
    startsAt: overrides.startsAt ?? now,
    expiresAt: overrides.expiresAt ?? null,
    productId: overrides.productId ?? null,
    customerEmail: overrides.customerEmail ?? null,
    reason: overrides.reason ?? "Code de réduction",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createMockCommerceWebhookDb(seed?: {
  payment?: PaymentWithOrder | null;
  discountCodes?: DiscountCode[];
}) {
  let payment = seed?.payment ?? null;
  const state = {
    paymentUpdates: [] as Array<{
      paymentId: string;
      status: "SUCCEEDED";
      stripePaymentIntentId: string | null;
      stripeCustomerId: string | null;
      rawProviderStatus: string | null;
      succeededAt: Date;
    }>,
    orderUpdates: [] as Array<{
      orderId: string;
      status: "PAID";
      paidAt: Date;
    }>,
    failedPaymentUpdates: [] as Array<{
      paymentId: string;
      status: "FAILED";
      rawProviderStatus: string | null;
      failedAt: Date;
    }>,
    discountCodes: [...(seed?.discountCodes ?? [])],
    discountRedemptions: [] as Array<{
      discountCodeId: string;
      orderId: string;
      customerEmail: string;
      productId: string | null;
      amountDiscountedCents: number;
    }>,
  };

  const db = {
    async findPaymentByStripeCheckoutSessionId(sessionId: string) {
      return payment?.stripeCheckoutSessionId === sessionId ? payment : null;
    },
    async updatePaymentSuccess(
      paymentId: string,
      data: {
        status: "SUCCEEDED";
        stripePaymentIntentId: string | null;
        stripeCustomerId: string | null;
        rawProviderStatus: string | null;
        succeededAt: Date;
      }
    ) {
      if (!payment || payment.id !== paymentId) {
        throw new Error("Payment not found in mock");
      }

      payment = {
        ...payment,
        status: data.status,
        stripePaymentIntentId: data.stripePaymentIntentId,
        stripeCustomerId: data.stripeCustomerId,
        rawProviderStatus: data.rawProviderStatus,
        succeededAt: data.succeededAt,
      };
      state.paymentUpdates.push({ paymentId, ...data });
      return payment;
    },
    async updatePaymentFailed(
      paymentId: string,
      data: {
        status: "FAILED";
        rawProviderStatus: string | null;
        failedAt: Date;
      }
    ) {
      if (!payment || payment.id !== paymentId) {
        throw new Error("Payment not found in mock");
      }

      payment = {
        ...payment,
        status: data.status,
        rawProviderStatus: data.rawProviderStatus,
        failedAt: data.failedAt,
      };
      state.failedPaymentUpdates.push({ paymentId, ...data });
      return payment;
    },
    async updateOrderPaid(
      orderId: string,
      data: {
        status: "PAID";
        paidAt: Date;
      }
    ) {
      if (!payment || payment.order.id !== orderId) {
        throw new Error("Order not found in mock");
      }

      payment = {
        ...payment,
        order: {
          ...payment.order,
          status: data.status,
          paidAt: data.paidAt,
        },
      };
      state.orderUpdates.push({ orderId, ...data });
      return payment.order;
    },
    async findDiscountRedemption(discountCodeId: string, orderId: string) {
      const found = state.discountRedemptions.find(
        (item) => item.discountCodeId === discountCodeId && item.orderId === orderId
      );
      return found ? { id: `redemption_${state.discountRedemptions.indexOf(found)}` } : null;
    },
    async findDiscountCodeCapacity(discountCodeId: string) {
      const discountCode = state.discountCodes.find((item) => item.id === discountCodeId);

      if (!discountCode) {
        return null;
      }

      return {
        maxRedemptions: discountCode.maxRedemptions,
        productId: discountCode.productId,
      };
    },
    async incrementDiscountCodeRedeemedCountIfCapacity(discountCodeId: string, maxRedemptions: number) {
      const discountCode = state.discountCodes.find((item) => item.id === discountCodeId);

      if (!discountCode || discountCode.redeemedCount >= maxRedemptions) {
        return 0;
      }

      discountCode.redeemedCount += 1;
      return 1;
    },
    async decrementDiscountCodeRedeemedCount(discountCodeId: string) {
      const discountCode = state.discountCodes.find((item) => item.id === discountCodeId);

      if (!discountCode) {
        throw new Error("Discount code not found in mock");
      }

      discountCode.redeemedCount -= 1;
    },
    async createDiscountRedemption(data: {
      discountCodeId: string;
      orderId: string;
      customerEmail: string;
      productId: string | null;
      amountDiscountedCents: number;
    }) {
      state.discountRedemptions.push(data);
      return data;
    },
    async transaction<T>(callback: (db: CommerceWebhookDb) => Promise<T>): Promise<T> {
      return callback(db);
    },
  };

  return { db, state, getPayment: () => payment };
}

function createMockDownloadGrantDeps() {
  const state = {
    orderIds: [] as string[],
  };

  return {
    state,
    async createDownloadGrantsForOrder(orderId: string) {
      state.orderIds.push(orderId);
      return {
        createdCount: 1,
        existingCount: 0,
        activeCount: 1,
        grants: [],
      };
    },
  };
}

function createMockAutoDiscountDeps() {
  const state = {
    orderIds: [] as string[],
  };

  return {
    state,
    async createAutomaticEbookDiscountCodesForOrder(orderId: string) {
      state.orderIds.push(orderId);
      return [];
    },
  };
}

function createMockNotifyDeps() {
  const state = {
    calls: [] as Array<{ orderId: string; metadata: Stripe.Metadata | null | undefined }>,
  };

  return {
    state,
    async sendPrestationsPackNotification(
      orderId: string,
      metadata: Stripe.Metadata | null | undefined
    ) {
      state.calls.push({ orderId, metadata });
    },
  };
}

function createExpiredCheckoutSession(
  overrides: Partial<Stripe.Checkout.Session> = {}
): Stripe.Checkout.Session {
  return createCheckoutSession({
    status: "expired",
    payment_status: "unpaid",
    ...overrides,
  });
}

test("isCommerceCheckoutSession detects commerce metadata", () => {
  assert.equal(isCommerceCheckoutSession(createCheckoutSession()), true);
  assert.equal(
    isCommerceCheckoutSession(
      createCheckoutSession({
        metadata: {
          email: "legacy@example.com",
          name: "Legacy",
        },
      })
    ),
    false
  );
});

test("handleCommerceCheckoutCompleted refuses missing metadata", async () => {
  const order = createOrderRecord();
  const payment = { ...createPaymentRecord(), order };
  const { db } = createMockCommerceWebhookDb({ payment });
  const service = createStripeWebhookCommerceService(db);

  await assert.rejects(
    () =>
      service.handleCommerceCheckoutCompleted(
        createCheckoutSession({
          metadata: {
            orderId: "order_1",
          },
        })
      ),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("handleCommerceCheckoutCompleted ignores sessions that are not paid", async () => {
  const order = createOrderRecord();
  const payment = { ...createPaymentRecord(), order };
  const { db, state } = createMockCommerceWebhookDb({ payment });
  const grantDeps = createMockDownloadGrantDeps();
  const service = createStripeWebhookCommerceService(db, grantDeps);

  const result = await service.handleCommerceCheckoutCompleted(
    createCheckoutSession({
      payment_status: "unpaid",
    })
  );

  assert.deepEqual(result, {
    status: "ignored_unpaid",
    reason: "payment_status_not_paid",
  });
  assert.equal(state.paymentUpdates.length, 0);
  assert.equal(state.orderUpdates.length, 0);
  assert.equal(grantDeps.state.orderIds.length, 0);
});

test("handleCommerceCheckoutCompleted refuses a missing payment", async () => {
  const { db } = createMockCommerceWebhookDb({ payment: null });
  const service = createStripeWebhookCommerceService(db);

  await assert.rejects(
    () => service.handleCommerceCheckoutCompleted(createCheckoutSession()),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("handleCommerceCheckoutCompleted refuses paymentId mismatch", async () => {
  const order = createOrderRecord();
  const payment = { ...createPaymentRecord({ id: "payment_local" }), order };
  const { db } = createMockCommerceWebhookDb({ payment });
  const service = createStripeWebhookCommerceService(db);

  await assert.rejects(
    () =>
      service.handleCommerceCheckoutCompleted(
        createCheckoutSession({
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentId: "payment_other",
          },
        })
      ),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("handleCommerceCheckoutCompleted refuses orderId mismatch", async () => {
  const order = createOrderRecord({ id: "order_local" });
  const payment = { ...createPaymentRecord(), order };
  const { db } = createMockCommerceWebhookDb({ payment });
  const service = createStripeWebhookCommerceService(db);

  await assert.rejects(
    () =>
      service.handleCommerceCheckoutCompleted(
        createCheckoutSession({
          metadata: {
            orderId: "order_other",
            orderNumber: order.orderNumber,
            paymentId: payment.id,
          },
        })
      ),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("handleCommerceCheckoutCompleted refuses orderNumber mismatch", async () => {
  const order = createOrderRecord({ orderNumber: "FS-20260806-LOCAL1" });
  const payment = { ...createPaymentRecord(), order };
  const { db } = createMockCommerceWebhookDb({ payment });
  const service = createStripeWebhookCommerceService(db);

  await assert.rejects(
    () =>
      service.handleCommerceCheckoutCompleted(
        createCheckoutSession({
          metadata: {
            orderId: order.id,
            orderNumber: "FS-20260806-OTHER1",
            paymentId: payment.id,
          },
        })
      ),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("handleCommerceCheckoutCompleted refuses amount mismatch", async () => {
  const order = createOrderRecord();
  const payment = { ...createPaymentRecord({ amountCents: 2900 }), order };
  const { db } = createMockCommerceWebhookDb({ payment });
  const service = createStripeWebhookCommerceService(db);

  await assert.rejects(
    () =>
      service.handleCommerceCheckoutCompleted(
        createCheckoutSession({
          amount_total: 3900,
        })
      ),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("handleCommerceCheckoutCompleted refuses currency mismatch", async () => {
  const order = createOrderRecord();
  const payment = { ...createPaymentRecord({ currency: "EUR" }), order };
  const { db } = createMockCommerceWebhookDb({ payment });
  const service = createStripeWebhookCommerceService(db);

  await assert.rejects(
    () =>
      service.handleCommerceCheckoutCompleted(
        createCheckoutSession({
          currency: "usd",
        })
      ),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("handleCommerceCheckoutCompleted passes payment to SUCCEEDED and order to PAID", async () => {
  const order = createOrderRecord();
  const payment = { ...createPaymentRecord(), order };
  const timestamp = new Date("2026-08-06T12:00:00.000Z");
  const { db, state, getPayment } = createMockCommerceWebhookDb({ payment });
  const grantDeps = createMockDownloadGrantDeps();
  const service = createStripeWebhookCommerceService(db, {
    now: () => timestamp,
    createDownloadGrantsForOrder: grantDeps.createDownloadGrantsForOrder,
  });

  const result = await service.handleCommerceCheckoutCompleted(createCheckoutSession());
  const updated = getPayment();

  assert.deepEqual(result, {
    status: "processed",
    orderId: order.id,
    paymentId: payment.id,
  });
  assert.equal(state.paymentUpdates.length, 1);
  assert.equal(state.orderUpdates.length, 1);
  assert.equal(updated?.status, "SUCCEEDED");
  assert.equal(updated?.succeededAt?.toISOString(), "2026-08-06T12:00:00.000Z");
  assert.equal(updated?.stripePaymentIntentId, "pi_123");
  assert.equal(updated?.stripeCustomerId, "cus_123");
  assert.equal(updated?.rawProviderStatus, "paid");
  assert.equal(updated?.order.status, "PAID");
  assert.equal(updated?.order.paidAt?.toISOString(), "2026-08-06T12:00:00.000Z");
  assert.deepEqual(grantDeps.state.orderIds, [order.id]);
});

test("handleCommerceCheckoutCompleted is idempotent when already processed", async () => {
  const order = createOrderRecord({
    status: "PAID",
    paidAt: new Date("2026-08-06T12:00:00.000Z"),
  });
  const payment = {
    ...createPaymentRecord({
      status: "SUCCEEDED",
      succeededAt: new Date("2026-08-06T12:00:00.000Z"),
    }),
    order,
  };
  const { db, state } = createMockCommerceWebhookDb({ payment });
  const grantDeps = createMockDownloadGrantDeps();
  const service = createStripeWebhookCommerceService(db, grantDeps);

  const result = await service.handleCommerceCheckoutCompleted(createCheckoutSession());

  assert.deepEqual(result, {
    status: "already_processed",
    orderId: order.id,
    paymentId: payment.id,
  });
  assert.equal(state.paymentUpdates.length, 0);
  assert.equal(state.orderUpdates.length, 0);
  assert.deepEqual(grantDeps.state.orderIds, [order.id]);
});

test("handleCommerceCheckoutCompleted stays idempotent when grants already exist", async () => {
  const order = createOrderRecord({
    status: "PAID",
    paidAt: new Date("2026-08-06T12:00:00.000Z"),
  });
  const payment = {
    ...createPaymentRecord({
      status: "SUCCEEDED",
      succeededAt: new Date("2026-08-06T12:00:00.000Z"),
    }),
    order,
  };
  const { db } = createMockCommerceWebhookDb({ payment });
  const calls: string[] = [];
  const service = createStripeWebhookCommerceService(db, {
    async createDownloadGrantsForOrder(orderId: string) {
      calls.push(orderId);
      return {
        createdCount: 0,
        existingCount: 1,
        activeCount: 1,
        grants: [],
      };
    },
  });

  const result = await service.handleCommerceCheckoutCompleted(createCheckoutSession());

  assert.deepEqual(result, {
    status: "already_processed",
    orderId: order.id,
    paymentId: payment.id,
  });
  assert.deepEqual(calls, [order.id]);
});

test("handleCommerceCheckoutCompleted refuses a cancelled order", async () => {
  const order = createOrderRecord({ status: "CANCELLED" });
  const payment = { ...createPaymentRecord(), order };
  const { db } = createMockCommerceWebhookDb({ payment });
  const grantDeps = createMockDownloadGrantDeps();
  const service = createStripeWebhookCommerceService(db, grantDeps);

  await assert.rejects(
    () => service.handleCommerceCheckoutCompleted(createCheckoutSession()),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
  assert.equal(grantDeps.state.orderIds.length, 0);
});

test("handleCommerceCheckoutCompleted refuses a failed payment", async () => {
  const order = createOrderRecord();
  const payment = { ...createPaymentRecord({ status: "FAILED" }), order };
  const { db } = createMockCommerceWebhookDb({ payment });
  const grantDeps = createMockDownloadGrantDeps();
  const service = createStripeWebhookCommerceService(db, grantDeps);

  await assert.rejects(
    () => service.handleCommerceCheckoutCompleted(createCheckoutSession()),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
  assert.equal(grantDeps.state.orderIds.length, 0);
});

test("handleCommerceCheckoutCompleted does not create grants on metadata mismatch", async () => {
  const order = createOrderRecord();
  const payment = { ...createPaymentRecord(), order };
  const { db } = createMockCommerceWebhookDb({ payment });
  const grantDeps = createMockDownloadGrantDeps();
  const service = createStripeWebhookCommerceService(db, grantDeps);

  await assert.rejects(
    () =>
      service.handleCommerceCheckoutCompleted(
        createCheckoutSession({
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentId: "payment_other",
          },
        })
      ),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );

  assert.equal(grantDeps.state.orderIds.length, 0);
});

test("handleCommerceCheckoutExpired marks a pending payment as failed", async () => {
  const order = createOrderRecord();
  const payment = { ...createPaymentRecord(), order };
  const timestamp = new Date("2026-08-06T13:00:00.000Z");
  const { db, state, getPayment } = createMockCommerceWebhookDb({ payment });
  const service = createStripeWebhookCommerceService(db, {
    now: () => timestamp,
  });

  const result = await service.handleCommerceCheckoutExpired(createExpiredCheckoutSession());
  const updated = getPayment();

  assert.deepEqual(result, {
    status: "expired_marked_failed",
    orderId: order.id,
    paymentId: payment.id,
  });
  assert.equal(state.failedPaymentUpdates.length, 1);
  assert.equal(state.paymentUpdates.length, 0);
  assert.equal(updated?.status, "FAILED");
  assert.equal(updated?.rawProviderStatus, "expired");
  assert.equal(updated?.failedAt?.toISOString(), "2026-08-06T13:00:00.000Z");
});

test("handleCommerceCheckoutExpired ignores when the order is already paid", async () => {
  const order = createOrderRecord({
    status: "PAID",
    paidAt: new Date("2026-08-06T12:00:00.000Z"),
  });
  const payment = {
    ...createPaymentRecord({
      status: "SUCCEEDED",
      succeededAt: new Date("2026-08-06T12:00:00.000Z"),
    }),
    order,
  };
  const { db, state } = createMockCommerceWebhookDb({ payment });
  const service = createStripeWebhookCommerceService(db);

  const result = await service.handleCommerceCheckoutExpired(createExpiredCheckoutSession());

  assert.deepEqual(result, {
    status: "ignored_paid_order",
    orderId: order.id,
    paymentId: payment.id,
  });
  assert.equal(state.failedPaymentUpdates.length, 0);
});

test("handleCommerceCheckoutExpired is idempotent for an already failed payment", async () => {
  const order = createOrderRecord();
  const payment = {
    ...createPaymentRecord({
      status: "FAILED",
      failedAt: new Date("2026-08-06T12:00:00.000Z"),
      rawProviderStatus: "expired",
    }),
    order,
  };
  const { db, state } = createMockCommerceWebhookDb({ payment });
  const service = createStripeWebhookCommerceService(db);

  const result = await service.handleCommerceCheckoutExpired(createExpiredCheckoutSession());

  assert.deepEqual(result, {
    status: "ignored_already_terminal",
    orderId: order.id,
    paymentId: payment.id,
  });
  assert.equal(state.failedPaymentUpdates.length, 0);
});

test("handleCommerceCheckoutExpired does not create grants", async () => {
  const order = createOrderRecord();
  const payment = { ...createPaymentRecord(), order };
  const { db } = createMockCommerceWebhookDb({ payment });
  const grantDeps = createMockDownloadGrantDeps();
  const service = createStripeWebhookCommerceService(db, grantDeps);

  await service.handleCommerceCheckoutExpired(createExpiredCheckoutSession());

  assert.deepEqual(grantDeps.state.orderIds, []);
});

test("handleCommerceCheckoutCompleted sends the Fabien notification with session metadata on first processing", async () => {
  const order = createOrderRecord();
  const payment = { ...createPaymentRecord(), order };
  const { db } = createMockCommerceWebhookDb({ payment });
  const notifyDeps = createMockNotifyDeps();
  const session = createCheckoutSession({
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      needsVehicle: "Van Ducato",
    },
  });
  const service = createStripeWebhookCommerceService(db, notifyDeps);

  await service.handleCommerceCheckoutCompleted(session);

  assert.equal(notifyDeps.state.calls.length, 1);
  assert.equal(notifyDeps.state.calls[0]?.orderId, order.id);
  assert.equal(notifyDeps.state.calls[0]?.metadata?.needsVehicle, "Van Ducato");
});

test("handleCommerceCheckoutCompleted generates the automatic ebook discount code(s) for the order", async () => {
  const order = createOrderRecord();
  const payment = { ...createPaymentRecord(), order };
  const { db } = createMockCommerceWebhookDb({ payment });
  const autoDiscountDeps = createMockAutoDiscountDeps();
  const session = createCheckoutSession({
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
    },
  });
  const service = createStripeWebhookCommerceService(db, autoDiscountDeps);

  await service.handleCommerceCheckoutCompleted(session);

  assert.deepEqual(autoDiscountDeps.state.orderIds, [order.id]);
});

test("handleCommerceCheckoutCompleted also regenerates (idempotently) on an already-processed redelivery", async () => {
  const order = createOrderRecord({
    status: "PAID",
    paidAt: new Date("2026-08-06T12:00:00.000Z"),
  });
  const payment = {
    ...createPaymentRecord({
      status: "SUCCEEDED",
      succeededAt: new Date("2026-08-06T12:00:00.000Z"),
    }),
    order,
  };
  const { db } = createMockCommerceWebhookDb({ payment });
  const autoDiscountDeps = createMockAutoDiscountDeps();
  const service = createStripeWebhookCommerceService(db, autoDiscountDeps);

  await service.handleCommerceCheckoutCompleted(createCheckoutSession());

  assert.deepEqual(autoDiscountDeps.state.orderIds, [order.id]);
});

test("handleCommerceCheckoutCompleted also sends the notification on an already-processed redelivery", async () => {
  const order = createOrderRecord({
    status: "PAID",
    paidAt: new Date("2026-08-06T12:00:00.000Z"),
  });
  const payment = {
    ...createPaymentRecord({
      status: "SUCCEEDED",
      succeededAt: new Date("2026-08-06T12:00:00.000Z"),
    }),
    order,
  };
  const { db } = createMockCommerceWebhookDb({ payment });
  const notifyDeps = createMockNotifyDeps();
  const service = createStripeWebhookCommerceService(db, notifyDeps);

  await service.handleCommerceCheckoutCompleted(createCheckoutSession());

  assert.equal(notifyDeps.state.calls.length, 1);
});

test("handleCommerceCheckoutCompleted consumes the discount code only when the order is actually paid", async () => {
  const discountCode = createDiscountCodeRecord({
    id: "discount_paid_path",
    maxRedemptions: 5,
    redeemedCount: 2,
  });
  const order = createOrderRecord({
    discountCodeId: discountCode.id,
    discountTotalCents: 1000,
  });
  const payment = { ...createPaymentRecord(), order };
  const { db, state } = createMockCommerceWebhookDb({
    payment,
    discountCodes: [discountCode],
  });
  const service = createStripeWebhookCommerceService(db);

  const result = await service.handleCommerceCheckoutCompleted(createCheckoutSession());

  assert.equal(result.status, "processed");
  assert.equal(state.discountRedemptions.length, 1);
  assert.equal(state.discountRedemptions[0]?.discountCodeId, discountCode.id);
  assert.equal(state.discountRedemptions[0]?.orderId, order.id);
  assert.equal(state.discountRedemptions[0]?.amountDiscountedCents, 1000);
  assert.equal(state.discountCodes[0]?.redeemedCount, 3);
});

test("handleCommerceCheckoutCompleted never double-counts a discount redemption on webhook retry", async () => {
  const discountCode = createDiscountCodeRecord({
    id: "discount_retry",
    maxRedemptions: 1,
    redeemedCount: 0,
  });
  const order = createOrderRecord({
    discountCodeId: discountCode.id,
    discountTotalCents: 1000,
  });
  const payment = { ...createPaymentRecord(), order };
  const { db, state } = createMockCommerceWebhookDb({
    payment,
    discountCodes: [discountCode],
  });
  const service = createStripeWebhookCommerceService(db);

  await service.handleCommerceCheckoutCompleted(createCheckoutSession());
  const secondResult = await service.handleCommerceCheckoutCompleted(createCheckoutSession());

  assert.equal(secondResult.status, "already_processed");
  assert.equal(state.discountRedemptions.length, 1);
  assert.equal(state.discountCodes[0]?.redeemedCount, 1);
});

test("handleCommerceCheckoutCompleted honors an already-Stripe-paid customer when the discount code is exhausted by a concurrent order", async () => {
  const discountCode = createDiscountCodeRecord({
    id: "discount_exhausted",
    maxRedemptions: 1,
    redeemedCount: 1,
  });
  const order = createOrderRecord({
    discountCodeId: discountCode.id,
    discountTotalCents: 1000,
  });
  const payment = { ...createPaymentRecord(), order };
  const { db, state, getPayment } = createMockCommerceWebhookDb({
    payment,
    discountCodes: [discountCode],
  });
  const service = createStripeWebhookCommerceService(db);

  const result = await service.handleCommerceCheckoutCompleted(createCheckoutSession());

  assert.equal(result.status, "processed");
  assert.equal(getPayment()?.order.status, "PAID");
  assert.equal(state.discountRedemptions.length, 0);
  assert.equal(state.discountCodes[0]?.redeemedCount, 1);
});

test("handleCommerceCheckoutCompleted does not send the notification for an unpaid session", async () => {
  const notifyDeps = createMockNotifyDeps();
  const service = createStripeWebhookCommerceService(
    createMockCommerceWebhookDb().db,
    notifyDeps
  );

  await service.handleCommerceCheckoutCompleted(
    createCheckoutSession({ payment_status: "unpaid" })
  );

  assert.equal(notifyDeps.state.calls.length, 0);
});

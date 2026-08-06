import assert from "node:assert/strict";
import test from "node:test";
import type { Order, OrderItem, Payment, PaymentStatus } from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import { buildCheckoutSessionParams, createCheckoutService } from "@/lib/services/checkout";

type OrderRecord = Order & {
  items?: OrderItem[];
  payments?: Payment[];
};

function createOrderRecord(overrides: Partial<Order> = {}): Order {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "order_1",
    orderNumber: overrides.orderNumber ?? "FS-20260806-ABC123",
    status: overrides.status ?? "PENDING_PAYMENT",
    customerEmail: overrides.customerEmail ?? "buyer@example.com",
    customerName: overrides.customerName ?? null,
    currency: overrides.currency ?? "EUR",
    subtotalCents: overrides.subtotalCents ?? 2900,
    totalCents: overrides.totalCents ?? 2900,
    cartId: overrides.cartId ?? "cart_1",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    paidAt: overrides.paidAt ?? null,
    cancelledAt: overrides.cancelledAt ?? null,
    refundedAt: overrides.refundedAt ?? null,
  };
}

function createOrderItemRecord(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: overrides.id ?? "item_1",
    orderId: overrides.orderId ?? "order_1",
    productId: overrides.productId ?? "prod_1",
    productSlug: overrides.productSlug ?? "ebook-electricite-van",
    productName: overrides.productName ?? "Ebook Electricite Van",
    productType: overrides.productType ?? "EBOOK",
    quantity: overrides.quantity ?? 1,
    currency: overrides.currency ?? "EUR",
    unitAmountCents: overrides.unitAmountCents ?? 2900,
    lineTotalCents: overrides.lineTotalCents ?? 2900,
    createdAt: overrides.createdAt ?? new Date("2026-08-06T00:00:00.000Z"),
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
    stripeCheckoutSessionId: overrides.stripeCheckoutSessionId ?? null,
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

function createMockCheckoutDb(seed?: {
  orders?: OrderRecord[];
  orderItems?: OrderItem[];
  payments?: Payment[];
}) {
  const state = {
    orders: [...(seed?.orders ?? [])],
    orderItems: [...(seed?.orderItems ?? [])],
    payments: [...(seed?.payments ?? [])],
    updatedPayments: [] as Array<{
      paymentId: string;
      status?: PaymentStatus;
      stripeCheckoutSessionId?: string | null;
      rawProviderStatus?: string | null;
      failedAt?: Date | null;
    }>,
    createdPayments: [] as Payment[],
  };

  const inflateOrder = (order: Order): OrderRecord => ({
    ...order,
    items: state.orderItems.filter((item) => item.orderId === order.id),
    payments: state.payments.filter((payment) => payment.orderId === order.id),
  });

  const db = {
    async findOrderById(orderId: string) {
      const order = state.orders.find((item) => item.id === orderId);
      return order ? inflateOrder(order) : null;
    },
    async updatePayment(
      paymentId: string,
      data: {
        status?: PaymentStatus;
        stripeCheckoutSessionId?: string | null;
        rawProviderStatus?: string | null;
        failedAt?: Date | null;
      }
    ) {
      const payment = state.payments.find((item) => item.id === paymentId);

      if (!payment) {
        throw new Error("Payment not found in mock");
      }

      if (typeof data.status !== "undefined") {
        payment.status = data.status;
      }
      if (typeof data.stripeCheckoutSessionId !== "undefined") {
        payment.stripeCheckoutSessionId = data.stripeCheckoutSessionId;
      }
      if (typeof data.rawProviderStatus !== "undefined") {
        payment.rawProviderStatus = data.rawProviderStatus;
      }
      if (typeof data.failedAt !== "undefined") {
        payment.failedAt = data.failedAt;
      }
      payment.updatedAt = new Date("2026-08-06T01:00:00.000Z");
      state.updatedPayments.push({ paymentId, ...data });
      return payment;
    },
    async createPayment(data: {
      orderId: string;
      provider: "STRIPE";
      status: PaymentStatus;
      amountCents: number;
      currency: string;
    }) {
      const payment = createPaymentRecord({
        id: `payment_${state.payments.length + 1}`,
        orderId: data.orderId,
        provider: data.provider,
        status: data.status,
        amountCents: data.amountCents,
        currency: data.currency,
        stripeCheckoutSessionId: null,
        rawProviderStatus: null,
      });
      state.payments.push(payment);
      state.createdPayments.push(payment);
      return payment;
    },
    async transaction<T>(callback: (db: typeof db) => Promise<T>) {
      return callback(db);
    },
  };

  return { db, state };
}

function createStripeClientMock() {
  const createCalls: Array<unknown> = [];
  const retrieveCalls: string[] = [];
  const sessions = new Map<
    string,
    { id: string; url: string | null; status: "open" | "complete" | "expired"; payment_status?: string | null }
  >();

  sessions.set("cs_test_123", {
    id: "cs_test_123",
    url: "https://checkout.stripe.com/c/pay/cs_test_123",
    status: "open",
    payment_status: "unpaid",
  });

  return {
    createCalls,
    retrieveCalls,
    sessions,
    client: {
      checkout: {
        sessions: {
          async create(params: unknown) {
            createCalls.push(params);
            return {
              id: "cs_test_123",
              url: "https://checkout.stripe.com/c/pay/cs_test_123",
              status: "open",
            };
          },
          async retrieve(sessionId: string) {
            retrieveCalls.push(sessionId);
            const session = sessions.get(sessionId);

            if (!session) {
              throw new Error(`Unknown checkout session ${sessionId}`);
            }

            return session;
          },
        },
      },
    },
  };
}

test("buildCheckoutSessionParams builds line_items and metadata from order snapshots", () => {
  const order = {
    ...createOrderRecord(),
    items: [
      createOrderItemRecord({
        id: "item_1",
        quantity: 1,
        currency: "EUR",
        unitAmountCents: 2900,
        productName: "Ebook Electricite Van",
      }),
    ],
    payments: [],
  };

  const params = buildCheckoutSessionParams({
    order,
    paymentId: "payment_1",
    baseUrl: "https://fabsystem.test",
  });

  assert.equal(params.mode, "payment");
  assert.equal(params.customer_email, "buyer@example.com");
  assert.equal(params.success_url, "https://fabsystem.test/commande/merci?order=FS-20260806-ABC123");
  assert.equal(params.cancel_url, "https://fabsystem.test/panier");
  assert.deepEqual(params.metadata, {
    orderId: "order_1",
    orderNumber: "FS-20260806-ABC123",
    paymentId: "payment_1",
  });
  assert.equal(params.line_items?.length, 1);
  assert.deepEqual(params.line_items?.[0], {
    price_data: {
      currency: "eur",
      product_data: {
        name: "Ebook Electricite Van",
      },
      unit_amount: 2900,
    },
    quantity: 1,
  });
});

test("createCheckoutSessionForOrder refuses a missing order", async () => {
  const { db } = createMockCheckoutDb();
  const stripe = createStripeClientMock();
  const service = createCheckoutService(db, {
    stripeClient: stripe.client,
    getBaseUrl: () => "https://fabsystem.test",
  });

  await assert.rejects(
    () => service.createCheckoutSessionForOrder({ orderId: "missing" }),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("createCheckoutSessionForOrder refuses an order not in PENDING_PAYMENT", async () => {
  const order = createOrderRecord({ status: "PAID" });
  const { db } = createMockCheckoutDb({
    orders: [order],
    orderItems: [createOrderItemRecord({ orderId: order.id })],
    payments: [createPaymentRecord({ orderId: order.id })],
  });
  const stripe = createStripeClientMock();
  const service = createCheckoutService(db, {
    stripeClient: stripe.client,
    getBaseUrl: () => "https://fabsystem.test",
  });

  await assert.rejects(
    () => service.createCheckoutSessionForOrder({ orderId: order.id }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("createCheckoutSessionForOrder refuses an order without items", async () => {
  const order = createOrderRecord();
  const { db } = createMockCheckoutDb({
    orders: [order],
    payments: [createPaymentRecord({ orderId: order.id })],
  });
  const stripe = createStripeClientMock();
  const service = createCheckoutService(db, {
    stripeClient: stripe.client,
    getBaseUrl: () => "https://fabsystem.test",
  });

  await assert.rejects(
    () => service.createCheckoutSessionForOrder({ orderId: order.id }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("createCheckoutSessionForOrder refuses if pending Stripe payment is missing", async () => {
  const order = createOrderRecord();
  const { db } = createMockCheckoutDb({
    orders: [order],
    orderItems: [createOrderItemRecord({ orderId: order.id })],
    payments: [createPaymentRecord({ orderId: order.id, status: "FAILED" as PaymentStatus })],
  });
  const stripe = createStripeClientMock();
  const service = createCheckoutService(db, {
    stripeClient: stripe.client,
    getBaseUrl: () => "https://fabsystem.test",
  });

  await assert.rejects(
    () => service.createCheckoutSessionForOrder({ orderId: order.id }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("createCheckoutSessionForOrder refuses if multiple pending Stripe payments exist", async () => {
  const order = createOrderRecord();
  const { db } = createMockCheckoutDb({
    orders: [order],
    orderItems: [createOrderItemRecord({ orderId: order.id })],
    payments: [
      createPaymentRecord({ id: "payment_1", orderId: order.id }),
      createPaymentRecord({ id: "payment_2", orderId: order.id }),
    ],
  });
  const stripe = createStripeClientMock();
  const service = createCheckoutService(db, {
    stripeClient: stripe.client,
    getBaseUrl: () => "https://fabsystem.test",
  });

  await assert.rejects(
    () => service.createCheckoutSessionForOrder({ orderId: order.id }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("createCheckoutSessionForOrder refuses if checkout was already created", async () => {
  const order = createOrderRecord();
  const { db } = createMockCheckoutDb({
    orders: [order],
    orderItems: [createOrderItemRecord({ orderId: order.id })],
    payments: [
      createPaymentRecord({
        orderId: order.id,
        stripeCheckoutSessionId: "cs_existing",
      }),
    ],
  });
  const stripe = createStripeClientMock();
  const service = createCheckoutService(db, {
    stripeClient: stripe.client,
    getBaseUrl: () => "https://fabsystem.test",
  });

  await assert.rejects(
    () => service.createCheckoutSessionForOrder({ orderId: order.id }),
    (error: unknown) => error instanceof Error && error.message === "Unknown checkout session cs_existing"
  );
});

test("createCheckoutSessionForOrder refuses when NEXT_PUBLIC_BASE_URL is missing", async () => {
  const order = createOrderRecord();
  const { db } = createMockCheckoutDb({
    orders: [order],
    orderItems: [createOrderItemRecord({ orderId: order.id })],
    payments: [createPaymentRecord({ orderId: order.id })],
  });
  const stripe = createStripeClientMock();
  const service = createCheckoutService(db, {
    stripeClient: stripe.client,
    getBaseUrl: () => undefined,
  });

  await assert.rejects(
    () => service.createCheckoutSessionForOrder({ orderId: order.id }),
    (error: unknown) => error instanceof HttpError && error.status === 500
  );
});

test("createCheckoutSessionForOrder creates a Stripe session from order snapshots and updates only the payment", async () => {
  const order = createOrderRecord({
    id: "order_checkout",
    orderNumber: "FS-20260806-CHK123",
    customerEmail: "buyer@example.com",
    status: "PENDING_PAYMENT",
  });
  const itemA = createOrderItemRecord({
    id: "item_a",
    orderId: order.id,
    productName: "Ebook Electricite Van",
    quantity: 1,
    unitAmountCents: 2900,
    lineTotalCents: 2900,
  });
  const itemB = createOrderItemRecord({
    id: "item_b",
    orderId: order.id,
    productId: "prod_2",
    productSlug: "bundle-checklist",
    productName: "Checklist Bonus",
    quantity: 1,
    unitAmountCents: 900,
    lineTotalCents: 900,
  });
  const payment = createPaymentRecord({
    id: "payment_checkout",
    orderId: order.id,
    status: "PENDING",
    amountCents: 3800,
    currency: "EUR",
  });
  const { db, state } = createMockCheckoutDb({
    orders: [order],
    orderItems: [itemA, itemB],
    payments: [payment],
  });
  const stripe = createStripeClientMock();
  const service = createCheckoutService(db, {
    stripeClient: stripe.client,
    getBaseUrl: () => "https://fabsystem.test",
  });

  const result = await service.createCheckoutSessionForOrder({
    orderId: order.id,
  });

  assert.equal(result.url, "https://checkout.stripe.com/c/pay/cs_test_123");
  assert.equal(stripe.createCalls.length, 1);
  assert.equal(state.updatedPayments.length, 1);
  assert.deepEqual(state.updatedPayments[0], {
    paymentId: "payment_checkout",
    stripeCheckoutSessionId: "cs_test_123",
    rawProviderStatus: "open",
  });
  assert.equal(state.orders[0]?.status, "PENDING_PAYMENT");
  assert.equal(state.payments[0]?.stripeCheckoutSessionId, "cs_test_123");
  assert.equal(state.payments[0]?.rawProviderStatus, "open");
});

test("createCheckoutSessionForOrder never marks the order as paid", async () => {
  const order = createOrderRecord({ id: "order_pending" });
  const { db, state } = createMockCheckoutDb({
    orders: [order],
    orderItems: [createOrderItemRecord({ orderId: order.id })],
    payments: [createPaymentRecord({ orderId: order.id })],
  });
  const stripe = createStripeClientMock();
  const service = createCheckoutService(db, {
    stripeClient: stripe.client,
    getBaseUrl: () => "https://fabsystem.test",
  });

  await service.createCheckoutSessionForOrder({ orderId: order.id });

  assert.equal(state.orders[0]?.status, "PENDING_PAYMENT");
  assert.equal(state.orders[0]?.paidAt, null);
});

test("createCheckoutSessionForOrder returns the existing URL when the Stripe session is already open", async () => {
  const order = createOrderRecord();
  const { db, state } = createMockCheckoutDb({
    orders: [order],
    orderItems: [createOrderItemRecord({ orderId: order.id })],
    payments: [
      createPaymentRecord({
        orderId: order.id,
        stripeCheckoutSessionId: "cs_existing_open",
      }),
    ],
  });
  const stripe = createStripeClientMock();
  stripe.sessions.set("cs_existing_open", {
    id: "cs_existing_open",
    url: "https://checkout.stripe.com/c/pay/cs_existing_open",
    status: "open",
    payment_status: "unpaid",
  });
  const service = createCheckoutService(db, {
    stripeClient: stripe.client,
    getBaseUrl: () => "https://fabsystem.test",
  });

  const result = await service.createCheckoutSessionForOrder({ orderId: order.id });

  assert.equal(result.url, "https://checkout.stripe.com/c/pay/cs_existing_open");
  assert.deepEqual(stripe.retrieveCalls, ["cs_existing_open"]);
  assert.equal(stripe.createCalls.length, 0);
  assert.equal(state.updatedPayments.length, 0);
  assert.equal(state.createdPayments.length, 0);
});

test("createCheckoutSessionForOrder recreates a payment and session when the previous checkout expired", async () => {
  const order = createOrderRecord({ id: "order_retry" });
  const previousPayment = createPaymentRecord({
    id: "payment_old",
    orderId: order.id,
    stripeCheckoutSessionId: "cs_expired_123",
  });
  const { db, state } = createMockCheckoutDb({
    orders: [order],
    orderItems: [createOrderItemRecord({ orderId: order.id })],
    payments: [previousPayment],
  });
  const stripe = createStripeClientMock();
  stripe.sessions.set("cs_expired_123", {
    id: "cs_expired_123",
    url: null,
    status: "expired",
    payment_status: "unpaid",
  });
  const service = createCheckoutService(db, {
    stripeClient: stripe.client,
    getBaseUrl: () => "https://fabsystem.test",
  });

  const result = await service.createCheckoutSessionForOrder({ orderId: order.id });

  assert.equal(result.url, "https://checkout.stripe.com/c/pay/cs_test_123");
  assert.deepEqual(stripe.retrieveCalls, ["cs_expired_123"]);
  assert.equal(stripe.createCalls.length, 1);
  assert.equal(state.updatedPayments.length, 2);
  assert.deepEqual(state.updatedPayments[0], {
    paymentId: "payment_old",
    status: "FAILED",
    rawProviderStatus: "expired",
    failedAt: state.updatedPayments[0]?.failedAt,
  });
  assert.equal(state.updatedPayments[1]?.paymentId, "payment_2");
  assert.equal(state.updatedPayments[1]?.stripeCheckoutSessionId, "cs_test_123");
  assert.equal(state.updatedPayments[1]?.rawProviderStatus, "open");
  assert.equal(state.createdPayments.length, 1);
  assert.equal(state.createdPayments[0]?.status, "PENDING");
  assert.equal(state.createdPayments[0]?.amountCents, previousPayment.amountCents);
  assert.equal(state.createdPayments[0]?.currency, previousPayment.currency);
  assert.equal(state.orders[0]?.status, "PENDING_PAYMENT");
});

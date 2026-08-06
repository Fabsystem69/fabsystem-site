import assert from "node:assert/strict";
import test from "node:test";
import type {
  DigitalAsset,
  DownloadGrant,
  Order,
  OrderItem,
  Payment,
  Product,
} from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import { createAdminOrdersService } from "@/lib/services/admin-orders";

type OrderRecord = Order & {
  items?: OrderItem[];
  payments?: Payment[];
  downloadGrants?: DownloadGrantWithRelations[];
  discountCode?: { id: string; code: string; reason: string | null } | null;
};

type DownloadGrantWithRelations = DownloadGrant & {
  product: Product;
  asset: DigitalAsset;
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
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    paidAt: overrides.paidAt ?? now,
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
    status: overrides.status ?? "SUCCEEDED",
    amountCents: overrides.amountCents ?? 2900,
    currency: overrides.currency ?? "EUR",
    stripeCheckoutSessionId: overrides.stripeCheckoutSessionId ?? "cs_test_1234567890",
    stripePaymentIntentId: overrides.stripePaymentIntentId ?? "pi_1234567890abcd",
    stripeCustomerId: overrides.stripeCustomerId ?? "cus_123456",
    rawProviderStatus: overrides.rawProviderStatus ?? "paid",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    succeededAt: overrides.succeededAt ?? now,
    failedAt: overrides.failedAt ?? null,
    refundedAt: overrides.refundedAt ?? null,
  };
}

function createProductRecord(overrides: Partial<Product> = {}): Product {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "prod_1",
    slug: overrides.slug ?? "ebook-electricite-van",
    name: overrides.name ?? "Ebook Electricite Van",
    shortDescription: overrides.shortDescription ?? null,
    description: overrides.description ?? null,
    status: overrides.status ?? "ACTIVE",
    productType: overrides.productType ?? "EBOOK",
    purchaseMode: overrides.purchaseMode ?? "BUY_NOW",
    featuredImage: overrides.featuredImage ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createAssetRecord(overrides: Partial<DigitalAsset> = {}): DigitalAsset {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "asset_1",
    provider: overrides.provider ?? "SUPABASE",
    bucket: overrides.bucket ?? "ebooks-private",
    path: overrides.path ?? "ebooks/ebook-electricite-van/v1/ebook.pdf",
    filename: overrides.filename ?? "ebook.pdf",
    contentType: overrides.contentType ?? "application/pdf",
    sizeBytes: overrides.sizeBytes ?? 1024,
    version: overrides.version ?? "v1",
    status: overrides.status ?? "ACTIVE",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
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
    downloadCount: overrides.downloadCount ?? 1,
    maxDownloads: overrides.maxDownloads ?? 10,
    expiresAt: overrides.expiresAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    revokedAt: overrides.revokedAt ?? null,
    lastDownloadedAt: overrides.lastDownloadedAt ?? null,
  };
}

function createMockAdminOrdersDb(seed?: { orders?: OrderRecord[] }) {
  const state = {
    orders: [...(seed?.orders ?? [])],
    listCalls: 0,
    findCalls: 0,
  };

  const inflateOrder = (order: OrderRecord) => ({
    ...order,
    items: [...(order.items ?? [])],
    payments: [...(order.payments ?? [])],
    downloadGrants: [...(order.downloadGrants ?? [])],
    discountCode: order.discountCode ?? null,
  });

  const db = {
    async listOrders() {
      state.listCalls += 1;
      return state.orders
        .slice()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(inflateOrder);
    },
    async findOrderById(orderId: string) {
      state.findCalls += 1;
      const order = state.orders.find((item) => item.id === orderId);
      return order ? inflateOrder(order) : null;
    },
  };

  return { db, state };
}

test("listDashboardOrders lists recent orders with email and total", async () => {
  const older = createOrderRecord({
    id: "order_old",
    orderNumber: "FS-20260805-OLD111",
    createdAt: new Date("2026-08-05T00:00:00.000Z"),
  });
  const newer = createOrderRecord({
    id: "order_new",
    orderNumber: "FS-20260806-NEW111",
    createdAt: new Date("2026-08-06T12:00:00.000Z"),
    customerEmail: "new@example.com",
    totalCents: 4900,
  });
  const { db, state } = createMockAdminOrdersDb({
    orders: [
      {
        ...older,
        items: [createOrderItemRecord({ orderId: older.id })],
        payments: [createPaymentRecord({ orderId: older.id })],
      },
      {
        ...newer,
        items: [createOrderItemRecord({ orderId: newer.id })],
        payments: [createPaymentRecord({ orderId: newer.id })],
      },
    ],
  });
  const service = createAdminOrdersService(db);

  const orders = await service.listDashboardOrders();

  assert.equal(state.listCalls, 1);
  assert.equal(orders[0]?.id, "order_new");
  assert.equal(orders[0]?.customerEmail, "new@example.com");
  assert.equal(orders[0]?.totalCents, 4900);
});

test("getDashboardOrderDetail includes items payments and grants", async () => {
  const order = createOrderRecord();
  const product = createProductRecord();
  const asset = createAssetRecord();
  const grant = {
    ...createGrantRecord({ orderId: order.id }),
    product,
    asset,
  };
  const { db } = createMockAdminOrdersDb({
    orders: [
      {
        ...order,
        items: [createOrderItemRecord({ orderId: order.id })],
        payments: [createPaymentRecord({ orderId: order.id })],
        downloadGrants: [grant],
      },
    ],
  });
  const service = createAdminOrdersService(db);

  const detail = await service.getDashboardOrderDetail(order.id);

  assert.equal(detail.order.items.length, 1);
  assert.equal(detail.order.payments.length, 1);
  assert.equal(detail.order.downloadGrants.length, 1);
});

test("getDashboardOrderDetail masks Stripe identifiers partially", async () => {
  const order = createOrderRecord();
  const payment = createPaymentRecord({
    orderId: order.id,
    stripeCheckoutSessionId: "cs_test_1234567890",
    stripePaymentIntentId: "pi_1234567890abcd",
  });
  const { db } = createMockAdminOrdersDb({
    orders: [
      {
        ...order,
        items: [createOrderItemRecord({ orderId: order.id })],
        payments: [payment],
        downloadGrants: [],
      },
    ],
  });
  const service = createAdminOrdersService(db);

  const detail = await service.getDashboardOrderDetail(order.id);

  assert.equal(detail.order.payments[0]?.stripeCheckoutSessionId, "cs_tes...7890");
  assert.equal(detail.order.payments[0]?.stripePaymentIntentId, "pi_123...abcd");
});

test("refundReadiness is false for a pending payment order", async () => {
  const order = createOrderRecord({
    status: "PENDING_PAYMENT",
    paidAt: null,
  });
  const { db } = createMockAdminOrdersDb({
    orders: [
      {
        ...order,
        items: [createOrderItemRecord({ orderId: order.id })],
        payments: [createPaymentRecord({ orderId: order.id, status: "PENDING" })],
        downloadGrants: [],
      },
    ],
  });
  const service = createAdminOrdersService(db);

  const detail = await service.getDashboardOrderDetail(order.id);

  assert.equal(detail.refundReadiness.canRefund, false);
  assert.match(detail.refundReadiness.reason ?? "", /payee/i);
});

test("refundReadiness is false for a refunded order", async () => {
  const order = createOrderRecord({
    status: "REFUNDED",
    refundedAt: new Date("2026-08-06T14:00:00.000Z"),
  });
  const { db } = createMockAdminOrdersDb({
    orders: [
      {
        ...order,
        items: [createOrderItemRecord({ orderId: order.id })],
        payments: [createPaymentRecord({ orderId: order.id })],
        downloadGrants: [],
      },
    ],
  });
  const service = createAdminOrdersService(db);

  const detail = await service.getDashboardOrderDetail(order.id);

  assert.equal(detail.refundReadiness.canRefund, false);
  assert.match(detail.refundReadiness.reason ?? "", /deja remboursee/i);
});

test("refundReadiness is false without a succeeded payment", async () => {
  const order = createOrderRecord();
  const { db } = createMockAdminOrdersDb({
    orders: [
      {
        ...order,
        items: [createOrderItemRecord({ orderId: order.id })],
        payments: [createPaymentRecord({ orderId: order.id, status: "FAILED" })],
        downloadGrants: [],
      },
    ],
  });
  const service = createAdminOrdersService(db);

  const detail = await service.getDashboardOrderDetail(order.id);

  assert.equal(detail.refundReadiness.canRefund, false);
  assert.match(detail.refundReadiness.reason ?? "", /aucun paiement stripe reussi/i);
});

test("refundReadiness is false when a payment is already refunded", async () => {
  const order = createOrderRecord();
  const { db } = createMockAdminOrdersDb({
    orders: [
      {
        ...order,
        items: [createOrderItemRecord({ orderId: order.id })],
        payments: [
          createPaymentRecord({
            orderId: order.id,
            status: "REFUNDED",
            refundedAt: new Date("2026-08-06T15:00:00.000Z"),
          }),
        ],
        downloadGrants: [],
      },
    ],
  });
  const service = createAdminOrdersService(db);

  const detail = await service.getDashboardOrderDetail(order.id);

  assert.equal(detail.refundReadiness.canRefund, false);
  assert.match(detail.refundReadiness.reason ?? "", /deja marque comme rembourse/i);
});

test("refundReadiness is false without a stripe payment intent id", async () => {
  const order = createOrderRecord();
  const { db } = createMockAdminOrdersDb({
    orders: [
      {
        ...order,
        items: [createOrderItemRecord({ orderId: order.id })],
        payments: [
          createPaymentRecord({
            orderId: order.id,
            stripePaymentIntentId: "",
          }),
        ],
        downloadGrants: [],
      },
    ],
  });
  const service = createAdminOrdersService(db);

  const detail = await service.getDashboardOrderDetail(order.id);

  assert.equal(detail.refundReadiness.canRefund, false);
  assert.match(detail.refundReadiness.reason ?? "", /identifiant remboursable/i);
});

test("refundReadiness is true for a paid order with a succeeded Stripe payment", async () => {
  const order = createOrderRecord({
    totalCents: 5900,
  });
  const { db } = createMockAdminOrdersDb({
    orders: [
      {
        ...order,
        items: [createOrderItemRecord({ orderId: order.id })],
        payments: [
          createPaymentRecord({
            orderId: order.id,
            amountCents: 5900,
            stripePaymentIntentId: "pi_refundable_123456",
          }),
        ],
        downloadGrants: [],
      },
    ],
  });
  const service = createAdminOrdersService(db);

  const detail = await service.getDashboardOrderDetail(order.id);

  assert.equal(detail.refundReadiness.canRefund, true);
  assert.equal(detail.refundReadiness.refundableAmountCents, 5900);
});

test("refundReadiness is false for a free order even when it is paid", async () => {
  const order = createOrderRecord({
    totalCents: 0,
    discountTotalCents: 2900,
  });
  const { db } = createMockAdminOrdersDb({
    orders: [
      {
        ...order,
        items: [createOrderItemRecord({ orderId: order.id })],
        payments: [],
        downloadGrants: [],
      },
    ],
  });
  const service = createAdminOrdersService(db);

  const detail = await service.getDashboardOrderDetail(order.id);

  assert.equal(detail.refundReadiness.canRefund, false);
  assert.match(detail.refundReadiness.reason ?? "", /commande offerte/i);
});

test("listDashboardOrders exposes discount totals and code for discounted orders", async () => {
  const order = createOrderRecord({
    id: "order_discounted",
    subtotalCents: 5900,
    discountTotalCents: 5900,
    totalCents: 0,
    discountCodeId: "discount_1",
  });
  const { db } = createMockAdminOrdersDb({
    orders: [
      {
        ...order,
        items: [createOrderItemRecord({ orderId: order.id })],
        payments: [],
        discountCode: {
          id: "discount_1",
          code: "COACH-ABC123",
          reason: "Prestation coaching",
        },
        downloadGrants: [],
      },
    ],
  });
  const service = createAdminOrdersService(db);

  const orders = await service.listDashboardOrders();

  assert.equal(orders[0]?.subtotalCents, 5900);
  assert.equal(orders[0]?.discountTotalCents, 5900);
  assert.equal(orders[0]?.totalCents, 0);
  assert.equal(orders[0]?.discountCode, "COACH-ABC123");
});

test("admin orders service does not mutate the database", async () => {
  const order = createOrderRecord();
  const originalPaidAt = order.paidAt;
  const { db, state } = createMockAdminOrdersDb({
    orders: [
      {
        ...order,
        items: [createOrderItemRecord({ orderId: order.id })],
        payments: [createPaymentRecord({ orderId: order.id })],
        downloadGrants: [],
      },
    ],
  });
  const service = createAdminOrdersService(db);

  await service.listDashboardOrders();
  await service.getDashboardOrderDetail(order.id);

  assert.equal(state.listCalls, 1);
  assert.equal(state.findCalls, 1);
  assert.equal(state.orders[0]?.status, "PAID");
  assert.deepEqual(state.orders[0]?.paidAt, originalPaidAt);
});

test("getDashboardOrderDetail rejects an unknown order", async () => {
  const { db } = createMockAdminOrdersDb();
  const service = createAdminOrdersService(db);

  await assert.rejects(
    () => service.getDashboardOrderDetail("missing"),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

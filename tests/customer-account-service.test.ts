import assert from "node:assert/strict";
import test from "node:test";
import type {
  Customer,
  DigitalAsset,
  DownloadGrant,
  Order,
  OrderItem,
} from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import { createCustomerAccountService } from "@/lib/services/customer-account";

type DownloadGrantWithRelations = DownloadGrant & {
  orderItem: OrderItem;
  asset: DigitalAsset;
};

type OrderWithRelations = Order & {
  items: OrderItem[];
  downloadGrants: DownloadGrantWithRelations[];
};

function createCustomerRecord(overrides: Partial<Customer> = {}): Customer {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "customer_1",
    email: overrides.email ?? "buyer@example.com",
    name: overrides.name ?? "Fabien",
    phone: overrides.phone ?? null,
    address: overrides.address ?? null,
    assetType: overrides.assetType ?? "OTHER",
    assetBrand: overrides.assetBrand ?? null,
    assetModel: overrides.assetModel ?? null,
    registration: overrides.registration ?? null,
    odometerKm: overrides.odometerKm ?? null,
    engineHours: overrides.engineHours ?? null,
    status: overrides.status ?? "ACTIVE",
    lastLoginAt: overrides.lastLoginAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createOrderRecord(overrides: Partial<Order> = {}): Order {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "order_1",
    orderNumber: overrides.orderNumber ?? "FS-20260806-AAA111",
    status: overrides.status ?? "PAID",
    customerId: overrides.customerId ?? "customer_1",
    discountCodeId: overrides.discountCodeId ?? null,
    customerEmail: overrides.customerEmail ?? "buyer@example.com",
    customerName: overrides.customerName ?? "Fabien",
    currency: overrides.currency ?? "EUR",
    subtotalCents: overrides.subtotalCents ?? 2900,
    discountTotalCents: overrides.discountTotalCents ?? 0,
    totalCents: overrides.totalCents ?? 2900,
    cartId: overrides.cartId ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    paidAt: overrides.paidAt ?? now,
    cancelledAt: overrides.cancelledAt ?? null,
    refundedAt: overrides.refundedAt ?? null,
  };
}

function createOrderItemRecord(overrides: Partial<OrderItem> = {}): OrderItem {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "item_1",
    orderId: overrides.orderId ?? "order_1",
    productId: overrides.productId ?? "product_1",
    productSlug: overrides.productSlug ?? "ebook-electricite-van",
    productName: overrides.productName ?? "Ebook Electricite Van",
    productType: overrides.productType ?? "EBOOK",
    quantity: overrides.quantity ?? 1,
    currency: overrides.currency ?? "EUR",
    unitAmountCents: overrides.unitAmountCents ?? 2900,
    lineTotalCents: overrides.lineTotalCents ?? 2900,
    createdAt: overrides.createdAt ?? now,
  };
}

function createAssetRecord(overrides: Partial<DigitalAsset> = {}): DigitalAsset {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "asset_1",
    provider: overrides.provider ?? "SUPABASE",
    bucket: overrides.bucket ?? "ebooks-private",
    path: overrides.path ?? "ebooks/ebook-electricite-van/v1/ebook-electricite-van.pdf",
    filename: overrides.filename ?? "ebook-electricite-van.pdf",
    contentType: overrides.contentType ?? "application/pdf",
    sizeBytes: overrides.sizeBytes ?? 1024,
    version: overrides.version ?? "v1",
    status: overrides.status ?? "ACTIVE",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createDownloadGrantRecord(
  overrides: Partial<DownloadGrantWithRelations> = {}
): DownloadGrantWithRelations {
  const now = new Date("2026-08-06T00:00:00.000Z");
  const orderItem =
    overrides.orderItem ??
    createOrderItemRecord({
      id: overrides.orderItemId ?? "item_1",
      orderId: overrides.orderId ?? "order_1",
      productId: overrides.productId ?? "product_1",
    });
  const asset = overrides.asset ?? createAssetRecord({ id: overrides.assetId ?? "asset_1" });

  return {
    id: overrides.id ?? "grant_1",
    orderId: overrides.orderId ?? "order_1",
    orderItemId: overrides.orderItemId ?? orderItem.id,
    productId: overrides.productId ?? orderItem.productId,
    assetId: overrides.assetId ?? asset.id,
    customerEmail: overrides.customerEmail ?? "buyer@example.com",
    status: overrides.status ?? "ACTIVE",
    downloadCount: overrides.downloadCount ?? 0,
    maxDownloads: overrides.maxDownloads ?? 10,
    expiresAt: overrides.expiresAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    revokedAt: overrides.revokedAt ?? null,
    lastDownloadedAt: overrides.lastDownloadedAt ?? null,
    orderItem,
    asset,
  };
}

function createOrderWithRelations(
  overrides: Partial<Order> = {},
  items: OrderItem[] = [createOrderItemRecord({ orderId: overrides.id ?? "order_1" })],
  grants: DownloadGrantWithRelations[] = []
): OrderWithRelations {
  return {
    ...createOrderRecord(overrides),
    items,
    downloadGrants: grants,
  };
}

function createMockCustomerAccountDb(seed?: {
  customer?: Customer | null;
  orders?: OrderWithRelations[];
}) {
  const customer = seed?.customer ?? createCustomerRecord();
  const orders = [...(seed?.orders ?? [])];

  return {
    async findCustomerById(customerId: string) {
      return customer?.id === customerId ? customer : null;
    },
    async findOrdersForCustomer(customerId: string, customerEmail: string) {
      return orders.filter(
        (order) => order.customerId === customerId || order.customerEmail === customerEmail
      );
    },
  };
}

test("getCustomerAccountOverview refuses a missing customer", async () => {
  const service = createCustomerAccountService(
    createMockCustomerAccountDb({ customer: null, orders: [] })
  );

  await assert.rejects(
    () => service.getCustomerAccountOverview("missing_customer"),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("getCustomerAccountOverview returns the minimal customer payload", async () => {
  const customer = createCustomerRecord();
  const service = createCustomerAccountService(
    createMockCustomerAccountDb({ customer, orders: [] })
  );

  const result = await service.getCustomerAccountOverview(customer.id);

  assert.deepEqual(result.customer, {
    id: customer.id,
    email: customer.email,
    name: customer.name,
  });
});

test("getCustomerAccountOverview returns orders matched by customerId", async () => {
  const customer = createCustomerRecord();
  const order = createOrderWithRelations({ customerId: customer.id });
  const service = createCustomerAccountService(
    createMockCustomerAccountDb({ customer, orders: [order] })
  );

  const result = await service.getCustomerAccountOverview(customer.id);

  assert.equal(result.orders.length, 1);
  assert.equal(result.orders[0]?.orderNumber, order.orderNumber);
});

test("getCustomerAccountOverview returns orders matched by fallback customerEmail", async () => {
  const customer = createCustomerRecord();
  const order = createOrderWithRelations({
    id: "order_email",
    customerId: null,
    customerEmail: customer.email,
  });
  const service = createCustomerAccountService(
    createMockCustomerAccountDb({ customer, orders: [order] })
  );

  const result = await service.getCustomerAccountOverview(customer.id);

  assert.equal(result.orders.length, 1);
  assert.equal(result.orders[0]?.orderNumber, order.orderNumber);
});

test("getCustomerAccountOverview excludes revoked grants", async () => {
  const customer = createCustomerRecord();
  const order = createOrderWithRelations(
    { customerId: customer.id },
    undefined,
    [
      createDownloadGrantRecord({ id: "grant_active" }),
      createDownloadGrantRecord({ id: "grant_revoked", status: "REVOKED" }),
    ]
  );
  const service = createCustomerAccountService(
    createMockCustomerAccountDb({ customer, orders: [order] })
  );

  const result = await service.getCustomerAccountOverview(customer.id);

  assert.deepEqual(result.orders[0]?.downloads.map((grant) => grant.grantId), ["grant_active"]);
});

test("getCustomerAccountOverview excludes expired grants by status", async () => {
  const customer = createCustomerRecord();
  const order = createOrderWithRelations(
    { customerId: customer.id },
    undefined,
    [
      createDownloadGrantRecord({ id: "grant_active" }),
      createDownloadGrantRecord({ id: "grant_expired", status: "EXPIRED" }),
    ]
  );
  const service = createCustomerAccountService(
    createMockCustomerAccountDb({ customer, orders: [order] })
  );

  const result = await service.getCustomerAccountOverview(customer.id);

  assert.deepEqual(result.orders[0]?.downloads.map((grant) => grant.grantId), ["grant_active"]);
});

test("getCustomerAccountOverview excludes grants past expiresAt", async () => {
  const customer = createCustomerRecord();
  const order = createOrderWithRelations(
    { customerId: customer.id },
    undefined,
    [
      createDownloadGrantRecord({ id: "grant_active" }),
      createDownloadGrantRecord({
        id: "grant_past",
        expiresAt: new Date("2026-08-05T23:59:59.000Z"),
      }),
    ]
  );
  const service = createCustomerAccountService(
    createMockCustomerAccountDb({ customer, orders: [order] }),
    {
      now: () => new Date("2026-08-06T00:00:00.000Z"),
    }
  );

  const result = await service.getCustomerAccountOverview(customer.id);

  assert.deepEqual(result.orders[0]?.downloads.map((grant) => grant.grantId), ["grant_active"]);
});

test("getCustomerAccountOverview computes remainingDownloads", async () => {
  const customer = createCustomerRecord();
  const order = createOrderWithRelations(
    { customerId: customer.id },
    undefined,
    [createDownloadGrantRecord({ downloadCount: 4, maxDownloads: 10 })]
  );
  const service = createCustomerAccountService(
    createMockCustomerAccountDb({ customer, orders: [order] })
  );

  const result = await service.getCustomerAccountOverview(customer.id);

  assert.equal(result.orders[0]?.downloads[0]?.remainingDownloads, 6);
});

test("getCustomerAccountOverview never exposes signed URLs or token hashes", async () => {
  const customer = createCustomerRecord();
  const order = createOrderWithRelations(
    { customerId: customer.id },
    undefined,
    [createDownloadGrantRecord()]
  );
  const service = createCustomerAccountService(
    createMockCustomerAccountDb({ customer, orders: [order] })
  );

  const result = await service.getCustomerAccountOverview(customer.id);
  const json = JSON.stringify(result);

  assert.equal(json.includes("http"), false);
  assert.equal(json.includes("tokenHash"), false);
  assert.equal(json.includes("sessionTokenHash"), false);
});

test("getCustomerAccountOverview returns no orders when the customer has no purchases", async () => {
  const customer = createCustomerRecord();
  const service = createCustomerAccountService(
    createMockCustomerAccountDb({ customer, orders: [] })
  );

  const result = await service.getCustomerAccountOverview(customer.id);

  assert.deepEqual(result.orders, []);
});

test("getCustomerAccountOverview never exposes a PENDING_PAYMENT order to the customer", async () => {
  const customer = createCustomerRecord();
  const paidOrder = createOrderWithRelations({
    id: "order_paid",
    orderNumber: "FS-20260806-PAID01",
    customerId: customer.id,
    status: "PAID",
  });
  const pendingOrder = createOrderWithRelations({
    id: "order_pending",
    orderNumber: "FS-20260806-PEND01",
    customerId: customer.id,
    status: "PENDING_PAYMENT",
    paidAt: null,
  });
  const service = createCustomerAccountService(
    createMockCustomerAccountDb({ customer, orders: [paidOrder, pendingOrder] })
  );

  const result = await service.getCustomerAccountOverview(customer.id);

  assert.deepEqual(
    result.orders.map((order) => order.orderNumber),
    ["FS-20260806-PAID01"]
  );
});

test("getCustomerAccountOverview exposes discount fields and flags a fully discounted order", async () => {
  const customer = createCustomerRecord();
  const freeOrder = createOrderWithRelations({
    id: "order_free",
    orderNumber: "FS-20260806-FREE01",
    customerId: customer.id,
    discountCodeId: "discount_1",
    subtotalCents: 2900,
    discountTotalCents: 2900,
    totalCents: 0,
  });
  const paidOrder = createOrderWithRelations({
    id: "order_paid",
    orderNumber: "FS-20260806-PAID02",
    customerId: customer.id,
    discountCodeId: "discount_2",
    subtotalCents: 2900,
    discountTotalCents: 500,
    totalCents: 2400,
  });
  const service = createCustomerAccountService(
    createMockCustomerAccountDb({ customer, orders: [freeOrder, paidOrder] })
  );

  const result = await service.getCustomerAccountOverview(customer.id);

  const free = result.orders.find((order) => order.id === "order_free");
  const partial = result.orders.find((order) => order.id === "order_paid");

  assert.deepEqual(
    {
      subtotalCents: free?.subtotalCents,
      discountTotalCents: free?.discountTotalCents,
      totalCents: free?.totalCents,
      isFullyDiscounted: free?.isFullyDiscounted,
      discountCodeId: free?.discountCodeId,
    },
    {
      subtotalCents: 2900,
      discountTotalCents: 2900,
      totalCents: 0,
      isFullyDiscounted: true,
      discountCodeId: "discount_1",
    }
  );

  assert.equal(partial?.isFullyDiscounted, false);
});

test("getCustomerAccountOverview does not flag an undiscounted order as fully discounted", async () => {
  const customer = createCustomerRecord();
  const order = createOrderWithRelations({
    customerId: customer.id,
    discountCodeId: null,
    subtotalCents: 2900,
    discountTotalCents: 0,
    totalCents: 2900,
  });
  const service = createCustomerAccountService(
    createMockCustomerAccountDb({ customer, orders: [order] })
  );

  const result = await service.getCustomerAccountOverview(customer.id);

  assert.equal(result.orders[0]?.isFullyDiscounted, false);
});

test("getCustomerAccountOverview keeps newest orders first", async () => {
  const customer = createCustomerRecord();
  const newest = createOrderWithRelations({
    id: "order_new",
    orderNumber: "FS-20260806-NEW001",
    customerId: customer.id,
    createdAt: new Date("2026-08-06T10:00:00.000Z"),
  });
  const oldest = createOrderWithRelations({
    id: "order_old",
    orderNumber: "FS-20260805-OLD001",
    customerId: customer.id,
    createdAt: new Date("2026-08-05T10:00:00.000Z"),
  });
  const service = createCustomerAccountService(
    createMockCustomerAccountDb({ customer, orders: [newest, oldest] })
  );

  const result = await service.getCustomerAccountOverview(customer.id);

  assert.deepEqual(
    result.orders.map((order) => order.orderNumber),
    ["FS-20260806-NEW001", "FS-20260805-OLD001"]
  );
});

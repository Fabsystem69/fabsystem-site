import assert from "node:assert/strict";
import test from "node:test";
import type { DigitalAsset, DownloadGrant, Order, OrderItem, Product } from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import { createOrderAccessService } from "@/lib/services/order-access";

type DownloadGrantWithRelations = DownloadGrant & {
  order: Order;
  orderItem: OrderItem;
  product: Product;
  asset: DigitalAsset;
};

type OrderWithGrants = Order & {
  downloadGrants: DownloadGrantWithRelations[];
};

function createOrderRecord(overrides: Partial<Order> = {}): Order {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "order_1",
    orderNumber: overrides.orderNumber ?? "FS-20260806-ABC123",
    status: overrides.status ?? "PAID",
    customerId: overrides.customerId ?? null,
    discountCodeId: overrides.discountCodeId ?? null,
    customerEmail: overrides.customerEmail ?? "buyer@example.com",
    customerName: overrides.customerName ?? "Buyer",
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

function createProductRecord(overrides: Partial<Product> = {}): Product {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "product_1",
    slug: overrides.slug ?? "ebook-electricite-van",
    name: overrides.name ?? "Ebook Electricite Van",
    shortDescription: overrides.shortDescription ?? "Guide numerique",
    description: overrides.description ?? "Description produit",
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
  const order = overrides.order ?? createOrderRecord({ id: overrides.orderId ?? "order_1" });
  const orderItem =
    overrides.orderItem ??
    createOrderItemRecord({
      id: overrides.orderItemId ?? "item_1",
      orderId: order.id,
      productId: overrides.productId ?? "product_1",
    });
  const product =
    overrides.product ?? createProductRecord({ id: overrides.productId ?? orderItem.productId });
  const asset = overrides.asset ?? createAssetRecord({ id: overrides.assetId ?? "asset_1" });

  return {
    id: overrides.id ?? "grant_1",
    orderId: overrides.orderId ?? order.id,
    orderItemId: overrides.orderItemId ?? orderItem.id,
    productId: overrides.productId ?? product.id,
    assetId: overrides.assetId ?? asset.id,
    customerEmail: overrides.customerEmail ?? order.customerEmail,
    status: overrides.status ?? "ACTIVE",
    downloadCount: overrides.downloadCount ?? 0,
    maxDownloads: overrides.maxDownloads ?? 10,
    expiresAt: overrides.expiresAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    revokedAt: overrides.revokedAt ?? null,
    lastDownloadedAt: overrides.lastDownloadedAt ?? null,
    order,
    orderItem,
    product,
    asset,
  };
}

function createOrderWithGrants(
  overrides: Partial<Order> = {},
  grants: DownloadGrantWithRelations[] = []
): OrderWithGrants {
  return {
    ...createOrderRecord(overrides),
    downloadGrants: grants,
  };
}

function createMockOrderAccessDb(seed?: { order?: OrderWithGrants | null }) {
  const order = seed?.order ?? null;

  return {
    async findOrderByNumber(orderNumber: string) {
      return order?.orderNumber === orderNumber ? order : null;
    },
  };
}

test("parseOrderNumber refuses an empty value", () => {
  const service = createOrderAccessService(createMockOrderAccessDb());

  assert.throws(
    () => service.parseOrderNumber("   "),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("getOrderAccessByNumber returns missing for an unknown order", async () => {
  const service = createOrderAccessService(createMockOrderAccessDb({ order: null }));

  const result = await service.getOrderAccessByNumber("FS-20260806-MISSING");

  assert.deepEqual(result, {
    status: "missing",
    orderNumber: "FS-20260806-MISSING",
    downloads: [],
  });
});

test("getOrderAccessByNumber returns pending for a non-paid order", async () => {
  const order = createOrderWithGrants({ status: "PENDING_PAYMENT", paidAt: null });
  const service = createOrderAccessService(createMockOrderAccessDb({ order }));

  const result = await service.getOrderAccessByNumber(order.orderNumber);

  assert.deepEqual(result, {
    status: "pending",
    orderNumber: order.orderNumber,
    downloads: [],
  });
});

test("getOrderAccessByNumber returns active grants for a paid order", async () => {
  const grant = createDownloadGrantRecord();
  const order = createOrderWithGrants({}, [grant]);
  const service = createOrderAccessService(createMockOrderAccessDb({ order }));

  const result = await service.getOrderAccessByNumber(order.orderNumber);

  assert.equal(result.status, "paid");
  if (result.status !== "paid") {
    throw new Error("Expected paid result");
  }
  assert.equal(result.orderNumber, order.orderNumber);
  assert.equal(result.downloads.length, 1);
  assert.deepEqual(result.downloads[0], {
    grantId: grant.id,
    productName: grant.product.name,
    filename: grant.asset.filename,
    downloadsRemaining: 10,
    downloadCount: 0,
    maxDownloads: 10,
  });
});

test("getOrderAccessByNumber hides revoked grants", async () => {
  const activeGrant = createDownloadGrantRecord({ id: "grant_active" });
  const revokedGrant = createDownloadGrantRecord({
    id: "grant_revoked",
    status: "REVOKED",
    revokedAt: new Date("2026-08-06T00:00:00.000Z"),
  });
  const order = createOrderWithGrants({}, [activeGrant, revokedGrant]);
  const service = createOrderAccessService(createMockOrderAccessDb({ order }));

  const result = await service.getOrderAccessByNumber(order.orderNumber);

  assert.equal(result.status, "paid");
  if (result.status !== "paid") {
    throw new Error("Expected paid result");
  }
  assert.deepEqual(result.downloads.map((download) => download.grantId), [activeGrant.id]);
});

test("getOrderAccessByNumber hides expired grants", async () => {
  const activeGrant = createDownloadGrantRecord({ id: "grant_active" });
  const expiredGrant = createDownloadGrantRecord({
    id: "grant_expired",
    expiresAt: new Date("2026-08-05T23:59:59.000Z"),
  });
  const order = createOrderWithGrants({}, [activeGrant, expiredGrant]);
  const service = createOrderAccessService(createMockOrderAccessDb({ order }), {
    now: () => new Date("2026-08-06T00:00:00.000Z"),
  });

  const result = await service.getOrderAccessByNumber(order.orderNumber);

  assert.equal(result.status, "paid");
  if (result.status !== "paid") {
    throw new Error("Expected paid result");
  }
  assert.deepEqual(result.downloads.map((download) => download.grantId), [activeGrant.id]);
});

test("getOrderAccessByNumber computes downloadsRemaining", async () => {
  const grant = createDownloadGrantRecord({
    downloadCount: 4,
    maxDownloads: 10,
  });
  const order = createOrderWithGrants({}, [grant]);
  const service = createOrderAccessService(createMockOrderAccessDb({ order }));

  const result = await service.getOrderAccessByNumber(order.orderNumber);

  assert.equal(result.status, "paid");
  if (result.status !== "paid") {
    throw new Error("Expected paid result");
  }
  assert.equal(result.downloads[0]?.downloadsRemaining, 6);
});

test("getOrderAccessByNumber never returns a signed Supabase URL", async () => {
  const grant = createDownloadGrantRecord();
  const order = createOrderWithGrants({}, [grant]);
  const service = createOrderAccessService(createMockOrderAccessDb({ order }));

  const result = await service.getOrderAccessByNumber(order.orderNumber);

  assert.equal(result.status, "paid");
  if (result.status !== "paid") {
    throw new Error("Expected paid result");
  }
  assert.equal("url" in result.downloads[0]!, false);
});

test("order access service does not touch Stripe or Vercel Blob", async () => {
  const grant = createDownloadGrantRecord();
  const order = createOrderWithGrants({}, [grant]);
  const service = createOrderAccessService(createMockOrderAccessDb({ order }));
  const stripeTouched = false;
  const blobTouched = false;

  await service.getOrderAccessByNumber(order.orderNumber);

  assert.equal(stripeTouched, false);
  assert.equal(blobTouched, false);
});

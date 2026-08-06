import assert from "node:assert/strict";
import test from "node:test";
import type {
  DigitalAsset,
  DownloadGrant,
  Order,
  OrderItem,
  Product,
  ProductAsset,
} from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import { createDownloadGrantService } from "@/lib/services/download-grant";

type ProductAssetWithAsset = ProductAsset & {
  asset: DigitalAsset;
};

type ProductWithAssets = Product & {
  assets?: ProductAssetWithAsset[];
};

type OrderItemWithProduct = OrderItem & {
  product?: ProductWithAssets;
};

type OrderWithContext = Order & {
  items?: OrderItemWithProduct[];
  downloadGrants?: DownloadGrant[];
};

type DownloadGrantWithRelations = DownloadGrant & {
  order: Order;
  orderItem: OrderItem;
  product: Product;
  asset: DigitalAsset;
};

function createProductRecord(overrides: Partial<Product> = {}): Product {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "prod_1",
    slug: overrides.slug ?? "ebook-electricite-van",
    name: overrides.name ?? "Ebook Electricite Van",
    shortDescription: overrides.shortDescription ?? "Short description",
    description: overrides.description ?? "Full description",
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

function createProductAssetRecord(
  overrides: Partial<ProductAssetWithAsset> = {}
): ProductAssetWithAsset {
  return {
    productId: overrides.productId ?? "prod_1",
    assetId: overrides.assetId ?? "asset_1",
    sortOrder: overrides.sortOrder ?? 0,
    createdAt: overrides.createdAt ?? new Date("2026-08-06T00:00:00.000Z"),
    asset: overrides.asset ?? createAssetRecord({ id: overrides.assetId ?? "asset_1" }),
  };
}

function createOrderRecord(overrides: Partial<Order> = {}): Order {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "order_1",
    orderNumber: overrides.orderNumber ?? "FS-20260806-ABC123",
    status: overrides.status ?? "PAID",
    customerEmail: overrides.customerEmail ?? "buyer@example.com",
    customerName: overrides.customerName ?? null,
    currency: overrides.currency ?? "EUR",
    subtotalCents: overrides.subtotalCents ?? 2900,
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
    id: overrides.id ?? "order_item_1",
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

function createDownloadGrantRecord(overrides: Partial<DownloadGrant> = {}): DownloadGrant {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "grant_1",
    orderId: overrides.orderId ?? "order_1",
    orderItemId: overrides.orderItemId ?? "order_item_1",
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

function createMockDownloadGrantDb(seed?: {
  orders?: OrderWithContext[];
  grants?: DownloadGrantWithRelations[];
  createDownloadGrantErrorsByKey?: Record<string, unknown>;
}) {
  const state = {
    orders: [...(seed?.orders ?? [])],
    grants: [...(seed?.grants ?? [])],
    stripeTouched: false,
    supabaseTouched: false,
    vercelBlobTouched: false,
    createDownloadGrantErrorsByKey: {
      ...(seed?.createDownloadGrantErrorsByKey ?? {}),
    } as Record<string, unknown>,
  };

  const inflateOrder = (order: OrderWithContext): OrderWithContext => ({
    ...order,
    items: (order.items ?? []).map((item) => ({
      ...item,
      product: item.product
        ? {
            ...item.product,
            assets: [...(item.product.assets ?? [])],
          }
        : undefined,
    })),
    downloadGrants: state.grants
      .filter((grant) => grant.orderId === order.id)
      .map((grant) => ({
        id: grant.id,
        orderId: grant.orderId,
        orderItemId: grant.orderItemId,
        productId: grant.productId,
        assetId: grant.assetId,
        customerEmail: grant.customerEmail,
        status: grant.status,
        downloadCount: grant.downloadCount,
        maxDownloads: grant.maxDownloads,
        expiresAt: grant.expiresAt,
        createdAt: grant.createdAt,
        updatedAt: grant.updatedAt,
        revokedAt: grant.revokedAt,
        lastDownloadedAt: grant.lastDownloadedAt,
      })),
  });

  const db = {
    async findOrderForGrantCreation(orderId: string) {
      const order = state.orders.find((item) => item.id === orderId);
      return order ? inflateOrder(order) : null;
    },
    async createDownloadGrant(data: {
      orderId: string;
      orderItemId: string;
      productId: string;
      assetId: string;
      customerEmail: string;
      status: DownloadGrant["status"];
      downloadCount: number;
      maxDownloads: number;
      expiresAt: Date | null;
    }) {
      const order = state.orders.find((item) => item.id === data.orderId);
      const orderItem = order?.items?.find((item) => item.id === data.orderItemId);
      const product = orderItem?.product;
      const asset = product?.assets?.find((item) => item.assetId === data.assetId)?.asset;
      const key = `${data.orderItemId}:${data.assetId}`;
      const injectedError = state.createDownloadGrantErrorsByKey[key];

      if (injectedError) {
        delete state.createDownloadGrantErrorsByKey[key];
        throw injectedError;
      }

      if (!order || !orderItem || !product || !asset) {
        throw new Error("Missing grant relations in mock");
      }

      const grantBase = createDownloadGrantRecord({
        id: `grant_${state.grants.length + 1}`,
        ...data,
        createdAt: new Date("2026-08-06T01:00:00.000Z"),
        updatedAt: new Date("2026-08-06T01:00:00.000Z"),
      });

      const grant = {
        ...grantBase,
        order,
        orderItem,
        product,
        asset,
      };

      state.grants.push(grant);
      return grantBase;
    },
    async findDownloadGrantsForOrder(orderId: string) {
      return state.grants
        .filter((grant) => grant.orderId === orderId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },
    async findActiveDownloadGrantsForEmail(email: string) {
      return state.grants
        .filter((grant) => grant.customerEmail === email)
        .filter((grant) => grant.status === "ACTIVE")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    async findDownloadGrantById(grantId: string) {
      return state.grants.find((grant) => grant.id === grantId) ?? null;
    },
    async updateDownloadGrant(
      grantId: string,
      data: {
        status?: DownloadGrant["status"];
        revokedAt?: Date | null;
      }
    ) {
      const grant = state.grants.find((item) => item.id === grantId);

      if (!grant) {
        throw new Error("Grant not found in mock");
      }

      if (data.status) {
        grant.status = data.status;
      }

      if ("revokedAt" in data) {
        grant.revokedAt = data.revokedAt ?? null;
      }

      grant.updatedAt = new Date("2026-08-06T02:00:00.000Z");
      return grant;
    },
    async expireActiveDownloadGrants(now: Date) {
      let count = 0;

      for (const grant of state.grants) {
        if (
          grant.status === "ACTIVE" &&
          grant.expiresAt &&
          grant.expiresAt.getTime() < now.getTime()
        ) {
          grant.status = "EXPIRED";
          grant.updatedAt = new Date("2026-08-06T03:00:00.000Z");
          count += 1;
        }
      }

      return count;
    },
    async transaction<T>(callback: (db: typeof db) => Promise<T>) {
      return callback(db);
    },
  };

  return { db, state };
}

test("createDownloadGrantsForOrder refuses a missing order", async () => {
  const { db } = createMockDownloadGrantDb();
  const service = createDownloadGrantService(db);

  await assert.rejects(
    () => service.createDownloadGrantsForOrder("missing"),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("createDownloadGrantsForOrder refuses a PENDING_PAYMENT order", async () => {
  const order = createOrderRecord({ status: "PENDING_PAYMENT" });
  const { db } = createMockDownloadGrantDb({
    orders: [{ ...order, items: [] }],
  });
  const service = createDownloadGrantService(db);

  await assert.rejects(
    () => service.createDownloadGrantsForOrder(order.id),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("createDownloadGrantsForOrder refuses a CANCELLED order", async () => {
  const order = createOrderRecord({ status: "CANCELLED" });
  const { db } = createMockDownloadGrantDb({
    orders: [{ ...order, items: [] }],
  });
  const service = createDownloadGrantService(db);

  await assert.rejects(
    () => service.createDownloadGrantsForOrder(order.id),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("createDownloadGrantsForOrder refuses a REFUNDED order", async () => {
  const order = createOrderRecord({ status: "REFUNDED" });
  const { db } = createMockDownloadGrantDb({
    orders: [{ ...order, items: [] }],
  });
  const service = createDownloadGrantService(db);

  await assert.rejects(
    () => service.createDownloadGrantsForOrder(order.id),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("createDownloadGrantsForOrder creates one grant for a paid order with one active asset", async () => {
  const product = createProductRecord();
  const asset = createAssetRecord();
  const order = createOrderRecord();
  const item = {
    ...createOrderItemRecord({ orderId: order.id, productId: product.id }),
    product: {
      ...product,
      assets: [createProductAssetRecord({ productId: product.id, assetId: asset.id, asset })],
    },
  };
  const { db, state } = createMockDownloadGrantDb({
    orders: [{ ...order, items: [item], downloadGrants: [] }],
  });
  const service = createDownloadGrantService(db);

  const result = await service.createDownloadGrantsForOrder(order.id);

  assert.equal(result.createdCount, 1);
  assert.equal(result.existingCount, 0);
  assert.equal(result.activeCount, 1);
  assert.equal(result.grants.length, 1);
  assert.equal(state.grants.length, 1);
  assert.equal(state.grants[0]?.assetId, asset.id);
});

test("createDownloadGrantsForOrder creates multiple grants for multiple active assets", async () => {
  const product = createProductRecord();
  const assetA = createAssetRecord({ id: "asset_a" });
  const assetB = createAssetRecord({ id: "asset_b", filename: "bonus.pdf", path: "ebooks/bonus.pdf" });
  const order = createOrderRecord();
  const item = {
    ...createOrderItemRecord({ orderId: order.id, productId: product.id }),
    product: {
      ...product,
      assets: [
        createProductAssetRecord({ productId: product.id, assetId: assetA.id, asset: assetA }),
        createProductAssetRecord({ productId: product.id, assetId: assetB.id, asset: assetB, sortOrder: 1 }),
      ],
    },
  };
  const { db } = createMockDownloadGrantDb({
    orders: [{ ...order, items: [item], downloadGrants: [] }],
  });
  const service = createDownloadGrantService(db);

  const result = await service.createDownloadGrantsForOrder(order.id);

  assert.equal(result.createdCount, 2);
  assert.equal(result.activeCount, 2);
});

test("createDownloadGrantsForOrder ignores DRAFT assets", async () => {
  const product = createProductRecord();
  const draftAsset = createAssetRecord({ status: "DRAFT" });
  const order = createOrderRecord();
  const item = {
    ...createOrderItemRecord({ orderId: order.id, productId: product.id }),
    product: {
      ...product,
      assets: [createProductAssetRecord({ productId: product.id, assetId: draftAsset.id, asset: draftAsset })],
    },
  };
  const { db } = createMockDownloadGrantDb({
    orders: [{ ...order, items: [item], downloadGrants: [] }],
  });
  const service = createDownloadGrantService(db);

  const result = await service.createDownloadGrantsForOrder(order.id);

  assert.equal(result.createdCount, 0);
  assert.equal(result.activeCount, 0);
});

test("createDownloadGrantsForOrder ignores ARCHIVED assets", async () => {
  const product = createProductRecord();
  const archivedAsset = createAssetRecord({ status: "ARCHIVED" });
  const order = createOrderRecord();
  const item = {
    ...createOrderItemRecord({ orderId: order.id, productId: product.id }),
    product: {
      ...product,
      assets: [createProductAssetRecord({ productId: product.id, assetId: archivedAsset.id, asset: archivedAsset })],
    },
  };
  const { db } = createMockDownloadGrantDb({
    orders: [{ ...order, items: [item], downloadGrants: [] }],
  });
  const service = createDownloadGrantService(db);

  const result = await service.createDownloadGrantsForOrder(order.id);

  assert.equal(result.createdCount, 0);
  assert.equal(result.activeCount, 0);
});

test("createDownloadGrantsForOrder is idempotent and does not create duplicates", async () => {
  const product = createProductRecord();
  const asset = createAssetRecord();
  const order = createOrderRecord();
  const item = createOrderItemRecord({ orderId: order.id, productId: product.id });
  const existingGrant = createDownloadGrantRecord({
    orderId: order.id,
    orderItemId: item.id,
    productId: product.id,
    assetId: asset.id,
    customerEmail: order.customerEmail,
  });
  const grantWithRelations = {
    ...existingGrant,
    order,
    orderItem: item,
    product,
    asset,
  };
  const itemWithProduct = {
    ...item,
    product: {
      ...product,
      assets: [createProductAssetRecord({ productId: product.id, assetId: asset.id, asset })],
    },
  };
  const { db, state } = createMockDownloadGrantDb({
    orders: [{ ...order, items: [itemWithProduct], downloadGrants: [existingGrant] }],
    grants: [grantWithRelations],
  });
  const service = createDownloadGrantService(db);

  const result = await service.createDownloadGrantsForOrder(order.id);

  assert.equal(result.createdCount, 0);
  assert.equal(result.existingCount, 1);
  assert.equal(result.activeCount, 1);
  assert.equal(state.grants.length, 1);
});

test("createDownloadGrantsForOrder returns created and existing counts", async () => {
  const product = createProductRecord();
  const assetA = createAssetRecord({ id: "asset_a" });
  const assetB = createAssetRecord({ id: "asset_b" });
  const order = createOrderRecord();
  const item = createOrderItemRecord({ orderId: order.id, productId: product.id });
  const existingGrant = createDownloadGrantRecord({
    orderId: order.id,
    orderItemId: item.id,
    productId: product.id,
    assetId: assetA.id,
    customerEmail: order.customerEmail,
  });
  const itemWithProduct = {
    ...item,
    product: {
      ...product,
      assets: [
        createProductAssetRecord({ productId: product.id, assetId: assetA.id, asset: assetA }),
        createProductAssetRecord({ productId: product.id, assetId: assetB.id, asset: assetB }),
      ],
    },
  };
  const { db } = createMockDownloadGrantDb({
    orders: [{ ...order, items: [itemWithProduct], downloadGrants: [existingGrant] }],
    grants: [
      {
        ...existingGrant,
        order,
        orderItem: item,
        product,
        asset: assetA,
      },
    ],
  });
  const service = createDownloadGrantService(db);

  const result = await service.createDownloadGrantsForOrder(order.id);

  assert.equal(result.createdCount, 1);
  assert.equal(result.existingCount, 1);
  assert.equal(result.activeCount, 2);
});

test("createDownloadGrantsForOrder treats concurrent unique-constraint collisions as existing grants", async () => {
  const product = createProductRecord();
  const asset = createAssetRecord();
  const order = createOrderRecord();
  const item = {
    ...createOrderItemRecord({ orderId: order.id, productId: product.id }),
    product: {
      ...product,
      assets: [createProductAssetRecord({ productId: product.id, assetId: asset.id, asset })],
    },
  };
  const uniqueConstraintError = {
    code: "P2002",
    meta: {
      target: ['"orderItemId"', '"assetId"'],
    },
  };
  const { db, state } = createMockDownloadGrantDb({
    orders: [{ ...order, items: [item], downloadGrants: [] }],
    createDownloadGrantErrorsByKey: {
      [`${item.id}:${asset.id}`]: uniqueConstraintError,
    },
  });
  const service = createDownloadGrantService(db);

  const result = await service.createDownloadGrantsForOrder(order.id);

  assert.equal(result.createdCount, 0);
  assert.equal(result.existingCount, 1);
  assert.equal(result.activeCount, 1);
  assert.equal(result.grants.length, 0);
  assert.equal(state.grants.length, 0);
});

test("listDownloadGrantsForOrder returns product and asset relations", async () => {
  const product = createProductRecord();
  const asset = createAssetRecord();
  const order = createOrderRecord();
  const item = createOrderItemRecord({ orderId: order.id, productId: product.id });
  const grant = {
    ...createDownloadGrantRecord({ orderId: order.id, orderItemId: item.id, productId: product.id, assetId: asset.id }),
    order,
    orderItem: item,
    product,
    asset,
  };
  const { db } = createMockDownloadGrantDb({
    grants: [grant],
  });
  const service = createDownloadGrantService(db);

  const result = await service.listDownloadGrantsForOrder(order.id);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.product.name, product.name);
  assert.equal(result[0]?.asset.filename, asset.filename);
});

test("listDownloadGrantsForEmail excludes REVOKED and EXPIRED grants", async () => {
  const product = createProductRecord();
  const asset = createAssetRecord();
  const order = createOrderRecord();
  const item = createOrderItemRecord({ orderId: order.id, productId: product.id });
  const activeGrant = {
    ...createDownloadGrantRecord({ id: "grant_active" }),
    order,
    orderItem: item,
    product,
    asset,
  };
  const revokedGrant = {
    ...createDownloadGrantRecord({ id: "grant_revoked", status: "REVOKED" }),
    order,
    orderItem: item,
    product,
    asset,
  };
  const expiredGrant = {
    ...createDownloadGrantRecord({ id: "grant_expired", status: "EXPIRED" }),
    order,
    orderItem: item,
    product,
    asset,
  };
  const { db } = createMockDownloadGrantDb({
    grants: [activeGrant, revokedGrant, expiredGrant],
  });
  const service = createDownloadGrantService(db);

  const result = await service.listDownloadGrantsForEmail(order.customerEmail);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, "grant_active");
});

test("revokeDownloadGrant passes the grant to REVOKED and sets revokedAt", async () => {
  const product = createProductRecord();
  const asset = createAssetRecord();
  const order = createOrderRecord();
  const item = createOrderItemRecord({ orderId: order.id, productId: product.id });
  const grant = {
    ...createDownloadGrantRecord(),
    order,
    orderItem: item,
    product,
    asset,
  };
  const timestamp = new Date("2026-08-06T12:00:00.000Z");
  const { db } = createMockDownloadGrantDb({
    grants: [grant],
  });
  const service = createDownloadGrantService(db, { now: () => timestamp });

  const result = await service.revokeDownloadGrant(grant.id);

  assert.equal(result.status, "REVOKED");
  assert.equal(result.revokedAt?.toISOString(), "2026-08-06T12:00:00.000Z");
});

test("revokeDownloadGrant is idempotent when already revoked", async () => {
  const product = createProductRecord();
  const asset = createAssetRecord();
  const order = createOrderRecord();
  const item = createOrderItemRecord({ orderId: order.id, productId: product.id });
  const grant = {
    ...createDownloadGrantRecord({
      status: "REVOKED",
      revokedAt: new Date("2026-08-06T11:00:00.000Z"),
    }),
    order,
    orderItem: item,
    product,
    asset,
  };
  const { db } = createMockDownloadGrantDb({
    grants: [grant],
  });
  const service = createDownloadGrantService(db);

  const result = await service.revokeDownloadGrant(grant.id);

  assert.equal(result.status, "REVOKED");
  assert.equal(result.revokedAt?.toISOString(), "2026-08-06T11:00:00.000Z");
});

test("markExpiredDownloadGrants expires only active grants with expiresAt in the past", async () => {
  const product = createProductRecord();
  const asset = createAssetRecord();
  const order = createOrderRecord();
  const item = createOrderItemRecord({ orderId: order.id, productId: product.id });
  const expiredActive = {
    ...createDownloadGrantRecord({
      id: "grant_expire",
      expiresAt: new Date("2026-08-05T00:00:00.000Z"),
    }),
    order,
    orderItem: item,
    product,
    asset,
  };
  const activeWithoutExpiry = {
    ...createDownloadGrantRecord({
      id: "grant_no_expiry",
      expiresAt: null,
    }),
    order,
    orderItem: item,
    product,
    asset,
  };
  const revokedExpired = {
    ...createDownloadGrantRecord({
      id: "grant_revoked",
      status: "REVOKED",
      expiresAt: new Date("2026-08-05T00:00:00.000Z"),
    }),
    order,
    orderItem: item,
    product,
    asset,
  };
  const { db, state } = createMockDownloadGrantDb({
    grants: [expiredActive, activeWithoutExpiry, revokedExpired],
  });
  const service = createDownloadGrantService(db);

  const count = await service.markExpiredDownloadGrants(new Date("2026-08-06T00:00:00.000Z"));

  assert.equal(count, 1);
  assert.equal(state.grants.find((grant) => grant.id === "grant_expire")?.status, "EXPIRED");
  assert.equal(state.grants.find((grant) => grant.id === "grant_no_expiry")?.status, "ACTIVE");
  assert.equal(state.grants.find((grant) => grant.id === "grant_revoked")?.status, "REVOKED");
});

test("download grant service does not touch Supabase, Stripe, or Vercel Blob", async () => {
  const product = createProductRecord();
  const asset = createAssetRecord();
  const order = createOrderRecord();
  const item = {
    ...createOrderItemRecord({ orderId: order.id, productId: product.id }),
    product: {
      ...product,
      assets: [createProductAssetRecord({ productId: product.id, assetId: asset.id, asset })],
    },
  };
  const { db, state } = createMockDownloadGrantDb({
    orders: [{ ...order, items: [item], downloadGrants: [] }],
  });
  const service = createDownloadGrantService(db);

  await service.createDownloadGrantsForOrder(order.id);

  assert.equal(state.supabaseTouched, false);
  assert.equal(state.stripeTouched, false);
  assert.equal(state.vercelBlobTouched, false);
});

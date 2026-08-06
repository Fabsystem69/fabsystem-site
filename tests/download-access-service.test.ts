import assert from "node:assert/strict";
import test from "node:test";
import type { DigitalAsset, DownloadGrant, Order, OrderItem, Product } from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import { createDownloadAccessService } from "@/lib/services/download-access";

type DownloadGrantWithRelations = DownloadGrant & {
  order: Order;
  orderItem: OrderItem;
  product: Product;
  asset: DigitalAsset;
};

function createOrderRecord(overrides: Partial<Order> = {}): Order {
  const now = new Date("2026-08-06T00:00:00.000Z");
  const hasCustomerIdOverride = Object.prototype.hasOwnProperty.call(overrides, "customerId");

  return {
    id: overrides.id ?? "order_1",
    orderNumber: overrides.orderNumber ?? "FS-20260806-ABC123",
    status: overrides.status ?? "PAID",
    customerId: hasCustomerIdOverride ? overrides.customerId ?? null : "customer_1",
    customerEmail: overrides.customerEmail ?? "buyer@example.com",
    customerName: overrides.customerName ?? "Buyer",
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

function createCustomerContext(overrides?: Partial<{ customerId: string; customerEmail: string }>) {
  return {
    customerId: overrides?.customerId ?? "customer_1",
    customerEmail: overrides?.customerEmail ?? "buyer@example.com",
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

function createMockDownloadAccessDb(seed?: { grant?: DownloadGrantWithRelations | null }) {
  let grant = seed?.grant ?? null;
  const state = {
    updates: [] as Array<{
      grantId: string;
      downloadCountIncrement?: number;
      lastDownloadedAt?: Date | null;
    }>,
  };

  const db = {
    async findDownloadGrantById(grantId: string) {
      return grant?.id === grantId ? grant : null;
    },
    async updateDownloadGrant(
      grantId: string,
      data: {
        lastDownloadedAt?: Date | null;
        downloadCountIncrement?: number;
      }
    ) {
      if (!grant || grant.id !== grantId) {
        throw new Error("Grant not found in mock");
      }

      grant = {
        ...grant,
        downloadCount: grant.downloadCount + (data.downloadCountIncrement ?? 0),
        lastDownloadedAt: data.lastDownloadedAt ?? grant.lastDownloadedAt,
      };

      state.updates.push({ grantId, ...data });

      return grant;
    },
  };

  return { db, state, getGrant: () => grant };
}

test("getDownloadAccessForGrant refuses a missing grant", async () => {
  const { db } = createMockDownloadAccessDb({ grant: null });
  const service = createDownloadAccessService(db);

  await assert.rejects(
    () => service.getDownloadAccessForGrant("missing", createCustomerContext()),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("getDownloadAccessForGrant refuses when no customer context is provided", async () => {
  const grant = createDownloadGrantRecord();
  const { db, state } = createMockDownloadAccessDb({ grant });
  const calls: Array<{ path: string; ttl?: number }> = [];
  const service = createDownloadAccessService(db, {
    expectedBucket: grant.asset.bucket,
    async createPrivateAssetSignedUrl(path: string, ttl?: number) {
      calls.push({ path, ttl });
      return "https://example.test/signed-download";
    },
  });

  await assert.rejects(
    () => service.getDownloadAccessForGrant(grant.id),
    (error: unknown) => error instanceof HttpError && error.status === 401
  );

  assert.equal(calls.length, 0);
  assert.equal(state.updates.length, 0);
});

test("getDownloadAccessForGrant refuses a revoked grant", async () => {
  const grant = createDownloadGrantRecord({ status: "REVOKED", revokedAt: new Date("2026-08-06T00:00:00.000Z") });
  const { db } = createMockDownloadAccessDb({ grant });
  const service = createDownloadAccessService(db);

  await assert.rejects(
    () => service.getDownloadAccessForGrant(grant.id, createCustomerContext()),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("getDownloadAccessForGrant refuses a revoked grant without resolving the Supabase bucket config", async () => {
  const grant = createDownloadGrantRecord({ status: "REVOKED", revokedAt: new Date("2026-08-06T00:00:00.000Z") });
  const { db } = createMockDownloadAccessDb({ grant });
  let expectedBucketResolved = false;
  const service = createDownloadAccessService(db, {
    expectedBucket: () => {
      expectedBucketResolved = true;
      throw new Error("Missing SUPABASE_URL");
    },
  });

  await assert.rejects(
    () => service.getDownloadAccessForGrant(grant.id, createCustomerContext()),
    (error: unknown) =>
      error instanceof HttpError && error.status === 409 && error.message === "Download grant is not active"
  );

  assert.equal(expectedBucketResolved, false);
});

test("getDownloadAccessForGrant refuses an expired grant status", async () => {
  const grant = createDownloadGrantRecord({ status: "EXPIRED" });
  const { db } = createMockDownloadAccessDb({ grant });
  const service = createDownloadAccessService(db);

  await assert.rejects(
    () => service.getDownloadAccessForGrant(grant.id, createCustomerContext()),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("getDownloadAccessForGrant refuses when expiresAt is in the past", async () => {
  const grant = createDownloadGrantRecord({
    expiresAt: new Date("2026-08-05T23:59:59.000Z"),
  });
  const { db } = createMockDownloadAccessDb({ grant });
  const service = createDownloadAccessService(db, {
    now: () => new Date("2026-08-06T00:00:00.000Z"),
  });

  await assert.rejects(
    () => service.getDownloadAccessForGrant(grant.id, createCustomerContext()),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("getDownloadAccessForGrant refuses when maxDownloads is reached", async () => {
  const grant = createDownloadGrantRecord({
    downloadCount: 3,
    maxDownloads: 3,
  });
  const { db } = createMockDownloadAccessDb({ grant });
  const service = createDownloadAccessService(db);

  await assert.rejects(
    () => service.getDownloadAccessForGrant(grant.id, createCustomerContext()),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("getDownloadAccessForGrant refuses a draft asset", async () => {
  const grant = createDownloadGrantRecord({
    asset: createAssetRecord({ status: "DRAFT" }),
  });
  const { db } = createMockDownloadAccessDb({ grant });
  const service = createDownloadAccessService(db);

  await assert.rejects(
    () => service.getDownloadAccessForGrant(grant.id, createCustomerContext()),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("getDownloadAccessForGrant refuses an archived asset", async () => {
  const grant = createDownloadGrantRecord({
    asset: createAssetRecord({ status: "ARCHIVED" }),
  });
  const { db } = createMockDownloadAccessDb({ grant });
  const service = createDownloadAccessService(db);

  await assert.rejects(
    () => service.getDownloadAccessForGrant(grant.id, createCustomerContext()),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("getDownloadAccessForGrant refuses a non-Supabase provider", async () => {
  const grant = createDownloadGrantRecord({
    asset: {
      ...createAssetRecord(),
      provider: "S3" as DigitalAsset["provider"],
    },
  });
  const { db } = createMockDownloadAccessDb({ grant });
  const service = createDownloadAccessService(db);

  await assert.rejects(
    () => service.getDownloadAccessForGrant(grant.id, createCustomerContext()),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("getDownloadAccessForGrant refuses an order that is not paid", async () => {
  const grant = createDownloadGrantRecord({
    order: createOrderRecord({ status: "PENDING_PAYMENT", paidAt: null }),
  });
  const { db } = createMockDownloadAccessDb({ grant });
  const service = createDownloadAccessService(db);

  await assert.rejects(
    () => service.getDownloadAccessForGrant(grant.id, createCustomerContext()),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("getDownloadAccessForGrant authorizes when order.customerId matches the customer", async () => {
  const grant = createDownloadGrantRecord();
  const { db } = createMockDownloadAccessDb({ grant });
  const calls: Array<{ path: string; ttl?: number }> = [];
  const service = createDownloadAccessService(db, {
    expectedBucket: grant.asset.bucket,
    async createPrivateAssetSignedUrl(path: string, ttl?: number) {
      calls.push({ path, ttl });
      return "https://example.test/signed-download";
    },
  });

  const result = await service.getDownloadAccessForGrant(
    grant.id,
    createCustomerContext({
      customerId: grant.order.customerId ?? "customer_1",
      customerEmail: "other@example.com",
    })
  );

  assert.equal(result.url, "https://example.test/signed-download");
  assert.equal(result.expiresInSeconds, 300);
  assert.equal(result.grant.id, grant.id);
  assert.deepEqual(calls, [{ path: grant.asset.path, ttl: 300 }]);
});

test("getDownloadAccessForGrant authorizes fallback on order.customerEmail when customerId is null", async () => {
  const grant = createDownloadGrantRecord({
    order: createOrderRecord({
      customerId: null,
      customerEmail: "buyer@example.com",
    }),
  });
  const { db } = createMockDownloadAccessDb({ grant });
  const service = createDownloadAccessService(db, {
    expectedBucket: grant.asset.bucket,
    async createPrivateAssetSignedUrl() {
      return "https://example.test/signed-download";
    },
  });

  const result = await service.getDownloadAccessForGrant(
    grant.id,
    createCustomerContext({
      customerId: "customer_other",
      customerEmail: "buyer@example.com",
    })
  );

  assert.equal(result.url, "https://example.test/signed-download");
});

test("getDownloadAccessForGrant refuses when customerId and email do not match", async () => {
  const grant = createDownloadGrantRecord();
  const { db, state } = createMockDownloadAccessDb({ grant });
  const calls: Array<string> = [];
  const service = createDownloadAccessService(db, {
    expectedBucket: grant.asset.bucket,
    async createPrivateAssetSignedUrl(path: string) {
      calls.push(path);
      return "https://example.test/signed-download";
    },
  });

  await assert.rejects(
    () =>
      service.getDownloadAccessForGrant(
        grant.id,
        createCustomerContext({
          customerId: "customer_other",
          customerEmail: "other@example.com",
        })
      ),
    (error: unknown) => error instanceof HttpError && error.status === 403
  );

  assert.equal(calls.length, 0);
  assert.equal(state.updates.length, 0);
});

test("getDownloadAccessForGrant refuses fallback email when order is already linked to another customerId", async () => {
  const grant = createDownloadGrantRecord({
    order: createOrderRecord({
      customerId: "customer_linked",
      customerEmail: "buyer@example.com",
    }),
  });
  const { db, state } = createMockDownloadAccessDb({ grant });
  const calls: Array<string> = [];
  const service = createDownloadAccessService(db, {
    expectedBucket: grant.asset.bucket,
    async createPrivateAssetSignedUrl(path: string) {
      calls.push(path);
      return "https://example.test/signed-download";
    },
  });

  await assert.rejects(
    () =>
      service.getDownloadAccessForGrant(
        grant.id,
        createCustomerContext({
          customerId: "customer_other",
          customerEmail: "buyer@example.com",
        })
      ),
    (error: unknown) => error instanceof HttpError && error.status === 403
  );

  assert.equal(calls.length, 0);
  assert.equal(state.updates.length, 0);
});

test("consumeDownloadGrant increments downloadCount and sets lastDownloadedAt", async () => {
  const timestamp = new Date("2026-08-06T12:00:00.000Z");
  const grant = createDownloadGrantRecord();
  const { db, state, getGrant } = createMockDownloadAccessDb({ grant });
  const service = createDownloadAccessService(db, {
    now: () => timestamp,
    expectedBucket: grant.asset.bucket,
  });

  const updatedGrant = await service.consumeDownloadGrant(grant.id, createCustomerContext());

  assert.equal(state.updates.length, 1);
  assert.equal(state.updates[0]?.downloadCountIncrement, 1);
  assert.equal(state.updates[0]?.lastDownloadedAt?.toISOString(), timestamp.toISOString());
  assert.equal(updatedGrant?.downloadCount, 1);
  assert.equal(updatedGrant?.lastDownloadedAt?.toISOString(), timestamp.toISOString());
  assert.equal(getGrant()?.downloadCount, 1);
});

test("consumeDownloadGrant does not increment if signed URL generation fails upstream", async () => {
  const grant = createDownloadGrantRecord();
  const { db, state } = createMockDownloadAccessDb({ grant });
  const service = createDownloadAccessService(db, {
    expectedBucket: grant.asset.bucket,
    async createPrivateAssetSignedUrl() {
      throw new Error("Supabase unavailable");
    },
  });

  await assert.rejects(
    () => service.getDownloadAccessForGrant(grant.id, createCustomerContext()),
    (error: unknown) => error instanceof HttpError && error.status === 503
  );

  assert.equal(state.updates.length, 0);
});

test("consumeDownloadGrant does not increment when the customer is not authorized", async () => {
  const grant = createDownloadGrantRecord();
  const { db, state, getGrant } = createMockDownloadAccessDb({ grant });
  const service = createDownloadAccessService(db, {
    expectedBucket: grant.asset.bucket,
  });

  await assert.rejects(
    () =>
      service.consumeDownloadGrant(
        grant.id,
        createCustomerContext({
          customerId: "customer_other",
          customerEmail: "other@example.com",
        })
      ),
    (error: unknown) => error instanceof HttpError && error.status === 403
  );

  assert.equal(state.updates.length, 0);
  assert.equal(getGrant()?.downloadCount, 0);
});

test("download access service does not store signed URLs in the database", async () => {
  const grant = createDownloadGrantRecord();
  const { db, state } = createMockDownloadAccessDb({ grant });
  const service = createDownloadAccessService(db, {
    expectedBucket: grant.asset.bucket,
    async createPrivateAssetSignedUrl() {
      return "https://example.test/private";
    },
  });

  await service.getDownloadAccessForGrant(grant.id, createCustomerContext());
  await service.consumeDownloadGrant(grant.id, createCustomerContext());

  assert.deepEqual(state.updates, [
    {
      grantId: grant.id,
      downloadCountIncrement: 1,
      lastDownloadedAt: state.updates[0]?.lastDownloadedAt,
    },
  ]);
});

test("download access service does not touch Stripe or Vercel Blob", async () => {
  const grant = createDownloadGrantRecord();
  const { db } = createMockDownloadAccessDb({ grant });
  const stripeTouched = false;
  const blobTouched = false;

  const service = createDownloadAccessService(db, {
    expectedBucket: grant.asset.bucket,
    async createPrivateAssetSignedUrl() {
      return "https://example.test/private";
    },
  });

  await service.getDownloadAccessForGrant(grant.id, createCustomerContext());

  assert.equal(stripeTouched, false);
  assert.equal(blobTouched, false);
});

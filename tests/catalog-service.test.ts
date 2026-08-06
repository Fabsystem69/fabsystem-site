import assert from "node:assert/strict";
import test from "node:test";
import type {
  BundleItem,
  DigitalAsset,
  DigitalAssetStatus,
  OrderItem,
  Product,
  ProductAsset,
  ProductPrice,
} from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import { createCatalogService, normalizeProductSlug } from "@/lib/services/catalog";

type ProductAssetWithAsset = ProductAsset & {
  asset: DigitalAsset;
};

type ProductRecord = Product & {
  prices?: ProductPrice[];
  assets?: ProductAssetWithAsset[];
  bundleItems?: BundleItem[];
};

function createProductRecord(overrides: Partial<Product> = {}): Product {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "prod_1",
    slug: overrides.slug ?? "ebook-foundation",
    name: overrides.name ?? "Ebook Foundation",
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

function createPriceRecord(overrides: Partial<ProductPrice> = {}): ProductPrice {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "price_1",
    productId: overrides.productId ?? "prod_1",
    currency: overrides.currency ?? "EUR",
    unitAmountCents: overrides.unitAmountCents ?? 1900,
    compareAtAmountCents: overrides.compareAtAmountCents ?? null,
    status: overrides.status ?? "ACTIVE",
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
    path: overrides.path ?? "ebooks/ebook-foundation.pdf",
    filename: overrides.filename ?? "ebook-foundation.pdf",
    contentType: overrides.contentType ?? "application/pdf",
    sizeBytes: overrides.sizeBytes ?? 1024,
    version: overrides.version ?? null,
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

function createOrderItemRecord(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: overrides.id ?? "order_item_1",
    orderId: overrides.orderId ?? "order_1",
    productId: overrides.productId ?? "prod_1",
    productSlug: overrides.productSlug ?? "ebook-foundation",
    productName: overrides.productName ?? "Ebook Foundation",
    productType: overrides.productType ?? "EBOOK",
    quantity: overrides.quantity ?? 1,
    currency: overrides.currency ?? "EUR",
    unitAmountCents: overrides.unitAmountCents ?? 1900,
    lineTotalCents: overrides.lineTotalCents ?? 1900,
    createdAt: overrides.createdAt ?? new Date("2026-08-06T00:00:00.000Z"),
  };
}

function createMockCatalogDb(seed?: {
  products?: ProductRecord[];
  prices?: ProductPrice[];
  assets?: DigitalAsset[];
  productAssets?: ProductAssetWithAsset[];
  orderItems?: OrderItem[];
}) {
  const state = {
    products: [...(seed?.products ?? [])],
    prices: [...(seed?.prices ?? [])],
    assets: [...(seed?.assets ?? [])],
    productAssets: [...(seed?.productAssets ?? [])],
    orderItems: [...(seed?.orderItems ?? [])],
    updatedProducts: [] as Array<{ productId: string; data: Record<string, unknown> }>,
    updatedPrices: [] as Array<{ priceId: string; data: Record<string, unknown> }>,
    updatedAssets: [] as Array<{ assetId: string; data: Record<string, unknown> }>,
  };

  const inflateProduct = (product: Product): ProductRecord => ({
    ...product,
    prices: state.prices.filter((price) => price.productId === product.id),
    assets: state.productAssets.filter((asset) => asset.productId === product.id),
    bundleItems: [],
  });

  const db = {
    async listProducts(
      filters: { status?: Product["status"]; purchaseMode?: Product["purchaseMode"] },
      options?: unknown
    ) {
      void options;
      return state.products
        .filter((product) => (filters.status ? product.status === filters.status : true))
        .filter((product) =>
          filters.purchaseMode ? product.purchaseMode === filters.purchaseMode : true
        )
        .map(inflateProduct);
    },
    async findProduct(where: { id?: string; slug?: string }) {
      const product = state.products.find(
        (item) =>
          (where.id ? item.id === where.id : true) &&
          (where.slug ? item.slug === where.slug : true)
      );
      return product ? inflateProduct(product) : null;
    },
    async findProductWithAssets(id: string) {
      const product = state.products.find((item) => item.id === id);
      return product
        ? {
            ...product,
            assets: state.productAssets.filter((asset) => asset.productId === id),
          }
        : null;
    },
    async countOrderItemsByProductId(productId: string) {
      return state.orderItems.filter((item) => item.productId === productId).length;
    },
    async findPricesByProductId(productId: string, status?: ProductPrice["status"]) {
      return state.prices.filter(
        (price) => price.productId === productId && (status ? price.status === status : true)
      );
    },
    async findDigitalAssetById(id: string) {
      const asset = state.assets.find((item) => item.id === id);
      return asset ? { id: asset.id, status: asset.status } : null;
    },
    async listAssets() {
      return state.assets
        .map((asset) => ({
          ...asset,
          products: state.productAssets
            .filter((productAsset) => productAsset.assetId === asset.id)
            .map((productAsset) => {
              const product = state.products.find((item) => item.id === productAsset.productId);

              if (!product) {
                throw new Error("Linked product not found in mock");
              }

              return {
                productId: productAsset.productId,
                sortOrder: productAsset.sortOrder,
                product: {
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  productType: product.productType,
                  status: product.status,
                },
              };
            }),
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    async findAssetById(id: string) {
      const asset = state.assets.find((item) => item.id === id);

      if (!asset) {
        return null;
      }

      return (
        (await db.listAssets()).find((item) => item.id === id) ?? {
          ...asset,
          products: [],
        }
      );
    },
    async findAssetByBucketPath(input: { bucket: string; path: string }) {
      const asset = state.assets.find(
        (item) => item.bucket === input.bucket && item.path === input.path
      );

      if (!asset) {
        return null;
      }

      return (await db.listAssets()).find((item) => item.id === asset.id) ?? null;
    },
    async createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">) {
      const product = createProductRecord({
        id: `prod_${state.products.length + 1}`,
        ...data,
      });
      state.products.push(product);
      return product;
    },
    async createProductPrice(data: Omit<ProductPrice, "id" | "createdAt" | "updatedAt">) {
      const price = createPriceRecord({
        id: `price_${state.prices.length + 1}`,
        ...data,
      });
      state.prices.push(price);
      return price;
    },
    async createDigitalAsset(data: Omit<DigitalAsset, "id" | "createdAt" | "updatedAt">) {
      const asset = createAssetRecord({
        id: `asset_${state.assets.length + 1}`,
        ...data,
      });
      state.assets.push(asset);
      return asset;
    },
    async createProductAsset(data: Omit<ProductAsset, "createdAt">) {
      const asset = state.assets.find((item) => item.id === data.assetId);
      const productAsset = createProductAssetRecord({
        ...data,
        asset: asset ?? createAssetRecord({ id: data.assetId }),
      });
      state.productAssets.push(productAsset);
      return productAsset;
    },
    async updateProduct(
      productId: string,
      data: Partial<Product>
    ) {
      const product = state.products.find((item) => item.id === productId);
      if (!product) {
        throw new Error("Product not found in mock");
      }
      Object.assign(product, data);
      product.updatedAt = new Date("2026-08-06T01:00:00.000Z");
      state.updatedProducts.push({ productId, data: data as Record<string, unknown> });
      return product;
    },
    async findProductPriceById(priceId: string) {
      return state.prices.find((item) => item.id === priceId) ?? null;
    },
    async updateProductPrice(priceId: string, data: Partial<ProductPrice>) {
      const price = state.prices.find((item) => item.id === priceId);
      if (!price) {
        throw new Error("Price not found in mock");
      }
      Object.assign(price, data);
      price.updatedAt = new Date("2026-08-06T01:00:00.000Z");
      state.updatedPrices.push({ priceId, data: data as Record<string, unknown> });
      return price;
    },
    async updateDigitalAsset(assetId: string, data: Partial<DigitalAsset>) {
      const asset = state.assets.find((item) => item.id === assetId);
      if (!asset) {
        throw new Error("Asset not found in mock");
      }
      Object.assign(asset, data);
      asset.updatedAt = new Date("2026-08-06T01:00:00.000Z");
      state.updatedAssets.push({ assetId, data: data as Record<string, unknown> });
      return asset;
    },
    async updateDigitalAssetStatus(assetId: string, status: DigitalAssetStatus) {
      return db.updateDigitalAsset(assetId, { status });
    },
    async updateProductStatus(productId: string, status: Product["status"]) {
      const product = state.products.find((item) => item.id === productId);
      if (!product) {
        throw new Error("Product not found in mock");
      }
      product.status = status;
      product.updatedAt = new Date("2026-08-06T01:00:00.000Z");
      return product;
    },
    async findProductAsset(input: { productId: string; assetId: string }) {
      const productAsset = state.productAssets.find(
        (item) => item.productId === input.productId && item.assetId === input.assetId
      );
      return productAsset
        ? {
            productId: productAsset.productId,
            assetId: productAsset.assetId,
            sortOrder: productAsset.sortOrder,
            createdAt: productAsset.createdAt,
          }
        : null;
    },
    async deleteProductAsset(input: { productId: string; assetId: string }) {
      const index = state.productAssets.findIndex(
        (item) => item.productId === input.productId && item.assetId === input.assetId
      );

      if (index === -1) {
        throw new Error("Product asset not found in mock");
      }

      const [removed] = state.productAssets.splice(index, 1);
      return {
        productId: removed.productId,
        assetId: removed.assetId,
        sortOrder: removed.sortOrder,
        createdAt: removed.createdAt,
      };
    },
    async transaction<T>(callback: (db: typeof db) => Promise<T>) {
      return callback(db);
    },
  };

  return { db, state };
}

test("normalizeProductSlug normalizes a simple slug", () => {
  assert.equal(normalizeProductSlug("Mon Ebook Test"), "mon-ebook-test");
});

test("normalizeProductSlug removes accents spaces and special characters", () => {
  assert.equal(
    normalizeProductSlug(" Électricité Van !!! édition 2026 "),
    "electricite-van-edition-2026"
  );
});

test("createDigitalProduct creates a digital product with an active price and optional asset", async () => {
  const asset = createAssetRecord({ id: "asset_existing" });
  const { db } = createMockCatalogDb({
    assets: [asset],
  });
  const service = createCatalogService(db);

  const product = await service.createDigitalProduct({
    slug: "ebook-launch",
    name: "Ebook Launch",
    productType: "EBOOK",
    purchaseMode: "BUY_NOW",
    unitAmountCents: 2900,
    assetId: asset.id,
  });

  assert.equal(product.slug, "ebook-launch");
  assert.equal(product.purchaseMode, "BUY_NOW");
  assert.equal(product.prices.length, 1);
  assert.equal(product.prices[0]?.status, "ACTIVE");
  assert.equal(product.prices[0]?.unitAmountCents, 2900);
  assert.equal(product.assets.length, 1);
  assert.equal(product.assets[0]?.assetId, asset.id);
});

test("createDigitalProduct rejects a negative amount", async () => {
  const { db } = createMockCatalogDb();
  const service = createCatalogService(db);

  await assert.rejects(
    () =>
      service.createDigitalProduct({
        slug: "ebook-launch",
        name: "Ebook Launch",
        productType: "EBOOK",
        purchaseMode: "BUY_NOW",
        unitAmountCents: -10,
      }),
    (error: unknown) => error instanceof Error && /unitAmountCents|too small/i.test(error.message)
  );
});

test("createDigitalProduct rejects an empty slug", async () => {
  const { db } = createMockCatalogDb();
  const service = createCatalogService(db);

  await assert.rejects(
    () =>
      service.createDigitalProduct({
        slug: "   ",
        name: "Ebook Launch",
        productType: "EBOOK",
        purchaseMode: "BUY_NOW",
        unitAmountCents: 2900,
      }),
    (error: unknown) => error instanceof Error && /slug/i.test(error.message)
  );
});

test("createProductWithPrice creates a DRAFT product with one ACTIVE price", async () => {
  const { db, state } = createMockCatalogDb();
  const service = createCatalogService(db);

  const product = await service.createProductWithPrice({
    name: "Guide Van",
    slug: "Guide Van",
    shortDescription: "Court",
    description: "Long",
    featuredImage: "",
    productType: "DIGITAL_DOWNLOAD",
    purchaseMode: "BUY_NOW",
    status: "ACTIVE",
    amountEuros: 29,
    currency: "EUR",
  });

  assert.equal(product.status, "DRAFT");
  assert.equal(product.slug, "guide-van");
  assert.equal(state.prices.length, 1);
  assert.equal(state.prices[0]?.status, "ACTIVE");
  assert.equal(state.prices[0]?.unitAmountCents, 2900);
});

test("createProductWithPrice refuses an empty name", async () => {
  const { db } = createMockCatalogDb();
  const service = createCatalogService(db);

  await assert.rejects(
    () =>
      service.createProductWithPrice({
        name: "   ",
        slug: "guide-van",
        shortDescription: "",
        description: "",
        featuredImage: "",
        productType: "DIGITAL_DOWNLOAD",
        purchaseMode: "BUY_NOW",
        status: "DRAFT",
        amountEuros: 29,
        currency: "EUR",
      }),
    (error: unknown) => error instanceof Error && /name/i.test(error.message)
  );
});

test("createProductWithPrice refuses a non-positive price", async () => {
  const { db } = createMockCatalogDb();
  const service = createCatalogService(db);

  await assert.rejects(
    () =>
      service.createProductWithPrice({
        name: "Guide Van",
        slug: "guide-van",
        shortDescription: "",
        description: "",
        featuredImage: "",
        productType: "DIGITAL_DOWNLOAD",
        purchaseMode: "BUY_NOW",
        status: "DRAFT",
        amountEuros: 0,
        currency: "EUR",
      }),
    (error: unknown) => error instanceof Error && /positive|too small/i.test(error.message)
  );
});

test("createProductWithPrice refuses a duplicate slug", async () => {
  const existing = createProductRecord({ slug: "guide-van" });
  const { db } = createMockCatalogDb({
    products: [existing],
  });
  const service = createCatalogService(db);

  await assert.rejects(
    () =>
      service.createProductWithPrice({
        name: "Guide Van 2",
        slug: "Guide Van",
        shortDescription: "",
        description: "",
        featuredImage: "",
        productType: "DIGITAL_DOWNLOAD",
        purchaseMode: "BUY_NOW",
        status: "DRAFT",
        amountEuros: 19,
        currency: "EUR",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("listActiveBuyNowProducts ignores DRAFT, ARCHIVED and REQUEST_ONLY products", async () => {
  const activeBuyNow = createProductRecord({ id: "prod_active", slug: "active-buy-now" });
  const draft = createProductRecord({ id: "prod_draft", slug: "draft", status: "DRAFT" });
  const archived = createProductRecord({
    id: "prod_archived",
    slug: "archived",
    status: "ARCHIVED",
  });
  const requestOnly = createProductRecord({
    id: "prod_request_only",
    slug: "request-only",
    purchaseMode: "REQUEST_ONLY",
  });
  const { db } = createMockCatalogDb({
    products: [activeBuyNow, draft, archived, requestOnly],
  });
  const service = createCatalogService(db);

  const products = await service.listActiveBuyNowProducts();

  assert.equal(products.length, 1);
  assert.equal(products[0]?.id, "prod_active");
});

test("listCatalogProductsForAdmin returns catalog products across statuses and purchase modes", async () => {
  const activeBuyNow = createProductRecord({ id: "prod_active", slug: "active-buy-now" });
  const draft = createProductRecord({ id: "prod_draft", slug: "draft", status: "DRAFT" });
  const requestOnly = createProductRecord({
    id: "prod_request_only",
    slug: "request-only",
    purchaseMode: "REQUEST_ONLY",
  });
  const { db } = createMockCatalogDb({
    products: [activeBuyNow, draft, requestOnly],
    prices: [
      createPriceRecord({ id: "price_active", productId: activeBuyNow.id, status: "ACTIVE" }),
      createPriceRecord({ id: "price_draft", productId: draft.id, status: "ARCHIVED" }),
    ],
    productAssets: [createProductAssetRecord({ productId: activeBuyNow.id, assetId: "asset_1" })],
  });
  const service = createCatalogService(db);

  const products = await service.listCatalogProductsForAdmin();

  assert.equal(products.length, 3);
  assert.equal(products.some((product) => product.slug === "active-buy-now"), true);
  assert.equal(products.some((product) => product.slug === "draft"), true);
  assert.equal(products.some((product) => product.slug === "request-only"), true);
});

test("getActivePriceForProduct fails when there is no active price", async () => {
  const product = createProductRecord({ id: "prod_no_price" });
  const { db } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ARCHIVED" })],
  });
  const service = createCatalogService(db);

  await assert.rejects(
    () => service.getActivePriceForProduct(product.id),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("getActivePriceForProduct fails when there are multiple active prices", async () => {
  const product = createProductRecord({ id: "prod_multi_price" });
  const { db } = createMockCatalogDb({
    products: [product],
    prices: [
      createPriceRecord({ id: "price_1", productId: product.id, status: "ACTIVE" }),
      createPriceRecord({ id: "price_2", productId: product.id, status: "ACTIVE" }),
    ],
  });
  const service = createCatalogService(db);

  await assert.rejects(
    () => service.getActivePriceForProduct(product.id),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("archiveProduct sets the product status to ARCHIVED", async () => {
  const product = createProductRecord({ id: "prod_archive_me", status: "ACTIVE" });
  const { db, state } = createMockCatalogDb({
    products: [product],
  });
  const service = createCatalogService(db);

  const archived = await service.archiveProduct(product.id);

  assert.equal(archived.status, "ARCHIVED");
  assert.equal(state.products[0]?.status, "ARCHIVED");
});

test("listDashboardProducts returns products with prices and assets", async () => {
  const product = createProductRecord({ id: "prod_dashboard" });
  const asset = createAssetRecord({ id: "asset_dashboard", filename: "dashboard.pdf" });
  const { db } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ACTIVE" })],
    assets: [asset],
    productAssets: [
      createProductAssetRecord({
        productId: product.id,
        assetId: asset.id,
        asset,
      }),
    ],
  });
  const service = createCatalogService(db);

  const products = await service.listDashboardProducts();

  assert.equal(products.length, 1);
  assert.equal(products[0]?.prices.length, 1);
  assert.equal(products[0]?.assets.length, 1);
  assert.equal(products[0]?.assets[0]?.asset.filename, "dashboard.pdf");
});

test("activateProduct activates a product with one active price", async () => {
  const product = createProductRecord({
    id: "prod_activate_download",
    status: "DRAFT",
    productType: "DIGITAL_DOWNLOAD",
  });
  const { db, state } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ACTIVE" })],
  });
  const service = createCatalogService(db);

  const activated = await service.activateProduct(product.id);

  assert.equal(activated.status, "ACTIVE");
  assert.equal(state.products[0]?.status, "ACTIVE");
});

test("activateProduct refuses when no active price exists", async () => {
  const product = createProductRecord({
    id: "prod_no_active_price",
    status: "DRAFT",
    productType: "DIGITAL_DOWNLOAD",
  });
  const { db } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ARCHIVED" })],
  });
  const service = createCatalogService(db);

  await assert.rejects(
    () => service.activateProduct(product.id),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("activateProduct activates an ebook with an active asset", async () => {
  const product = createProductRecord({
    id: "prod_ebook_ready",
    status: "ARCHIVED",
    productType: "EBOOK",
  });
  const asset = createAssetRecord({ id: "asset_ready", status: "ACTIVE" });
  const { db, state } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ACTIVE" })],
    assets: [asset],
    productAssets: [
      createProductAssetRecord({
        productId: product.id,
        assetId: asset.id,
        asset,
      }),
    ],
  });
  const service = createCatalogService(db);

  const activated = await service.activateProduct(product.id);

  assert.equal(activated.status, "ACTIVE");
  assert.equal(state.products[0]?.status, "ACTIVE");
});

test("activateProduct refuses an ebook without any active asset", async () => {
  const product = createProductRecord({
    id: "prod_ebook_no_asset",
    status: "DRAFT",
    productType: "EBOOK",
  });
  const { db } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ACTIVE" })],
  });
  const service = createCatalogService(db);

  await assert.rejects(
    () => service.activateProduct(product.id),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("activateProduct refuses an ebook when linked assets are not ACTIVE", async () => {
  const product = createProductRecord({
    id: "prod_ebook_archived_asset",
    status: "DRAFT",
    productType: "EBOOK",
  });
  const asset = createAssetRecord({ id: "asset_archived", status: "ARCHIVED" });
  const { db } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ACTIVE" })],
    assets: [asset],
    productAssets: [
      createProductAssetRecord({
        productId: product.id,
        assetId: asset.id,
        asset,
      }),
    ],
  });
  const service = createCatalogService(db);

  await assert.rejects(
    () => service.activateProduct(product.id),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("draftProduct sets the product status to DRAFT", async () => {
  const product = createProductRecord({ id: "prod_draft_me", status: "ACTIVE" });
  const { db, state } = createMockCatalogDb({
    products: [product],
  });
  const service = createCatalogService(db);

  const drafted = await service.draftProduct(product.id);

  assert.equal(drafted.status, "DRAFT");
  assert.equal(state.products[0]?.status, "DRAFT");
});

test("status actions do not modify existing order items", async () => {
  const product = createProductRecord({ id: "prod_ordered", status: "ACTIVE" });
  const orderItem = createOrderItemRecord({ productId: product.id });
  const { db, state } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ACTIVE" })],
    orderItems: [orderItem],
  });
  const service = createCatalogService(db);

  await service.archiveProduct(product.id);
  await service.draftProduct(product.id);

  assert.equal(state.orderItems.length, 1);
  assert.equal(state.orderItems[0]?.productId, product.id);
});

test("activateProduct returns a clean error when productId is unknown", async () => {
  const { db } = createMockCatalogDb();
  const service = createCatalogService(db);

  await assert.rejects(
    () => service.activateProduct("missing"),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("updateProductDetails updates name and slug", async () => {
  const product = createProductRecord({ id: "prod_edit", slug: "ancien-slug" });
  const { db, state } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ACTIVE" })],
  });
  const service = createCatalogService(db);

  const updated = await service.updateProductDetails(product.id, {
    name: "Nouveau nom",
    slug: " Nouveau Slug ",
    shortDescription: "Court",
    description: "Long",
    featuredImage: "",
    productType: "DIGITAL_DOWNLOAD",
    purchaseMode: "BUY_NOW",
    status: "DRAFT",
  });

  assert.equal(updated.name, "Nouveau nom");
  assert.equal(updated.slug, "nouveau-slug");
  assert.equal(state.products[0]?.slug, "nouveau-slug");
});

test("updateProductDetails refuses a slug already used by another product", async () => {
  const first = createProductRecord({ id: "prod_first", slug: "slug-1" });
  const second = createProductRecord({ id: "prod_second", slug: "slug-2" });
  const { db } = createMockCatalogDb({
    products: [first, second],
  });
  const service = createCatalogService(db);

  await assert.rejects(
    () =>
      service.updateProductDetails(second.id, {
        name: "Produit 2",
        slug: "slug-1",
        shortDescription: "",
        description: "",
        featuredImage: "",
        productType: "DIGITAL_DOWNLOAD",
        purchaseMode: "BUY_NOW",
        status: "DRAFT",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("updateProductDetails allows keeping the same slug on the same product", async () => {
  const product = createProductRecord({ id: "prod_same_slug", slug: "slug-stable" });
  const { db } = createMockCatalogDb({
    products: [product],
  });
  const service = createCatalogService(db);

  const updated = await service.updateProductDetails(product.id, {
    name: "Produit stable",
    slug: "slug-stable",
    shortDescription: "",
    description: "",
    featuredImage: "",
    productType: "DIGITAL_DOWNLOAD",
    purchaseMode: "BUY_NOW",
    status: "DRAFT",
  });

  assert.equal(updated.slug, "slug-stable");
});

test("updateActiveProductPrice archives the previous active price and creates a new one", async () => {
  const product = createProductRecord({ id: "prod_price_rotate", productType: "DIGITAL_DOWNLOAD" });
  const oldPrice = createPriceRecord({
    id: "price_old",
    productId: product.id,
    unitAmountCents: 2900,
    status: "ACTIVE",
  });
  const { db, state } = createMockCatalogDb({
    products: [product],
    prices: [oldPrice],
  });
  const service = createCatalogService(db);

  const newPrice = await service.updateActiveProductPrice(product.id, {
    amountEuros: 39,
    currency: "EUR",
  });

  assert.equal(newPrice.status, "ACTIVE");
  assert.equal(newPrice.unitAmountCents, 3900);
  assert.equal(state.updatedPrices[0]?.priceId, "price_old");
  assert.equal(state.prices.find((price) => price.id === "price_old")?.status, "ARCHIVED");
  assert.equal(state.prices.filter((price) => price.status === "ACTIVE").length, 1);
});

test("updateActiveProductPrice does not modify order item snapshots", async () => {
  const product = createProductRecord({ id: "prod_snapshot", productType: "DIGITAL_DOWNLOAD" });
  const oldPrice = createPriceRecord({
    id: "price_snapshot",
    productId: product.id,
    unitAmountCents: 2900,
    status: "ACTIVE",
  });
  const orderItem = createOrderItemRecord({
    productId: product.id,
    unitAmountCents: 2900,
    lineTotalCents: 2900,
  });
  const { db, state } = createMockCatalogDb({
    products: [product],
    prices: [oldPrice],
    orderItems: [orderItem],
  });
  const service = createCatalogService(db);

  await service.updateActiveProductPrice(product.id, {
    amountEuros: 49,
    currency: "EUR",
  });

  assert.equal(state.orderItems[0]?.unitAmountCents, 2900);
  assert.equal(state.orderItems[0]?.lineTotalCents, 2900);
});

test("updateProductDetails refuses activating an ebook without active asset", async () => {
  const product = createProductRecord({
    id: "prod_edit_ebook",
    status: "DRAFT",
    productType: "EBOOK",
  });
  const { db } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ACTIVE" })],
  });
  const service = createCatalogService(db);

  await assert.rejects(
    () =>
      service.updateProductDetails(product.id, {
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        description: product.description,
        featuredImage: "",
        productType: "EBOOK",
        purchaseMode: "BUY_NOW",
        status: "ACTIVE",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("updateProductDetails accepts activating a digital download with one active price", async () => {
  const product = createProductRecord({
    id: "prod_edit_download",
    status: "DRAFT",
    productType: "DIGITAL_DOWNLOAD",
  });
  const { db, state } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ACTIVE" })],
  });
  const service = createCatalogService(db);

  const updated = await service.updateProductDetails(product.id, {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    featuredImage: "",
    productType: "DIGITAL_DOWNLOAD",
    purchaseMode: "BUY_NOW",
    status: "ACTIVE",
  });

  assert.equal(updated.status, "ACTIVE");
  assert.equal(state.products[0]?.status, "ACTIVE");
});

test("updateActiveProductPrice returns a clean error when productId is unknown", async () => {
  const { db } = createMockCatalogDb();
  const service = createCatalogService(db);

  await assert.rejects(
    () => service.updateActiveProductPrice("missing", { amountEuros: 29, currency: "EUR" }),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("createDigitalAsset creates a SUPABASE asset reference", async () => {
  const { db, state } = createMockCatalogDb();
  const service = createCatalogService(db);

  const asset = await service.createDigitalAsset({
    provider: "SUPABASE",
    bucket: " ebooks-private ",
    path: " ebooks/guide.pdf ",
    filename: " guide.pdf ",
    status: "DRAFT",
  });

  assert.equal(asset.provider, "SUPABASE");
  assert.equal(asset.bucket, "ebooks-private");
  assert.equal(asset.path, "ebooks/guide.pdf");
  assert.equal(asset.filename, "guide.pdf");
  assert.equal(asset.contentType, "application/pdf");
  assert.equal(asset.sizeBytes, 0);
  assert.equal(state.assets.length, 1);
});

test("createDigitalAsset refuses an empty filename", async () => {
  const { db } = createMockCatalogDb();
  const service = createCatalogService(db);

  await assert.rejects(
    () =>
      service.createDigitalAsset({
        provider: "SUPABASE",
        bucket: "ebooks-private",
        path: "ebooks/guide.pdf",
        filename: "   ",
        status: "DRAFT",
      }),
    (error: unknown) => error instanceof Error && /filename/i.test(error.message)
  );
});

test("createDigitalAsset refuses an empty bucket", async () => {
  const { db } = createMockCatalogDb();
  const service = createCatalogService(db);

  await assert.rejects(
    () =>
      service.createDigitalAsset({
        provider: "SUPABASE",
        bucket: "   ",
        path: "ebooks/guide.pdf",
        filename: "guide.pdf",
        status: "DRAFT",
      }),
    (error: unknown) => error instanceof Error && /bucket/i.test(error.message)
  );
});

test("createDigitalAsset refuses an empty path", async () => {
  const { db } = createMockCatalogDb();
  const service = createCatalogService(db);

  await assert.rejects(
    () =>
      service.createDigitalAsset({
        provider: "SUPABASE",
        bucket: "ebooks-private",
        path: "   ",
        filename: "guide.pdf",
        status: "DRAFT",
      }),
    (error: unknown) => error instanceof Error && /path/i.test(error.message)
  );
});

test("createDigitalAsset refuses a duplicate bucket/path", async () => {
  const existingAsset = createAssetRecord({
    id: "asset_existing",
    bucket: "ebooks-private",
    path: "ebooks/guide.pdf",
  });
  const { db } = createMockCatalogDb({
    assets: [existingAsset],
  });
  const service = createCatalogService(db);

  await assert.rejects(
    () =>
      service.createDigitalAsset({
        provider: "SUPABASE",
        bucket: "ebooks-private",
        path: "ebooks/guide.pdf",
        filename: "guide-v2.pdf",
        status: "DRAFT",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("updateDigitalAsset modifies filename bucket path and status", async () => {
  const asset = createAssetRecord({
    id: "asset_edit",
    filename: "old.pdf",
    bucket: "ebooks-private",
    path: "ebooks/old.pdf",
    status: "DRAFT",
  });
  const { db, state } = createMockCatalogDb({
    assets: [asset],
  });
  const service = createCatalogService(db);

  const updated = await service.updateDigitalAsset(asset.id, {
    provider: "SUPABASE",
    filename: " new.pdf ",
    bucket: " new-bucket ",
    path: " ebooks/new.pdf ",
    status: "ACTIVE",
  });

  assert.equal(updated.filename, "new.pdf");
  assert.equal(updated.bucket, "new-bucket");
  assert.equal(updated.path, "ebooks/new.pdf");
  assert.equal(updated.status, "ACTIVE");
  assert.equal(state.updatedAssets.length, 1);
});

test("setDigitalAssetStatus activates an asset", async () => {
  const asset = createAssetRecord({
    id: "asset_activate",
    status: "DRAFT",
  });
  const { db, state } = createMockCatalogDb({
    assets: [asset],
  });
  const service = createCatalogService(db);

  const updated = await service.setDigitalAssetStatus(asset.id, "ACTIVE");

  assert.equal(updated.status, "ACTIVE");
  assert.equal(state.assets[0]?.status, "ACTIVE");
});

test("setDigitalAssetStatus archives an asset", async () => {
  const asset = createAssetRecord({
    id: "asset_archive",
    status: "ACTIVE",
  });
  const { db, state } = createMockCatalogDb({
    assets: [asset],
  });
  const service = createCatalogService(db);

  const updated = await service.setDigitalAssetStatus(asset.id, "ARCHIVED");

  assert.equal(updated.status, "ARCHIVED");
  assert.equal(state.assets[0]?.status, "ARCHIVED");
});

test("linkAssetToProduct links an asset to a product", async () => {
  const product = createProductRecord({ id: "prod_link" });
  const asset = createAssetRecord({ id: "asset_link" });
  const { db, state } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
    assets: [asset],
  });
  const service = createCatalogService(db);

  const updatedProduct = await service.linkAssetToProduct(product.id, asset.id);

  assert.equal(updatedProduct.assets.length, 1);
  assert.equal(updatedProduct.assets[0]?.assetId, asset.id);
  assert.equal(state.productAssets.length, 1);
});

test("linkAssetToProduct does not create duplicate links", async () => {
  const product = createProductRecord({ id: "prod_link_once" });
  const asset = createAssetRecord({ id: "asset_link_once" });
  const existingLink = createProductAssetRecord({
    productId: product.id,
    assetId: asset.id,
    asset,
  });
  const { db, state } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
    assets: [asset],
    productAssets: [existingLink],
  });
  const service = createCatalogService(db);

  await service.linkAssetToProduct(product.id, asset.id);

  assert.equal(state.productAssets.length, 1);
});

test("unlinkAssetFromProduct removes only the product link", async () => {
  const product = createProductRecord({ id: "prod_unlink" });
  const asset = createAssetRecord({ id: "asset_unlink" });
  const existingLink = createProductAssetRecord({
    productId: product.id,
    assetId: asset.id,
    asset,
  });
  const { db, state } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
    assets: [asset],
    productAssets: [existingLink],
  });
  const service = createCatalogService(db);

  const updatedProduct = await service.unlinkAssetFromProduct(product.id, asset.id);

  assert.equal(updatedProduct.assets.length, 0);
  assert.equal(state.productAssets.length, 0);
  assert.equal(state.assets.length, 1);
});

test("linkAssetToProduct refuses an unknown product", async () => {
  const asset = createAssetRecord({ id: "asset_only" });
  const { db } = createMockCatalogDb({
    assets: [asset],
  });
  const service = createCatalogService(db);

  await assert.rejects(
    () => service.linkAssetToProduct("missing", asset.id),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("linkAssetToProduct refuses an unknown asset", async () => {
  const product = createProductRecord({ id: "prod_only" });
  const { db } = createMockCatalogDb({
    products: [product],
  });
  const service = createCatalogService(db);

  await assert.rejects(
    () => service.linkAssetToProduct(product.id, "missing"),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("ebook without an active asset stays non-activable", async () => {
  const product = createProductRecord({
    id: "prod_ebook_no_active_asset",
    status: "DRAFT",
    productType: "EBOOK",
  });
  const asset = createAssetRecord({
    id: "asset_draft_for_ebook",
    status: "DRAFT",
  });
  const { db } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ACTIVE" })],
    assets: [asset],
    productAssets: [
      createProductAssetRecord({
        productId: product.id,
        assetId: asset.id,
        asset,
      }),
    ],
  });
  const service = createCatalogService(db);

  const activation = await service.canActivateProduct(product.id);

  assert.equal(activation.ok, false);
  assert.match(activation.reasons.join(" "), /asset actif/i);
});

test("ebook with an active asset becomes activable when it has one active price", async () => {
  const product = createProductRecord({
    id: "prod_ebook_active_asset",
    status: "DRAFT",
    productType: "EBOOK",
  });
  const asset = createAssetRecord({
    id: "asset_active_for_ebook",
    status: "ACTIVE",
  });
  const { db } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ACTIVE" })],
    assets: [asset],
    productAssets: [
      createProductAssetRecord({
        productId: product.id,
        assetId: asset.id,
        asset,
      }),
    ],
  });
  const service = createCatalogService(db);

  const activation = await service.canActivateProduct(product.id);

  assert.equal(activation.ok, true);
  assert.deepEqual(activation.reasons, []);
});

test("digital download stays activable without any asset", async () => {
  const product = createProductRecord({
    id: "prod_download_no_asset",
    status: "DRAFT",
    productType: "DIGITAL_DOWNLOAD",
  });
  const { db } = createMockCatalogDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ACTIVE" })],
  });
  const service = createCatalogService(db);

  const activation = await service.canActivateProduct(product.id);

  assert.equal(activation.ok, true);
  assert.deepEqual(activation.reasons, []);
});

test("asset operations do not modify existing order items", async () => {
  const product = createProductRecord({ id: "prod_snapshot" });
  const orderItem = createOrderItemRecord({
    productId: product.id,
    unitAmountCents: 2900,
    lineTotalCents: 2900,
  });
  const asset = createAssetRecord({ id: "asset_snapshot" });
  const { db, state } = createMockCatalogDb({
    products: [product],
    assets: [asset],
    orderItems: [orderItem],
  });
  const service = createCatalogService(db);

  await service.linkAssetToProduct(product.id, asset.id);
  await service.unlinkAssetFromProduct(product.id, asset.id);

  assert.equal(state.orderItems[0]?.unitAmountCents, 2900);
  assert.equal(state.orderItems[0]?.lineTotalCents, 2900);
});

test("dashboard asset listing never returns signed URLs", async () => {
  const asset = createAssetRecord({
    id: "asset_dashboard_listing",
  });
  const { db } = createMockCatalogDb({
    assets: [asset],
  });
  const service = createCatalogService(db);

  const assets = await service.listDashboardAssets();

  assert.equal("signedUrl" in assets[0]!, false);
});

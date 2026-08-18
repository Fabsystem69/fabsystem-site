import { z } from "zod";
import type {
  BundleItem,
  DigitalAsset,
  DigitalAssetProvider,
  DigitalAssetStatus,
  PrismaClient,
  Product,
  ProductAsset,
  ProductPrice,
  ProductStatus,
  ProductType,
  PurchaseMode,
} from "@/lib/generated/prisma/client";
import { badRequest, conflict, notFound } from "@/lib/http-errors";

const productStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);
const productTypeSchema = z.enum(["EBOOK", "DIGITAL_DOWNLOAD", "BUNDLE", "SCHEMA_UNLOCK", "COACHING_30MIN"]);
const purchaseModeSchema = z.enum(["BUY_NOW", "REQUEST_ONLY"]);
const digitalAssetStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);
const digitalAssetProviderSchema = z.enum(["SUPABASE"]);
const optionalTrimmedString = z.string().trim().optional().nullable().or(z.literal(""));

// Identifiants techniques (slug, bucket, storage path) : jamais d'accent, jamais
// d'espace. Ils circulent dans des URLs, des clés de stockage Supabase et des
// chemins de fichiers, contrairement aux titres/noms affichés qui peuvent garder
// leurs accents. Un slug/bucket est un seul segment ("mon-produit"), un storage
// path autorise des segments séparés par "/" (ex. "ebooks/mon-produit/v1/f.pdf").
const SEGMENT_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const STORAGE_PATH_PATTERN = /^[a-z0-9]+([-_./][a-z0-9]+)*$/;

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(
    SEGMENT_PATTERN,
    "Le slug ne doit contenir que des minuscules, des chiffres et des tirets, sans accent ni espace."
  );

const bucketSchema = z
  .string()
  .trim()
  .min(1)
  .regex(
    SEGMENT_PATTERN,
    "Le bucket ne doit contenir que des minuscules, des chiffres et des tirets, sans accent ni espace."
  );

const storagePathSchema = z
  .string()
  .trim()
  .min(1)
  .regex(
    STORAGE_PATH_PATTERN,
    "Le storage path ne doit contenir que des minuscules, des chiffres et les séparateurs - _ . /, sans accent ni espace."
  );

export const createDigitalProductInputSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1),
  shortDescription: optionalTrimmedString,
  description: optionalTrimmedString,
  featuredImage: optionalTrimmedString,
  status: productStatusSchema.default("DRAFT"),
  productType: productTypeSchema,
  purchaseMode: purchaseModeSchema.default("BUY_NOW"),
  currency: z.string().trim().min(3).max(3).default("EUR"),
  unitAmountCents: z.coerce.number().int().min(0),
  compareAtAmountCents: z.coerce.number().int().min(0).optional().nullable(),
  assetId: z.string().trim().min(1).optional(),
  assetSortOrder: z.coerce.number().int().min(0).default(0),
});

// z.input (pas z.infer/z.output) : les champs avec .default() doivent rester
// optionnels pour l'appelant, puisque createDigitalProduct() les remplit via
// .parse() au runtime.
export type CreateDigitalProductInput = z.input<typeof createDigitalProductInputSchema>;

type ProductAssetWithAsset = ProductAsset & {
  asset: DigitalAsset;
};

type PrismaClientLike = PrismaClient;

export type CatalogProductSummary = Product & {
  prices: ProductPrice[];
  assets: ProductAssetWithAsset[];
  bundleItems: BundleItem[];
};

export type CatalogProductWithAssets = Product & {
  assets: ProductAssetWithAsset[];
};

export type ProductActivationCheck = {
  ok: boolean;
  reasons: string[];
};

export type DashboardAssetSummary = DigitalAsset & {
  products: Array<{
    productId: string;
    sortOrder: number;
    product: Pick<Product, "id" | "slug" | "name" | "productType" | "status">;
  }>;
};

const productPriceInputSchema = z.object({
  amountEuros: z.coerce.number().positive(),
  currency: z.literal("EUR").default("EUR"),
});

const productDetailsInputSchema = z.object({
  name: z.string().trim().min(1),
  slug: slugSchema,
  shortDescription: optionalTrimmedString,
  description: optionalTrimmedString,
  featuredImage: optionalTrimmedString,
  productType: productTypeSchema,
  purchaseMode: purchaseModeSchema,
  status: productStatusSchema.default("DRAFT"),
});

const digitalAssetInputSchema = z.object({
  provider: digitalAssetProviderSchema.default("SUPABASE"),
  bucket: bucketSchema,
  path: storagePathSchema,
  // filename reste un libellé affiché (ex. "Câbler son van.pdf") : les accents
  // y sont autorisés, contrairement au bucket/path techniques ci-dessus.
  filename: z.string().trim().min(1),
  status: digitalAssetStatusSchema.default("DRAFT"),
});

export type CreateProductWithPriceInput = z.infer<typeof productDetailsInputSchema> &
  z.infer<typeof productPriceInputSchema>;

export type UpdateProductDetailsInput = z.infer<typeof productDetailsInputSchema>;
export type UpdateActiveProductPriceInput = z.infer<typeof productPriceInputSchema>;
export type CreateDigitalAssetInput = z.infer<typeof digitalAssetInputSchema>;
export type UpdateDigitalAssetInput = z.infer<typeof digitalAssetInputSchema>;

type CatalogProductCreateData = {
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  status: ProductStatus;
  productType: ProductType;
  purchaseMode: PurchaseMode;
  featuredImage: string | null;
};

type CatalogPriceCreateData = {
  productId: string;
  currency: string;
  unitAmountCents: number;
  compareAtAmountCents: number | null;
  status: "ACTIVE" | "ARCHIVED";
};

type CatalogAssetCreateData = {
  provider: DigitalAssetProvider;
  bucket: string;
  path: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  version: string | null;
  status: DigitalAssetStatus;
};

type ProductLookup = {
  id?: string;
  slug?: string;
};

type ProductListFilters = {
  status?: ProductStatus;
  purchaseMode?: PurchaseMode;
  excludeProductTypes?: ProductType[];
};

type CatalogQueryOptions = {
  activePricesOnly?: boolean;
  includeAssets?: boolean;
  includeBundleItems?: boolean;
};

export type CatalogDb = {
  listProducts(filters: ProductListFilters, options?: CatalogQueryOptions): Promise<CatalogProductSummary[]>;
  findProduct(where: ProductLookup, options?: CatalogQueryOptions): Promise<CatalogProductSummary | null>;
  findProductWithAssets(id: string): Promise<CatalogProductWithAssets | null>;
  countOrderItemsByProductId(productId: string): Promise<number>;
  findPricesByProductId(
    productId: string,
    status?: "ACTIVE" | "ARCHIVED"
  ): Promise<ProductPrice[]>;
  findDigitalAssetById(id: string): Promise<Pick<DigitalAsset, "id" | "status"> | null>;
  listAssets(): Promise<DashboardAssetSummary[]>;
  findAssetById(id: string): Promise<DashboardAssetSummary | null>;
  findAssetByBucketPath(input: { bucket: string; path: string }): Promise<DashboardAssetSummary | null>;
  createProduct(data: CatalogProductCreateData): Promise<Product>;
  createProductPrice(data: CatalogPriceCreateData): Promise<ProductPrice>;
  createDigitalAsset(data: CatalogAssetCreateData): Promise<DigitalAsset>;
  createProductAsset(data: {
    productId: string;
    assetId: string;
    sortOrder: number;
  }): Promise<ProductAsset>;
  updateProduct(
    productId: string,
    data: Partial<CatalogProductCreateData> & { slug?: string; name?: string }
  ): Promise<Product>;
  findProductPriceById(priceId: string): Promise<ProductPrice | null>;
  updateProductPrice(
    priceId: string,
    data: Partial<Pick<ProductPrice, "status">>
  ): Promise<ProductPrice>;
  updateDigitalAsset(
    assetId: string,
    data: Partial<CatalogAssetCreateData>
  ): Promise<DigitalAsset>;
  updateDigitalAssetStatus(assetId: string, status: DigitalAssetStatus): Promise<DigitalAsset>;
  updateProductStatus(productId: string, status: ProductStatus): Promise<Product>;
  findProductAsset(input: { productId: string; assetId: string }): Promise<ProductAsset | null>;
  deleteProductAsset(input: { productId: string; assetId: string }): Promise<ProductAsset>;
  transaction<T>(callback: (db: CatalogDb) => Promise<T>): Promise<T>;
};

function normalizeNullableString(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeCurrency(value: string) {
  return value.trim().toUpperCase();
}

function normalizeAssetField(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw badRequest(`${label} is required`);
  }

  return normalized;
}

function inferAssetContentType(filename: string) {
  const normalized = filename.trim().toLowerCase();

  if (normalized.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (normalized.endsWith(".zip")) {
    return "application/zip";
  }

  return "application/octet-stream";
}

export function normalizeProductSlug(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function eurosToCents(value: number) {
  return Math.round(value * 100);
}

function assertNonEmptyId(value: string, label: string) {
  if (!value.trim()) {
    throw badRequest(`${label} is required`);
  }
}

function assertProductExists(product: CatalogProductSummary | null) {
  if (!product) {
    throw notFound("Product not found");
  }

  return product;
}

function getProductActivationReasons(product: CatalogProductSummary) {
  const reasons: string[] = [];
  const activePrices = product.prices.filter((price) => price.status === "ACTIVE");

  if (activePrices.length === 0) {
    reasons.push("Le produit doit avoir un prix actif.");
  }

  if (activePrices.length > 1) {
    reasons.push("Le produit ne peut pas avoir plusieurs prix actifs.");
  }

  if (product.productType === "EBOOK") {
    const hasActiveAsset = product.assets.some((productAsset) => productAsset.asset.status === "ACTIVE");

    if (!hasActiveAsset) {
      reasons.push("Un ebook doit avoir au moins un asset actif.");
    }
  }

  return reasons;
}

function buildProductInclude(options?: CatalogQueryOptions) {
  return {
    prices: {
      where: options?.activePricesOnly ? { status: "ACTIVE" as const } : undefined,
      orderBy: { createdAt: "desc" as const },
    },
    assets: options?.includeAssets
      ? {
          include: { asset: true },
          orderBy: { sortOrder: "asc" as const },
        }
      : false,
    bundleItems: options?.includeBundleItems
      ? {
          orderBy: { sortOrder: "asc" as const },
        }
      : false,
  };
}

function createPrismaCatalogDb(client: PrismaClientLike): CatalogDb {
  const buildScopedDb = (currentClient: PrismaClientLike): CatalogDb => ({
    async listProducts(filters, options) {
      return currentClient.product.findMany({
        where: {
          status: filters.status,
          purchaseMode: filters.purchaseMode,
          productType: filters.excludeProductTypes
            ? { notIn: filters.excludeProductTypes }
            : undefined,
        },
        include: buildProductInclude(options),
        orderBy: { createdAt: "desc" },
      }) as Promise<CatalogProductSummary[]>;
    },
    async findProduct(where, options) {
      return currentClient.product.findFirst({
        where,
        include: buildProductInclude(options),
      }) as Promise<CatalogProductSummary | null>;
    },
    async findProductWithAssets(id) {
      return currentClient.product.findUnique({
        where: { id },
        include: {
          assets: {
            include: { asset: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      }) as Promise<CatalogProductWithAssets | null>;
    },
    async countOrderItemsByProductId(productId) {
      return currentClient.orderItem.count({
        where: { productId },
      });
    },
    async findPricesByProductId(productId, status) {
      return currentClient.productPrice.findMany({
        where: {
          productId,
          status,
        },
        orderBy: { createdAt: "desc" },
      });
    },
    async findDigitalAssetById(id) {
      return currentClient.digitalAsset.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
        },
      });
    },
    async listAssets() {
      return currentClient.digitalAsset.findMany({
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  productType: true,
                  status: true,
                },
              },
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: { createdAt: "desc" },
      }) as Promise<DashboardAssetSummary[]>;
    },
    async findAssetById(id) {
      return currentClient.digitalAsset.findUnique({
        where: { id },
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  productType: true,
                  status: true,
                },
              },
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      }) as Promise<DashboardAssetSummary | null>;
    },
    async findAssetByBucketPath(input) {
      return currentClient.digitalAsset.findUnique({
        where: {
          bucket_path: {
            bucket: input.bucket,
            path: input.path,
          },
        },
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  productType: true,
                  status: true,
                },
              },
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      }) as Promise<DashboardAssetSummary | null>;
    },
    async createProduct(data) {
      return currentClient.product.create({
        data,
      });
    },
    async createProductPrice(data) {
      return currentClient.productPrice.create({
        data,
      });
    },
    async createDigitalAsset(data) {
      return currentClient.digitalAsset.create({
        data,
      });
    },
    async createProductAsset(data) {
      return currentClient.productAsset.create({
        data,
      });
    },
    async updateProduct(productId, data) {
      return currentClient.product.update({
        where: { id: productId },
        data,
      });
    },
    async findProductPriceById(priceId) {
      return currentClient.productPrice.findUnique({
        where: { id: priceId },
      });
    },
    async updateProductPrice(priceId, data) {
      return currentClient.productPrice.update({
        where: { id: priceId },
        data,
      });
    },
    async updateDigitalAsset(assetId, data) {
      return currentClient.digitalAsset.update({
        where: { id: assetId },
        data,
      });
    },
    async updateDigitalAssetStatus(assetId, status) {
      return currentClient.digitalAsset.update({
        where: { id: assetId },
        data: { status },
      });
    },
    async updateProductStatus(productId, status) {
      return currentClient.product.update({
        where: { id: productId },
        data: { status },
      });
    },
    async findProductAsset(input) {
      return currentClient.productAsset.findUnique({
        where: {
          productId_assetId: {
            productId: input.productId,
            assetId: input.assetId,
          },
        },
      });
    },
    async deleteProductAsset(input) {
      return currentClient.productAsset.delete({
        where: {
          productId_assetId: {
            productId: input.productId,
            assetId: input.assetId,
          },
        },
      });
    },
    async transaction<T>(callback: (db: CatalogDb) => Promise<T>) {
      return currentClient.$transaction(async (tx) => {
        const transactionDb = createPrismaCatalogDb(tx as PrismaClientLike);
        return callback(transactionDb);
      });
    },
  });

  return buildScopedDb(client);
}

async function getDefaultCatalogService() {
  const { prisma } = await import("@/lib/prisma");
  return createCatalogService(createPrismaCatalogDb(prisma));
}

export function createCatalogService(db: CatalogDb) {
  return {
    async listDashboardAssets() {
      return db.listAssets();
    },

    async listCatalogProductsForAdmin() {
      return db.listProducts(
        {},
        {
          activePricesOnly: false,
          includeAssets: true,
          includeBundleItems: true,
        }
      );
    },

    async listDashboardProducts() {
      return db.listProducts(
        {},
        {
          activePricesOnly: false,
          includeAssets: true,
          includeBundleItems: true,
        }
      );
    },

    async listActiveBuyNowProducts() {
      // v2.1 : SCHEMA_UNLOCK et COACHING_30MIN ne sont jamais parcourus/
      // achetes via la boutique generique — ils se vendent uniquement depuis
      // l'editeur (voir Order.projectId pour SCHEMA_UNLOCK, coaching-checkout.ts
      // pour COACHING_30MIN).
      return db.listProducts(
        {
          status: "ACTIVE",
          purchaseMode: "BUY_NOW",
          excludeProductTypes: ["SCHEMA_UNLOCK", "COACHING_30MIN"],
        },
        {
          activePricesOnly: true,
          includeAssets: true,
          includeBundleItems: true,
        }
      );
    },

    async getProductBySlug(slug: string) {
      const normalizedSlug = slug.trim();
      if (!normalizedSlug) {
        throw badRequest("Product slug is required");
      }

      const product = await db.findProduct(
        { slug: normalizedSlug },
        {
          activePricesOnly: true,
          includeAssets: true,
          includeBundleItems: true,
        }
      );

      if (!product) {
        throw notFound("Product not found");
      }

      return product;
    },

    async getProductWithAssets(productId: string) {
      assertNonEmptyId(productId, "Product ID");

      const product = await db.findProductWithAssets(productId.trim());

      if (!product) {
        throw notFound("Product not found");
      }

      return product;
    },

    async getActivePriceForProduct(productId: string) {
      assertNonEmptyId(productId, "Product ID");

      const prices = await db.findPricesByProductId(productId.trim(), "ACTIVE");

      if (prices.length === 0) {
        throw notFound("Active price not found for product");
      }

      if (prices.length > 1) {
        throw conflict("Multiple active prices found for product");
      }

      return prices[0];
    },

    async getDashboardProductForEdit(productId: string) {
      assertNonEmptyId(productId, "Product ID");

      const product = assertProductExists(
        await db.findProduct(
          { id: productId.trim() },
          {
            activePricesOnly: false,
            includeAssets: true,
            includeBundleItems: true,
          }
        )
      );

      return product;
    },

    async getDashboardAssetForEdit(assetId: string) {
      assertNonEmptyId(assetId, "Asset ID");

      const asset = await db.findAssetById(assetId.trim());

      if (!asset) {
        throw notFound("Digital asset not found");
      }

      return asset;
    },

    async createDigitalProduct(input: CreateDigitalProductInput) {
      const parsed = createDigitalProductInputSchema.parse(input);

      if (parsed.purchaseMode === "BUY_NOW" && parsed.unitAmountCents < 0) {
        throw badRequest("Product price must be a non-negative integer amount in cents");
      }

      return db.transaction(async (tx) => {
        if (parsed.assetId) {
          const asset = await tx.findDigitalAssetById(parsed.assetId);

          if (!asset) {
            throw notFound("Digital asset not found");
          }
        }

        const product = await tx.createProduct({
          slug: parsed.slug.trim(),
          name: parsed.name.trim(),
          shortDescription: normalizeNullableString(parsed.shortDescription),
          description: normalizeNullableString(parsed.description),
          status: parsed.status,
          productType: parsed.productType,
          purchaseMode: parsed.purchaseMode,
          featuredImage: normalizeNullableString(parsed.featuredImage),
        });

        await tx.createProductPrice({
          productId: product.id,
          currency: normalizeCurrency(parsed.currency),
          unitAmountCents: parsed.unitAmountCents,
          compareAtAmountCents: parsed.compareAtAmountCents ?? null,
          status: "ACTIVE",
        });

        if (parsed.assetId) {
          await tx.createProductAsset({
            productId: product.id,
            assetId: parsed.assetId,
            sortOrder: parsed.assetSortOrder,
          });
        }

        const created = await tx.findProduct(
          { id: product.id },
          {
            activePricesOnly: true,
            includeAssets: true,
            includeBundleItems: true,
          }
        );

        if (!created) {
          throw notFound("Created product could not be reloaded");
        }

        return created;
      });
    },

    async createProductWithPrice(input: CreateProductWithPriceInput) {
      const details = productDetailsInputSchema.parse(input);
      const price = productPriceInputSchema.parse(input);
      const normalizedSlug = normalizeProductSlug(details.slug);

      if (!normalizedSlug) {
        throw badRequest("Product slug is required");
      }

      return db.transaction(async (tx) => {
        const existing = await tx.findProduct({ slug: normalizedSlug });

        if (existing) {
          throw conflict("Product slug already exists");
        }

        const product = await tx.createProduct({
          slug: normalizedSlug,
          name: details.name.trim(),
          shortDescription: normalizeNullableString(details.shortDescription),
          description: normalizeNullableString(details.description),
          status: "DRAFT",
          productType: details.productType,
          purchaseMode: details.purchaseMode,
          featuredImage: normalizeNullableString(details.featuredImage),
        });

        await tx.createProductPrice({
          productId: product.id,
          currency: "EUR",
          unitAmountCents: eurosToCents(price.amountEuros),
          compareAtAmountCents: null,
          status: "ACTIVE",
        });

        const created = await tx.findProduct(
          { id: product.id },
          {
            activePricesOnly: false,
            includeAssets: true,
            includeBundleItems: true,
          }
        );

        return assertProductExists(created);
      });
    },

    async updateProductDetails(productId: string, input: UpdateProductDetailsInput) {
      assertNonEmptyId(productId, "Product ID");
      const parsed = productDetailsInputSchema.parse(input);
      const normalizedProductId = productId.trim();
      const normalizedSlug = normalizeProductSlug(parsed.slug);

      if (!normalizedSlug) {
        throw badRequest("Product slug is required");
      }

      return db.transaction(async (tx) => {
        const existing = assertProductExists(
          await tx.findProduct(
            { id: normalizedProductId },
            {
              activePricesOnly: false,
              includeAssets: true,
              includeBundleItems: true,
            }
          )
        );

        const conflicting = await tx.findProduct({ slug: normalizedSlug });

        if (conflicting && conflicting.id !== existing.id) {
          throw conflict("Product slug already exists");
        }

        const nextStatus = parsed.status === "ACTIVE" ? "DRAFT" : parsed.status;

        await tx.updateProduct(existing.id, {
          name: parsed.name.trim(),
          slug: normalizedSlug,
          shortDescription: normalizeNullableString(parsed.shortDescription),
          description: normalizeNullableString(parsed.description),
          productType: parsed.productType,
          purchaseMode: parsed.purchaseMode,
          featuredImage: normalizeNullableString(parsed.featuredImage),
          status: nextStatus,
        });

        if (parsed.status === "ACTIVE") {
          const reloaded = assertProductExists(
            await tx.findProduct(
              { id: existing.id },
              {
                activePricesOnly: false,
                includeAssets: true,
                includeBundleItems: true,
              }
            )
          );

          const reasons = getProductActivationReasons(reloaded);

          if (reasons.length > 0) {
            throw conflict(reasons.join(" "));
          }

          return tx.updateProductStatus(existing.id, "ACTIVE");
        }

        return tx.updateProduct(existing.id, {
          status: nextStatus,
        });
      });
    },

    async updateActiveProductPrice(productId: string, input: UpdateActiveProductPriceInput) {
      assertNonEmptyId(productId, "Product ID");
      const parsed = productPriceInputSchema.parse(input);
      const normalizedProductId = productId.trim();

      return db.transaction(async (tx) => {
        const product = assertProductExists(
          await tx.findProduct(
            { id: normalizedProductId },
            {
              activePricesOnly: false,
              includeAssets: true,
              includeBundleItems: true,
            }
          )
        );

        const activePrices = product.prices.filter((price) => price.status === "ACTIVE");

        if (activePrices.length > 1) {
          throw conflict("Multiple active prices found for product");
        }

        const nextAmountCents = eurosToCents(parsed.amountEuros);

        if (activePrices.length === 1) {
          const currentPrice = activePrices[0];

          if (
            currentPrice.unitAmountCents === nextAmountCents &&
            normalizeCurrency(currentPrice.currency) === "EUR"
          ) {
            return currentPrice;
          }

          await tx.updateProductPrice(currentPrice.id, {
            status: "ARCHIVED",
          });
        }

        return tx.createProductPrice({
          productId: product.id,
          currency: "EUR",
          unitAmountCents: nextAmountCents,
          compareAtAmountCents: null,
          status: "ACTIVE",
        });
      });
    },

    async createDigitalAsset(input: CreateDigitalAssetInput) {
      const parsed = digitalAssetInputSchema.parse(input);
      const bucket = normalizeAssetField(parsed.bucket, "Bucket");
      const path = normalizeAssetField(parsed.path, "Path");
      const filename = normalizeAssetField(parsed.filename, "Filename");

      return db.transaction(async (tx) => {
        const existing = await tx.findAssetByBucketPath({ bucket, path });

        if (existing) {
          throw conflict("Digital asset bucket/path already exists");
        }

        return tx.createDigitalAsset({
          provider: parsed.provider,
          bucket,
          path,
          filename,
          contentType: inferAssetContentType(filename),
          sizeBytes: 0,
          version: null,
          status: parsed.status,
        });
      });
    },

    async updateDigitalAsset(assetId: string, input: UpdateDigitalAssetInput) {
      assertNonEmptyId(assetId, "Asset ID");
      const parsed = digitalAssetInputSchema.parse(input);
      const normalizedAssetId = assetId.trim();
      const bucket = normalizeAssetField(parsed.bucket, "Bucket");
      const path = normalizeAssetField(parsed.path, "Path");
      const filename = normalizeAssetField(parsed.filename, "Filename");

      return db.transaction(async (tx) => {
        const existing = await tx.findAssetById(normalizedAssetId);

        if (!existing) {
          throw notFound("Digital asset not found");
        }

        const conflicting = await tx.findAssetByBucketPath({ bucket, path });

        if (conflicting && conflicting.id !== existing.id) {
          throw conflict("Digital asset bucket/path already exists");
        }

        return tx.updateDigitalAsset(existing.id, {
          provider: parsed.provider,
          bucket,
          path,
          filename,
          contentType: inferAssetContentType(filename),
          status: parsed.status,
        });
      });
    },

    async setDigitalAssetStatus(assetId: string, status: DigitalAssetStatus) {
      assertNonEmptyId(assetId, "Asset ID");
      const parsedStatus = digitalAssetStatusSchema.parse(status);
      const normalizedAssetId = assetId.trim();

      const existing = await db.findAssetById(normalizedAssetId);

      if (!existing) {
        throw notFound("Digital asset not found");
      }

      return db.updateDigitalAssetStatus(existing.id, parsedStatus);
    },

    async linkAssetToProduct(productId: string, assetId: string) {
      assertNonEmptyId(productId, "Product ID");
      assertNonEmptyId(assetId, "Asset ID");
      const normalizedProductId = productId.trim();
      const normalizedAssetId = assetId.trim();

      return db.transaction(async (tx) => {
        const product = await tx.findProduct(
          { id: normalizedProductId },
          { activePricesOnly: false, includeAssets: true, includeBundleItems: false }
        );

        if (!product) {
          throw notFound("Product not found");
        }

        const asset = await tx.findAssetById(normalizedAssetId);

        if (!asset) {
          throw notFound("Digital asset not found");
        }

        const existingLink = await tx.findProductAsset({
          productId: product.id,
          assetId: asset.id,
        });

        if (!existingLink) {
          const maxSortOrder = product.assets.reduce(
            (currentMax, productAsset) => Math.max(currentMax, productAsset.sortOrder),
            -1
          );

          await tx.createProductAsset({
            productId: product.id,
            assetId: asset.id,
            sortOrder: maxSortOrder + 1,
          });
        }

        return assertProductExists(
          await tx.findProduct(
            { id: product.id },
            {
              activePricesOnly: false,
              includeAssets: true,
              includeBundleItems: true,
            }
          )
        );
      });
    },

    async unlinkAssetFromProduct(productId: string, assetId: string) {
      assertNonEmptyId(productId, "Product ID");
      assertNonEmptyId(assetId, "Asset ID");
      const normalizedProductId = productId.trim();
      const normalizedAssetId = assetId.trim();

      return db.transaction(async (tx) => {
        const product = await tx.findProduct({ id: normalizedProductId });

        if (!product) {
          throw notFound("Product not found");
        }

        const asset = await tx.findAssetById(normalizedAssetId);

        if (!asset) {
          throw notFound("Digital asset not found");
        }

        const existingLink = await tx.findProductAsset({
          productId: product.id,
          assetId: asset.id,
        });

        if (existingLink) {
          await tx.deleteProductAsset({
            productId: product.id,
            assetId: asset.id,
          });
        }

        return assertProductExists(
          await tx.findProduct(
            { id: product.id },
            {
              activePricesOnly: false,
              includeAssets: true,
              includeBundleItems: true,
            }
          )
        );
      });
    },

    async listAvailableAssetsForProduct(productId: string) {
      assertNonEmptyId(productId, "Product ID");
      const normalizedProductId = productId.trim();
      const product = await db.findProduct(
        { id: normalizedProductId },
        {
          activePricesOnly: false,
          includeAssets: true,
          includeBundleItems: false,
        }
      );

      if (!product) {
        throw notFound("Product not found");
      }

      const linkedAssetIds = new Set(product.assets.map((productAsset) => productAsset.assetId));
      const assets = await db.listAssets();

      return assets.filter((asset) => !linkedAssetIds.has(asset.id));
    },

    async archiveProduct(productId: string) {
      assertNonEmptyId(productId, "Product ID");

      const normalizedProductId = productId.trim();
      const existing = assertProductExists(await db.findProduct({ id: normalizedProductId }));

      return db.updateProductStatus(existing.id, "ARCHIVED");
    },

    async canActivateProduct(productId: string): Promise<ProductActivationCheck> {
      assertNonEmptyId(productId, "Product ID");

      const normalizedProductId = productId.trim();
      const product = assertProductExists(
        await db.findProduct(
          { id: normalizedProductId },
          {
            activePricesOnly: false,
            includeAssets: true,
            includeBundleItems: true,
          }
        )
      );

      const reasons = getProductActivationReasons(product);

      return {
        ok: reasons.length === 0,
        reasons,
      };
    },

    async activateProduct(productId: string) {
      assertNonEmptyId(productId, "Product ID");

      const normalizedProductId = productId.trim();
      const product = assertProductExists(
        await db.findProduct(
          { id: normalizedProductId },
          {
            activePricesOnly: false,
            includeAssets: true,
            includeBundleItems: true,
          }
        )
      );

      const activationCheck = await this.canActivateProduct(product.id);

      if (!activationCheck.ok) {
        throw conflict(activationCheck.reasons.join(" "));
      }

      return db.updateProductStatus(product.id, "ACTIVE");
    },

    async draftProduct(productId: string) {
      assertNonEmptyId(productId, "Product ID");

      const normalizedProductId = productId.trim();
      const product = assertProductExists(await db.findProduct({ id: normalizedProductId }));

      return db.updateProductStatus(product.id, "DRAFT");
    },

    async setProductStatus(productId: string, status: ProductStatus) {
      const parsedStatus = productStatusSchema.parse(status);

      if (parsedStatus === "ACTIVE") {
        return this.activateProduct(productId);
      }

      if (parsedStatus === "ARCHIVED") {
        return this.archiveProduct(productId);
      }

      return this.draftProduct(productId);
    },
  };
}

export async function listActiveBuyNowProducts() {
  const service = await getDefaultCatalogService();
  return service.listActiveBuyNowProducts();
}

export async function listCatalogProductsForAdmin() {
  const service = await getDefaultCatalogService();
  return service.listCatalogProductsForAdmin();
}

export async function listDashboardProducts() {
  const service = await getDefaultCatalogService();
  return service.listDashboardProducts();
}

export async function listDashboardAssets() {
  const service = await getDefaultCatalogService();
  return service.listDashboardAssets();
}

export async function getProductBySlug(slug: string) {
  const service = await getDefaultCatalogService();
  return service.getProductBySlug(slug);
}

export async function getProductWithAssets(productId: string) {
  const service = await getDefaultCatalogService();
  return service.getProductWithAssets(productId);
}

export async function getActivePriceForProduct(productId: string) {
  const service = await getDefaultCatalogService();
  return service.getActivePriceForProduct(productId);
}

export async function createDigitalProduct(input: CreateDigitalProductInput) {
  const service = await getDefaultCatalogService();
  return service.createDigitalProduct(input);
}

export async function createProductWithPrice(input: CreateProductWithPriceInput) {
  const service = await getDefaultCatalogService();
  return service.createProductWithPrice(input);
}

export async function getDashboardProductForEdit(productId: string) {
  const service = await getDefaultCatalogService();
  return service.getDashboardProductForEdit(productId);
}

export async function getDashboardAssetForEdit(assetId: string) {
  const service = await getDefaultCatalogService();
  return service.getDashboardAssetForEdit(assetId);
}

export async function archiveProduct(productId: string) {
  const service = await getDefaultCatalogService();
  return service.archiveProduct(productId);
}

export async function canActivateProduct(productId: string) {
  const service = await getDefaultCatalogService();
  return service.canActivateProduct(productId);
}

export async function activateProduct(productId: string) {
  const service = await getDefaultCatalogService();
  return service.activateProduct(productId);
}

export async function draftProduct(productId: string) {
  const service = await getDefaultCatalogService();
  return service.draftProduct(productId);
}

export async function setProductStatus(productId: string, status: ProductStatus) {
  const service = await getDefaultCatalogService();
  return service.setProductStatus(productId, status);
}

export async function createDigitalAsset(input: CreateDigitalAssetInput) {
  const service = await getDefaultCatalogService();
  return service.createDigitalAsset(input);
}

export async function updateDigitalAsset(assetId: string, input: UpdateDigitalAssetInput) {
  const service = await getDefaultCatalogService();
  return service.updateDigitalAsset(assetId, input);
}

export async function setDigitalAssetStatus(assetId: string, status: DigitalAssetStatus) {
  const service = await getDefaultCatalogService();
  return service.setDigitalAssetStatus(assetId, status);
}

export async function linkAssetToProduct(productId: string, assetId: string) {
  const service = await getDefaultCatalogService();
  return service.linkAssetToProduct(productId, assetId);
}

export async function unlinkAssetFromProduct(productId: string, assetId: string) {
  const service = await getDefaultCatalogService();
  return service.unlinkAssetFromProduct(productId, assetId);
}

export async function listAvailableAssetsForProduct(productId: string) {
  const service = await getDefaultCatalogService();
  return service.listAvailableAssetsForProduct(productId);
}

export async function updateProductDetails(productId: string, input: UpdateProductDetailsInput) {
  const service = await getDefaultCatalogService();
  return service.updateProductDetails(productId, input);
}

export async function updateActiveProductPrice(
  productId: string,
  input: UpdateActiveProductPriceInput
) {
  const service = await getDefaultCatalogService();
  return service.updateActiveProductPrice(productId, input);
}

export type CatalogProductStatus = ProductStatus;
export type CatalogProductType = ProductType;
export type CatalogPurchaseMode = PurchaseMode;
export type CatalogAssetStatus = DigitalAssetStatus;

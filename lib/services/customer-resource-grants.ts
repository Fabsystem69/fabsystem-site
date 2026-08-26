import type {
  Customer,
  CustomerResourceGrant,
  DigitalAsset,
  DownloadGrantStatus,
  PrismaClient,
  Product,
  ProductAsset,
} from "@/lib/generated/prisma/client";
import { badRequest, conflict, notFound } from "@/lib/http-errors";

type PrismaClientLike = PrismaClient;

type ProductWithAssets = Product & {
  assets: ProductAsset[];
};

type CustomerResourceGrantWithRelations = CustomerResourceGrant & {
  customer: Customer;
  product: Product;
  asset: DigitalAsset;
};

type CreateResourceGrantData = {
  customerId: string;
  productId: string;
  assetId: string;
  note: string | null;
  maxDownloads: number;
  expiresAt: Date | null;
};

export type CustomerResourceGrantDb = {
  findCustomerById(customerId: string): Promise<Customer | null>;
  findProductWithAssets(productId: string): Promise<ProductWithAssets | null>;
  createResourceGrant(data: CreateResourceGrantData): Promise<CustomerResourceGrant>;
  findResourceGrantById(grantId: string): Promise<CustomerResourceGrantWithRelations | null>;
  findResourceGrantsForCustomer(customerId: string): Promise<CustomerResourceGrantWithRelations[]>;
  updateResourceGrant(
    grantId: string,
    data: { status?: DownloadGrantStatus; revokedAt?: Date | null }
  ): Promise<CustomerResourceGrant>;
};

type CustomerResourceGrantServiceDeps = {
  now?: () => Date;
};

export const DEFAULT_RESOURCE_GRANT_MAX_DOWNLOADS = 20;

function assertNonEmptyId(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw badRequest(`${label} is required`);
  }

  return normalized;
}

function createPrismaCustomerResourceGrantDb(client: PrismaClientLike): CustomerResourceGrantDb {
  return {
    async findCustomerById(customerId) {
      return client.customer.findUnique({ where: { id: customerId } });
    },
    async findProductWithAssets(productId) {
      return client.product.findUnique({
        where: { id: productId },
        include: { assets: true },
      }) as Promise<ProductWithAssets | null>;
    },
    async createResourceGrant(data) {
      return client.customerResourceGrant.create({ data });
    },
    async findResourceGrantById(grantId) {
      return client.customerResourceGrant.findUnique({
        where: { id: grantId },
        include: { customer: true, product: true, asset: true },
      }) as Promise<CustomerResourceGrantWithRelations | null>;
    },
    async findResourceGrantsForCustomer(customerId) {
      return client.customerResourceGrant.findMany({
        where: { customerId },
        include: { customer: true, product: true, asset: true },
        orderBy: { createdAt: "desc" },
      }) as Promise<CustomerResourceGrantWithRelations[]>;
    },
    async updateResourceGrant(grantId, data) {
      return client.customerResourceGrant.update({ where: { id: grantId }, data });
    },
  };
}

async function getDefaultCustomerResourceGrantService() {
  const { prisma } = await import("@/lib/prisma");
  return createCustomerResourceGrantService(createPrismaCustomerResourceGrantDb(prisma));
}

export function createCustomerResourceGrantService(
  db: CustomerResourceGrantDb,
  deps?: CustomerResourceGrantServiceDeps
) {
  const now = deps?.now ?? (() => new Date());

  return {
    async grantResourceToCustomer(input: {
      customerId: string;
      productId: string;
      assetId: string;
      note?: string;
      maxDownloads?: number;
      expiresAt?: Date | null;
    }) {
      const customerId = assertNonEmptyId(input.customerId, "Customer id");
      const productId = assertNonEmptyId(input.productId, "Product id");
      const assetId = assertNonEmptyId(input.assetId, "Asset id");

      const customer = await db.findCustomerById(customerId);
      if (!customer) {
        throw notFound("Customer not found");
      }

      const product = await db.findProductWithAssets(productId);
      if (!product) {
        throw notFound("Product not found");
      }

      const belongsToProduct = product.assets.some((productAsset) => productAsset.assetId === assetId);
      if (!belongsToProduct) {
        throw conflict("Asset does not belong to this product");
      }

      const maxDownloads = input.maxDownloads ?? DEFAULT_RESOURCE_GRANT_MAX_DOWNLOADS;
      if (!Number.isInteger(maxDownloads) || maxDownloads <= 0) {
        throw badRequest("maxDownloads must be a positive integer");
      }

      const grant = await db.createResourceGrant({
        customerId,
        productId,
        assetId,
        note: input.note?.trim() || null,
        maxDownloads,
        expiresAt: input.expiresAt ?? null,
      });

      const created = await db.findResourceGrantById(grant.id);
      if (!created) {
        throw notFound("Resource grant not found after creation");
      }

      return created;
    },

    async listResourceGrantsForCustomer(customerId: string) {
      const normalizedCustomerId = assertNonEmptyId(customerId, "Customer id");
      return db.findResourceGrantsForCustomer(normalizedCustomerId);
    },

    async revokeResourceGrant(grantId: string) {
      const normalizedGrantId = assertNonEmptyId(grantId, "Grant id");
      const grant = await db.findResourceGrantById(normalizedGrantId);

      if (!grant) {
        throw notFound("Resource grant not found");
      }

      if (grant.status === "REVOKED") {
        return grant;
      }

      await db.updateResourceGrant(grant.id, {
        status: "REVOKED",
        revokedAt: now(),
      });

      const updated = await db.findResourceGrantById(grant.id);
      if (!updated) {
        throw notFound("Resource grant not found after update");
      }

      return updated;
    },
  };
}

export async function grantResourceToCustomer(input: {
  customerId: string;
  productId: string;
  assetId: string;
  note?: string;
  maxDownloads?: number;
  expiresAt?: Date | null;
}) {
  const service = await getDefaultCustomerResourceGrantService();
  return service.grantResourceToCustomer(input);
}

export async function listResourceGrantsForCustomer(customerId: string) {
  const service = await getDefaultCustomerResourceGrantService();
  return service.listResourceGrantsForCustomer(customerId);
}

export async function revokeResourceGrant(grantId: string) {
  const service = await getDefaultCustomerResourceGrantService();
  return service.revokeResourceGrant(grantId);
}

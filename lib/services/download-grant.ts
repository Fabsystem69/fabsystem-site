import type {
  DigitalAsset,
  DownloadGrant,
  DownloadGrantStatus,
  Order,
  OrderItem,
  PrismaClient,
  Product,
  ProductAsset,
} from "@/lib/generated/prisma/client";
import { badRequest, conflict, notFound } from "@/lib/http-errors";

type PrismaClientLike = PrismaClient;

type ProductAssetWithAsset = ProductAsset & {
  asset: DigitalAsset;
};

type ProductWithAssets = Product & {
  assets: ProductAssetWithAsset[];
};

type OrderItemWithProduct = OrderItem & {
  product: ProductWithAssets;
};

type OrderWithGrantContext = Order & {
  items: OrderItemWithProduct[];
  downloadGrants: DownloadGrant[];
};

type DownloadGrantWithRelations = DownloadGrant & {
  order: Order;
  orderItem: OrderItem;
  product: Product;
  asset: DigitalAsset;
};

type DownloadGrantCreateData = {
  orderId: string;
  orderItemId: string;
  productId: string;
  assetId: string;
  customerEmail: string;
  status: DownloadGrantStatus;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: Date | null;
};

type DownloadGrantDb = {
  findOrderForGrantCreation(orderId: string): Promise<OrderWithGrantContext | null>;
  createDownloadGrant(data: DownloadGrantCreateData): Promise<DownloadGrant>;
  findDownloadGrantsForOrder(orderId: string): Promise<DownloadGrantWithRelations[]>;
  findActiveDownloadGrantsForEmail(email: string): Promise<DownloadGrantWithRelations[]>;
  findDownloadGrantById(grantId: string): Promise<DownloadGrantWithRelations | null>;
  updateDownloadGrant(
    grantId: string,
    data: {
      status?: DownloadGrantStatus;
      revokedAt?: Date | null;
    }
  ): Promise<DownloadGrant>;
  expireActiveDownloadGrants(now: Date): Promise<number>;
  transaction<T>(callback: (db: DownloadGrantDb) => Promise<T>): Promise<T>;
};

type DownloadGrantServiceDeps = {
  now?: () => Date;
};

export type CreateDownloadGrantsResult = {
  createdCount: number;
  existingCount: number;
  activeCount: number;
  grants: DownloadGrant[];
};

function isOrderItemAssetUniqueConstraintError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? error.code : null;
  const meta = "meta" in error ? error.meta : null;

  if (code !== "P2002" || !meta || typeof meta !== "object") {
    return false;
  }

  const target = "target" in meta ? meta.target : null;

  if (!Array.isArray(target)) {
    return false;
  }

  return target.includes('"orderItemId"') && target.includes('"assetId"');
}

function assertNonEmptyId(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw badRequest(`${label} is required`);
  }

  return normalized;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function assertOrderIsGrantEligible(order: OrderWithGrantContext | null) {
  if (!order) {
    throw notFound("Order not found");
  }

  if (order.status === "PENDING_PAYMENT") {
    throw conflict("Download grants cannot be created for a pending payment order");
  }

  if (order.status === "CANCELLED") {
    throw conflict("Download grants cannot be created for a cancelled order");
  }

  if (order.status === "REFUNDED") {
    throw conflict("Download grants cannot be created for a refunded order");
  }

  if (order.status !== "PAID") {
    throw conflict("Download grants can only be created for a paid order");
  }

  if (order.items.length === 0) {
    throw badRequest("Order has no items");
  }

  return order;
}

function createPrismaDownloadGrantDb(client: PrismaClientLike): DownloadGrantDb {
  const buildScopedDb = (currentClient: PrismaClientLike): DownloadGrantDb => ({
    async findOrderForGrantCreation(orderId) {
      return currentClient.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
            include: {
              product: {
                include: {
                  assets: {
                    include: {
                      asset: true,
                    },
                    orderBy: { sortOrder: "asc" },
                  },
                },
              },
            },
          },
          downloadGrants: {
            orderBy: { createdAt: "asc" },
          },
        },
      }) as Promise<OrderWithGrantContext | null>;
    },
    async createDownloadGrant(data) {
      return currentClient.downloadGrant.create({
        data,
      });
    },
    async findDownloadGrantsForOrder(orderId) {
      return currentClient.downloadGrant.findMany({
        where: { orderId },
        include: {
          order: true,
          orderItem: true,
          product: true,
          asset: true,
        },
        orderBy: { createdAt: "asc" },
      }) as Promise<DownloadGrantWithRelations[]>;
    },
    async findActiveDownloadGrantsForEmail(email) {
      return currentClient.downloadGrant.findMany({
        where: {
          customerEmail: email,
          status: "ACTIVE",
        },
        include: {
          order: true,
          orderItem: true,
          product: true,
          asset: true,
        },
        orderBy: { createdAt: "desc" },
      }) as Promise<DownloadGrantWithRelations[]>;
    },
    async findDownloadGrantById(grantId) {
      return currentClient.downloadGrant.findUnique({
        where: { id: grantId },
        include: {
          order: true,
          orderItem: true,
          product: true,
          asset: true,
        },
      }) as Promise<DownloadGrantWithRelations | null>;
    },
    async updateDownloadGrant(grantId, data) {
      return currentClient.downloadGrant.update({
        where: { id: grantId },
        data,
      });
    },
    async expireActiveDownloadGrants(now) {
      const result = await currentClient.downloadGrant.updateMany({
        where: {
          status: "ACTIVE",
          expiresAt: {
            not: null,
            lt: now,
          },
        },
        data: {
          status: "EXPIRED",
        },
      });

      return result.count;
    },
    async transaction<T>(callback: (db: DownloadGrantDb) => Promise<T>) {
      return currentClient.$transaction(async (tx) => {
        const transactionDb = createPrismaDownloadGrantDb(tx as PrismaClientLike);
        return callback(transactionDb);
      });
    },
  });

  return buildScopedDb(client);
}

async function getDefaultDownloadGrantService() {
  const { prisma } = await import("@/lib/prisma");
  return createDownloadGrantService(createPrismaDownloadGrantDb(prisma));
}

export function createDownloadGrantService(
  db: DownloadGrantDb,
  deps?: DownloadGrantServiceDeps
) {
  const now = deps?.now ?? (() => new Date());

  return {
    async createDownloadGrantsForOrder(orderId: string): Promise<CreateDownloadGrantsResult> {
      const normalizedOrderId = assertNonEmptyId(orderId, "Order id");

      return db.transaction(async (tx) => {
        const order = assertOrderIsGrantEligible(
          await tx.findOrderForGrantCreation(normalizedOrderId)
        );

        const existingKeys = new Set(
          order.downloadGrants.map((grant) => `${grant.orderItemId}:${grant.assetId}`)
        );

        const createdGrants: DownloadGrant[] = [];
        let existingCount = 0;
        let racedExistingActiveCount = 0;

        for (const item of order.items) {
          const activeAssets = item.product.assets.filter(
            (productAsset) => productAsset.asset.status === "ACTIVE"
          );

          for (const productAsset of activeAssets) {
            const key = `${item.id}:${productAsset.assetId}`;

            if (existingKeys.has(key)) {
              existingCount += 1;
              continue;
            }

            try {
              const grant = await tx.createDownloadGrant({
                orderId: order.id,
                orderItemId: item.id,
                productId: item.productId,
                assetId: productAsset.assetId,
                customerEmail: normalizeEmail(order.customerEmail),
                status: "ACTIVE",
                downloadCount: 0,
                maxDownloads: 10,
                expiresAt: null,
              });

              createdGrants.push(grant);
              existingKeys.add(key);
            } catch (error) {
              if (!isOrderItemAssetUniqueConstraintError(error)) {
                throw error;
              }

              existingCount += 1;
              racedExistingActiveCount += 1;
              existingKeys.add(key);
            }
          }
        }

        const activeCount =
          order.downloadGrants.filter((grant) => grant.status === "ACTIVE").length +
          createdGrants.length +
          racedExistingActiveCount;

        return {
          createdCount: createdGrants.length,
          existingCount,
          activeCount,
          grants: createdGrants,
        };
      });
    },

    async listDownloadGrantsForOrder(orderId: string) {
      const normalizedOrderId = assertNonEmptyId(orderId, "Order id");
      return db.findDownloadGrantsForOrder(normalizedOrderId);
    },

    async listDownloadGrantsForEmail(email: string) {
      const normalizedEmail = normalizeEmail(assertNonEmptyId(email, "Email"));
      return db.findActiveDownloadGrantsForEmail(normalizedEmail);
    },

    async revokeDownloadGrant(grantId: string) {
      const normalizedGrantId = assertNonEmptyId(grantId, "Grant id");
      const grant = await db.findDownloadGrantById(normalizedGrantId);

      if (!grant) {
        throw notFound("Download grant not found");
      }

      if (grant.status === "REVOKED") {
        return grant;
      }

      await db.updateDownloadGrant(grant.id, {
        status: "REVOKED",
        revokedAt: now(),
      });

      const updatedGrant = await db.findDownloadGrantById(grant.id);

      if (!updatedGrant) {
        throw notFound("Download grant not found after update");
      }

      return updatedGrant;
    },

    async markExpiredDownloadGrants(referenceDate?: Date) {
      const effectiveNow = referenceDate ?? now();
      return db.expireActiveDownloadGrants(effectiveNow);
    },
  };
}

export async function createDownloadGrantsForOrder(orderId: string) {
  const service = await getDefaultDownloadGrantService();
  return service.createDownloadGrantsForOrder(orderId);
}

export async function listDownloadGrantsForOrder(orderId: string) {
  const service = await getDefaultDownloadGrantService();
  return service.listDownloadGrantsForOrder(orderId);
}

export async function listDownloadGrantsForEmail(email: string) {
  const service = await getDefaultDownloadGrantService();
  return service.listDownloadGrantsForEmail(email);
}

export async function revokeDownloadGrant(grantId: string) {
  const service = await getDefaultDownloadGrantService();
  return service.revokeDownloadGrant(grantId);
}

export async function markExpiredDownloadGrants(referenceDate?: Date) {
  const service = await getDefaultDownloadGrantService();
  return service.markExpiredDownloadGrants(referenceDate);
}

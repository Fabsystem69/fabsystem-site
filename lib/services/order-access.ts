import { z } from "zod";
import type {
  DigitalAsset,
  DownloadGrant,
  Order,
  OrderItem,
  PrismaClient,
  Product,
} from "@/lib/generated/prisma/client";
import { badRequest } from "@/lib/http-errors";

type PrismaClientLike = PrismaClient;

const orderNumberSchema = z.string().trim().min(1);

type DownloadGrantWithRelations = DownloadGrant & {
  order: Order;
  orderItem: OrderItem;
  product: Product;
  asset: DigitalAsset;
};

type OrderAccessOrder = Order & {
  downloadGrants: DownloadGrantWithRelations[];
};

type OrderAccessDb = {
  findOrderByNumber(orderNumber: string): Promise<OrderAccessOrder | null>;
};

export type OrderAccessDownload = {
  grantId: string;
  productName: string;
  filename: string;
  downloadsRemaining: number;
  downloadCount: number;
  maxDownloads: number;
};

export type OrderAccessResult =
  | {
      status: "missing";
      orderNumber: string | null;
      downloads: [];
    }
  | {
      status: "pending";
      orderNumber: string;
      downloads: [];
    }
  | {
      status: "paid";
      orderNumber: string;
      customerEmail: string;
      downloads: OrderAccessDownload[];
    };

type OrderAccessDeps = {
  now?: () => Date;
};

function createPrismaOrderAccessDb(client: PrismaClientLike): OrderAccessDb {
  return {
    async findOrderByNumber(orderNumber) {
      return client.order.findFirst({
        where: { orderNumber },
        include: {
          downloadGrants: {
            include: {
              order: true,
              orderItem: true,
              product: true,
              asset: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }) as Promise<OrderAccessOrder | null>;
    },
  };
}

async function getDefaultOrderAccessService() {
  const { prisma } = await import("@/lib/prisma");
  return createOrderAccessService(createPrismaOrderAccessDb(prisma));
}

function isGrantVisible(grant: DownloadGrantWithRelations, now: Date) {
  if (grant.status !== "ACTIVE") {
    return false;
  }

  if (grant.expiresAt && grant.expiresAt <= now) {
    return false;
  }

  return true;
}

export function createOrderAccessService(db: OrderAccessDb, deps?: OrderAccessDeps) {
  const now = deps?.now ?? (() => new Date());

  return {
    async getOrderAccessByNumber(orderNumber: string): Promise<OrderAccessResult> {
      const normalizedOrderNumber = orderNumberSchema.parse(orderNumber);
      const order = await db.findOrderByNumber(normalizedOrderNumber);

      if (!order) {
        return {
          status: "missing",
          orderNumber: normalizedOrderNumber,
          downloads: [],
        };
      }

      if (order.status !== "PAID") {
        return {
          status: "pending",
          orderNumber: order.orderNumber,
          downloads: [],
        };
      }

      const currentTime = now();
      const downloads = order.downloadGrants
        .filter((grant) => isGrantVisible(grant, currentTime))
        .map((grant) => ({
          grantId: grant.id,
          productName: grant.product.name,
          filename: grant.asset.filename,
          downloadsRemaining: Math.max(grant.maxDownloads - grant.downloadCount, 0),
          downloadCount: grant.downloadCount,
          maxDownloads: grant.maxDownloads,
        }));

      return {
        status: "paid",
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        downloads,
      };
    },

    parseOrderNumber(value: string | null | undefined) {
      const normalized = value?.trim();

      if (!normalized) {
        throw badRequest("Order number is required");
      }

      return orderNumberSchema.parse(normalized);
    },
  };
}

export async function getOrderAccessByNumber(orderNumber: string) {
  const service = await getDefaultOrderAccessService();
  return service.getOrderAccessByNumber(orderNumber);
}

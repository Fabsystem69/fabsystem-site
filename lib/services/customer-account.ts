import type {
  Customer,
  DigitalAsset,
  DownloadGrant,
  Order,
  OrderItem,
  PrismaClient,
} from "@/lib/generated/prisma/client";
import { notFound } from "@/lib/http-errors";

type PrismaClientLike = PrismaClient;

type OrderItemRecord = OrderItem;

type DownloadGrantWithRelations = DownloadGrant & {
  orderItem: OrderItem;
  asset: DigitalAsset;
};

type OrderWithRelations = Order & {
  items: OrderItemRecord[];
  downloadGrants: DownloadGrantWithRelations[];
};

type CustomerAccountDb = {
  findCustomerById(customerId: string): Promise<Customer | null>;
  findOrdersForCustomer(customerId: string, customerEmail: string): Promise<OrderWithRelations[]>;
};

export type CustomerAccountOverview = {
  customer: {
    id: string;
    email: string;
    name: string | null;
  };
  orders: Array<{
    id: string;
    orderNumber: string;
    status: Order["status"];
    totalCents: number;
    currency: string;
    createdAt: Date;
    paidAt: Date | null;
    items: Array<{
      id: string;
      productName: string;
      productSlug: string;
      quantity: number;
      lineTotalCents: number;
    }>;
    downloads: Array<{
      grantId: string;
      productName: string;
      filename: string;
      remainingDownloads: number;
      maxDownloads: number;
      expiresAt: Date | null;
    }>;
  }>;
};

type CustomerAccountDeps = {
  now?: () => Date;
};

function createPrismaCustomerAccountDb(client: PrismaClientLike): CustomerAccountDb {
  return {
    async findCustomerById(customerId) {
      return client.customer.findUnique({
        where: { id: customerId },
      });
    },
    async findOrdersForCustomer(customerId, customerEmail) {
      return client.order.findMany({
        where: {
          status: { not: "PENDING_PAYMENT" },
          OR: [{ customerId }, { customerEmail }],
        },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
          },
          downloadGrants: {
            include: {
              orderItem: true,
              asset: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }) as Promise<OrderWithRelations[]>;
    },
  };
}

async function getDefaultCustomerAccountService() {
  const { prisma } = await import("@/lib/prisma");
  return createCustomerAccountService(createPrismaCustomerAccountDb(prisma));
}

function isVisibleGrant(grant: DownloadGrantWithRelations, currentTime: Date) {
  if (grant.status !== "ACTIVE") {
    return false;
  }

  if (grant.expiresAt && grant.expiresAt <= currentTime) {
    return false;
  }

  return true;
}

export function createCustomerAccountService(
  db: CustomerAccountDb,
  deps?: CustomerAccountDeps
) {
  const now = deps?.now ?? (() => new Date());

  return {
    async getCustomerAccountOverview(customerId: string): Promise<CustomerAccountOverview> {
      const customer = await db.findCustomerById(customerId);

      if (!customer) {
        throw notFound("Customer not found");
      }

      const currentTime = now();
      const orders = await db.findOrdersForCustomer(customer.id, customer.email);

      return {
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
        },
        // Une commande PENDING_PAYMENT ne doit jamais apparaitre cote
        // client (paiement pas encore confirme, purge possible cote admin) :
        // filtre ici en plus de la requete Prisma, pour ne jamais dependre
        // uniquement de la couche DB.
        orders: orders
          .filter((order) => order.status !== "PENDING_PAYMENT")
          .map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalCents: order.totalCents,
          currency: order.currency,
          createdAt: order.createdAt,
          paidAt: order.paidAt,
          items: order.items.map((item) => ({
            id: item.id,
            productName: item.productName,
            productSlug: item.productSlug,
            quantity: item.quantity,
            lineTotalCents: item.lineTotalCents,
          })),
          downloads: order.downloadGrants
            .filter((grant) => isVisibleGrant(grant, currentTime))
            .map((grant) => ({
              grantId: grant.id,
              productName: grant.orderItem.productName,
              filename: grant.asset.filename,
              remainingDownloads: Math.max(grant.maxDownloads - grant.downloadCount, 0),
              maxDownloads: grant.maxDownloads,
              expiresAt: grant.expiresAt,
            })),
        })),
      };
    },
  };
}

export async function getCustomerAccountOverview(customerId: string) {
  const service = await getDefaultCustomerAccountService();
  return service.getCustomerAccountOverview(customerId);
}

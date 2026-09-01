import type {
  Customer,
  CustomerResourceGrant,
  DigitalAsset,
  DownloadGrant,
  Order,
  OrderItem,
  PrismaClient,
  Product,
  TrialAccessCode,
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

type ResourceGrantWithRelations = CustomerResourceGrant & {
  product: Product;
  asset: DigitalAsset;
};

type EditorAccessCodeRecord = Pick<
  TrialAccessCode,
  "code" | "durationDays" | "status" | "redeemedCount" | "maxRedemptions" | "sourceOrderId"
>;

type CustomerAccountDb = {
  findCustomerById(customerId: string): Promise<Customer | null>;
  findOrdersForCustomer(customerId: string, customerEmail: string): Promise<OrderWithRelations[]>;
  findResourceGrantsForCustomer(customerId: string): Promise<ResourceGrantWithRelations[]>;
  findEditorAccessCodesForOrders(customerEmail: string, orderIds: string[]): Promise<EditorAccessCodeRecord[]>;
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
    subtotalCents: number;
    discountTotalCents: number;
    totalCents: number;
    currency: string;
    // Achat entierement couvert par un code de reduction (cf. cahier des
    // charges espace client, section 7.5 "Achat offert") : derive ici pour
    // eviter qu'un simple 0 EUR affiche cote UI ne ressemble a une erreur.
    isFullyDiscounted: boolean;
    discountCodeId: string | null;
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
  // Ressources offertes par l'admin hors commande (lib/services/customer-resource-grants.ts) —
  // distinctes des achats, affichées à part côté mon-compte/achats.
  offeredResources: Array<{
    grantId: string;
    productName: string;
    filename: string;
    remainingDownloads: number;
    maxDownloads: number;
    expiresAt: Date | null;
    grantedAt: Date;
  }>;
  editorAccessCodes: Array<{
    code: string;
    durationDays: number;
    status: TrialAccessCode["status"];
    redeemed: boolean;
    orderId: string;
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
    async findResourceGrantsForCustomer(customerId) {
      return client.customerResourceGrant.findMany({
        where: { customerId },
        include: { product: true, asset: true },
        orderBy: { createdAt: "desc" },
      }) as Promise<ResourceGrantWithRelations[]>;
    },
    async findEditorAccessCodesForOrders(customerEmail, orderIds) {
      if (orderIds.length === 0) {
        return [];
      }

      return client.trialAccessCode.findMany({
        where: {
          recipientEmail: customerEmail,
          sourceOrderId: { in: orderIds },
        },
        select: {
          code: true,
          durationDays: true,
          status: true,
          redeemedCount: true,
          maxRedemptions: true,
          sourceOrderId: true,
        },
      });
    },
  };
}

async function getDefaultCustomerAccountService() {
  const { prisma } = await import("@/lib/prisma");
  return createCustomerAccountService(createPrismaCustomerAccountDb(prisma));
}

function isVisibleGrant(
  grant: DownloadGrantWithRelations | ResourceGrantWithRelations,
  currentTime: Date
) {
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
      const [orders, resourceGrants] = await Promise.all([
        db.findOrdersForCustomer(customer.id, customer.email),
        db.findResourceGrantsForCustomer(customer.id),
      ]);
      const editorAccessCodes = await db.findEditorAccessCodesForOrders(
        customer.email,
        orders.map((order) => order.id)
      );

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
          subtotalCents: order.subtotalCents,
          discountTotalCents: order.discountTotalCents,
          totalCents: order.totalCents,
          isFullyDiscounted: order.discountTotalCents > 0 && order.totalCents === 0,
          discountCodeId: order.discountCodeId,
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
        offeredResources: resourceGrants
          .filter((grant) => isVisibleGrant(grant, currentTime))
          .map((grant) => ({
            grantId: grant.id,
            productName: grant.product.name,
            filename: grant.asset.filename,
            remainingDownloads: Math.max(grant.maxDownloads - grant.downloadCount, 0),
            maxDownloads: grant.maxDownloads,
            expiresAt: grant.expiresAt,
            grantedAt: grant.createdAt,
          })),
        editorAccessCodes: editorAccessCodes
          .filter((accessCode) => accessCode.sourceOrderId)
          .map((accessCode) => ({
            code: accessCode.code,
            durationDays: accessCode.durationDays,
            status: accessCode.status,
            redeemed: accessCode.redeemedCount >= accessCode.maxRedemptions,
            orderId: accessCode.sourceOrderId as string,
          })),
      };
    },
  };
}

export async function getCustomerAccountOverview(customerId: string) {
  const service = await getDefaultCustomerAccountService();
  return service.getCustomerAccountOverview(customerId);
}

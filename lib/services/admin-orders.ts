import type {
  DigitalAsset,
  DiscountCode,
  DownloadGrant,
  Order,
  OrderItem,
  Payment,
  PrismaClient,
  Product,
} from "@/lib/generated/prisma/client";
import { notFound } from "@/lib/http-errors";

type PrismaClientLike = PrismaClient;

type OrderListRecord = Order & {
  items: OrderItem[];
  payments: Payment[];
  discountCode: Pick<DiscountCode, "id" | "code" | "reason"> | null;
};

type DownloadGrantWithRelations = DownloadGrant & {
  product: Product;
  asset: DigitalAsset;
};

type OrderDetailRecord = Order & {
  items: OrderItem[];
  payments: Payment[];
  downloadGrants: DownloadGrantWithRelations[];
  discountCode: Pick<DiscountCode, "id" | "code" | "reason"> | null;
};

type AdminOrdersDb = {
  listOrders(): Promise<OrderListRecord[]>;
  findOrderById(orderId: string): Promise<OrderDetailRecord | null>;
};

export type DashboardOrderSummary = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  customerEmail: string;
  customerName: string | null;
  status: Order["status"];
  totalCents: number;
  subtotalCents: number;
  discountTotalCents: number;
  currency: string;
  itemCount: number;
  paymentCount: number;
  primaryPaymentStatus: Payment["status"] | null;
  discountCode: string | null;
};

export type RefundReadiness = {
  canRefund: boolean;
  reason: string | null;
  refundableAmountCents: number;
  consequences: string[];
};

export type DashboardOrderDetail = {
  order: OrderDetailRecord;
  refundReadiness: RefundReadiness;
};

export type RefundableOrderDetailRecord = OrderDetailRecord;

function maskIdentifier(value: string | null | undefined) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length <= 10) {
    return `${normalized.slice(0, 3)}***`;
  }

  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
}

export function getPrimaryRefundableStripePayment(order: RefundableOrderDetailRecord) {
  return order.payments.find(
    (payment) => payment.provider === "STRIPE" && payment.status === "SUCCEEDED"
  );
}

export function buildRefundReadiness(order: RefundableOrderDetailRecord): RefundReadiness {
  const consequences = [
    "Remboursement total Stripe",
    "Order -> REFUNDED",
    "Payment -> REFUNDED",
    "DownloadGrant -> REVOKED",
  ];

  if (order.status === "REFUNDED") {
    return {
      canRefund: false,
      reason: "La commande est deja remboursee.",
      refundableAmountCents: 0,
      consequences,
    };
  }

  if (order.status !== "PAID") {
    return {
      canRefund: false,
      reason: "La commande doit etre payee.",
      refundableAmountCents: 0,
      consequences,
    };
  }

  if (order.totalCents <= 0) {
    return {
      canRefund: false,
      reason: "Commande offerte, aucun paiement Stripe a rembourser.",
      refundableAmountCents: 0,
      consequences,
    };
  }

  const refundedPayment = order.payments.find(
    (payment) => payment.status === "REFUNDED" || payment.refundedAt
  );

  if (refundedPayment) {
    return {
      canRefund: false,
      reason: "Un paiement est deja marque comme rembourse.",
      refundableAmountCents: 0,
      consequences,
    };
  }

  const mainSucceededPayment = getPrimaryRefundableStripePayment(order);

  if (!mainSucceededPayment) {
    return {
      canRefund: false,
      reason: "Aucun paiement Stripe reussi n'est disponible.",
      refundableAmountCents: 0,
      consequences,
    };
  }

  if (!mainSucceededPayment.stripePaymentIntentId?.trim()) {
    return {
      canRefund: false,
      reason: "Le paiement Stripe ne contient pas d'identifiant remboursable.",
      refundableAmountCents: 0,
      consequences,
    };
  }

  return {
    canRefund: true,
    reason: null,
    refundableAmountCents: mainSucceededPayment.amountCents,
    consequences,
  };
}

function createPrismaAdminOrdersDb(client: PrismaClientLike): AdminOrdersDb {
  return {
    async listOrders() {
      return client.order.findMany({
        include: {
          items: {
            orderBy: { createdAt: "asc" },
          },
          payments: {
            orderBy: { createdAt: "desc" },
          },
          discountCode: {
            select: {
              id: true,
              code: true,
              reason: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }) as Promise<OrderListRecord[]>;
    },
    async findOrderById(orderId) {
      return client.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
          },
          payments: {
            orderBy: { createdAt: "desc" },
          },
          discountCode: {
            select: {
              id: true,
              code: true,
              reason: true,
            },
          },
          downloadGrants: {
            include: {
              product: true,
              asset: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }) as Promise<OrderDetailRecord | null>;
    },
  };
}

async function getDefaultAdminOrdersService() {
  const { prisma } = await import("@/lib/prisma");
  return createAdminOrdersService(createPrismaAdminOrdersDb(prisma));
}

export function createAdminOrdersService(db: AdminOrdersDb) {
  return {
    async listDashboardOrders(): Promise<DashboardOrderSummary[]> {
      const orders = await db.listOrders();

      return orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        status: order.status,
        subtotalCents: order.subtotalCents,
        discountTotalCents: order.discountTotalCents,
        totalCents: order.totalCents,
        currency: order.currency,
        itemCount: order.items.length,
        paymentCount: order.payments.length,
        primaryPaymentStatus: order.payments[0]?.status ?? null,
        discountCode: order.discountCode?.code ?? null,
      }));
    },

    async getDashboardOrderDetail(orderId: string): Promise<DashboardOrderDetail> {
      const normalizedOrderId = orderId.trim();

      if (!normalizedOrderId) {
        throw notFound("Order not found");
      }

      const order = await db.findOrderById(normalizedOrderId);

      if (!order) {
        throw notFound("Order not found");
      }

      const maskedPayments = order.payments.map((payment) => ({
        ...payment,
        stripeCheckoutSessionId: maskIdentifier(payment.stripeCheckoutSessionId),
        stripePaymentIntentId: maskIdentifier(payment.stripePaymentIntentId),
      }));

      return {
        order: {
          ...order,
          payments: maskedPayments,
        },
        refundReadiness: buildRefundReadiness(order),
      };
    },
  };
}

export async function listDashboardOrders() {
  const service = await getDefaultAdminOrdersService();
  return service.listDashboardOrders();
}

export async function getDashboardOrderDetail(orderId: string) {
  const service = await getDefaultAdminOrdersService();
  return service.getDashboardOrderDetail(orderId);
}

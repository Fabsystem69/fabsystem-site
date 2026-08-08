import type { Order, OrderStatus, Payment, PrismaClient } from "@/lib/generated/prisma/client";
import { badRequest, conflict, notFound } from "@/lib/http-errors";

type PrismaClientLike = PrismaClient;

// Delai a partir duquel une commande PENDING_PAYMENT est proposee a la
// purge groupee ("Tout purger"). La suppression individuelle n'est, elle,
// pas soumise a ce delai (l'admin peut nettoyer un test recent tout de
// suite) — seule la purge groupee y est strictement limitee.
export const PENDING_ORDER_PURGE_THRESHOLD_DAYS = 5;

type PurgeCandidateOrder = Pick<
  Order,
  "id" | "orderNumber" | "status" | "createdAt" | "customerEmail" | "totalCents" | "currency"
> & {
  payments: Pick<Payment, "status">[];
  _count: {
    downloadGrants: number;
    discountRedemptions: number;
  };
};

type OrderPurgeDb = {
  findPendingPaymentOrders(): Promise<PurgeCandidateOrder[]>;
  findOrderForPurgeById(orderId: string): Promise<PurgeCandidateOrder | null>;
  deleteOrder(orderId: string): Promise<void>;
};

export type PurgeEligibility = { eligible: true } | { eligible: false; reason: string };

// Regle metier unique de securite avant toute suppression (individuelle ou
// groupee) : jamais une commande payee, jamais une commande gratuite/offerte
// (toujours PAID des sa creation, voir order.ts — ce cas ne devrait donc
// jamais survenir ici, garde par defense en profondeur), jamais une commande
// ayant deja donne acces a un telechargement ou consomme un code de
// reduction, et jamais tant qu'un paiement Stripe est encore susceptible
// d'aboutir (status PENDING).
export function evaluatePendingOrderPurgeEligibility(order: {
  status: OrderStatus;
  totalCents: number;
  payments: Array<{ status: Payment["status"] }>;
  downloadGrantsCount: number;
  discountRedemptionsCount: number;
}): PurgeEligibility {
  if (order.status !== "PENDING_PAYMENT") {
    return { eligible: false, reason: "La commande n'est pas en attente de paiement." };
  }

  if (order.totalCents <= 0) {
    return { eligible: false, reason: "Commande gratuite ou offerte : ne doit jamais être purgée." };
  }

  if (order.downloadGrantsCount > 0) {
    return {
      eligible: false,
      reason: "Cette commande a déjà donné accès à un téléchargement.",
    };
  }

  if (order.discountRedemptionsCount > 0) {
    return { eligible: false, reason: "Cette commande a déjà consommé un code de réduction." };
  }

  if (order.payments.some((payment) => payment.status === "SUCCEEDED")) {
    return { eligible: false, reason: "Un paiement de cette commande a réussi." };
  }

  if (order.payments.some((payment) => payment.status === "PENDING")) {
    return {
      eligible: false,
      reason: "Un paiement Stripe est encore en attente : il peut encore aboutir.",
    };
  }

  return { eligible: true };
}

export function getPendingOrderAgeDays(createdAt: Date, now: Date) {
  return Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000));
}

export function isPendingOrderPurgeTier(createdAt: Date, now: Date) {
  return getPendingOrderAgeDays(createdAt, now) >= PENDING_ORDER_PURGE_THRESHOLD_DAYS;
}

export type PendingOrderPurgeSummary = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  customerEmail: string;
  totalCents: number;
  currency: string;
  ageDays: number;
  isPurgeTier: boolean;
  eligibility: PurgeEligibility;
};

export type PurgeAllPendingOrdersResult = {
  deletedCount: number;
  deletedOrderNumbers: string[];
  skipped: Array<{ orderId: string; orderNumber: string; reason: string }>;
};

function buildEligibility(order: PurgeCandidateOrder) {
  return evaluatePendingOrderPurgeEligibility({
    status: order.status,
    totalCents: order.totalCents,
    payments: order.payments,
    downloadGrantsCount: order._count.downloadGrants,
    discountRedemptionsCount: order._count.discountRedemptions,
  });
}

function createPrismaOrderPurgeDb(client: PrismaClientLike): OrderPurgeDb {
  const select = {
    id: true,
    orderNumber: true,
    status: true,
    createdAt: true,
    customerEmail: true,
    totalCents: true,
    currency: true,
    payments: { select: { status: true } },
    _count: { select: { downloadGrants: true, discountRedemptions: true } },
  } as const;

  return {
    async findPendingPaymentOrders() {
      return client.order.findMany({
        where: { status: "PENDING_PAYMENT" },
        orderBy: { createdAt: "asc" },
        select,
      }) as unknown as Promise<PurgeCandidateOrder[]>;
    },
    async findOrderForPurgeById(orderId) {
      return client.order.findUnique({
        where: { id: orderId },
        select,
      }) as unknown as Promise<PurgeCandidateOrder | null>;
    },
    async deleteOrder(orderId) {
      // Suppression atomique : Payment / OrderItem / DownloadGrant sont
      // onDelete:Cascade sur Order (supprimes dans la meme instruction SQL),
      // DiscountRedemption est onDelete:Restrict — la verification
      // discountRedemptionsCount === 0 en amont (evaluatePendingOrderPurgeEligibility)
      // garantit qu'on ne declenche jamais cette contrainte ici.
      await client.order.delete({ where: { id: orderId } });
    },
  };
}

async function getDefaultOrderPurgeService() {
  const { prisma } = await import("@/lib/prisma");
  return createOrderPurgeService(createPrismaOrderPurgeDb(prisma));
}

export function createOrderPurgeService(db: OrderPurgeDb, deps?: { now?: () => Date }) {
  const now = deps?.now ?? (() => new Date());

  return {
    async listPendingOrdersForPurge(): Promise<PendingOrderPurgeSummary[]> {
      const orders = await db.findPendingPaymentOrders();
      const currentTime = now();

      return orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customerEmail: order.customerEmail,
        totalCents: order.totalCents,
        currency: order.currency,
        ageDays: getPendingOrderAgeDays(order.createdAt, currentTime),
        isPurgeTier: isPendingOrderPurgeTier(order.createdAt, currentTime),
        eligibility: buildEligibility(order),
      }));
    },

    // Suppression individuelle : pas de contrainte d'anciennete (a la
    // discretion de l'admin), mais toujours soumise aux memes garde-fous
    // absolus que la purge groupee.
    async deletePendingOrder(orderId: string) {
      const normalizedOrderId = orderId.trim();

      if (!normalizedOrderId) {
        throw badRequest("Order id is required");
      }

      const order = await db.findOrderForPurgeById(normalizedOrderId);

      if (!order) {
        throw notFound("Order not found");
      }

      const eligibility = buildEligibility(order);

      if (!eligibility.eligible) {
        throw conflict(eligibility.reason);
      }

      await db.deleteOrder(order.id);

      return { orderId: order.id, orderNumber: order.orderNumber };
    },

    // Purge groupee : uniquement les PENDING_PAYMENT >= PENDING_ORDER_PURGE_THRESHOLD_DAYS,
    // et uniquement celles qui passent les memes garde-fous. Chaque commande
    // est supprimee individuellement (pas une seule grosse transaction) pour
    // qu'un echec isole ne bloque jamais les autres suppressions eligibles ;
    // le detail (supprimees / ignorees + raison) est renvoye pour affichage.
    async purgeAllEligiblePendingOrders(): Promise<PurgeAllPendingOrdersResult> {
      const orders = await db.findPendingPaymentOrders();
      const currentTime = now();

      const deletedOrderNumbers: string[] = [];
      const skipped: PurgeAllPendingOrdersResult["skipped"] = [];

      for (const order of orders) {
        if (!isPendingOrderPurgeTier(order.createdAt, currentTime)) {
          continue;
        }

        const eligibility = buildEligibility(order);

        if (!eligibility.eligible) {
          skipped.push({ orderId: order.id, orderNumber: order.orderNumber, reason: eligibility.reason });
          continue;
        }

        try {
          await db.deleteOrder(order.id);
          deletedOrderNumbers.push(order.orderNumber);
        } catch {
          skipped.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            reason: "Suppression refusée par la base de données.",
          });
        }
      }

      return {
        deletedCount: deletedOrderNumbers.length,
        deletedOrderNumbers,
        skipped,
      };
    },
  };
}

export async function listPendingOrdersForPurge() {
  const service = await getDefaultOrderPurgeService();
  return service.listPendingOrdersForPurge();
}

export async function deletePendingOrder(orderId: string) {
  const service = await getDefaultOrderPurgeService();
  return service.deletePendingOrder(orderId);
}

export async function purgeAllEligiblePendingOrders() {
  const service = await getDefaultOrderPurgeService();
  return service.purgeAllEligiblePendingOrders();
}

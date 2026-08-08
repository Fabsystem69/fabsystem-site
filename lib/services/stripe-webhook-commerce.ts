import Stripe from "stripe";
import type { Order, Payment, PrismaClient } from "@/lib/generated/prisma/client";
import { badRequest, conflict, notFound } from "@/lib/http-errors";
import { finalizeDiscountRedemptionForOrder } from "@/lib/services/discounts";
import { logServerEvent } from "@/lib/server-log";

type PrismaClientLike = PrismaClient;

type PaymentWithOrder = Payment & {
  order: Order;
};

type CommerceWebhookResult =
  | { status: "processed"; orderId: string; paymentId: string }
  | { status: "already_processed"; orderId: string; paymentId: string }
  | { status: "ignored_unpaid"; reason: "payment_status_not_paid" };

type CommerceCheckoutExpiredResult =
  | { status: "expired_marked_failed"; orderId: string; paymentId: string }
  | { status: "ignored_missing_payment" }
  | { status: "ignored_already_terminal"; orderId: string; paymentId: string }
  | { status: "ignored_paid_order"; orderId: string; paymentId: string };

export type CommerceWebhookDb = {
  findPaymentByStripeCheckoutSessionId(sessionId: string): Promise<PaymentWithOrder | null>;
  updatePaymentSuccess(
    paymentId: string,
    data: {
      status: "SUCCEEDED";
      stripePaymentIntentId: string | null;
      stripeCustomerId: string | null;
      rawProviderStatus: string | null;
      succeededAt: Date;
    }
  ): Promise<Payment>;
  updatePaymentFailed(
    paymentId: string,
    data: {
      status: "FAILED";
      rawProviderStatus: string | null;
      failedAt: Date;
    }
  ): Promise<Payment>;
  updateOrderPaid(
    orderId: string,
    data: {
      status: "PAID";
      paidAt: Date;
    }
  ): Promise<Order>;
  // Contrat DiscountRedemptionDb (lib/services/discounts.ts) : rend
  // CommerceWebhookDb utilisable tel quel par finalizeDiscountRedemptionForOrder,
  // appele ici au moment exact ou le paiement Stripe confirme la commande.
  findDiscountRedemption(discountCodeId: string, orderId: string): Promise<{ id: string } | null>;
  findDiscountCodeCapacity(
    discountCodeId: string
  ): Promise<{ maxRedemptions: number; productId: string | null } | null>;
  incrementDiscountCodeRedeemedCountIfCapacity(
    discountCodeId: string,
    maxRedemptions: number
  ): Promise<number>;
  decrementDiscountCodeRedeemedCount(discountCodeId: string): Promise<void>;
  createDiscountRedemption(data: {
    discountCodeId: string;
    orderId: string;
    customerEmail: string;
    productId: string | null;
    amountDiscountedCents: number;
  }): Promise<unknown>;
  transaction<T>(callback: (db: CommerceWebhookDb) => Promise<T>): Promise<T>;
};

type CommerceWebhookDeps = {
  now?: () => Date;
  createDownloadGrantsForOrder?: (orderId: string) => Promise<unknown>;
  createAutomaticEbookDiscountCodesForOrder?: (orderId: string) => Promise<unknown>;
  sendPrestationsPackNotification?: (
    orderId: string,
    sessionMetadata: Stripe.Metadata | null | undefined
  ) => Promise<unknown>;
};

function getRequiredMetadataValue(
  metadata: Stripe.Metadata | null | undefined,
  key: "orderId" | "orderNumber" | "paymentId"
) {
  const value = metadata?.[key]?.trim();

  if (!value) {
    throw badRequest(`Missing Stripe checkout metadata: ${key}`);
  }

  return value;
}

function normalizeCurrency(value: string | null | undefined) {
  return value?.trim().toUpperCase() ?? null;
}

export function isCommerceCheckoutSession(session: Stripe.Checkout.Session) {
  return Boolean(
    session.metadata?.orderId?.trim() &&
      session.metadata?.orderNumber?.trim() &&
      session.metadata?.paymentId?.trim()
  );
}

function assertPaymentAndOrderAreEligible(payment: PaymentWithOrder | null) {
  if (!payment) {
    throw notFound("Payment not found for Stripe checkout session");
  }

  if (payment.provider !== "STRIPE") {
    throw conflict("Payment provider is not STRIPE");
  }

  if (payment.status === "FAILED" || payment.status === "REFUNDED") {
    throw conflict("Payment is not eligible for Stripe success processing");
  }

  if (payment.order.status === "CANCELLED" || payment.order.status === "REFUNDED") {
    throw conflict("Order is not eligible for Stripe success processing");
  }

  return payment;
}

function assertStripeMetadataMatches(
  payment: PaymentWithOrder,
  metadata: {
    orderId: string;
    orderNumber: string;
    paymentId: string;
  }
) {
  if (payment.id !== metadata.paymentId) {
    throw conflict("Stripe paymentId metadata does not match local payment");
  }

  if (payment.orderId !== metadata.orderId || payment.order.id !== metadata.orderId) {
    throw conflict("Stripe orderId metadata does not match local order");
  }

  if (payment.order.orderNumber !== metadata.orderNumber) {
    throw conflict("Stripe orderNumber metadata does not match local order");
  }
}

function assertStripeAmountMatches(
  payment: PaymentWithOrder,
  session: Stripe.Checkout.Session
) {
  if (typeof session.amount_total === "number" && session.amount_total !== payment.amountCents) {
    throw conflict("Stripe amount_total does not match local payment amount");
  }

  const sessionCurrency = normalizeCurrency(session.currency);
  const paymentCurrency = normalizeCurrency(payment.currency);

  if (sessionCurrency && paymentCurrency && sessionCurrency !== paymentCurrency) {
    throw conflict("Stripe currency does not match local payment currency");
  }
}

function createPrismaCommerceWebhookDb(client: PrismaClientLike): CommerceWebhookDb {
  const buildScopedDb = (currentClient: PrismaClientLike): CommerceWebhookDb => ({
    async findPaymentByStripeCheckoutSessionId(sessionId) {
      return currentClient.payment.findUnique({
        where: {
          stripeCheckoutSessionId: sessionId,
        },
        include: {
          order: true,
        },
      }) as Promise<PaymentWithOrder | null>;
    },
    async updatePaymentSuccess(paymentId, data) {
      return currentClient.payment.update({
        where: { id: paymentId },
        data,
      });
    },
    async updatePaymentFailed(paymentId, data) {
      return currentClient.payment.update({
        where: { id: paymentId },
        data,
      });
    },
    async updateOrderPaid(orderId, data) {
      return currentClient.order.update({
        where: { id: orderId },
        data,
      });
    },
    async findDiscountRedemption(discountCodeId, orderId) {
      return currentClient.discountRedemption.findUnique({
        where: {
          discountCodeId_orderId: {
            discountCodeId,
            orderId,
          },
        },
        select: { id: true },
      });
    },
    async findDiscountCodeCapacity(discountCodeId) {
      return currentClient.discountCode.findUnique({
        where: { id: discountCodeId },
        select: { maxRedemptions: true, productId: true },
      });
    },
    async incrementDiscountCodeRedeemedCountIfCapacity(discountCodeId, maxRedemptions) {
      const result = await currentClient.discountCode.updateMany({
        where: {
          id: discountCodeId,
          redeemedCount: { lt: maxRedemptions },
        },
        data: {
          redeemedCount: { increment: 1 },
        },
      });

      return result.count;
    },
    async decrementDiscountCodeRedeemedCount(discountCodeId) {
      await currentClient.discountCode.update({
        where: { id: discountCodeId },
        data: {
          redeemedCount: { decrement: 1 },
        },
      });
    },
    async createDiscountRedemption(data) {
      return currentClient.discountRedemption.create({ data });
    },
    async transaction<T>(callback: (db: CommerceWebhookDb) => Promise<T>) {
      return currentClient.$transaction(async (tx) => {
        const transactionDb = createPrismaCommerceWebhookDb(tx as PrismaClientLike);
        return callback(transactionDb);
      });
    },
  });

  return buildScopedDb(client);
}

async function getDefaultCommerceWebhookService() {
  const [
    { prisma },
    { createDownloadGrantsForOrder },
    { createAutomaticEbookDiscountCodesForOrder },
    { sendPrestationsPackNotification },
  ] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/services/download-grant"),
    import("@/lib/services/discounts"),
    import("@/lib/services/prestations-notify"),
  ]);

  return createStripeWebhookCommerceService(createPrismaCommerceWebhookDb(prisma), {
    createDownloadGrantsForOrder,
    createAutomaticEbookDiscountCodesForOrder,
    sendPrestationsPackNotification,
  });
}

export function createStripeWebhookCommerceService(
  db: CommerceWebhookDb,
  deps?: CommerceWebhookDeps
) {
  const now = deps?.now ?? (() => new Date());
  const createDownloadGrantsForOrder = deps?.createDownloadGrantsForOrder ?? (async () => {});
  const createAutomaticEbookDiscountCodesForOrder =
    deps?.createAutomaticEbookDiscountCodesForOrder ?? (async () => {});
  const sendPrestationsPackNotification =
    deps?.sendPrestationsPackNotification ?? (async () => {});

  return {
    async handleCommerceCheckoutCompleted(
      session: Stripe.Checkout.Session
    ): Promise<CommerceWebhookResult> {
      const metadata = {
        orderId: getRequiredMetadataValue(session.metadata, "orderId"),
        orderNumber: getRequiredMetadataValue(session.metadata, "orderNumber"),
        paymentId: getRequiredMetadataValue(session.metadata, "paymentId"),
      };

      if (session.payment_status !== "paid") {
        return {
          status: "ignored_unpaid",
          reason: "payment_status_not_paid",
        };
      }

      const result = await db.transaction(async (
        tx
      ): Promise<
        | { status: "already_processed"; orderId: string; paymentId: string }
        | { status: "processed"; orderId: string; paymentId: string }
      > => {
        const payment = assertPaymentAndOrderAreEligible(
          await tx.findPaymentByStripeCheckoutSessionId(session.id)
        );

        assertStripeMetadataMatches(payment, metadata);
        assertStripeAmountMatches(payment, session);

        if (payment.status === "SUCCEEDED" && payment.order.status === "PAID") {
          return {
            status: "already_processed",
            orderId: payment.order.id,
            paymentId: payment.id,
          };
        }

        if (payment.status !== "PENDING") {
          throw conflict("Payment is not eligible for Stripe success processing");
        }

        if (payment.order.status !== "PENDING_PAYMENT") {
          throw conflict("Order is not eligible for Stripe success processing");
        }

        const timestamp = now();
        const stripePaymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : null;
        const stripeCustomerId =
          typeof session.customer === "string" ? session.customer : null;

        await tx.updatePaymentSuccess(payment.id, {
          status: "SUCCEEDED",
          stripePaymentIntentId,
          stripeCustomerId,
          rawProviderStatus: session.payment_status,
          succeededAt: timestamp,
        });

        await tx.updateOrderPaid(payment.order.id, {
          status: "PAID",
          paidAt: timestamp,
        });

        // Consommation reelle du code de reduction ici, au moment exact ou
        // le paiement Stripe confirme la commande (jamais avant, voir
        // finalizeDiscountRedemptionForOrder). Contrairement au chemin
        // gratuit (order.ts), un epuisement ici ne doit jamais annuler la
        // commande : le client a deja paye via Stripe, on l'honore et on se
        // contente de journaliser l'anomalie pour revue manuelle.
        const redemptionOutcome = await finalizeDiscountRedemptionForOrder(tx, {
          id: payment.order.id,
          discountCodeId: payment.order.discountCodeId,
          discountTotalCents: payment.order.discountTotalCents,
          customerEmail: payment.order.customerEmail,
        });

        if (redemptionOutcome.status === "exhausted") {
          logServerEvent("error", "discount code exhausted after Stripe payment succeeded", {
            orderId: payment.order.id,
            discountCodeId: payment.order.discountCodeId,
          });
        }

        return {
          status: "processed",
          orderId: payment.order.id,
          paymentId: payment.id,
        };
      });

      if (result.status === "processed" || result.status === "already_processed") {
        await createDownloadGrantsForOrder(result.orderId);
        // Genere le(s) code(s) coaching automatique(s) pour chaque ebook de
        // la commande (miroir cote paye de createAutomaticEbookDiscountCodesForFreeOrder
        // pour le chemin gratuit). Idempotent (code deterministe + upsert),
        // donc sans risque sur already_processed (redelivery Stripe).
        await createAutomaticEbookDiscountCodesForOrder(result.orderId);
        // Appele aussi sur already_processed (redelivery Stripe) pour ne
        // jamais perdre silencieusement la notification si l'envoi avait
        // echoue lors d'une tentative precedente — au pire un email en
        // double vers Fabien, jamais zero email pour un pack paye.
        await sendPrestationsPackNotification(result.orderId, session.metadata);
      }

      return result;
    },
    async handleCommerceCheckoutExpired(
      session: Stripe.Checkout.Session
    ): Promise<CommerceCheckoutExpiredResult> {
      const metadata = {
        orderId: getRequiredMetadataValue(session.metadata, "orderId"),
        orderNumber: getRequiredMetadataValue(session.metadata, "orderNumber"),
        paymentId: getRequiredMetadataValue(session.metadata, "paymentId"),
      };

      return db.transaction(async (tx) => {
        const payment = await tx.findPaymentByStripeCheckoutSessionId(session.id);

        if (!payment) {
          return {
            status: "ignored_missing_payment",
          };
        }

        assertStripeMetadataMatches(payment, metadata);

        if (payment.order.status === "PAID") {
          return {
            status: "ignored_paid_order",
            orderId: payment.order.id,
            paymentId: payment.id,
          };
        }

        if (payment.status !== "PENDING") {
          return {
            status: "ignored_already_terminal",
            orderId: payment.order.id,
            paymentId: payment.id,
          };
        }

        const timestamp = now();

        await tx.updatePaymentFailed(payment.id, {
          status: "FAILED",
          rawProviderStatus: session.status ?? "expired",
          failedAt: timestamp,
        });

        return {
          status: "expired_marked_failed",
          orderId: payment.order.id,
          paymentId: payment.id,
        };
      });
    },
  };
}

export async function handleCommerceCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const service = await getDefaultCommerceWebhookService();
  return service.handleCommerceCheckoutCompleted(session);
}

export async function handleCommerceCheckoutExpired(
  session: Stripe.Checkout.Session
) {
  const service = await getDefaultCommerceWebhookService();
  return service.handleCommerceCheckoutExpired(session);
}

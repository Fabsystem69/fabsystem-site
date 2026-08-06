import type { DownloadGrant, Order, Payment, PrismaClient } from "@/lib/generated/prisma/client";
import { badRequest, conflict, notFound } from "@/lib/http-errors";
import { buildRefundReadiness, getPrimaryRefundableStripePayment } from "@/lib/services/admin-orders";
import { logServerEvent } from "@/lib/server-log";

type PrismaClientLike = PrismaClient;

type RefundOrderRecord = Order & {
  payments: Payment[];
  downloadGrants: DownloadGrant[];
};

type AdminRefundsDb = {
  findOrderById(orderId: string): Promise<RefundOrderRecord | null>;
  transaction<T>(
    callback: (tx: {
      markPaymentRefunded(
        paymentId: string,
        refundedAt: Date,
        rawProviderStatus: string | null
      ): Promise<void>;
      markOrderRefunded(orderId: string, refundedAt: Date): Promise<void>;
      revokeActiveDownloadGrantsForOrder(orderId: string, revokedAt: Date): Promise<number>;
    }) => Promise<T>
  ): Promise<T>;
};

type CreateStripeRefundResult = {
  id: string;
  status: string | null;
};

type AdminRefundsDeps = {
  createRefund?: (input: {
    paymentIntentId: string;
    amountCents: number;
    orderId: string;
    orderNumber: string;
    idempotencyKey: string;
  }) => Promise<CreateStripeRefundResult>;
  now?: () => Date;
};

export type RefundOrderInFullInput = {
  orderId: string;
  confirmationText: string;
};

export type RefundOrderInFullResult = {
  orderId: string;
  orderNumber: string;
  status: Order["status"];
  refundedGrantCount: number;
  alreadyRefunded: boolean;
};

function createPrismaAdminRefundsDb(client: PrismaClientLike): AdminRefundsDb {
  return {
    async findOrderById(orderId) {
      return client.order.findUnique({
        where: { id: orderId },
        include: {
          payments: {
            orderBy: { createdAt: "desc" },
          },
          downloadGrants: {
            orderBy: { createdAt: "asc" },
          },
        },
      }) as Promise<RefundOrderRecord | null>;
    },
    async transaction(callback) {
      return client.$transaction(async (tx) =>
        callback({
          async markPaymentRefunded(paymentId, refundedAt, rawProviderStatus) {
            await tx.payment.update({
              where: { id: paymentId },
              data: {
                status: "REFUNDED",
                refundedAt,
                rawProviderStatus,
              },
            });
          },
          async markOrderRefunded(orderId, refundedAt) {
            await tx.order.update({
              where: { id: orderId },
              data: {
                status: "REFUNDED",
                refundedAt,
              },
            });
          },
          async revokeActiveDownloadGrantsForOrder(orderId, revokedAt) {
            const result = await tx.downloadGrant.updateMany({
              where: {
                orderId,
                status: "ACTIVE",
              },
              data: {
                status: "REVOKED",
                revokedAt,
              },
            });

            return result.count;
          },
        })
      );
    },
  };
}

async function getDefaultAdminRefundsService() {
  const { prisma } = await import("@/lib/prisma");
  const { createStripeRefund } = await import("@/lib/server/stripe");
  return createAdminRefundsService(createPrismaAdminRefundsDb(prisma), {
    createRefund: createStripeRefund,
  });
}

function normalizeOrderId(orderId: string) {
  return orderId.trim();
}

function assertRefundConfirmation(confirmationText: string) {
  if (confirmationText.trim() !== "REMBOURSER") {
    throw badRequest("Confirmation invalide. Saisissez REMBOURSER.");
  }
}

export function createAdminRefundsService(db: AdminRefundsDb, deps: AdminRefundsDeps = {}) {
  const now = deps.now ?? (() => new Date());

  return {
    async refundOrderInFull(input: RefundOrderInFullInput): Promise<RefundOrderInFullResult> {
      const orderId = normalizeOrderId(input.orderId);

      if (!orderId) {
        throw notFound("Commande introuvable.");
      }

      assertRefundConfirmation(input.confirmationText);

      const order = await db.findOrderById(orderId);

      if (!order) {
        throw notFound("Commande introuvable.");
      }

      if (order.status === "REFUNDED") {
        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          refundedGrantCount: 0,
          alreadyRefunded: true,
        };
      }

      const refundReadiness = buildRefundReadiness(order);

      if (!refundReadiness.canRefund) {
        throw conflict(refundReadiness.reason ?? "Commande non remboursable.");
      }

      const payment = getPrimaryRefundableStripePayment(order);

      if (!payment?.stripePaymentIntentId?.trim()) {
        throw conflict("Aucun paiement Stripe remboursable n'est disponible.");
      }

      if (!deps.createRefund) {
        throw new Error("createRefund dependency is required");
      }

      let stripeRefund: CreateStripeRefundResult;
      try {
        stripeRefund = await deps.createRefund({
          paymentIntentId: payment.stripePaymentIntentId.trim(),
          amountCents: refundReadiness.refundableAmountCents,
          orderId: order.id,
          orderNumber: order.orderNumber,
          idempotencyKey: `order-refund-full:${order.id}`,
        });
      } catch (error) {
        logServerEvent("error", "admin refund stripe call failed", {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentId: payment.id,
          error: error instanceof Error ? error.message : "unknown-error",
        });
        throw error;
      }

      const refundedAt = now();

      try {
        const refundedGrantCount = await db.transaction(async (tx) => {
          await tx.markPaymentRefunded(payment.id, refundedAt, stripeRefund.status);
          await tx.markOrderRefunded(order.id, refundedAt);
          return tx.revokeActiveDownloadGrantsForOrder(order.id, refundedAt);
        });

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: "REFUNDED",
          refundedGrantCount,
          alreadyRefunded: false,
        };
      } catch (error) {
        logServerEvent("error", "admin refund database update failed after stripe refund", {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentId: payment.id,
          stripeRefundId: stripeRefund.id,
          error: error instanceof Error ? error.message : "unknown-error",
        });
        throw error;
      }
    },
  };
}

export async function refundOrderInFull(input: RefundOrderInFullInput) {
  const service = await getDefaultAdminRefundsService();
  return service.refundOrderInFull(input);
}

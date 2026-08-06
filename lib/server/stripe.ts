import "server-only";
import Stripe from "stripe";
import { badRequest } from "@/lib/http-errors";
import { requireServerEnv } from "@/lib/server/env";

const globalForServerStripe = globalThis as { serverStripe?: Stripe };

function createServerStripeClient() {
  const secretKey = requireServerEnv("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY);

  return new Stripe(secretKey);
}

export function getServerStripe() {
  const stripe = globalForServerStripe.serverStripe ?? createServerStripeClient();

  if (process.env.NODE_ENV !== "production") {
    globalForServerStripe.serverStripe = stripe;
  }

  return stripe;
}

export type CreateStripeRefundInput = {
  paymentIntentId: string;
  amountCents: number;
  orderId: string;
  orderNumber: string;
  idempotencyKey: string;
};

export async function createStripeRefund(input: CreateStripeRefundInput) {
  const paymentIntentId = input.paymentIntentId.trim();
  const orderId = input.orderId.trim();
  const orderNumber = input.orderNumber.trim();
  const idempotencyKey = input.idempotencyKey.trim();

  if (!paymentIntentId) {
    throw badRequest("Stripe payment intent id is required.");
  }

  if (!orderId || !orderNumber || !idempotencyKey) {
    throw badRequest("Stripe refund metadata is incomplete.");
  }

  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw badRequest("Stripe refund amount must be a positive integer.");
  }

  return getServerStripe().refunds.create(
    {
      payment_intent: paymentIntentId,
      amount: input.amountCents,
      metadata: {
        orderId,
        orderNumber,
        reason: "admin_full_refund",
      },
    },
    {
      idempotencyKey,
    }
  );
}

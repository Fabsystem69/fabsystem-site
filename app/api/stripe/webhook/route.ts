import Stripe from "stripe";
import {
  handleCommerceCheckoutCompleted,
  handleCommerceCheckoutExpired,
  isCommerceCheckoutSession,
} from "@/lib/services/stripe-webhook-commerce";
import { logServerEvent } from "@/lib/server-log";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logServerEvent("error", "stripe webhook: missing STRIPE_WEBHOOK_SECRET", {});
    return Response.json({ error: "Configuration manquante" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  // IMPORTANT : req.text() lit le corps brut, pas req.json() — la vérification
  // de signature Stripe échoue si le corps a été reparsé/reformaté.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing stripe-signature header");
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    logServerEvent("warn", "stripe webhook: signature verification failed", { error });
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.expired"
  ) {
    logServerEvent("info", "stripe webhook: event ignored", { type: event.type });
    return Response.json({ ok: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const isCommerceSession = isCommerceCheckoutSession(session);

  logServerEvent("info", `stripe webhook: ${event.type} received`, {
    sessionId: session.id,
    mode: session.mode,
    amountTotal: session.amount_total,
    currency: session.currency,
    paymentStatus: session.payment_status,
    flow: isCommerceSession ? "commerce" : "ignored_non_commerce",
  });

  if (session.mode !== "payment") {
    logServerEvent("info", "stripe webhook: session skipped (unsupported mode)", {
      sessionId: session.id,
      mode: session.mode,
    });
    return Response.json({ ok: true });
  }

  if (!isCommerceSession) {
    // Le tunnel ebook legacy a été décommissionné au Sprint 8.9 : toute session
    // sans metadata commerce (orderId/orderNumber/paymentId) est désormais
    // ignorée proprement, sans effet de bord.
    logServerEvent("info", "stripe webhook: session ignored (no commerce metadata)", {
      sessionId: session.id,
      type: event.type,
    });
    return Response.json({ ok: true });
  }

  try {
    if (event.type === "checkout.session.expired") {
      const result = await handleCommerceCheckoutExpired(session);

      logServerEvent("info", "stripe webhook commerce: checkout.session.expired processed", {
        sessionId: session.id,
        result: result.status,
        orderId: "orderId" in result ? result.orderId : undefined,
        paymentId: "paymentId" in result ? result.paymentId : undefined,
      });

      return Response.json({ ok: true });
    }

    const result = await handleCommerceCheckoutCompleted(session);

    if (result.status === "ignored_unpaid") {
      logServerEvent("info", "stripe webhook commerce: session skipped (payment not paid)", {
        sessionId: session.id,
        paymentStatus: session.payment_status,
      });
      return Response.json({ ok: true });
    }

    logServerEvent("info", "stripe webhook commerce: checkout.session.completed processed", {
      sessionId: session.id,
      result: result.status,
      orderId: result.orderId,
      paymentId: result.paymentId,
    });

    return Response.json({ ok: true });
  } catch (error) {
    logServerEvent("error", "stripe webhook commerce: processing failed", {
      sessionId: session.id,
      error,
    });
    throw error;
  }
}

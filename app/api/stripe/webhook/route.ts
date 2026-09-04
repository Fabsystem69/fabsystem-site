import Stripe from "stripe";
import {
  handleCommerceCheckoutCompleted,
  handleCommerceCheckoutExpired,
  isCommerceCheckoutSession,
} from "@/lib/services/stripe-webhook-commerce";
import { logServerEvent } from "@/lib/server-log";
import { stripe } from "@/lib/stripe";
import { syncSchemaEditorPlusSubscription } from "@/lib/services/schema-editor-plus";

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

  const isEditorPlusSubscriptionEvent =
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted";
  const isCheckoutEvent = event.type === "checkout.session.completed" || event.type === "checkout.session.expired";

  if (!isCheckoutEvent && !isEditorPlusSubscriptionEvent) {
    logServerEvent("info", "stripe webhook: event ignored", { type: event.type });
    return Response.json({ ok: true });
  }

  // Stripe Billing est synchronise directement par l'identifiant unique de
  // l'abonnement : les redeliveries ne creent donc jamais un second droit.
  if (isEditorPlusSubscriptionEvent) {
    try {
      const subscription = event.data.object as Stripe.Subscription;
      const result = await syncSchemaEditorPlusSubscription(subscription);
      logServerEvent("info", "stripe webhook editor plus subscription processed", {
        eventType: event.type,
        subscriptionId: subscription.id,
        status: subscription.status,
        localSubscriptionId: result.id,
      });
      return Response.json({ ok: true });
    } catch (error) {
      logServerEvent("error", "stripe webhook editor plus subscription failed", {
        eventType: event.type,
        subscriptionId: (event.data.object as Stripe.Subscription).id,
        error,
      });
      throw error;
    }
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

  if (session.mode === "subscription" && event.type === "checkout.session.completed") {
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (!subscriptionId) {
      return Response.json({ error: "Missing subscription" }, { status: 400 });
    }
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSchemaEditorPlusSubscription(subscription);
      return Response.json({ ok: true });
    } catch (error) {
      logServerEvent("error", "stripe webhook editor plus checkout failed", { sessionId: session.id, error });
      throw error;
    }
  }

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

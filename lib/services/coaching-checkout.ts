import { badRequest, notFound, unauthorized } from "@/lib/http-errors";
import type { OwnershipActor } from "@/lib/ownership";

// v2.1 : checkout express pour un créneau de conseil ponctuel (30 min, visio
// ou téléphone, 59€) — proposé dans l'éditeur de schéma quand l'utilisateur
// semble bloqué (voir CoachingOfferWidget.tsx). Même schéma que
// schema-unlock-checkout.ts (produit hors panier générique, price_data
// Stripe construit depuis le Product/Price local plutôt qu'un Price Stripe
// pré-créé) mais sans Project à rattacher : n'importe quel client connecté
// peut l'acheter. Aucun octroi automatique (pas de DownloadGrant, pas de
// capability) — sendPurchaseNotification (déjà appelée pour toute commande
// payée, voir stripe-webhook-commerce.ts) suffit à alerter Fabien pour
// qu'il recontacte le client et cale le rendez-vous.
export const COACHING_30MIN_PRODUCT_SLUG = "coaching-30min";

function formatOrderDate(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

// Préfixe "CO-" (COaching) — distingue ces commandes au premier coup d'œil
// dans le dashboard admin, comme "SU-" pour le déverrouillage schéma.
function generateOrderNumber() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CO-${formatOrderDate(new Date())}-${random}`;
}

export async function createCoachingCheckoutSession(
  actor: OwnershipActor,
  input: { baseUrl: string }
): Promise<{ url: string }> {
  if (actor.role !== "customer" || !actor.customerId) {
    throw unauthorized("Customer account required");
  }

  const [{ prisma }, { stripe }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/stripe"),
  ]);

  const product = await prisma.product.findUnique({
    where: { slug: COACHING_30MIN_PRODUCT_SLUG },
    include: { prices: { where: { status: "ACTIVE" } } },
  });

  if (!product || product.status !== "ACTIVE" || product.productType !== "COACHING_30MIN") {
    throw notFound("Coaching product not found");
  }

  const price = product.prices[0];
  if (!price) {
    throw notFound("Coaching price not found");
  }

  const customer = await prisma.customer.findUnique({ where: { id: actor.customerId } });
  if (!customer) {
    throw notFound("Customer not found");
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      status: "PENDING_PAYMENT",
      customerId: customer.id,
      customerEmail: customer.email,
      customerName: customer.name,
      currency: price.currency,
      subtotalCents: price.unitAmountCents,
      totalCents: price.unitAmountCents,
      items: {
        create: {
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          productType: product.productType,
          quantity: 1,
          currency: price.currency,
          unitAmountCents: price.unitAmountCents,
          lineTotalCents: price.unitAmountCents,
        },
      },
      payments: {
        create: {
          provider: "STRIPE",
          status: "PENDING",
          amountCents: price.unitAmountCents,
          currency: price.currency,
        },
      },
    },
    include: { payments: true },
  });

  const payment = order.payments[0];
  if (!payment) {
    throw badRequest("Payment could not be created");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customer.email,
    success_url: `${input.baseUrl}/outils/schema?coaching=success`,
    cancel_url: `${input.baseUrl}/outils/schema?coaching=cancelled`,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
    },
    line_items: [
      {
        price_data: {
          currency: price.currency.toLowerCase(),
          product_data: { name: product.name },
          unit_amount: price.unitAmountCents,
        },
        quantity: 1,
      },
    ],
  });

  if (!session.url) {
    throw badRequest("Stripe session could not be created");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  return { url: session.url };
}

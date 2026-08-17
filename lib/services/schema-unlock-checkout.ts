import { badRequest, conflict, notFound } from "@/lib/http-errors";
import type { OwnershipActor } from "@/lib/ownership";
import { getProject } from "@/lib/services/project";
import { hasUnlimitedSchemaAccess } from "@/lib/services/schema-unlock";

// v2.1 : checkout express dedie pour le deverrouillage payant d'un Project
// dans l'editeur de schema (9,90e, 60 jours) — deliberement hors du panier
// generique (voir les gardes SCHEMA_UNLOCK dans lib/services/cart.ts et
// lib/services/order.ts) car ce produit n'a de sens que rattache a un
// Project precis, ce que le panier ne sait pas transporter.
export const SCHEMA_UNLOCK_PRODUCT_SLUG = "schema-editor-unlock";

function formatOrderDate(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

// Prefixe "SU-" (Schema Unlock) plutot que "FS-" (utilise par les commandes
// boutique normales, voir lib/services/order.ts) : distingue ces commandes
// express au premier coup d'oeil dans le dashboard admin.
function generateOrderNumber() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SU-${formatOrderDate(new Date())}-${random}`;
}

export async function createSchemaUnlockCheckoutSession(
  actor: OwnershipActor,
  input: { projectId: string; baseUrl: string }
): Promise<{ url: string }> {
  // getProject applique deja requireOwnerOrAdmin (MASTER-10 §40) : un
  // customerId seul ne suffit jamais, il faut etre le proprietaire du
  // Project ou admin.
  const project = await getProject(actor, input.projectId);

  const alreadyUnlocked = await hasUnlimitedSchemaAccess(project.customerId, project.id);
  if (alreadyUnlocked) {
    throw conflict("Project already has unlimited access");
  }

  const [{ prisma }, { stripe }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/stripe"),
  ]);

  const product = await prisma.product.findUnique({
    where: { slug: SCHEMA_UNLOCK_PRODUCT_SLUG },
    include: { prices: { where: { status: "ACTIVE" } } },
  });

  if (!product || product.status !== "ACTIVE" || product.productType !== "SCHEMA_UNLOCK") {
    throw notFound("Schema unlock product not found");
  }

  const price = product.prices[0];
  if (!price) {
    throw notFound("Schema unlock price not found");
  }

  const customer = await prisma.customer.findUnique({ where: { id: project.customerId } });
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
      projectId: project.id,
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
    success_url: `${input.baseUrl}/outils/schema?projectId=${project.id}&unlock=success`,
    cancel_url: `${input.baseUrl}/outils/schema?projectId=${project.id}&unlock=cancelled`,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      projectId: project.id,
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

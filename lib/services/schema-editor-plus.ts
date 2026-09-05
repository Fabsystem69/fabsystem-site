import type Stripe from "stripe";
import { hasCapability } from "@/lib/entitlements";
import { notFound } from "@/lib/http-errors";
import { SCHEMA_EDITOR_UNLIMITED_CAPABILITY } from "@/lib/services/schema-unlock";

export const SCHEMA_EDITOR_PLUS_CAPABILITY = "schema-editor-plus";
export const SCHEMA_EDITOR_PLUS_MONTHLY_PRICE_ENV = "STRIPE_PRICE_ID_SCHEMA_EDITOR_PLUS_MONTHLY";
export const SCHEMA_EDITOR_PLUS_YEARLY_PRICE_ENV = "STRIPE_PRICE_ID_SCHEMA_EDITOR_PLUS_YEARLY";

export const SCHEMA_EDITOR_PLUS_WEEKLY_PRICE_ENV = "STRIPE_PRICE_ID_SCHEMA_EDITOR_PLUS_WEEKLY";

export type SchemaEditorPlusPlan = "weekly" | "monthly" | "yearly";

export const SCHEMA_EDITOR_PLUS_PLANS: Record<SchemaEditorPlusPlan, {
  label: string;
  priceCents: number;
  interval: "week" | "month" | "year";
  priceEnv: string;
}> = {
  weekly: {
    label: "Éditeur Plus hebdomadaire",
    priceCents: 290,
    interval: "week",
    priceEnv: SCHEMA_EDITOR_PLUS_WEEKLY_PRICE_ENV,
  },
  monthly: {
    label: "Éditeur Plus mensuel",
    priceCents: 690,
    interval: "month",
    priceEnv: SCHEMA_EDITOR_PLUS_MONTHLY_PRICE_ENV,
  },
  yearly: {
    label: "Éditeur Plus annuel",
    priceCents: 5900,
    interval: "year",
    priceEnv: SCHEMA_EDITOR_PLUS_YEARLY_PRICE_ENV,
  },
};

// Bug corrigé (retour utilisateur : "je viens de simuler un achat stripe le
// compte reste en editeur gratuit") — comparé à des valeurs en minuscules
// alors que EditorSubscriptionStatus (Prisma) est en majuscules ("ACTIVE",
// "TRIALING"), donc ne matchait jamais : la page /mon-compte/editeur restait
// bloquée sur l'offre gratuite malgré un abonnement réellement actif en
// base. hasSchemaEditorPlusAccess ci-dessous, qui interroge Prisma
// directement avec les bonnes valeurs, n'était pas affectée.
const ACTIVE_STATUSES = new Set(["ACTIVE", "TRIALING"]);

function toDate(unixTimestamp: number | null | undefined) {
  return typeof unixTimestamp === "number" ? new Date(unixTimestamp * 1000) : null;
}

function toLocalStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active": return "ACTIVE" as const;
    case "trialing": return "TRIALING" as const;
    case "past_due": return "PAST_DUE" as const;
    case "unpaid": return "UNPAID" as const;
    case "incomplete":
    case "incomplete_expired": return "INCOMPLETE" as const;
    case "canceled": return "CANCELED" as const;
    default: return "CANCELED" as const;
  }
}

export function isSchemaEditorPlusStatusActive(status: string) {
  return ACTIVE_STATUSES.has(status);
}

export async function hasSchemaEditorPlusAccess(customerId: string, now: Date = new Date()) {
  const [{ prisma }, includedWithAccompaniment] = await Promise.all([
    import("@/lib/prisma"),
    hasCapability(customerId, "schema-editor-unlimited", { scope: "CUSTOMER", scopeId: null, now }),
  ]);

  if (includedWithAccompaniment) return true;

  const subscription = await prisma.editorSubscription.findFirst({
    where: {
      customerId,
      status: { in: ["ACTIVE", "TRIALING"] },
      OR: [{ currentPeriodEndsAt: null }, { currentPeriodEndsAt: { gt: now } }],
    },
    orderBy: { updatedAt: "desc" },
  });

  return Boolean(subscription);
}

export async function getSchemaEditorPlusSummary(customerId: string) {
  const { prisma } = await import("@/lib/prisma");
  const [subscription, includedWithAccompaniment] = await Promise.all([
    prisma.editorSubscription.findFirst({
      where: { customerId },
      orderBy: { updatedAt: "desc" },
    }),
    hasCapability(customerId, "schema-editor-unlimited", { scope: "CUSTOMER", scopeId: null }),
  ]);

  return {
    subscription,
    includedWithAccompaniment,
    active: includedWithAccompaniment || Boolean(subscription && isSchemaEditorPlusStatusActive(subscription.status) &&
      (!subscription.currentPeriodEndsAt || subscription.currentPeriodEndsAt > new Date())),
  };
}

export function getSchemaEditorPlusPriceId(plan: SchemaEditorPlusPlan) {
  const priceId = process.env[SCHEMA_EDITOR_PLUS_PLANS[plan].priceEnv]?.trim();
  if (!priceId) {
    throw notFound("Éditeur Plus is not configured yet");
  }
  return priceId;
}

export async function syncSchemaEditorPlusSubscription(subscription: Stripe.Subscription) {
  const { prisma } = await import("@/lib/prisma");
  const customerEmail = subscription.metadata.fabsystem_customer_email?.trim().toLowerCase();
  const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const priceId = subscription.items.data[0]?.price.id;

  let customerId: string | undefined = subscription.metadata.fabsystem_customer_id?.trim();
  if (!customerId && customerEmail) {
    customerId = (await prisma.customer.findUnique({ where: { email: customerEmail }, select: { id: true } }))?.id;
  }
  if (!customerId || !priceId) {
    throw notFound("Unable to match an Éditeur Plus subscription to a customer");
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } });
  if (!customer) throw notFound("Subscription customer not found");

  return prisma.editorSubscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      customerId: customer.id,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: toLocalStatus(subscription.status),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEndsAt: toDate(subscription.items.data[0]?.current_period_end),
      canceledAt: toDate(subscription.canceled_at),
    },
    update: {
      stripeCustomerId,
      stripePriceId: priceId,
      status: toLocalStatus(subscription.status),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEndsAt: toDate(subscription.items.data[0]?.current_period_end),
      canceledAt: toDate(subscription.canceled_at),
    },
  });
}

export async function createSchemaEditorPlusCheckoutSession(params: {
  customerId: string;
  plan: SchemaEditorPlusPlan;
  baseUrl: string;
}) {
  const [{ prisma }, { stripe }] = await Promise.all([import("@/lib/prisma"), import("@/lib/stripe")]);
  const customer = await prisma.customer.findUnique({ where: { id: params.customerId } });
  if (!customer) throw notFound("Customer not found");

  const active = await hasSchemaEditorPlusAccess(customer.id);
  if (active) throw new Error("Éditeur Plus is already active");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: customer.email,
    success_url: `${params.baseUrl}/mon-compte/editeur?subscription=success`,
    cancel_url: `${params.baseUrl}/mon-compte/editeur?subscription=cancelled`,
    allow_promotion_codes: true,
    line_items: [{ price: getSchemaEditorPlusPriceId(params.plan), quantity: 1 }],
    subscription_data: {
      metadata: {
        fabsystem_customer_id: customer.id,
        fabsystem_customer_email: customer.email,
        fabsystem_product: "schema-editor-plus",
        fabsystem_plan: params.plan,
      },
    },
    metadata: {
      fabsystem_flow: "schema-editor-plus",
      fabsystem_customer_id: customer.id,
      fabsystem_plan: params.plan,
    },
  });

  if (!session.url) throw new Error("Stripe checkout session URL is missing");
  return { url: session.url };
}

export async function createSchemaEditorPlusPortalSession(params: { customerId: string; baseUrl: string }) {
  const summary = await getSchemaEditorPlusSummary(params.customerId);
  const stripeCustomerId = summary.subscription?.stripeCustomerId;
  if (!stripeCustomerId) throw notFound("No Éditeur Plus billing account found");
  const { stripe } = await import("@/lib/stripe");
  const portal = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${params.baseUrl}/mon-compte/editeur`,
  });
  return { url: portal.url };
}

// --- Octroi manuel (dashboard) ---
// Offrir de l'accès Éditeur Plus à un client sans passer par Stripe, en
// réutilisant le même mécanisme que l'accès inclus avec un accompagnement
// (CustomerCapability, capability="schema-editor-unlimited") plutôt que
// d'inventer un système parallèle — hasSchemaEditorPlusAccess le voit donc
// automatiquement.
const MANUAL_GRANT_SOURCE_PREFIX = "manual-grant:";

export async function grantSchemaEditorPlusManually(params: {
  customerId: string;
  days: number;
  note?: string | null;
}) {
  const { prisma } = await import("@/lib/prisma");

  if (!Number.isInteger(params.days) || params.days <= 0) {
    throw notFound("Invalid grant duration");
  }

  const customer = await prisma.customer.findUnique({ where: { id: params.customerId }, select: { id: true } });
  if (!customer) throw notFound("Customer not found");

  const now = new Date();
  return prisma.customerCapability.create({
    data: {
      customerId: customer.id,
      capability: SCHEMA_EDITOR_UNLIMITED_CAPABILITY,
      scope: "CUSTOMER",
      source: `${MANUAL_GRANT_SOURCE_PREFIX}${now.getTime()}`,
      startsAt: now,
      expiresAt: new Date(now.getTime() + params.days * 24 * 60 * 60 * 1000),
    },
  });
}

export async function revokeSchemaEditorPlusManualGrant(capabilityId: string) {
  const { prisma } = await import("@/lib/prisma");
  const capability = await prisma.customerCapability.findUnique({ where: { id: capabilityId } });

  if (!capability || !capability.source?.startsWith(MANUAL_GRANT_SOURCE_PREFIX)) {
    throw notFound("Manual grant not found");
  }

  return prisma.customerCapability.update({
    where: { id: capabilityId },
    data: { status: "REVOKED", revokedAt: new Date() },
  });
}

// Toutes les capabilities editeur (incluses avec accompagnement + octrois
// manuels) d'un client, pour affichage admin sur sa fiche — distingue
// l'origine via le prefixe de `source` plutot que de dupliquer un flag.
export async function listSchemaEditorAccessGrantsForCustomer(customerId: string) {
  const { prisma } = await import("@/lib/prisma");
  const capabilities = await prisma.customerCapability.findMany({
    where: { customerId, capability: SCHEMA_EDITOR_UNLIMITED_CAPABILITY },
    orderBy: { createdAt: "desc" },
  });

  return capabilities.map((capability) => ({
    ...capability,
    isManual: capability.source?.startsWith(MANUAL_GRANT_SOURCE_PREFIX) ?? false,
  }));
}

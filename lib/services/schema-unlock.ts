import { getCustomerCapabilities, hasCapability } from "@/lib/entitlements";
import { grantCapability } from "@/lib/services/capabilities";

// v2.1 : palier gratuit/payant de l'editeur de schema. S'appuie sur le
// moteur de capacites generique existant (lib/entitlements.ts,
// lib/services/capabilities.ts, MASTER-11) plutot que d'inventer un nouveau
// mecanisme — deux formes possibles pour cette meme capability :
// - scope=PROJECT, scopeId=<projectId> : achat unitaire (60 jours), un seul
//   projet.
// - scope=CUSTOMER (pas de scopeId) : code promo communautaire (7 jours),
//   tous les projets du compte.
export const SCHEMA_EDITOR_UNLIMITED_CAPABILITY = "schema-editor-unlimited";

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function hasUnlimitedSchemaAccess(
  customerId: string,
  projectId: string,
  now: Date = new Date()
): Promise<boolean> {
  const [projectScoped, accountWide] = await Promise.all([
    hasCapability(customerId, SCHEMA_EDITOR_UNLIMITED_CAPABILITY, {
      scope: "PROJECT",
      scopeId: projectId,
      now,
    }),
    hasCapability(customerId, SCHEMA_EDITOR_UNLIMITED_CAPABILITY, {
      scope: "CUSTOMER",
      scopeId: null,
      now,
    }),
  ]);

  return projectScoped || accountWide;
}

// v2.1 : un Project ayant deja recu un deverrouillage payant (scope=PROJECT)
// qui n'est plus actif aujourd'hui repasse en lecture seule complete —
// jamais retrograde silencieusement au comptage "3 consommateurs" du palier
// gratuit (decision produit : rien de deja construit ne redevient
// modifiable/exportable sans renouveler). Un projet qui n'a jamais ete
// deverrouille n'est jamais concerne par cette regle, meme s'il a plus de 3
// consommateurs (ex: cree via un code promo CUSTOMER expire depuis).
export async function wasProjectEverUnlocked(customerId: string, projectId: string): Promise<boolean> {
  const capabilities = await getCustomerCapabilities(customerId);
  return capabilities.some(
    (capability) =>
      capability.capability === SCHEMA_EDITOR_UNLIMITED_CAPABILITY &&
      capability.scope === "PROJECT" &&
      capability.scopeId === projectId
  );
}

export async function isProjectReadOnly(
  customerId: string,
  projectId: string,
  now: Date = new Date()
): Promise<boolean> {
  const [everUnlocked, currentlyUnlimited] = await Promise.all([
    wasProjectEverUnlocked(customerId, projectId),
    hasUnlimitedSchemaAccess(customerId, projectId, now),
  ]);

  return everUnlocked && !currentlyUnlimited;
}

// Appele par le webhook Stripe apres confirmation de paiement d'un
// SCHEMA_UNLOCK (voir stripe-webhook-commerce.ts) — jamais appele
// directement depuis une route publique.
export async function grantProjectUnlock(params: {
  customerId: string;
  projectId: string;
  source: string;
  durationDays?: number;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  return grantCapability({
    customerId: params.customerId,
    capability: SCHEMA_EDITOR_UNLIMITED_CAPABILITY,
    scope: "PROJECT",
    scopeId: params.projectId,
    source: params.source,
    startsAt: now,
    expiresAt: addDays(now, params.durationDays ?? 60),
  });
}

// Appele par le webhook Stripe (stripe-webhook-commerce.ts) apres
// confirmation de paiement d'une commande contenant un item SCHEMA_UNLOCK.
// Appele aussi sur une redelivery Stripe (already_processed) : grantCapability
// n'est pas idempotent par construction (pas de contrainte unique), donc
// l'appelant doit s'assurer de ne pas rappeler deux fois pour la meme
// commande — voir la garde dans stripe-webhook-commerce.ts (recherche d'une
// capability existante avec source=order:<orderId> avant de creer).
export async function grantProjectUnlockForOrder(params: {
  orderId: string;
  now?: Date;
}) {
  const { prisma } = await import("@/lib/prisma");

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { items: true },
  });

  if (!order || !order.customerId || !order.projectId) {
    return { granted: false as const, reason: "not_a_schema_unlock_order" as const };
  }

  const hasSchemaUnlockItem = order.items.some((item) => item.productType === "SCHEMA_UNLOCK");
  if (!hasSchemaUnlockItem) {
    return { granted: false as const, reason: "not_a_schema_unlock_order" as const };
  }

  const source = `order:${order.id}`;
  const existing = await prisma.customerCapability.findFirst({
    where: { customerId: order.customerId, source },
  });

  if (existing) {
    return { granted: false as const, reason: "already_granted" as const };
  }

  const capability = await grantProjectUnlock({
    customerId: order.customerId,
    projectId: order.projectId,
    source,
    now: params.now,
  });

  return { granted: true as const, capability };
}

// Appele par la redemption d'un TrialAccessCode (code promo communautaire).
export async function grantAccountWideTrial(params: {
  customerId: string;
  source: string;
  durationDays?: number;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  return grantCapability({
    customerId: params.customerId,
    capability: SCHEMA_EDITOR_UNLIMITED_CAPABILITY,
    scope: "CUSTOMER",
    scopeId: null,
    source: params.source,
    startsAt: now,
    expiresAt: addDays(now, params.durationDays ?? 7),
  });
}

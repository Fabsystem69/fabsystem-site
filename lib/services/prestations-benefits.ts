import { randomBytes } from "node:crypto";
import { normalizeCustomerEmail } from "@/lib/services/customer-auth";
import {
  PRESTATIONS_EDITOR_ACCESS_DAYS,
  PRESTATIONS_INCLUDED_EBOOK_SLUG,
  isPrestationsOfferSlug,
} from "@/lib/prestations-offers";
import { SCHEMA_EDITOR_UNLIMITED_CAPABILITY } from "@/lib/services/schema-unlock";

export const PRESTATIONS_BENEFIT_REASON = "Avantages inclus avec un accompagnement FabSystem";

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function codeForOrder(prefix: string, orderId: string) {
  return `${prefix}-${orderId.replace(/[^a-z0-9]/gi, "").toUpperCase()}`;
}

function editorCode() {
  return `EDITEUR365-${randomBytes(5).toString("hex").toUpperCase()}`;
}

// Déclenché uniquement après un paiement confirmé. Chaque création est
// idempotente par identifiant de commande afin de supporter les redeliveries Stripe.
export async function grantPrestationsBenefitsForOrder(orderId: string) {
  const { prisma } = await import("@/lib/prisma");
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, customerId: true, customerEmail: true, items: { select: { productSlug: true } } },
  });

  if (!order || !order.items.some((item) => isPrestationsOfferSlug(item.productSlug))) {
    return { status: "not_applicable" as const };
  }

  const now = new Date();
  const expiresAt = addDays(now, PRESTATIONS_EDITOR_ACCESS_DAYS);
  const existingCode = await prisma.trialAccessCode.findUnique({
    where: { sourceOrderId: order.id },
    select: { code: true },
  });
  if (!existingCode) {
    await prisma.trialAccessCode.create({
      data: {
        code: editorCode(),
        capability: SCHEMA_EDITOR_UNLIMITED_CAPABILITY,
        durationDays: PRESTATIONS_EDITOR_ACCESS_DAYS,
        maxRedemptions: 1,
        recipientEmail: normalizeCustomerEmail(order.customerEmail),
        sourceOrderId: order.id,
        reason: "12 mois d'accès à l'éditeur inclus avec l'accompagnement",
        status: "ACTIVE",
      },
    });
  }

  const ebook = await prisma.product.findUnique({
    where: { slug: PRESTATIONS_INCLUDED_EBOOK_SLUG },
    include: { prices: { where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const ebookPrice = ebook?.prices[0];

  if (ebook && ebook.status === "ACTIVE" && ebookPrice) {
    await prisma.discountCode.upsert({
      where: { code: codeForOrder("EBOOK-OFFERT", order.id) },
      create: {
        code: codeForOrder("EBOOK-OFFERT", order.id),
        status: "ACTIVE",
        type: "FIXED_AMOUNT",
        amountOffCents: ebookPrice.unitAmountCents,
        percentOff: null,
        currency: ebookPrice.currency,
        maxRedemptions: 1,
        redeemedCount: 0,
        startsAt: now,
        expiresAt,
        productId: ebook.id,
        customerEmail: normalizeCustomerEmail(order.customerEmail),
        reason: PRESTATIONS_BENEFIT_REASON,
      },
      update: {},
    });
  }

  return { status: "granted" as const, ebookCodeCreated: Boolean(ebook && ebookPrice) };
}

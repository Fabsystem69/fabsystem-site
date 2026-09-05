import type { PrismaClient } from "@/lib/generated/prisma/client";
import { PRESTATIONS_OFFERS, type PrestationsOfferDefinition } from "@/lib/prestations-offers";

type PrismaClientLike = PrismaClient;

export type SeedPrestationsOffersResult = {
  seeded: { slug: string; productId: string; priceCents: number }[];
  archivedLegacyProducts: number;
};

async function seedOffer(db: PrismaClientLike, offer: PrestationsOfferDefinition) {
  const product = await db.product.upsert({
    where: { slug: offer.slug },
    update: {
      name: offer.name,
      shortDescription: offer.shortDescription,
      description: offer.description,
      status: "ACTIVE",
      productType: "DIGITAL_DOWNLOAD",
      purchaseMode: "BUY_NOW",
      featuredImage: null,
    },
    create: {
      slug: offer.slug,
      name: offer.name,
      shortDescription: offer.shortDescription,
      description: offer.description,
      status: "ACTIVE",
      productType: "DIGITAL_DOWNLOAD",
      purchaseMode: "BUY_NOW",
      featuredImage: null,
    },
  });

  const matchingPrice = await db.productPrice.findFirst({
    where: { productId: product.id, currency: "EUR", unitAmountCents: offer.priceCents, status: "ACTIVE" },
  });

  if (!matchingPrice) {
    await db.productPrice.updateMany({
      where: { productId: product.id, status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });
    await db.productPrice.create({
      data: { productId: product.id, currency: "EUR", unitAmountCents: offer.priceCents, status: "ACTIVE" },
    });
  }

  return { slug: offer.slug, productId: product.id, priceCents: offer.priceCents };
}

// Source unique pour le catalogue vendu par Stripe des accompagnements
// (lib/prestations-offers.ts) — utilisee a la fois par le script CLI
// (scripts/seed-prestations-offers.ts, execution manuelle post-deploiement)
// et par l'action dashboard, pour ne jamais desynchroniser les deux chemins.
// Idempotent : upsert par slug, prix remplace seulement si aucun prix actif
// ne correspond deja au montant courant.
export async function seedPrestationsOffers(db: PrismaClientLike): Promise<SeedPrestationsOffersResult> {
  const seeded = [];
  for (const offer of PRESTATIONS_OFFERS) {
    seeded.push(await seedOffer(db, offer));
  }

  const archived = await db.product.updateMany({
    where: { slug: { startsWith: "pack-" }, status: "ACTIVE" },
    data: { status: "ARCHIVED" },
  });

  return { seeded, archivedLegacyProducts: archived.count };
}

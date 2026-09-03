// Met à jour le catalogue vendu par Stripe pour les accompagnements actuels.
// Les paiements Stripe utilisent les ProductPrice locaux pour construire
// price_data : aucun Price ID Stripe pré-créé n'est nécessaire.
//
// Usage local : npx tsx scripts/seed-prestations-offers.ts
// Production : exécuter manuellement une fois le déploiement en ligne.

import { loadEnvConfig } from "@next/env";
import { createRequire } from "node:module";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PRESTATIONS_OFFERS } from "@/lib/prestations-offers";

loadEnvConfig(process.cwd());

const require = createRequire(import.meta.url);
const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
const { Pool } = require("pg") as typeof import("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Missing DATABASE_URL");

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool), log: ["error"] });

async function seedOffer(offer: (typeof PRESTATIONS_OFFERS)[number]) {
  const product = await prisma.product.upsert({
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

  const matchingPrice = await prisma.productPrice.findFirst({
    where: { productId: product.id, currency: "EUR", unitAmountCents: offer.priceCents, status: "ACTIVE" },
  });

  if (!matchingPrice) {
    await prisma.productPrice.updateMany({
      where: { productId: product.id, status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });
    await prisma.productPrice.create({
      data: { productId: product.id, currency: "EUR", unitAmountCents: offer.priceCents, status: "ACTIVE" },
    });
  }

  return { slug: offer.slug, productId: product.id, priceCents: offer.priceCents };
}

async function main() {
  const seeded = [];
  for (const offer of PRESTATIONS_OFFERS) seeded.push(await seedOffer(offer));

  // Les anciens packs restent dans la base et dans les commandes passées,
  // mais ne doivent plus apparaître comme des offres achetables.
  const archived = await prisma.product.updateMany({
    where: { slug: { startsWith: "pack-" }, status: "ACTIVE" },
    data: { status: "ARCHIVED" },
  });

  console.log(JSON.stringify({ seeded, archivedLegacyProducts: archived.count }, null, 2));
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });

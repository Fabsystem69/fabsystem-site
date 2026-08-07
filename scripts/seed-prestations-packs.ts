// Enregistre les 12 packs d'accompagnement à distance (Amarrage/Cap/
// Passerelle/Grand Large × Van/Camping-car/Bateau) dans le catalogue
// Product/ProductPrice existant — aucune migration Prisma, aucune donnée
// Stripe : les mêmes tables que pour les ebooks, avec price_data dynamique
// à la création de la session Checkout (voir lib/services/checkout.ts).
//
// Idempotent : peut être relancé sans effet de bord (upsert par slug).
// Pour les packs Cap/Passerelle/Grand Large en catégorie van/bateau, lie
// aussi le ProductAsset de l'ebook correspondant — c'est ce lien, réutilisant
// le mécanisme DownloadGrant déjà en place pour les ebooks, qui déclenche
// l'octroi automatique d'accès (voir createDownloadGrantsForOrder). Si
// l'ebook n'existe pas encore dans le catalogue (ex. "ebook bateau" pas
// encore créé), le lien est simplement ignoré avec un avertissement.
//
// Usage : npx tsx scripts/seed-prestations-packs.ts
// A rejouer manuellement contre la base de production après validation
// (voir docs/06-DEPLOYMENT.md — même politique que les migrations Prisma).

import { loadEnvConfig } from "@next/env";
import { createRequire } from "node:module";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { listPrestationsPackDefinitions } from "@/lib/prestations-packs";

loadEnvConfig(process.cwd());

const require = createRequire(import.meta.url);
const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
const { Pool } = require("pg") as typeof import("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL");
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: ["error"],
});

async function seedPack(definition: ReturnType<typeof listPrestationsPackDefinitions>[number]) {
  const product = await prisma.product.upsert({
    where: { slug: definition.slug },
    update: {
      name: definition.name,
      shortDescription: `Accompagnement à distance FabSystem — palier ${definition.palier}.`,
      description:
        "Pack d'accompagnement à distance FabSystem. Le contenu détaillé du palier est présenté sur la page /prestations.",
      status: "ACTIVE",
      // Reutilise DIGITAL_DOWNLOAD (aucun productType "pack/service" n'existe
      // dans le schema actuel ; en ajouter un necessiterait une migration
      // d'enum, hors scope de cette mission — voir rapport).
      productType: "DIGITAL_DOWNLOAD",
      purchaseMode: "BUY_NOW",
      featuredImage: null,
    },
    create: {
      slug: definition.slug,
      name: definition.name,
      shortDescription: `Accompagnement à distance FabSystem — palier ${definition.palier}.`,
      description:
        "Pack d'accompagnement à distance FabSystem. Le contenu détaillé du palier est présenté sur la page /prestations.",
      status: "ACTIVE",
      productType: "DIGITAL_DOWNLOAD",
      purchaseMode: "BUY_NOW",
      featuredImage: null,
    },
  });

  const existingMatchingPrice = await prisma.productPrice.findFirst({
    where: {
      productId: product.id,
      currency: "EUR",
      unitAmountCents: definition.priceCents,
      compareAtAmountCents: null,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "asc" },
  });

  if (existingMatchingPrice) {
    await prisma.productPrice.update({
      where: { id: existingMatchingPrice.id },
      data: { status: "ACTIVE" },
    });
  } else {
    // Archive les anciens prix actifs pour ce produit avant d'en créer un
    // nouveau (même logique que le dashboard catalogue : jamais deux prix
    // ACTIVE simultanés pour le même produit).
    await prisma.productPrice.updateMany({
      where: { productId: product.id, status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });

    await prisma.productPrice.create({
      data: {
        productId: product.id,
        currency: "EUR",
        unitAmountCents: definition.priceCents,
        compareAtAmountCents: null,
        status: "ACTIVE",
      },
    });
  }

  let ebookLinked = false;

  if (definition.grantsEbookSlug) {
    const ebookProduct = await prisma.product.findUnique({
      where: { slug: definition.grantsEbookSlug },
      include: { assets: { include: { asset: true } } },
    });

    const ebookAsset = ebookProduct?.assets.find((a) => a.asset.status === "ACTIVE")?.asset;

    if (ebookProduct && ebookAsset) {
      await prisma.productAsset.upsert({
        where: {
          productId_assetId: {
            productId: product.id,
            assetId: ebookAsset.id,
          },
        },
        update: { sortOrder: 0 },
        create: {
          productId: product.id,
          assetId: ebookAsset.id,
          sortOrder: 0,
        },
      });
      ebookLinked = true;
    }
  }

  return {
    slug: definition.slug,
    productId: product.id,
    priceCents: definition.priceCents,
    grantsEbookSlug: definition.grantsEbookSlug,
    ebookLinked,
  };
}

async function main() {
  const definitions = listPrestationsPackDefinitions();
  const results = [];

  for (const definition of definitions) {
    results.push(await seedPack(definition));
  }

  for (const result of results) {
    if (result.grantsEbookSlug && !result.ebookLinked) {
      console.warn(
        `[seed-prestations-packs] ${result.slug} : ebook "${result.grantsEbookSlug}" introuvable dans le catalogue — aucun DownloadGrant ne sera créé pour ce pack tant que ce produit n'existe pas.`
      );
    }
  }

  console.log(JSON.stringify({ seeded: results.length, results }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

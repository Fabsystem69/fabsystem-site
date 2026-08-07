import { loadEnvConfig } from "@next/env";
import { createRequire } from "node:module";
import { PrismaClient } from "@/lib/generated/prisma/client";

loadEnvConfig(process.cwd());

const require = createRequire(import.meta.url);
const { PrismaPg } =
  require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
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

const PRODUCT_SLUG = "ebook-electricite-van";
const PRODUCT_NAME = "Ebook Électricité Van";
const DEFAULT_BUCKET = "ebooks-private";
const ASSET_PATH = "ebooks/ebook-electricite-van/v1/ebook-electricite-van.pdf";
const ASSET_FILENAME = "ebook-electricite-van.pdf";

async function seedDigitalCatalog() {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET_EBOOKS?.trim() || DEFAULT_BUCKET;

  const product = await prisma.product.upsert({
    where: { slug: PRODUCT_SLUG },
    update: {
      name: PRODUCT_NAME,
      shortDescription:
        "Le guide FabSystem pour câbler un van aménagé sans se planter.",
      description:
        "Le guide complet pour comprendre, dimensionner et câbler soi-même l'installation électrique d'un van aménagé : bases du 12V, batterie et solaire, choix du matériel, pose dans l'ordre, plomberie embarquée, mise en service et vie avec l'installation.",
      status: "ACTIVE",
      productType: "EBOOK",
      purchaseMode: "BUY_NOW",
      featuredImage: "/ebook/couverture.jpg",
    },
    create: {
      slug: PRODUCT_SLUG,
      name: PRODUCT_NAME,
      shortDescription:
        "Le guide FabSystem pour câbler un van aménagé sans se planter.",
      description:
        "Le guide complet pour comprendre, dimensionner et câbler soi-même l'installation électrique d'un van aménagé : bases du 12V, batterie et solaire, choix du matériel, pose dans l'ordre, plomberie embarquée, mise en service et vie avec l'installation.",
      status: "ACTIVE",
      productType: "EBOOK",
      purchaseMode: "BUY_NOW",
      featuredImage: "/ebook/couverture.jpg",
    },
  });

  const asset = await prisma.digitalAsset.upsert({
    where: {
      bucket_path: {
        bucket,
        path: ASSET_PATH,
      },
    },
    update: {
      provider: "SUPABASE",
      filename: ASSET_FILENAME,
      contentType: "application/pdf",
      sizeBytes: 0,
      version: "v1",
      status: "ACTIVE",
    },
    create: {
      provider: "SUPABASE",
      bucket,
      path: ASSET_PATH,
      filename: ASSET_FILENAME,
      contentType: "application/pdf",
      sizeBytes: 0,
      version: "v1",
      status: "ACTIVE",
    },
  });

  // getActivePriceForProduct() rejette (conflict) des qu'un produit a plus
  // d'un prix ACTIVE : on ne cree un prix par defaut que s'il n'en existe
  // encore aucun. Le montant reel est ensuite gere depuis le dashboard, le
  // seed ne doit jamais l'ecraser ni en dupliquer un second.
  const existingActivePrice = await prisma.productPrice.findFirst({
    where: {
      productId: product.id,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "asc" },
  });

  if (!existingActivePrice) {
    await prisma.productPrice.create({
      data: {
        productId: product.id,
        currency: "EUR",
        unitAmountCents: 2900,
        compareAtAmountCents: null,
        status: "ACTIVE",
      },
    });
  }

  await prisma.productAsset.upsert({
    where: {
      productId_assetId: {
        productId: product.id,
        assetId: asset.id,
      },
    },
    update: {
      sortOrder: 0,
    },
    create: {
      productId: product.id,
      assetId: asset.id,
      sortOrder: 0,
    },
  });

  return {
    productSlug: product.slug,
    assetBucket: asset.bucket,
    assetPath: asset.path,
  };
}

// L'ebook bateau a ete cree depuis le dashboard, avec ses propres assets
// (HTML haute qualite, HTML mobile, EPUB) deja lies en base : on ne touche
// ici qu'aux champs marketing, jamais aux assets/prix/statut geres par le
// dashboard. updateMany() est volontairement un no-op silencieux si le
// produit n'existe pas encore dans l'environnement cible.
async function seedBateauMetadata() {
  await prisma.product.updateMany({
    where: { slug: "ebook-electricite-bateau" },
    data: {
      description:
        "Le guide complet pour un bateau qui a déjà vécu : diagnostiquer l'existant avant de reprendre quoi que ce soit, comprendre les normes et l'assurance, concevoir et choisir son matériel, installer pas à pas, mettre en réseau NMEA, refaire sa plomberie, mettre en service et vivre au quotidien avec son installation.",
      featuredImage: "/ebook/couverture-bateau.jpg",
    },
  });
}

async function main() {
  const result = await seedDigitalCatalog();
  await seedBateauMetadata();
  console.log(
    JSON.stringify(
      {
        seeded: true,
        productSlug: result.productSlug,
        assetBucket: result.assetBucket,
        assetPath: result.assetPath,
      },
      null,
      2
    )
  );
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

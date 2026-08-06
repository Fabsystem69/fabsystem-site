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
        "Le guide FabSystem pour cabler un van amenage sans se planter.",
      description:
        "Un produit de developpement pour valider le catalogue numerique FabSystem autour d'un ebook prive et achetable.",
      status: "ACTIVE",
      productType: "EBOOK",
      purchaseMode: "BUY_NOW",
      featuredImage: null,
    },
    create: {
      slug: PRODUCT_SLUG,
      name: PRODUCT_NAME,
      shortDescription:
        "Le guide FabSystem pour cabler un van amenage sans se planter.",
      description:
        "Un produit de developpement pour valider le catalogue numerique FabSystem autour d'un ebook prive et achetable.",
      status: "ACTIVE",
      productType: "EBOOK",
      purchaseMode: "BUY_NOW",
      featuredImage: null,
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

  const existingMatchingPrice = await prisma.productPrice.findFirst({
    where: {
      productId: product.id,
      currency: "EUR",
      unitAmountCents: 2900,
      compareAtAmountCents: null,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "asc" },
  });

  if (existingMatchingPrice) {
    await prisma.productPrice.update({
      where: { id: existingMatchingPrice.id },
      data: {
        currency: "EUR",
        unitAmountCents: 2900,
        compareAtAmountCents: null,
        status: "ACTIVE",
      },
    });
  } else {
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

async function main() {
  const result = await seedDigitalCatalog();
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

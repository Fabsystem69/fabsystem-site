import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/internal-api";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIGRATION_NAME = "20260901103000_add_purchased_schema_editor_trial";
const MIGRATION_SQL = `-- Codes issus d'un achat : lien de commande unique pour l'idempotence Stripe
-- et adresse destinataire pour empecher le transfert a un autre compte.
-- Les deux champs restent nullable afin de conserver les codes communautaires.
ALTER TABLE "TrialAccessCode"
ADD COLUMN "sourceOrderId" TEXT,
ADD COLUMN "recipientEmail" TEXT;

CREATE UNIQUE INDEX "TrialAccessCode_sourceOrderId_key"
ON "TrialAccessCode"("sourceOrderId");

CREATE INDEX "TrialAccessCode_recipientEmail_idx"
ON "TrialAccessCode"("recipientEmail");
`;

const ASSETS = [
  {
    bucket: "ebooks-private",
    path: "ebooks/ebook-schema-electrique/v1/dessiner-son-installation-electrique.pdf",
    filename: "Dessiner-son-installation-electrique.pdf",
    contentType: "application/pdf",
    sizeBytes: 3327092,
  },
  {
    bucket: "ebooks-private",
    path: "ebooks/ebook-schema-electrique/v1/dessiner-son-installation-electrique.epub",
    filename: "Dessiner-son-installation-electrique.epub",
    contentType: "application/epub+zip",
    sizeBytes: 2257643,
  },
] as const;

async function applyPurchasedTrialMigration() {
  const applied = await prisma.$queryRaw<Array<{ migration_name: string }>>`
    SELECT "migration_name"
    FROM "_prisma_migrations"
    WHERE "migration_name" = ${MIGRATION_NAME}
    LIMIT 1
  `;

  if (applied.length > 0) {
    return false;
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      'ALTER TABLE "TrialAccessCode" ADD COLUMN IF NOT EXISTS "sourceOrderId" TEXT'
    );
    await tx.$executeRawUnsafe(
      'ALTER TABLE "TrialAccessCode" ADD COLUMN IF NOT EXISTS "recipientEmail" TEXT'
    );
    await tx.$executeRawUnsafe(
      'CREATE UNIQUE INDEX IF NOT EXISTS "TrialAccessCode_sourceOrderId_key" ON "TrialAccessCode"("sourceOrderId")'
    );
    await tx.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "TrialAccessCode_recipientEmail_idx" ON "TrialAccessCode"("recipientEmail")'
    );
    await tx.$executeRaw`
      INSERT INTO "_prisma_migrations" (
        "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"
      ) VALUES (
        ${randomUUID()},
        ${createHash("sha256").update(MIGRATION_SQL).digest("hex")},
        NOW(),
        ${MIGRATION_NAME},
        NULL,
        NULL,
        NOW(),
        1
      )
    `;
  });

  return true;
}

// Operation d'administration ponctuelle : publie exclusivement l'ebook dont
// les deux fichiers ont deja ete controles dans le bucket prive Supabase.
export async function POST() {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const migrationApplied = await applyPurchasedTrialMigration();

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.upsert({
        where: { slug: "ebook-schema-electrique" },
        create: {
          slug: "ebook-schema-electrique",
          name: "Dessiner son installation électrique",
          shortDescription:
            "Guide pratique pour lire, organiser et faire relire le schéma électrique d'un van, bateau ou camping-car.",
          description:
            "PDF imprimable et EPUB. L'achat inclut un code personnel donnant 30 jours d'accès complet à l'éditeur de schémas FabSystem.",
          featuredImage: "/ebook/ebook-schema-fabsystem-images/couverture-schema.png",
          status: "ACTIVE",
          productType: "EBOOK",
          purchaseMode: "BUY_NOW",
        },
        update: {
          status: "ACTIVE",
          name: "Dessiner son installation électrique",
          shortDescription:
            "Guide pratique pour lire, organiser et faire relire le schéma électrique d'un van, bateau ou camping-car.",
          description:
            "PDF imprimable et EPUB. L'achat inclut un code personnel donnant 30 jours d'accès complet à l'éditeur de schémas FabSystem.",
          featuredImage: "/ebook/ebook-schema-fabsystem-images/couverture-schema.png",
        },
      });

      const assets = await Promise.all(
        ASSETS.map((asset) =>
          tx.digitalAsset.upsert({
            where: { bucket_path: { bucket: asset.bucket, path: asset.path } },
            create: { ...asset, provider: "SUPABASE", status: "ACTIVE", version: "v1" },
            update: { ...asset, provider: "SUPABASE", status: "ACTIVE", version: "v1" },
          })
        )
      );

      await Promise.all(
        assets.map((asset, sortOrder) =>
          tx.productAsset.upsert({
            where: { productId_assetId: { productId: product.id, assetId: asset.id } },
            create: { productId: product.id, assetId: asset.id, sortOrder },
            update: { sortOrder },
          })
        )
      );

      const activePrices = await tx.productPrice.findMany({
        where: { productId: product.id, status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
      });
      const primaryPrice = activePrices.shift();

      if (primaryPrice) {
        await tx.productPrice.update({
          where: { id: primaryPrice.id },
          data: { currency: "EUR", unitAmountCents: 1490, compareAtAmountCents: null },
        });
        if (activePrices.length > 0) {
          await tx.productPrice.updateMany({
            where: { id: { in: activePrices.map((price) => price.id) } },
            data: { status: "ARCHIVED" },
          });
        }
      } else {
        await tx.productPrice.create({
          data: { productId: product.id, currency: "EUR", unitAmountCents: 1490, status: "ACTIVE" },
        });
      }

      return { productId: product.id, assetCount: assets.length };
    });

    return NextResponse.json({ ok: true, migrationApplied, ...result });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.catalog.publish-ebook-schema.post");
  }
}

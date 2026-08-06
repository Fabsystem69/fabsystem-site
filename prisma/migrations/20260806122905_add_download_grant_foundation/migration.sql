-- CreateEnum
CREATE TYPE "DownloadGrantStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "DownloadGrant" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "status" "DownloadGrantStatus" NOT NULL DEFAULT 'ACTIVE',
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "maxDownloads" INTEGER NOT NULL DEFAULT 10,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastDownloadedAt" TIMESTAMP(3),

    CONSTRAINT "DownloadGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DownloadGrant_orderId_idx" ON "DownloadGrant"("orderId");

-- CreateIndex
CREATE INDEX "DownloadGrant_orderItemId_idx" ON "DownloadGrant"("orderItemId");

-- CreateIndex
CREATE INDEX "DownloadGrant_productId_idx" ON "DownloadGrant"("productId");

-- CreateIndex
CREATE INDEX "DownloadGrant_assetId_idx" ON "DownloadGrant"("assetId");

-- CreateIndex
CREATE INDEX "DownloadGrant_customerEmail_idx" ON "DownloadGrant"("customerEmail");

-- CreateIndex
CREATE INDEX "DownloadGrant_status_idx" ON "DownloadGrant"("status");

-- CreateIndex
CREATE INDEX "DownloadGrant_expiresAt_idx" ON "DownloadGrant"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DownloadGrant_orderItemId_assetId_key" ON "DownloadGrant"("orderItemId", "assetId");

-- AddForeignKey
ALTER TABLE "DownloadGrant" ADD CONSTRAINT "DownloadGrant_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadGrant" ADD CONSTRAINT "DownloadGrant_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadGrant" ADD CONSTRAINT "DownloadGrant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadGrant" ADD CONSTRAINT "DownloadGrant_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "DigitalAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

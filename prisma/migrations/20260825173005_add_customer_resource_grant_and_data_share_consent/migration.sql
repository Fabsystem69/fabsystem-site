-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "dataShareConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dataShareConsentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CustomerResourceGrant" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "note" TEXT,
    "status" "DownloadGrantStatus" NOT NULL DEFAULT 'ACTIVE',
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "maxDownloads" INTEGER NOT NULL DEFAULT 10,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastDownloadedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerResourceGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerResourceGrant_customerId_idx" ON "CustomerResourceGrant"("customerId");

-- CreateIndex
CREATE INDEX "CustomerResourceGrant_productId_idx" ON "CustomerResourceGrant"("productId");

-- CreateIndex
CREATE INDEX "CustomerResourceGrant_assetId_idx" ON "CustomerResourceGrant"("assetId");

-- CreateIndex
CREATE INDEX "CustomerResourceGrant_status_idx" ON "CustomerResourceGrant"("status");

-- CreateIndex
CREATE INDEX "CustomerResourceGrant_expiresAt_idx" ON "CustomerResourceGrant"("expiresAt");

-- AddForeignKey
ALTER TABLE "CustomerResourceGrant" ADD CONSTRAINT "CustomerResourceGrant_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerResourceGrant" ADD CONSTRAINT "CustomerResourceGrant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerResourceGrant" ADD CONSTRAINT "CustomerResourceGrant_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "DigitalAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

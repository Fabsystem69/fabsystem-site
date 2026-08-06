-- CreateEnum
CREATE TYPE "DiscountCodeStatus" AS ENUM ('ACTIVE', 'DISABLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DiscountCodeType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountCodeId" TEXT,
ADD COLUMN     "discountTotalCents" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DiscountCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "DiscountCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "type" "DiscountCodeType" NOT NULL,
    "amountOffCents" INTEGER,
    "percentOff" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "maxRedemptions" INTEGER NOT NULL DEFAULT 1,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "productId" TEXT,
    "customerEmail" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountRedemption" (
    "id" TEXT NOT NULL,
    "discountCodeId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "productId" TEXT,
    "amountDiscountedCents" INTEGER NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCode_code_key" ON "DiscountCode"("code");

-- CreateIndex
CREATE INDEX "DiscountCode_status_idx" ON "DiscountCode"("status");

-- CreateIndex
CREATE INDEX "DiscountCode_productId_idx" ON "DiscountCode"("productId");

-- CreateIndex
CREATE INDEX "DiscountCode_customerEmail_idx" ON "DiscountCode"("customerEmail");

-- CreateIndex
CREATE INDEX "DiscountCode_expiresAt_idx" ON "DiscountCode"("expiresAt");

-- CreateIndex
CREATE INDEX "DiscountRedemption_discountCodeId_idx" ON "DiscountRedemption"("discountCodeId");

-- CreateIndex
CREATE INDEX "DiscountRedemption_orderId_idx" ON "DiscountRedemption"("orderId");

-- CreateIndex
CREATE INDEX "DiscountRedemption_customerEmail_idx" ON "DiscountRedemption"("customerEmail");

-- CreateIndex
CREATE INDEX "DiscountRedemption_productId_idx" ON "DiscountRedemption"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountRedemption_discountCodeId_orderId_key" ON "DiscountRedemption"("discountCodeId", "orderId");

-- CreateIndex
CREATE INDEX "Order_discountCodeId_idx" ON "Order"("discountCodeId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountRedemption" ADD CONSTRAINT "DiscountRedemption_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountRedemption" ADD CONSTRAINT "DiscountRedemption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountRedemption" ADD CONSTRAINT "DiscountRedemption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

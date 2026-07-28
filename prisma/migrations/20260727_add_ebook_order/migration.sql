-- CreateEnum
CREATE TYPE "EbookOrderStatus" AS ENUM ('PENDING', 'PAID', 'GENERATING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "EbookOrder" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "status" "EbookOrderStatus" NOT NULL DEFAULT 'PENDING',
    "desktopBlobPath" TEXT,
    "pocketBlobPath" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EbookOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EbookOrder_stripeSessionId_key" ON "EbookOrder"("stripeSessionId");

-- CreateIndex
CREATE INDEX "EbookOrder_email_idx" ON "EbookOrder"("email");

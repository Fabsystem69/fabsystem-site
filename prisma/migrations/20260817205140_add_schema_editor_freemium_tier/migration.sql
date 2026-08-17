-- CreateEnum
CREATE TYPE "TrialAccessCodeStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- AlterEnum
ALTER TYPE "ProductType" ADD VALUE 'SCHEMA_UNLOCK';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "TrialAccessCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 7,
    "status" "TrialAccessCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "maxRedemptions" INTEGER NOT NULL DEFAULT 1,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrialAccessCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialAccessCodeRedemption" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrialAccessCodeRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrialAccessCode_code_key" ON "TrialAccessCode"("code");

-- CreateIndex
CREATE INDEX "TrialAccessCode_status_idx" ON "TrialAccessCode"("status");

-- CreateIndex
CREATE INDEX "TrialAccessCodeRedemption_customerId_idx" ON "TrialAccessCodeRedemption"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "TrialAccessCodeRedemption_codeId_customerId_key" ON "TrialAccessCodeRedemption"("codeId", "customerId");

-- CreateIndex
CREATE INDEX "Order_projectId_idx" ON "Order"("projectId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialAccessCodeRedemption" ADD CONSTRAINT "TrialAccessCodeRedemption_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "TrialAccessCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialAccessCodeRedemption" ADD CONSTRAINT "TrialAccessCodeRedemption_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

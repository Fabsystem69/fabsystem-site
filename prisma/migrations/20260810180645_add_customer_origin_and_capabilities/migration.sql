-- CreateEnum
CREATE TYPE "CustomerOrigin" AS ENUM ('PURCHASE', 'ADMIN');

-- CreateEnum
CREATE TYPE "CapabilityScope" AS ENUM ('CUSTOMER', 'PROJECT');

-- CreateEnum
CREATE TYPE "CustomerCapabilityStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "origin" "CustomerOrigin" NOT NULL DEFAULT 'PURCHASE';

-- CreateTable
CREATE TABLE "CustomerCapability" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "scope" "CapabilityScope" NOT NULL DEFAULT 'CUSTOMER',
    "scopeId" TEXT,
    "status" "CustomerCapabilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerCapability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerCapability_customerId_idx" ON "CustomerCapability"("customerId");

-- CreateIndex
CREATE INDEX "CustomerCapability_capability_idx" ON "CustomerCapability"("capability");

-- CreateIndex
CREATE INDEX "CustomerCapability_status_idx" ON "CustomerCapability"("status");

-- CreateIndex
CREATE INDEX "CustomerCapability_customerId_capability_idx" ON "CustomerCapability"("customerId", "capability");

-- CreateIndex
CREATE INDEX "CustomerCapability_scope_scopeId_idx" ON "CustomerCapability"("scope", "scopeId");

-- CreateIndex
CREATE INDEX "Customer_origin_idx" ON "Customer"("origin");

-- AddForeignKey
ALTER TABLE "CustomerCapability" ADD CONSTRAINT "CustomerCapability_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

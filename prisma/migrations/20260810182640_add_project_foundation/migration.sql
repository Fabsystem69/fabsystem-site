-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETE_SCHEDULED');

-- CreateEnum
CREATE TYPE "ProjectAssetType" AS ENUM ('BOAT', 'VAN', 'MOTORHOME', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectVoltage" AS ENUM ('V12', 'V24', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ProjectValueStatus" AS ENUM ('ACTIVE', 'OBSOLETE');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetType" "ProjectAssetType" NOT NULL,
    "voltage" "ProjectVoltage" NOT NULL DEFAULT 'UNKNOWN',
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "deleteScheduledAt" TIMESTAMP(3),
    "preScheduleStatus" "ProjectStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRetainedValue" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "simulatedValue" JSONB,
    "status" "ProjectValueStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT,
    "retainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "obsoletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectRetainedValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectValueDependency" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "dependentKey" TEXT NOT NULL,
    "dependsOnKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectValueDependency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_customerId_idx" ON "Project"("customerId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_deleteScheduledAt_idx" ON "Project"("deleteScheduledAt");

-- CreateIndex
CREATE INDEX "ProjectRetainedValue_projectId_idx" ON "ProjectRetainedValue"("projectId");

-- CreateIndex
CREATE INDEX "ProjectRetainedValue_status_idx" ON "ProjectRetainedValue"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRetainedValue_projectId_key_key" ON "ProjectRetainedValue"("projectId", "key");

-- CreateIndex
CREATE INDEX "ProjectValueDependency_projectId_idx" ON "ProjectValueDependency"("projectId");

-- CreateIndex
CREATE INDEX "ProjectValueDependency_projectId_dependsOnKey_idx" ON "ProjectValueDependency"("projectId", "dependsOnKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectValueDependency_projectId_dependentKey_dependsOnKey_key" ON "ProjectValueDependency"("projectId", "dependentKey", "dependsOnKey");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRetainedValue" ADD CONSTRAINT "ProjectRetainedValue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectValueDependency" ADD CONSTRAINT "ProjectValueDependency_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

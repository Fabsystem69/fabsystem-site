/*
  Warnings:

  - You are about to drop the column `justificationDocumentId` on the `CoachingDevice` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CoachingMaterialCategory" AS ENUM ('BATTERIE', 'BMS', 'PANNEAU_SOLAIRE', 'REGULATEUR', 'CHARGEUR_MOTEUR', 'CHARGEUR_SECTEUR', 'CONVERTISSEUR', 'DISTRIBUTION', 'PROTECTION', 'AUTRE');

-- CreateEnum
CREATE TYPE "CoachingCircuitReviewStatus" AS ENUM ('A_FAIRE', 'A_REVOIR', 'VALIDE');

-- CreateEnum
CREATE TYPE "CoachingSchemaStatus" AS ENUM ('BROUILLON', 'A_REVOIR', 'REVU_POUR_REALISATION', 'MIS_A_JOUR_SELON_INSTALLATION');

-- AlterTable
ALTER TABLE "CoachingDevice" DROP COLUMN "justificationDocumentId";

-- AlterTable
ALTER TABLE "CoachingProject" ADD COLUMN     "implantationNotes" TEXT,
ADD COLUMN     "implantationUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "outletsLightingNotes" TEXT,
ADD COLUMN     "vehicleElectricalNotes" TEXT,
ADD COLUMN     "vehicleElectricalSource" TEXT,
ADD COLUMN     "ventilationConstraints" TEXT;

-- AlterTable
ALTER TABLE "CoachingProjectDocument" ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "materialId" TEXT;

-- CreateTable
CREATE TABLE "CoachingMaterial" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" "CoachingMaterialCategory" NOT NULL,
    "brand" TEXT,
    "reference" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "state" "CoachingDeviceState" NOT NULL DEFAULT 'ENVISAGE',
    "keepExisting" BOOLEAN,
    "ratedVoltage" DOUBLE PRECISION,
    "ratedCurrentA" DOUBLE PRECISION,
    "ratedPowerW" DOUBLE PRECISION,
    "capacityAh" DOUBLE PRECISION,
    "characteristicsNotes" TEXT,
    "knownIssues" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingCircuit" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "deviceId" TEXT,
    "materialId" TEXT,
    "source" TEXT,
    "destination" TEXT,
    "systemVoltage" DOUBLE PRECISION,
    "calculatedCurrentA" DOUBLE PRECISION,
    "outboundLengthM" DOUBLE PRECISION,
    "outboundLengthOrigin" "CoachingDataOrigin",
    "returnPathPlanned" TEXT,
    "returnLengthM" DOUBLE PRECISION,
    "electricalLengthM" DOUBLE PRECISION,
    "installMethod" TEXT,
    "section" TEXT,
    "voltageDropNotes" TEXT,
    "protectionType" TEXT,
    "protectionReference" TEXT,
    "protectionRatingA" DOUBLE PRECISION,
    "protectionRatedVoltage" DOUBLE PRECISION,
    "protectionBreakingCapacityA" DOUBLE PRECISION,
    "protectionLocation" TEXT,
    "justification" TEXT,
    "reviewStatus" "CoachingCircuitReviewStatus" NOT NULL DEFAULT 'A_FAIRE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingCircuit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingSchemaRevision" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "documentId" TEXT,
    "status" "CoachingSchemaStatus" NOT NULL DEFAULT 'BROUILLON',
    "snapshotJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingSchemaRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingProjectEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachingProjectEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachingMaterial_projectId_idx" ON "CoachingMaterial"("projectId");

-- CreateIndex
CREATE INDEX "CoachingCircuit_projectId_idx" ON "CoachingCircuit"("projectId");

-- CreateIndex
CREATE INDEX "CoachingCircuit_deviceId_idx" ON "CoachingCircuit"("deviceId");

-- CreateIndex
CREATE INDEX "CoachingSchemaRevision_projectId_idx" ON "CoachingSchemaRevision"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachingSchemaRevision_projectId_revisionNumber_key" ON "CoachingSchemaRevision"("projectId", "revisionNumber");

-- CreateIndex
CREATE INDEX "CoachingProjectEvent_projectId_createdAt_idx" ON "CoachingProjectEvent"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "CoachingProjectDocument_deviceId_idx" ON "CoachingProjectDocument"("deviceId");

-- CreateIndex
CREATE INDEX "CoachingProjectDocument_materialId_idx" ON "CoachingProjectDocument"("materialId");

-- AddForeignKey
ALTER TABLE "CoachingProjectDocument" ADD CONSTRAINT "CoachingProjectDocument_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "CoachingDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingProjectDocument" ADD CONSTRAINT "CoachingProjectDocument_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "CoachingMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingMaterial" ADD CONSTRAINT "CoachingMaterial_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CoachingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingCircuit" ADD CONSTRAINT "CoachingCircuit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CoachingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingCircuit" ADD CONSTRAINT "CoachingCircuit_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "CoachingDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingCircuit" ADD CONSTRAINT "CoachingCircuit_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "CoachingMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingSchemaRevision" ADD CONSTRAINT "CoachingSchemaRevision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CoachingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingSchemaRevision" ADD CONSTRAINT "CoachingSchemaRevision_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CoachingProjectDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingProjectEvent" ADD CONSTRAINT "CoachingProjectEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CoachingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

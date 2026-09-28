-- AlterTable
ALTER TABLE "CoachingProject" ADD COLUMN     "assetType" "ProjectAssetType",
ADD COLUMN     "besoinAutre" TEXT,
ADD COLUMN     "besoinDeadline" TEXT,
ADD COLUMN     "besoinDescription" TEXT,
ADD COLUMN     "besoinProgress" TEXT,
ADD COLUMN     "besoinVehicule" TEXT,
ADD COLUMN     "compteRendu" TEXT,
ADD COLUMN     "confirmationEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "consentementPartage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentementPartageAt" TIMESTAMP(3),
ADD COLUMN     "dateLivraison" TIMESTAMP(3),
ADD COLUMN     "etapeActuelle" TEXT,
ADD COLUMN     "etapeOverride" TEXT,
ADD COLUMN     "iterationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "j30MessageEnvoye" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedProjectId" TEXT,
ADD COLUMN     "offre" "DossierOffre",
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "purgeWarningSentAt" TIMESTAMP(3),
ADD COLUMN     "statutSimple" "DossierStatutSimple",
ADD COLUMN     "temoignageDemande" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "temoignageRecu" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsapp" TEXT;

-- AlterTable
ALTER TABLE "CoachingSession" ADD COLUMN     "legacyDossierAppointmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CoachingProject_orderId_key" ON "CoachingProject"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachingProject_linkedProjectId_key" ON "CoachingProject"("linkedProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachingSession_legacyDossierAppointmentId_key" ON "CoachingSession"("legacyDossierAppointmentId");

-- AddForeignKey
ALTER TABLE "CoachingProject" ADD CONSTRAINT "CoachingProject_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingProject" ADD CONSTRAINT "CoachingProject_linkedProjectId_fkey" FOREIGN KEY ("linkedProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

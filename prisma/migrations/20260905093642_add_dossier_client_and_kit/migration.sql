-- CreateEnum
CREATE TYPE "DossierOffre" AS ENUM ('DECOUVERTE', 'CONSEIL', 'GUIDE', 'CONCEPTION');

-- CreateEnum
CREATE TYPE "DossierStatutSimple" AS ENUM ('A_VENIR', 'FAIT');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "kitId" TEXT;

-- CreateTable
CREATE TABLE "DossierClient" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "offre" "DossierOffre" NOT NULL,
    "whatsapp" TEXT,
    "statutSimple" "DossierStatutSimple",
    "compteRendu" TEXT,
    "etapeActuelle" TEXT,
    "etapeOverride" TEXT,
    "iterationCount" INTEGER NOT NULL DEFAULT 0,
    "dateLivraison" TIMESTAMP(3),
    "consentementPartage" BOOLEAN NOT NULL DEFAULT false,
    "consentementPartageAt" TIMESTAMP(3),
    "temoignageDemande" BOOLEAN NOT NULL DEFAULT false,
    "temoignageRecu" BOOLEAN NOT NULL DEFAULT false,
    "notesInternes" TEXT,
    "besoinVehicule" TEXT,
    "besoinDescription" TEXT,
    "besoinProgress" TEXT,
    "besoinDeadline" TEXT,
    "besoinAutre" TEXT,
    "derniereActivite" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DossierEvent" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromEtape" TEXT,
    "toEtape" TEXT,
    "note" TEXT,
    "authorName" TEXT NOT NULL DEFAULT 'FabSystem',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DossierEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DossierDocument" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "contentType" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DossierDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photoControls" JSONB,
    "powerControls" JSONB,
    "checklist" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitItem" (
    "id" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "budgetCents" INTEGER NOT NULL,
    "href" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "KitItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DossierClient_orderId_key" ON "DossierClient"("orderId");

-- CreateIndex
CREATE INDEX "DossierClient_customerId_idx" ON "DossierClient"("customerId");

-- CreateIndex
CREATE INDEX "DossierClient_offre_idx" ON "DossierClient"("offre");

-- CreateIndex
CREATE INDEX "DossierClient_derniereActivite_idx" ON "DossierClient"("derniereActivite");

-- CreateIndex
CREATE INDEX "DossierEvent_dossierId_createdAt_idx" ON "DossierEvent"("dossierId", "createdAt");

-- CreateIndex
CREATE INDEX "DossierDocument_dossierId_createdAt_idx" ON "DossierDocument"("dossierId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DossierDocument_bucket_path_key" ON "DossierDocument"("bucket", "path");

-- CreateIndex
CREATE INDEX "KitItem_kitId_idx" ON "KitItem"("kitId");

-- CreateIndex
CREATE INDEX "Project_kitId_idx" ON "Project"("kitId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierClient" ADD CONSTRAINT "DossierClient_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierClient" ADD CONSTRAINT "DossierClient_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierEvent" ADD CONSTRAINT "DossierEvent_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "DossierClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierDocument" ADD CONSTRAINT "DossierDocument_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "DossierClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitItem" ADD CONSTRAINT "KitItem_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

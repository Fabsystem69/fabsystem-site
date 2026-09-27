-- CreateEnum
CREATE TYPE "ProspectSource" AS ENUM ('MESSENGER', 'PAGE_FACEBOOK', 'GROUPE_FACEBOOK', 'COMMENTAIRE', 'PUBLICITE', 'AUTRE');

-- CreateEnum
CREATE TYPE "ProspectStatus" AS ENUM ('NOUVEAU', 'EN_DISCUSSION', 'COACHING_PROPOSE', 'RESERVE', 'GAGNE', 'SANS_SUITE');

-- CreateEnum
CREATE TYPE "ClientLevel" AS ENUM ('DEBUTANT', 'INTERMEDIAIRE', 'AVANCE');

-- CreateEnum
CREATE TYPE "CoachingProjectStatus" AS ENUM ('A_DEMARRER', 'EN_COURS', 'EN_ATTENTE', 'TERMINE');

-- CreateEnum
CREATE TYPE "CoachingSessionStatus" AS ENUM ('PREVUE', 'REALISEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "CoachingActionStatus" AS ENUM ('A_FAIRE', 'FAIT');

-- CreateEnum
CREATE TYPE "CoachingProposalStatus" AS ENUM ('BROUILLON', 'ENVOYEE', 'ACCEPTEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "CoachingPaymentStatus" AS ENUM ('EN_ATTENTE', 'PARTIEL', 'PAYE');

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "source" "ProspectSource" NOT NULL,
    "facebookLink" TEXT,
    "besoinElectricite" TEXT,
    "notesInternes" TEXT,
    "status" "ProspectStatus" NOT NULL DEFAULT 'NOUVEAU',
    "nextAction" TEXT,
    "nextActionAt" TIMESTAMP(3),
    "convertedCustomerId" TEXT,
    "derniereActivite" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectEvent" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProspectEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectMessageTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProspectMessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingProject" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "objectifs" TEXT,
    "niveauClient" "ClientLevel",
    "status" "CoachingProjectStatus" NOT NULL DEFAULT 'A_DEMARRER',
    "questionsEnAttente" TEXT,
    "actionsAPreparer" TEXT,
    "notesInternes" TEXT,
    "derniereActivite" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingProjectDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "contentType" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachingProjectDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingSession" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "status" "CoachingSessionStatus" NOT NULL DEFAULT 'PREVUE',
    "sujetsAbordes" TEXT,
    "explicationsDonnees" TEXT,
    "difficultes" TEXT,
    "prochaineEtape" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingActionItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sessionId" TEXT,
    "label" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "CoachingActionStatus" NOT NULL DEFAULT 'A_FAIRE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingProposal" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "montantCents" INTEGER NOT NULL,
    "montantRecuCents" INTEGER NOT NULL DEFAULT 0,
    "dureeMinutes" INTEGER NOT NULL,
    "status" "CoachingProposalStatus" NOT NULL DEFAULT 'BROUILLON',
    "paymentStatus" "CoachingPaymentStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_convertedCustomerId_key" ON "Prospect"("convertedCustomerId");

-- CreateIndex
CREATE INDEX "Prospect_status_idx" ON "Prospect"("status");

-- CreateIndex
CREATE INDEX "Prospect_nextActionAt_idx" ON "Prospect"("nextActionAt");

-- CreateIndex
CREATE INDEX "Prospect_derniereActivite_idx" ON "Prospect"("derniereActivite");

-- CreateIndex
CREATE INDEX "ProspectEvent_prospectId_createdAt_idx" ON "ProspectEvent"("prospectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProspectMessageTemplate_key_key" ON "ProspectMessageTemplate"("key");

-- CreateIndex
CREATE INDEX "CoachingProject_customerId_idx" ON "CoachingProject"("customerId");

-- CreateIndex
CREATE INDEX "CoachingProject_status_idx" ON "CoachingProject"("status");

-- CreateIndex
CREATE INDEX "CoachingProject_derniereActivite_idx" ON "CoachingProject"("derniereActivite");

-- CreateIndex
CREATE INDEX "CoachingProjectDocument_projectId_createdAt_idx" ON "CoachingProjectDocument"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachingProjectDocument_bucket_path_key" ON "CoachingProjectDocument"("bucket", "path");

-- CreateIndex
CREATE INDEX "CoachingSession_projectId_idx" ON "CoachingSession"("projectId");

-- CreateIndex
CREATE INDEX "CoachingSession_scheduledAt_idx" ON "CoachingSession"("scheduledAt");

-- CreateIndex
CREATE INDEX "CoachingSession_status_idx" ON "CoachingSession"("status");

-- CreateIndex
CREATE INDEX "CoachingActionItem_projectId_idx" ON "CoachingActionItem"("projectId");

-- CreateIndex
CREATE INDEX "CoachingActionItem_status_dueDate_idx" ON "CoachingActionItem"("status", "dueDate");

-- CreateIndex
CREATE INDEX "CoachingProposal_projectId_idx" ON "CoachingProposal"("projectId");

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_convertedCustomerId_fkey" FOREIGN KEY ("convertedCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectEvent" ADD CONSTRAINT "ProspectEvent_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingProject" ADD CONSTRAINT "CoachingProject_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingProjectDocument" ADD CONSTRAINT "CoachingProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CoachingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingSession" ADD CONSTRAINT "CoachingSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CoachingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingActionItem" ADD CONSTRAINT "CoachingActionItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CoachingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingActionItem" ADD CONSTRAINT "CoachingActionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CoachingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingProposal" ADD CONSTRAINT "CoachingProposal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CoachingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

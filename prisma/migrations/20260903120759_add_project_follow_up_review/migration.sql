-- CreateEnum
CREATE TYPE "ProjectFollowUpReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "ProjectFollowUpEventType" AS ENUM ('NOTE', 'APPROVED', 'CHANGES_REQUESTED');

-- DropIndex
DROP INDEX "TrialAccessCode_recipientEmail_idx";

-- CreateTable
CREATE TABLE "ProjectFollowUpReview" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "status" "ProjectFollowUpReviewStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectFollowUpReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectFollowUpEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "type" "ProjectFollowUpEventType" NOT NULL,
    "message" TEXT,
    "authorName" TEXT NOT NULL DEFAULT 'FabSystem',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectFollowUpEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectFollowUpReview_projectId_status_idx" ON "ProjectFollowUpReview"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFollowUpReview_projectId_stepKey_key" ON "ProjectFollowUpReview"("projectId", "stepKey");

-- CreateIndex
CREATE INDEX "ProjectFollowUpEvent_projectId_createdAt_idx" ON "ProjectFollowUpEvent"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProjectFollowUpReview" ADD CONSTRAINT "ProjectFollowUpReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFollowUpEvent" ADD CONSTRAINT "ProjectFollowUpEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

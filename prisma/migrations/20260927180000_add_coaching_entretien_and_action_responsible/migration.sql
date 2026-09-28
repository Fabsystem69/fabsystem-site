-- CreateEnum
CREATE TYPE "CoachingResponsible" AS ENUM ('COACH', 'CLIENT');

-- AlterTable
ALTER TABLE "CoachingProject" ADD COLUMN     "accordMiseAuPropre" TEXT,
ADD COLUMN     "accordPerimetre" TEXT,
ADD COLUMN     "accordPrixCents" INTEGER,
ADD COLUMN     "entretienUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "preoccupations" TEXT,
ADD COLUMN     "resumePartage" TEXT;

-- AlterTable
ALTER TABLE "CoachingActionItem" ADD COLUMN     "responsible" "CoachingResponsible";

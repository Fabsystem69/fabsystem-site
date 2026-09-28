-- AlterTable
ALTER TABLE "CoachingSession" ADD COLUMN     "channel" TEXT,
ADD COLUMN     "sharedWithClient" BOOLEAN NOT NULL DEFAULT false;

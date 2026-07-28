-- AlterTable
ALTER TABLE "EbookOrder" ADD COLUMN "emailSentAt" TIMESTAMP(3);
ALTER TABLE "EbookOrder" ADD COLUMN "emailError" TEXT;

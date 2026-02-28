ALTER TABLE "Invoice"
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentRef" TEXT;

CREATE INDEX "Invoice_paidAt_idx" ON "Invoice"("paidAt");

ALTER TABLE "Invoice"
ADD COLUMN     "sourceQuoteId" TEXT;

CREATE UNIQUE INDEX "Invoice_sourceQuoteId_key" ON "Invoice"("sourceQuoteId");
CREATE INDEX "Invoice_sourceQuoteId_idx" ON "Invoice"("sourceQuoteId");

ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_sourceQuoteId_fkey"
FOREIGN KEY ("sourceQuoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

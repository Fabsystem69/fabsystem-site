-- CreateEnum
CREATE TYPE "RemiseStatus" AS ENUM ('DRAFT', 'SENT', 'APPLIED');

-- CreateTable
CREATE TABLE "Remise" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "RemiseStatus" NOT NULL DEFAULT 'DRAFT',
    "customerId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Remise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Remise_number_key" ON "Remise"("number");

-- CreateIndex
CREATE INDEX "Remise_customerId_idx" ON "Remise"("customerId");

-- CreateIndex
CREATE INDEX "Remise_invoiceId_idx" ON "Remise"("invoiceId");

-- AddForeignKey
ALTER TABLE "Remise" ADD CONSTRAINT "Remise_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remise" ADD CONSTRAINT "Remise_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "DossierAppointment" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "compteRendu" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DossierAppointment_dossierId_idx" ON "DossierAppointment"("dossierId");

-- CreateIndex
CREATE INDEX "DossierAppointment_scheduledAt_idx" ON "DossierAppointment"("scheduledAt");

-- AddForeignKey
ALTER TABLE "DossierAppointment" ADD CONSTRAINT "DossierAppointment_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "DossierClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

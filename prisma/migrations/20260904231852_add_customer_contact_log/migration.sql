-- CreateTable
CREATE TABLE "CustomerContactLog" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentBy" TEXT NOT NULL DEFAULT 'FabSystem',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerContactLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerContactLog_customerId_createdAt_idx" ON "CustomerContactLog"("customerId", "createdAt");

-- AddForeignKey
ALTER TABLE "CustomerContactLog" ADD CONSTRAINT "CustomerContactLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

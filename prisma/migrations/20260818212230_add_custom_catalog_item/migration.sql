-- CreateTable
CREATE TABLE "CustomCatalogItem" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "componentType" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "defaults" JSONB NOT NULL,
    "imageDataUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomCatalogItem_customerId_idx" ON "CustomCatalogItem"("customerId");

-- CreateIndex
CREATE INDEX "CustomCatalogItem_componentType_idx" ON "CustomCatalogItem"("componentType");

-- AddForeignKey
ALTER TABLE "CustomCatalogItem" ADD CONSTRAINT "CustomCatalogItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

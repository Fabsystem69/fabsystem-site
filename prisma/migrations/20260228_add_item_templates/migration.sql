CREATE TABLE "ItemTemplate" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT,
    "defaultUnitPriceCents" INTEGER,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ItemTemplate_label_key" ON "ItemTemplate"("label");

CREATE TABLE "DocumentSequence" (
    "key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX "DocumentSequence_prefix_year_key" ON "DocumentSequence"("prefix", "year");

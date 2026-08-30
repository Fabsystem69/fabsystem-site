ALTER TABLE "ProjectSchema"
ADD COLUMN "shareToken" TEXT,
ADD COLUMN "shareEnabledAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "ProjectSchema_shareToken_key" ON "ProjectSchema"("shareToken");

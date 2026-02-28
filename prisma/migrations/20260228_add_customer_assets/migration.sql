CREATE TYPE "AssetType" AS ENUM ('VEHICLE', 'BOAT', 'OTHER');

ALTER TABLE "Customer"
ADD COLUMN     "assetType" "AssetType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "assetBrand" TEXT,
ADD COLUMN     "assetModel" TEXT,
ADD COLUMN     "registration" TEXT,
ADD COLUMN     "odometerKm" INTEGER,
ADD COLUMN     "engineHours" INTEGER;

CREATE INDEX "Customer_registration_idx" ON "Customer"("registration");

ALTER TABLE "Invoice"
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "customerReference" TEXT,
ADD COLUMN     "projectReference" TEXT,
ADD COLUMN     "serviceReference" TEXT;

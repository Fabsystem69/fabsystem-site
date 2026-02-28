ALTER TABLE "Quote"
ADD COLUMN "signedAt" TIMESTAMP(3),
ADD COLUMN "signedName" TEXT,
ADD COLUMN "agreementChecked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "signatureDataUrl" TEXT,
ADD COLUMN "signatureTokenHash" TEXT,
ADD COLUMN "signatureTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "signatureIp" TEXT,
ADD COLUMN "signatureUserAgent" TEXT;

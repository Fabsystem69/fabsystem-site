CREATE TYPE "ServiceType" AS ENUM ('INTERVENTION', 'FORMATION', 'AUDIT', 'CONSEIL');
CREATE TYPE "DeliveryMode" AS ENUM ('ONSITE', 'REMOTE');

ALTER TABLE "Quote"
ADD COLUMN     "serviceType" "ServiceType" NOT NULL DEFAULT 'INTERVENTION',
ADD COLUMN     "deliveryMode" "DeliveryMode" NOT NULL DEFAULT 'ONSITE',
ADD COLUMN     "serviceDate" TIMESTAMP(3);

ALTER TABLE "Invoice"
ADD COLUMN     "serviceType" "ServiceType" NOT NULL DEFAULT 'INTERVENTION',
ADD COLUMN     "deliveryMode" "DeliveryMode" NOT NULL DEFAULT 'ONSITE',
ADD COLUMN     "serviceDate" TIMESTAMP(3);

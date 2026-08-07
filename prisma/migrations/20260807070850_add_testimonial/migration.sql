-- CreateEnum
CREATE TYPE "TestimonialCustomerType" AS ENUM ('VAN', 'CAMPING_CAR', 'BOAT', 'OTHER');

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "customerType" "TestimonialCustomerType" NOT NULL DEFAULT 'OTHER',
    "vehicleModel" TEXT,
    "region" TEXT,
    "rating" INTEGER NOT NULL,
    "quote" TEXT NOT NULL,
    "relatedOffer" TEXT,
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Testimonial_isPublished_idx" ON "Testimonial"("isPublished");

-- CreateIndex
CREATE INDEX "Testimonial_isFeatured_idx" ON "Testimonial"("isFeatured");

-- CreateIndex
CREATE INDEX "Testimonial_displayOrder_idx" ON "Testimonial"("displayOrder");

-- CreateEnum
CREATE TYPE "CoachingDeviceState" AS ENUM ('ENVISAGE', 'CHOISI', 'ACHETE', 'INSTALLE');

-- CreateEnum
CREATE TYPE "CoachingDevicePhase" AS ENUM ('ACTUEL', 'FUTUR');

-- CreateEnum
CREATE TYPE "CoachingDevicePriority" AS ENUM ('INDISPENSABLE', 'SOUHAITABLE', 'OPTIONNEL');

-- CreateEnum
CREATE TYPE "CoachingPowerSupply" AS ENUM ('DC12', 'DC24', 'DC_AUTRE', 'USB', 'AC230', 'INCONNU');

-- CreateEnum
CREATE TYPE "CoachingMeasurementPoint" AS ENUM ('APPAREIL', 'ENTREE_ADAPTATEUR', 'COTE_BATTERIE');

-- CreateEnum
CREATE TYPE "CoachingDataOrigin" AS ENUM ('MESUREE', 'DOC_FABRICANT', 'ESTIMATION_CLIENT', 'ESTIMATION_COACH');

-- CreateEnum
CREATE TYPE "CoachingCalcMethod" AS ENUM ('PUISSANCE_TEMPS', 'ENERGIE_JOUR', 'RECHARGE_CYCLE');

-- AlterTable
ALTER TABLE "CoachingProject" ADD COLUMN     "coachingTopics" TEXT,
ADD COLUMN     "criticalDevicesWhenLow" TEXT,
ADD COLUMN     "daysWithoutRecharge" TEXT,
ADD COLUMN     "drivingHabits" TEXT,
ADD COLUMN     "hasChangesSinceReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "homologationNotes" TEXT,
ADD COLUMN     "laborBudgetCents" INTEGER,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "materialBudgetCents" INTEGER,
ADD COLUMN     "minAutonomyNoRecharge" TEXT,
ADD COLUMN     "otherEnergySources" TEXT,
ADD COLUMN     "parkingExposure" TEXT,
ADD COLUMN     "plannedEquipmentNotes" TEXT,
ADD COLUMN     "projectStage" TEXT,
ADD COLUMN     "readyForReviewAt" TIMESTAMP(3),
ADD COLUMN     "registrationCountry" TEXT,
ADD COLUMN     "remoteWorkNotes" TEXT,
ADD COLUMN     "seasonsRegionsNotes" TEXT,
ADD COLUMN     "shorePowerAvailability" TEXT,
ADD COLUMN     "solarMounting" TEXT,
ADD COLUMN     "solarPreference" TEXT,
ADD COLUMN     "solarRoofSpaceNotes" TEXT,
ADD COLUMN     "startDeadline" TEXT,
ADD COLUMN     "threePriorities" TEXT,
ADD COLUMN     "travelerCount" TEXT,
ADD COLUMN     "usageCountry" TEXT,
ADD COLUMN     "usagePattern" TEXT,
ADD COLUMN     "vehicleBrand" TEXT,
ADD COLUMN     "vehicleDimensions" TEXT,
ADD COLUMN     "vehicleEngine" TEXT,
ADD COLUMN     "vehicleFormat" TEXT,
ADD COLUMN     "vehicleModel" TEXT,
ADD COLUMN     "vehicleYear" TEXT,
ADD COLUMN     "whoDoesTheWork" TEXT;

-- CreateTable
CREATE TABLE "CoachingScenario" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingDevice" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "brand" TEXT,
    "reference" TEXT,
    "manufacturerLink" TEXT,
    "state" "CoachingDeviceState" NOT NULL DEFAULT 'ENVISAGE',
    "phase" "CoachingDevicePhase" NOT NULL DEFAULT 'ACTUEL',
    "priority" "CoachingDevicePriority" NOT NULL DEFAULT 'SOUHAITABLE',
    "powerSupply" "CoachingPowerSupply" NOT NULL DEFAULT 'INCONNU',
    "measurementPoint" "CoachingMeasurementPoint",
    "dataOrigin" "CoachingDataOrigin",
    "justificationDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingDeviceUsage" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "calcMethod" "CoachingCalcMethod" NOT NULL,
    "continuousPowerW" DOUBLE PRECISION,
    "peakPowerW" DOUBLE PRECISION,
    "peakDurationMinutes" DOUBLE PRECISION,
    "effectiveHoursPerDay" DOUBLE PRECISION,
    "availabilityHoursPerDay" DOUBLE PRECISION,
    "dutyCycleRatio" DOUBLE PRECISION,
    "dailyEnergyWhPerUnit" DOUBLE PRECISION,
    "dailyEnergyIsGroupTotal" BOOLEAN NOT NULL DEFAULT false,
    "energyPerCycleWh" DOUBLE PRECISION,
    "cyclesPerDay" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingDeviceUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachingScenario_projectId_idx" ON "CoachingScenario"("projectId");

-- CreateIndex
CREATE INDEX "CoachingDevice_projectId_idx" ON "CoachingDevice"("projectId");

-- CreateIndex
CREATE INDEX "CoachingDeviceUsage_scenarioId_idx" ON "CoachingDeviceUsage"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachingDeviceUsage_deviceId_scenarioId_key" ON "CoachingDeviceUsage"("deviceId", "scenarioId");

-- AddForeignKey
ALTER TABLE "CoachingScenario" ADD CONSTRAINT "CoachingScenario_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CoachingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingDevice" ADD CONSTRAINT "CoachingDevice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CoachingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingDeviceUsage" ADD CONSTRAINT "CoachingDeviceUsage_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "CoachingDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingDeviceUsage" ADD CONSTRAINT "CoachingDeviceUsage_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "CoachingScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

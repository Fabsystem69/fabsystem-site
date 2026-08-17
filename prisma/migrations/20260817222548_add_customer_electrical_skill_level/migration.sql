-- CreateEnum
CREATE TYPE "ElectricalSkillLevel" AS ENUM ('DEBUTANT', 'INTERMEDIAIRE', 'AVANCE');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "electricalSkillLevel" "ElectricalSkillLevel";

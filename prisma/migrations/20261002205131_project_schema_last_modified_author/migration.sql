-- AlterEnum
ALTER TYPE "ProjectSchemaVersionAuthor" ADD VALUE 'UNKNOWN';

-- AlterTable
ALTER TABLE "ProjectSchema" ADD COLUMN     "lastModifiedByName" TEXT,
ADD COLUMN     "lastModifiedByType" "ProjectSchemaVersionAuthor";

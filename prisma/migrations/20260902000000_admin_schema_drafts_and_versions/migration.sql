-- Admin-only working copies and immutable project-schema milestones.
CREATE TYPE "ProjectSchemaVersionAuthor" AS ENUM ('ADMIN', 'CUSTOMER');

CREATE TABLE "AdminSchemaDraft" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nodes" JSONB NOT NULL,
  "edges" JSONB NOT NULL,
  "thumbnail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminSchemaDraft_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminSchemaDraft_updatedAt_idx" ON "AdminSchemaDraft"("updatedAt");

CREATE TABLE "ProjectSchemaVersion" (
  "id" TEXT NOT NULL,
  "projectSchemaId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "authorType" "ProjectSchemaVersionAuthor" NOT NULL,
  "authorName" TEXT NOT NULL,
  "label" TEXT,
  "projectName" TEXT NOT NULL,
  "nodes" JSONB NOT NULL,
  "edges" JSONB NOT NULL,
  "thumbnail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectSchemaVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectSchemaVersion_projectSchemaId_versionNumber_key"
  ON "ProjectSchemaVersion"("projectSchemaId", "versionNumber");
CREATE INDEX "ProjectSchemaVersion_projectSchemaId_createdAt_idx"
  ON "ProjectSchemaVersion"("projectSchemaId", "createdAt");
ALTER TABLE "ProjectSchemaVersion"
  ADD CONSTRAINT "ProjectSchemaVersion_projectSchemaId_fkey"
  FOREIGN KEY ("projectSchemaId") REFERENCES "ProjectSchema"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

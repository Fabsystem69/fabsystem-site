import type { PrismaClient, ProjectSchema, Prisma } from "@/lib/generated/prisma/client";
import type { OwnershipActor } from "@/lib/ownership";
import { getProject } from "@/lib/services/project";

type PrismaClientLike = PrismaClient;

// Schéma électrique de /outils/schema, lié à un Project (retour
// utilisateur : "il manque enregistrer lié au compte client"). Même
// structure DI que lib/services/project.ts, relation 1:1 avec Project :
// pas d'historique de versions dans cette première ébauche, juste le
// dernier état sauvegardé (upsert).
export type SaveProjectSchemaInput = {
  projectName: string;
  nodes: Prisma.InputJsonValue;
  edges: Prisma.InputJsonValue;
  thumbnail?: string | null;
};

export type ProjectSchemaSummary = { projectId: string; thumbnail: string | null; updatedAt: Date };

export type ProjectSchemaDb = {
  findByProjectId(projectId: string): Promise<ProjectSchema | null>;
  upsert(projectId: string, data: SaveProjectSchemaInput): Promise<ProjectSchema>;
  findSummariesByProjectIds(projectIds: string[]): Promise<ProjectSchemaSummary[]>;
};

function createPrismaProjectSchemaDb(client: PrismaClientLike): ProjectSchemaDb {
  return {
    async findByProjectId(projectId) {
      return client.projectSchema.findUnique({ where: { projectId } });
    },
    async upsert(projectId, data) {
      return client.projectSchema.upsert({
        where: { projectId },
        create: { projectId, ...data },
        update: data,
      });
    },
    async findSummariesByProjectIds(projectIds) {
      if (projectIds.length === 0) return [];
      return client.projectSchema.findMany({
        where: { projectId: { in: projectIds } },
        select: { projectId: true, thumbnail: true, updatedAt: true },
      });
    },
  };
}

async function getDefaultProjectSchemaService() {
  const { prisma } = await import("@/lib/prisma");
  return createProjectSchemaService(createPrismaProjectSchemaDb(prisma));
}

export function createProjectSchemaService(db: ProjectSchemaDb) {
  // getProject() vérifie déjà la propriété du Project (jamais l'id seul,
  // MASTER-10 §40) — même garde réutilisée telle quelle, pas dupliquée.
  const assertOwnedProject = getProject;

  return {
    async getProjectSchema(actor: OwnershipActor, projectId: string): Promise<ProjectSchema | null> {
      const project = await assertOwnedProject(actor, projectId);
      return db.findByProjectId(project.id);
    },

    async saveProjectSchema(actor: OwnershipActor, projectId: string, input: SaveProjectSchemaInput): Promise<ProjectSchema> {
      const project = await assertOwnedProject(actor, projectId);
      return db.upsert(project.id, input);
    },

    // Pas de vérification de propriété ici : réservé à un appelant qui a
    // déjà lui-même la liste des projectId via listProjectsForCustomer(actor)
    // (retour utilisateur : miniature/statut schéma sur /mon-compte/projets,
    // une seule requête groupée plutôt qu'un N+1 avec re-vérification à
    // chaque projet).
    async listProjectSchemaSummaries(projectIds: string[]): Promise<Map<string, ProjectSchemaSummary>> {
      const rows = await db.findSummariesByProjectIds(projectIds);
      return new Map(rows.map((row) => [row.projectId, row]));
    },
  };
}

export async function getProjectSchema(actor: OwnershipActor, projectId: string) {
  const service = await getDefaultProjectSchemaService();
  return service.getProjectSchema(actor, projectId);
}

export async function saveProjectSchema(actor: OwnershipActor, projectId: string, input: SaveProjectSchemaInput) {
  const service = await getDefaultProjectSchemaService();
  return service.saveProjectSchema(actor, projectId, input);
}

export async function listProjectSchemaSummaries(projectIds: string[]) {
  const service = await getDefaultProjectSchemaService();
  return service.listProjectSchemaSummaries(projectIds);
}

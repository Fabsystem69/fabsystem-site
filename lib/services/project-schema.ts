import type { PrismaClient, ProjectSchema, Prisma } from "@/lib/generated/prisma/client";
import { forbidden, serviceUnavailable } from "@/lib/http-errors";
import type { OwnershipActor } from "@/lib/ownership";
import { logServerEvent } from "@/lib/server-log";
import { getProject } from "@/lib/services/project";
import { isProjectReadOnly } from "@/lib/services/schema-unlock";
import { randomBytes } from "crypto";

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
export type SharedProjectSchema = Pick<ProjectSchema, "projectName" | "nodes" | "edges" | "updatedAt">;

export type ProjectSchemaDb = {
  findByProjectId(projectId: string): Promise<ProjectSchema | null>;
  upsert(projectId: string, data: SaveProjectSchemaInput): Promise<ProjectSchema>;
  findSummariesByProjectIds(projectIds: string[]): Promise<ProjectSchemaSummary[]>;
  setShareToken?(projectId: string, token: string | null): Promise<ProjectSchema>;
  findSharedByToken?(token: string): Promise<SharedProjectSchema | null>;
};

type ProjectSchemaServiceDeps = {
  assertOwnedProject?: typeof getProject;
  reportSchemaStorageMissing?: (operation: string, error: unknown) => void;
  checkProjectReadOnly?: typeof isProjectReadOnly;
};

function isProjectSchemaTableMissingError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
    meta?: { modelName?: unknown };
  };
  const messageMentionsModel =
    typeof candidate.message === "string" && candidate.message.includes("ProjectSchema");
  const metaMentionsModel = candidate.meta?.modelName === "ProjectSchema";

  return candidate.code === "P2021" && (messageMentionsModel || metaMentionsModel);
}

function defaultReportSchemaStorageMissing(operation: string, error: unknown) {
  logServerEvent("warn", "project-schema storage table missing", {
    operation,
    error,
  });
}

function projectSchemaStorageUnavailableError() {
  return serviceUnavailable(
    "Le cloud du schema n'est pas encore initialise sur cette base. Lancez la migration Prisma puis reessayez."
  );
}

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
    async setShareToken(projectId, token) {
      return client.projectSchema.update({
        where: { projectId },
        // Les types générés localement sont régénérés par le build après la
        // migration; l'assertion garde les tests utilisables entre les deux.
        data: { shareToken: token, shareEnabledAt: token ? new Date() : null } as never,
      }) as Promise<ProjectSchema>;
    },
    async findSharedByToken(token) {
      return client.projectSchema.findUnique({
        where: { shareToken: token } as never,
        select: { projectName: true, nodes: true, edges: true, updatedAt: true },
      });
    },
  };
}

async function getDefaultProjectSchemaService() {
  const { prisma } = await import("@/lib/prisma");
  return createProjectSchemaService(createPrismaProjectSchemaDb(prisma));
}

export function createProjectSchemaService(db: ProjectSchemaDb, deps: ProjectSchemaServiceDeps = {}) {
  // getProject() vérifie déjà la propriété du Project (jamais l'id seul,
  // MASTER-10 §40) — même garde réutilisée telle quelle, pas dupliquée.
  const assertOwnedProject = deps.assertOwnedProject ?? getProject;
  const reportSchemaStorageMissing =
    deps.reportSchemaStorageMissing ?? defaultReportSchemaStorageMissing;
  const checkProjectReadOnly = deps.checkProjectReadOnly ?? isProjectReadOnly;

  return {
    async getProjectSchema(actor: OwnershipActor, projectId: string): Promise<ProjectSchema | null> {
      const project = await assertOwnedProject(actor, projectId);
      try {
        return await db.findByProjectId(project.id);
      } catch (error) {
        if (isProjectSchemaTableMissingError(error)) {
          reportSchemaStorageMissing("getProjectSchema", error);
          return null;
        }
        throw error;
      }
    },

    async saveProjectSchema(actor: OwnershipActor, projectId: string, input: SaveProjectSchemaInput): Promise<ProjectSchema> {
      const project = await assertOwnedProject(actor, projectId);
      // v2.1 : un projet ayant deja beneficie d'un deverrouillage payant qui
      // n'est plus actif repasse en lecture seule complete — jamais de perte
      // silencieuse de travail (le schema reste consultable via
      // getProjectSchema), juste plus de sauvegarde possible sans renouveler.
      // Le verrouillage est une limite commerciale du compte client. Il ne
      // doit pas empêcher l'administrateur de préparer ou corriger un
      // schéma dans le cadre de l'accompagnement.
      if (actor.role !== "admin" && await checkProjectReadOnly(project.customerId, project.id)) {
        throw forbidden("Project schema is read-only: unlock has expired");
      }
      try {
        return await db.upsert(project.id, input);
      } catch (error) {
        if (isProjectSchemaTableMissingError(error)) {
          reportSchemaStorageMissing("saveProjectSchema", error);
          throw projectSchemaStorageUnavailableError();
        }
        throw error;
      }
    },

    // Pas de vérification de propriété ici : réservé à un appelant qui a
    // déjà lui-même la liste des projectId via listProjectsForCustomer(actor)
    // (retour utilisateur : miniature/statut schéma sur /mon-compte/projets,
    // une seule requête groupée plutôt qu'un N+1 avec re-vérification à
    // chaque projet).
    async listProjectSchemaSummaries(projectIds: string[]): Promise<Map<string, ProjectSchemaSummary>> {
      let rows: ProjectSchemaSummary[];
      try {
        rows = await db.findSummariesByProjectIds(projectIds);
      } catch (error) {
        if (isProjectSchemaTableMissingError(error)) {
          reportSchemaStorageMissing("listProjectSchemaSummaries", error);
          return new Map();
        }
        throw error;
      }
      return new Map(rows.map((row) => [row.projectId, row]));
    },

    async enableShare(actor: OwnershipActor, projectId: string): Promise<string> {
      const project = await assertOwnedProject(actor, projectId);
      const schema = await db.findByProjectId(project.id);
      if (!schema) throw forbidden("Save the schema before sharing it");
      const token = (schema as ProjectSchema & { shareToken?: string | null }).shareToken ?? randomBytes(24).toString("base64url");
      if (!db.setShareToken) throw projectSchemaStorageUnavailableError();
      await db.setShareToken(project.id, token);
      return token;
    },

    async disableShare(actor: OwnershipActor, projectId: string): Promise<void> {
      const project = await assertOwnedProject(actor, projectId);
      const schema = await db.findByProjectId(project.id);
      if (schema) {
        if (!db.setShareToken) throw projectSchemaStorageUnavailableError();
        await db.setShareToken(project.id, null);
      }
    },

    async getSharedSchema(token: string): Promise<SharedProjectSchema | null> {
      if (!db.findSharedByToken) throw projectSchemaStorageUnavailableError();
      return db.findSharedByToken(token);
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

export async function enableProjectSchemaShare(actor: OwnershipActor, projectId: string) {
  const service = await getDefaultProjectSchemaService();
  return service.enableShare(actor, projectId);
}

export async function disableProjectSchemaShare(actor: OwnershipActor, projectId: string) {
  const service = await getDefaultProjectSchemaService();
  return service.disableShare(actor, projectId);
}

export async function getSharedProjectSchema(token: string) {
  const service = await getDefaultProjectSchemaService();
  return service.getSharedSchema(token);
}

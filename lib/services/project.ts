import type {
  PrismaClient,
  Project,
  ProjectAssetType,
  ProjectStatus,
  ProjectVoltage,
} from "@/lib/generated/prisma/client";
import { badRequest, conflict, notFound } from "@/lib/http-errors";
import { requireOwnerOrAdmin, type OwnershipActor } from "@/lib/ownership";

type PrismaClientLike = PrismaClient;

// Couche 3 (MASTER-11) : Project, source de vérité métier du travail client
// (MASTER-06 §2). CRUD serveur uniquement — aucune interface, aucun module
// consommateur (Volta/Circuits/Schéma/Documents/Accompagnement) ici.

// Limite gratuite : 1 Project personnel maximum. Éditeur Plus supprime cette
// limite de portefeuille, sans limiter les sauvegardes du projet.
// actifs + archivés + en attente de suppression comptent (seule une
// suppression définitive effective libère une place, cf. MASTER-06 §7 et
// §99 "Pour libérer réellement une place, le Projet doit être supprimé
// définitivement").
//
// ARBITRAGE REQUIS (voir docs/audits/PHASE-3-RAPPORT.md) : MASTER-11 §21
// demande que cette limite soit configurable pour une future offre Pro,
// sans préciser le mécanisme (capability Phase 2 ? champ Customer ? autre ?).
// Aucun MASTER ne tranche ce mécanisme : la valeur ci-dessous reste une
// constante simple, volontairement isolée pour rester remplaçable sans
// réécrire le service, plutôt que câblée à une capacité inventée.
export const STANDARD_PROJECT_LIMIT = 1;

export type PurgeDueDeletionsResult = {
  deletedCount: number;
  deletedProjectIds: string[];
  failed: Array<{ projectId: string; reason: string }>;
};

export type CreateProjectInput = {
  customerId: string;
  name: string;
  assetType: ProjectAssetType;
  voltage: ProjectVoltage;
};

export type UpdateProjectInput = Partial<{
  name: string;
  assetType: ProjectAssetType;
  voltage: ProjectVoltage;
}>;

export type ProjectDb = {
  createProject(data: {
    customerId: string;
    name: string;
    assetType: ProjectAssetType;
    voltage: ProjectVoltage;
  }): Promise<Project>;
  findProjectById(id: string): Promise<Project | null>;
  countCustomerProjects(customerId: string): Promise<number>;
  listCustomerProjects(customerId: string): Promise<Project[]>;
  updateProjectFields(id: string, data: UpdateProjectInput): Promise<Project>;
  updateProjectState(
    id: string,
    data: {
      status: ProjectStatus;
      archivedAt?: Date | null;
      deleteScheduledAt?: Date | null;
      preScheduleStatus?: ProjectStatus | null;
    }
  ): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  findDueScheduledDeletions(before: Date): Promise<Project[]>;
};

type ProjectDeps = {
  now?: () => Date;
  deletionDelayMs?: number;
  // Bug corrigé : createProject importait directement
  // lib/services/schema-editor-plus (donc lib/prisma, donc du code
  // "server-only") au lieu de passer par le `db` injecté — cassait tous les
  // tests appelant createProjectService avec un mock (ERR "This module
  // cannot be imported from a Client Component module"). Injectée comme le
  // reste : réelle dans getDefaultProjectService, mockable en test.
  hasSchemaEditorPlusAccess?: (customerId: string) => Promise<boolean>;
};

const DELETION_DELAY_MS = 72 * 60 * 60 * 1000;

function assertNonEmpty(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw badRequest(`${label} is required`);
  }

  return normalized;
}

function assertConfirmed(confirm: boolean, action: string) {
  if (!confirm) {
    throw badRequest(`Explicit confirmation is required to ${action}`);
  }
}

function createPrismaProjectDb(client: PrismaClientLike): ProjectDb {
  return {
    async createProject(data) {
      return client.project.create({ data });
    },
    async findProjectById(id) {
      return client.project.findUnique({ where: { id } });
    },
    async countCustomerProjects(customerId) {
      return client.project.count({ where: { customerId } });
    },
    async listCustomerProjects(customerId) {
      return client.project.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
      });
    },
    async updateProjectFields(id, data) {
      return client.project.update({ where: { id }, data });
    },
    async updateProjectState(id, data) {
      return client.project.update({ where: { id }, data });
    },
    async deleteProject(id) {
      await client.project.delete({ where: { id } });
    },
    async findDueScheduledDeletions(before) {
      return client.project.findMany({
        where: { status: "DELETE_SCHEDULED", deleteScheduledAt: { lte: before } },
        orderBy: { deleteScheduledAt: "asc" },
      });
    },
  };
}

async function getDefaultProjectService() {
  const [{ prisma }, { hasSchemaEditorPlusAccess }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/services/schema-editor-plus"),
  ]);
  return createProjectService(createPrismaProjectDb(prisma), { hasSchemaEditorPlusAccess });
}

export function createProjectService(db: ProjectDb, deps?: ProjectDeps) {
  const now = deps?.now ?? (() => new Date());
  const deletionDelayMs = deps?.deletionDelayMs ?? DELETION_DELAY_MS;
  const hasSchemaEditorPlusAccess = deps?.hasSchemaEditorPlusAccess ?? (async () => false);

  async function fetchOwnedProject(actor: OwnershipActor, projectId: string) {
    const id = assertNonEmpty(projectId, "Project id");
    const project = await db.findProjectById(id);

    if (!project) {
      throw notFound("Project not found");
    }

    // Un identifiant seul n'accorde jamais un accès (MASTER-10 §40).
    requireOwnerOrAdmin(actor, project.customerId);

    return project;
  }

  return {
    async createProject(actor: OwnershipActor, input: CreateProjectInput): Promise<Project> {
      const customerId = assertNonEmpty(input.customerId, "Customer id");
      const name = assertNonEmpty(input.name, "Project name");

      requireOwnerOrAdmin(actor, customerId);

      const [existingCount, hasPlusAccess] = await Promise.all([
        db.countCustomerProjects(customerId),
        hasSchemaEditorPlusAccess(customerId),
      ]);

      if (!hasPlusAccess && existingCount >= STANDARD_PROJECT_LIMIT) {
        throw conflict(
          `Standard accounts are limited to ${STANDARD_PROJECT_LIMIT} personal projects`
        );
      }

      return db.createProject({
        customerId,
        name,
        assetType: input.assetType,
        voltage: input.voltage,
      });
    },

    async getProject(actor: OwnershipActor, projectId: string): Promise<Project> {
      return fetchOwnedProject(actor, projectId);
    },

    async listProjectsForCustomer(actor: OwnershipActor, customerId: string): Promise<Project[]> {
      const id = assertNonEmpty(customerId, "Customer id");
      requireOwnerOrAdmin(actor, id);
      return db.listCustomerProjects(id);
    },

    async updateProject(
      actor: OwnershipActor,
      projectId: string,
      input: UpdateProjectInput
    ): Promise<Project> {
      const project = await fetchOwnedProject(actor, projectId);

      const data: UpdateProjectInput = {};

      if (typeof input.name !== "undefined") {
        data.name = assertNonEmpty(input.name, "Project name");
      }
      if (typeof input.assetType !== "undefined") {
        data.assetType = input.assetType;
      }
      if (typeof input.voltage !== "undefined") {
        data.voltage = input.voltage;
      }

      if (Object.keys(data).length === 0) {
        return project;
      }

      return db.updateProjectFields(project.id, data);
    },

    async archiveProject(actor: OwnershipActor, projectId: string): Promise<Project> {
      const project = await fetchOwnedProject(actor, projectId);

      if (project.status === "ARCHIVED") {
        return project;
      }

      if (project.status === "DELETE_SCHEDULED") {
        throw conflict("Cancel the scheduled deletion before archiving this project");
      }

      return db.updateProjectState(project.id, {
        status: "ARCHIVED",
        archivedAt: now(),
      });
    },

    async deleteProject(
      actor: OwnershipActor,
      projectId: string,
      options: { confirm: boolean }
    ): Promise<{ projectId: string }> {
      const project = await fetchOwnedProject(actor, projectId);
      assertConfirmed(options.confirm, "delete a project immediately and definitively");

      if (project.status === "DELETE_SCHEDULED") {
        throw conflict(
          "Cancel the scheduled deletion before deleting this project immediately"
        );
      }

      // Suppression immédiate = définitive (MASTER-06 §15, MASTER-10 §53).
      await db.deleteProject(project.id);

      return { projectId: project.id };
    },

    async scheduleDeletion(
      actor: OwnershipActor,
      projectId: string,
      options: { confirm: boolean }
    ): Promise<Project> {
      const project = await fetchOwnedProject(actor, projectId);
      assertConfirmed(options.confirm, "schedule a project deletion");

      if (project.status === "DELETE_SCHEDULED") {
        throw conflict("A deletion is already scheduled for this project");
      }

      // Intention + échéance persistées en base, jamais de timer mémoire
      // (MASTER-10 §54-55). L'exécuteur rejouable appartient à une phase
      // ultérieure (MASTER-10 §57) : cette fonction ne supprime rien.
      return db.updateProjectState(project.id, {
        status: "DELETE_SCHEDULED",
        preScheduleStatus: project.status,
        deleteScheduledAt: new Date(now().getTime() + deletionDelayMs),
      });
    },

    async cancelDeletion(actor: OwnershipActor, projectId: string): Promise<Project> {
      const project = await fetchOwnedProject(actor, projectId);

      if (project.status !== "DELETE_SCHEDULED") {
        throw conflict("This project has no scheduled deletion to cancel");
      }

      // Le client et l'Admin peuvent annuler tant que l'échéance n'est pas
      // atteinte ; l'annulation restitue l'état normal (MASTER-10 §56).
      return db.updateProjectState(project.id, {
        status: project.preScheduleStatus ?? "ACTIVE",
        preScheduleStatus: null,
        deleteScheduledAt: null,
      });
    },

    // Exécuteur rejouable (MASTER-10 §57, §84-85) : recherche les Projects
    // dont l'échéance est atteinte ou dépassée et les supprime
    // définitivement. Aucun timer mémoire — l'échéance vient uniquement de
    // `deleteScheduledAt`, persisté en base. Chaque Project est supprimé
    // individuellement (même principe que purgeAllEligiblePendingOrders) :
    // un échec isolé ne bloque jamais les autres, et rejouer ce traitement
    // après un échec partiel ne recrée rien et ne supprime rien d'autre
    // qu'un Project encore réellement dû (idempotent : un Project déjà
    // supprimé par un passage précédent n'apparaît simplement plus dans la
    // recherche suivante).
    async purgeDueScheduledDeletions(): Promise<PurgeDueDeletionsResult> {
      const due = await db.findDueScheduledDeletions(now());

      const deletedProjectIds: string[] = [];
      const failed: PurgeDueDeletionsResult["failed"] = [];

      for (const project of due) {
        try {
          await db.deleteProject(project.id);
          deletedProjectIds.push(project.id);
        } catch (error) {
          failed.push({
            projectId: project.id,
            reason: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return { deletedCount: deletedProjectIds.length, deletedProjectIds, failed };
    },
  };
}

export async function createProject(actor: OwnershipActor, input: CreateProjectInput) {
  const service = await getDefaultProjectService();
  return service.createProject(actor, input);
}

export async function getProject(actor: OwnershipActor, projectId: string) {
  const service = await getDefaultProjectService();
  return service.getProject(actor, projectId);
}

export async function listProjectsForCustomer(actor: OwnershipActor, customerId: string) {
  const service = await getDefaultProjectService();
  return service.listProjectsForCustomer(actor, customerId);
}

export async function updateProject(
  actor: OwnershipActor,
  projectId: string,
  input: UpdateProjectInput
) {
  const service = await getDefaultProjectService();
  return service.updateProject(actor, projectId, input);
}

export async function archiveProject(actor: OwnershipActor, projectId: string) {
  const service = await getDefaultProjectService();
  return service.archiveProject(actor, projectId);
}

export async function deleteProject(
  actor: OwnershipActor,
  projectId: string,
  options: { confirm: boolean }
) {
  const service = await getDefaultProjectService();
  return service.deleteProject(actor, projectId, options);
}

export async function scheduleDeletion(
  actor: OwnershipActor,
  projectId: string,
  options: { confirm: boolean }
) {
  const service = await getDefaultProjectService();
  return service.scheduleDeletion(actor, projectId, options);
}

export async function cancelDeletion(actor: OwnershipActor, projectId: string) {
  const service = await getDefaultProjectService();
  return service.cancelDeletion(actor, projectId);
}

export async function purgeDueScheduledDeletions() {
  const service = await getDefaultProjectService();
  return service.purgeDueScheduledDeletions();
}

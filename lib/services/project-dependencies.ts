import type {
  PrismaClient,
  ProjectValueDependency,
} from "@/lib/generated/prisma/client";
import { badRequest } from "@/lib/http-errors";
import { markValueObsolete } from "@/lib/services/project-values";

type PrismaClientLike = PrismaClient;

// Couche 3 (MASTER-11) : socle générique "dépendances" (MASTER-06 §27-30).
// Déclare uniquement un graphe (`dependentKey` dépend de `dependsOnKey`) et
// permet de cibler ce qui doit être marqué obsolète — jamais d'invalidation
// globale (MASTER-06 §30), jamais de recalcul automatique. Aucune clé
// métier ni règle de dépendance spécifique n'est codée ici.

export type DeclareDependencyInput = {
  projectId: string;
  dependentKey: string;
  dependsOnKey: string;
};

export type ProjectDependenciesDb = {
  createDependency(data: {
    projectId: string;
    dependentKey: string;
    dependsOnKey: string;
  }): Promise<ProjectValueDependency>;
  findDependency(
    projectId: string,
    dependentKey: string,
    dependsOnKey: string
  ): Promise<ProjectValueDependency | null>;
  listDependents(projectId: string, dependsOnKey: string): Promise<ProjectValueDependency[]>;
  listDependencies(projectId: string): Promise<ProjectValueDependency[]>;
};

function assertNonEmpty(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw badRequest(`${label} is required`);
  }

  return normalized;
}

function createPrismaProjectDependenciesDb(client: PrismaClientLike): ProjectDependenciesDb {
  return {
    async createDependency(data) {
      return client.projectValueDependency.create({ data });
    },
    async findDependency(projectId, dependentKey, dependsOnKey) {
      return client.projectValueDependency.findUnique({
        where: {
          projectId_dependentKey_dependsOnKey: { projectId, dependentKey, dependsOnKey },
        },
      });
    },
    async listDependents(projectId, dependsOnKey) {
      return client.projectValueDependency.findMany({ where: { projectId, dependsOnKey } });
    },
    async listDependencies(projectId) {
      return client.projectValueDependency.findMany({ where: { projectId } });
    },
  };
}

type ProjectDependenciesDeps = {
  markValueObsolete?: (projectId: string, key: string) => Promise<unknown>;
};

async function getDefaultProjectDependenciesService() {
  const { prisma } = await import("@/lib/prisma");
  return createProjectDependenciesService(createPrismaProjectDependenciesDb(prisma), {
    markValueObsolete,
  });
}

/**
 * Fonction pure : dérive les clés directement dépendantes de `changedKey`.
 * Volontairement à un seul niveau (dépendances ciblées, MASTER-06 §30) :
 * la propagation transitive éventuelle est un choix métier non défini par
 * les MASTER (voir "Arbitrage requis" du rapport de phase) et n'est donc
 * pas implémentée ici.
 */
export function computeDirectDependents(
  edges: Pick<ProjectValueDependency, "dependentKey" | "dependsOnKey">[],
  changedKey: string
): string[] {
  return edges
    .filter((edge) => edge.dependsOnKey === changedKey)
    .map((edge) => edge.dependentKey);
}

export function createProjectDependenciesService(
  db: ProjectDependenciesDb,
  deps?: ProjectDependenciesDeps
) {
  const markObsolete = deps?.markValueObsolete ?? markValueObsolete;

  return {
    /** Déclare qu'une valeur dépend d'une autre. Idempotent si l'arête
     * existe déjà. */
    async declareDependency(input: DeclareDependencyInput): Promise<ProjectValueDependency> {
      const projectId = assertNonEmpty(input.projectId, "Project id");
      const dependentKey = assertNonEmpty(input.dependentKey, "Dependent key");
      const dependsOnKey = assertNonEmpty(input.dependsOnKey, "Depends-on key");

      const existing = await db.findDependency(projectId, dependentKey, dependsOnKey);

      if (existing) {
        return existing;
      }

      return db.createDependency({ projectId, dependentKey, dependsOnKey });
    },

    async listDependencies(projectId: string): Promise<ProjectValueDependency[]> {
      return db.listDependencies(assertNonEmpty(projectId, "Project id"));
    },

    /** Marque comme obsolètes (À recalculer) les valeurs retenues qui
     * dépendent directement de `changedKey`, sans toucher aux autres
     * (MASTER-06 §30) et sans jamais remplacer la valeur retenue elle-même
     * (MASTER-06 §29). Ne touche que les clés ayant réellement une valeur
     * retenue existante ; les autres sont ignorées silencieusement. */
    async markDependentsObsolete(projectId: string, changedKey: string): Promise<string[]> {
      const normalizedProjectId = assertNonEmpty(projectId, "Project id");
      const normalizedChangedKey = assertNonEmpty(changedKey, "Changed key");

      const dependents = await db.listDependents(normalizedProjectId, normalizedChangedKey);
      const dependentKeys = computeDirectDependents(dependents, normalizedChangedKey);

      const obsoleted: string[] = [];

      for (const key of dependentKeys) {
        try {
          await markObsolete(normalizedProjectId, key);
          obsoleted.push(key);
        } catch {
          // Pas de valeur retenue pour cette clé : rien à marquer obsolète.
          continue;
        }
      }

      return obsoleted;
    },
  };
}

export async function declareDependency(input: DeclareDependencyInput) {
  const service = await getDefaultProjectDependenciesService();
  return service.declareDependency(input);
}

export async function listDependencies(projectId: string) {
  const service = await getDefaultProjectDependenciesService();
  return service.listDependencies(projectId);
}

export async function markDependentsObsolete(projectId: string, changedKey: string) {
  const service = await getDefaultProjectDependenciesService();
  return service.markDependentsObsolete(projectId, changedKey);
}

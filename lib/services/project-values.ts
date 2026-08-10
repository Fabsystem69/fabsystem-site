import type {
  PrismaClient,
  ProjectRetainedValue,
} from "@/lib/generated/prisma/client";
import { badRequest, notFound } from "@/lib/http-errors";

type PrismaClientLike = PrismaClient;

// Couche 3 (MASTER-11) : socle générique "valeurs retenues" (MASTER-06
// §24-26). Aucun calculateur : ce module ne connaît aucune clé métier et
// n'impose aucune règle de recalcul. `key` reste un identifiant libre que
// les futurs modules définiront (ex. "battery.capacity"), non figé ici.

export type RetainValueInput = {
  projectId: string;
  key: string;
  value: unknown;
  simulatedValue?: unknown;
  source?: string | null;
};

export type ProjectValuesDb = {
  upsertRetainedValue(data: {
    projectId: string;
    key: string;
    value: unknown;
    simulatedValue: unknown;
    source: string | null;
    retainedAt: Date;
  }): Promise<ProjectRetainedValue>;
  findRetainedValue(projectId: string, key: string): Promise<ProjectRetainedValue | null>;
  updateRetainedValueStatus(
    id: string,
    data: { status: "ACTIVE" | "OBSOLETE"; obsoletedAt: Date | null }
  ): Promise<ProjectRetainedValue>;
  listRetainedValues(projectId: string): Promise<ProjectRetainedValue[]>;
};

type ProjectValuesDeps = {
  now?: () => Date;
};

function assertNonEmpty(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw badRequest(`${label} is required`);
  }

  return normalized;
}

function createPrismaProjectValuesDb(client: PrismaClientLike): ProjectValuesDb {
  return {
    async upsertRetainedValue(data) {
      return client.projectRetainedValue.upsert({
        where: { projectId_key: { projectId: data.projectId, key: data.key } },
        create: {
          projectId: data.projectId,
          key: data.key,
          value: data.value as never,
          simulatedValue: data.simulatedValue as never,
          source: data.source,
          status: "ACTIVE",
          retainedAt: data.retainedAt,
          obsoletedAt: null,
        },
        update: {
          value: data.value as never,
          simulatedValue: data.simulatedValue as never,
          source: data.source,
          status: "ACTIVE",
          retainedAt: data.retainedAt,
          obsoletedAt: null,
        },
      });
    },
    async findRetainedValue(projectId, key) {
      return client.projectRetainedValue.findUnique({
        where: { projectId_key: { projectId, key } },
      });
    },
    async updateRetainedValueStatus(id, data) {
      return client.projectRetainedValue.update({ where: { id }, data });
    },
    async listRetainedValues(projectId) {
      return client.projectRetainedValue.findMany({
        where: { projectId },
        orderBy: { key: "asc" },
      });
    },
  };
}

async function getDefaultProjectValuesService() {
  const { prisma } = await import("@/lib/prisma");
  return createProjectValuesService(createPrismaProjectValuesDb(prisma));
}

export function createProjectValuesService(db: ProjectValuesDb, deps?: ProjectValuesDeps) {
  const now = deps?.now ?? (() => new Date());

  return {
    /** Action explicite "Retenir" (MASTER-06 §26) : la simulation ne
     * devient jamais automatiquement la valeur retenue ; cette fonction ne
     * doit être appelée que sur décision explicite d'un futur module. */
    async retainValue(input: RetainValueInput): Promise<ProjectRetainedValue> {
      const projectId = assertNonEmpty(input.projectId, "Project id");
      const key = assertNonEmpty(input.key, "Value key");

      return db.upsertRetainedValue({
        projectId,
        key,
        value: input.value,
        simulatedValue: input.simulatedValue ?? null,
        source: input.source ?? null,
        retainedAt: now(),
      });
    },

    /** Marque une valeur retenue comme obsolète (À recalculer) sans jamais
     * la remplacer silencieusement (MASTER-06 §29). Idempotent. */
    async markValueObsolete(projectId: string, key: string): Promise<ProjectRetainedValue> {
      const normalizedProjectId = assertNonEmpty(projectId, "Project id");
      const normalizedKey = assertNonEmpty(key, "Value key");

      const existing = await db.findRetainedValue(normalizedProjectId, normalizedKey);

      if (!existing) {
        throw notFound("Retained value not found");
      }

      if (existing.status === "OBSOLETE") {
        return existing;
      }

      return db.updateRetainedValueStatus(existing.id, {
        status: "OBSOLETE",
        obsoletedAt: now(),
      });
    },

    async getProjectValue(projectId: string, key: string): Promise<ProjectRetainedValue | null> {
      return db.findRetainedValue(
        assertNonEmpty(projectId, "Project id"),
        assertNonEmpty(key, "Value key")
      );
    },

    async getProjectValues(projectId: string): Promise<ProjectRetainedValue[]> {
      return db.listRetainedValues(assertNonEmpty(projectId, "Project id"));
    },
  };
}

export async function retainValue(input: RetainValueInput) {
  const service = await getDefaultProjectValuesService();
  return service.retainValue(input);
}

export async function markValueObsolete(projectId: string, key: string) {
  const service = await getDefaultProjectValuesService();
  return service.markValueObsolete(projectId, key);
}

export async function getProjectValue(projectId: string, key: string) {
  const service = await getDefaultProjectValuesService();
  return service.getProjectValue(projectId, key);
}

export async function getProjectValues(projectId: string) {
  const service = await getDefaultProjectValuesService();
  return service.getProjectValues(projectId);
}

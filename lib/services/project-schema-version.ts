import { Prisma, type ProjectSchemaVersion, type ProjectSchemaVersionAuthor } from "@/lib/generated/prisma/client";
import { badRequest, notFound } from "@/lib/http-errors";
import type { OwnershipActor } from "@/lib/ownership";
import { getProject } from "@/lib/services/project";

type VersionInput = {
  label?: string | null;
  authorType: ProjectSchemaVersionAuthor;
  authorName: string;
};

// Convention déjà établie par app/api/projects/[projectId]/schema/versions/route.ts
// (création manuelle d'une version) : un libellé générique par rôle, jamais
// le vrai nom du client (pas de PII dans l'historique d'auteur). Déplacé
// ici et exporté pour que project-schema.ts (instantané automatique avant
// sauvegarde, Lot 3 dashboard client) utilise exactement la même
// convention — un seul endroit qui décide "qui a écrit quoi".
export function authorFor(actor: OwnershipActor): { authorType: ProjectSchemaVersionAuthor; authorName: string } {
  return actor.role === "admin" ? { authorType: "ADMIN", authorName: "FabSystem" } : { authorType: "CUSTOMER", authorName: "Client" };
}

export type VersionDb = {
  projectSchema: {
    findUnique(args: Prisma.ProjectSchemaFindUniqueArgs): Promise<{
      id: string;
      projectName: string;
      nodes: Prisma.JsonValue;
      edges: Prisma.JsonValue;
      thumbnail: string | null;
    } | null>;
    update(args: Prisma.ProjectSchemaUpdateArgs): Promise<unknown>;
  };
  projectSchemaVersion: {
    findMany(args: Prisma.ProjectSchemaVersionFindManyArgs): Promise<ProjectSchemaVersion[]>;
    findUnique(args: Prisma.ProjectSchemaVersionFindUniqueArgs): Promise<ProjectSchemaVersion | null>;
    create(args: Prisma.ProjectSchemaVersionCreateArgs): Promise<ProjectSchemaVersion>;
  };
  // Revue (Lot 3 dashboard client) : verrouille la ligne ProjectSchema pour
  // toute la transaction, même mécanisme et même but que dans
  // project-schema.ts (saveWithHistory) — sans ce verrou PARTAGÉ (même
  // requête, même ligne), une création manuelle de version ou une
  // restauration pourrait calculer le même "prochain numéro de version"
  // qu'une sauvegarde automatique concurrente et violer la contrainte
  // unique (projectSchemaId, versionNumber) au lieu d'être simplement
  // mise en attente par Postgres jusqu'à la fin de l'autre transaction.
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  $transaction<T>(fn: (tx: VersionDb) => Promise<T>): Promise<T>;
};

function normalizedLabel(label: string | null | undefined) {
  const value = label?.trim();
  if (!value) return null;
  if (value.length > 120) throw badRequest("Version label must be 120 characters or fewer");
  return value;
}

// Les valeurs lues en JSON peuvent être `null`, alors que Prisma impose sa
// sentinelle `JsonNull` pour représenter cette valeur lors d'une écriture.
// Exporté : réutilisé par project-schema.ts pour l'instantané automatique
// avant sauvegarde (Lot 3 dashboard client) — une seule logique de
// conversion JSON, jamais deux versions qui pourraient diverger.
export function asInputJson(value: Prisma.JsonValue): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : value;
}

// Exporté pour la même raison : project-schema.ts doit numéroter ses
// instantanés automatiques dans la MÊME séquence que les versions créées
// explicitement (bouton "Créer une version") ou par restauration — jamais
// une numérotation parallèle qui entrerait en collision.
export async function nextVersionNumber(db: VersionDb, projectSchemaId: string) {
  const versions = await db.projectSchemaVersion.findMany({
    where: { projectSchemaId },
    orderBy: { versionNumber: "desc" },
    take: 1,
  });
  return (versions[0]?.versionNumber ?? 0) + 1;
}

async function getSchemaOrThrow(db: VersionDb, projectId: string) {
  const schema = await db.projectSchema.findUnique({ where: { projectId } });
  if (!schema) throw notFound("Project schema not found");
  return schema;
}

export function createProjectSchemaVersionService(db: VersionDb, assertOwnedProject = getProject) {
  return {
    async list(actor: OwnershipActor, projectId: string) {
      const project = await assertOwnedProject(actor, projectId);
      const schema = await getSchemaOrThrow(db, project.id);
      return db.projectSchemaVersion.findMany({
        where: { projectSchemaId: schema.id },
        orderBy: { versionNumber: "desc" },
      });
    },

    async create(actor: OwnershipActor, projectId: string, input: VersionInput) {
      const project = await assertOwnedProject(actor, projectId);
      return db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "ProjectSchema" WHERE "projectId" = ${project.id} FOR UPDATE`;
        const schema = await getSchemaOrThrow(tx, project.id);
        const versionNumber = await nextVersionNumber(tx, schema.id);
        return tx.projectSchemaVersion.create({
          data: {
            projectSchemaId: schema.id,
            versionNumber,
            authorType: input.authorType,
            authorName: input.authorName,
            label: normalizedLabel(input.label),
            projectName: schema.projectName,
            nodes: asInputJson(schema.nodes),
            edges: asInputJson(schema.edges),
            thumbnail: schema.thumbnail,
          },
        });
      });
    },

    async restore(actor: OwnershipActor, projectId: string, versionId: string, input: Omit<VersionInput, "label">) {
      const project = await assertOwnedProject(actor, projectId);
      return db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "ProjectSchema" WHERE "projectId" = ${project.id} FOR UPDATE`;
        const schema = await getSchemaOrThrow(tx, project.id);
        const version = await tx.projectSchemaVersion.findUnique({ where: { id: versionId } });
        if (!version || version.projectSchemaId !== schema.id) throw notFound("Project schema version not found");

        // La version courante est sauvegardée avant toute restauration: même
        // une mauvaise manipulation peut donc être annulée sans perte.
        const versionNumber = await nextVersionNumber(tx, schema.id);
        await tx.projectSchemaVersion.create({
          data: {
            projectSchemaId: schema.id,
            versionNumber,
            authorType: input.authorType,
            authorName: input.authorName,
            label: "Avant restauration",
            projectName: schema.projectName,
            nodes: asInputJson(schema.nodes),
            edges: asInputJson(schema.edges),
            thumbnail: schema.thumbnail,
          },
        });
        await tx.projectSchema.update({
          where: { id: schema.id },
          data: {
            projectName: version.projectName,
            nodes: asInputJson(version.nodes),
            edges: asInputJson(version.edges),
            thumbnail: version.thumbnail,
            // Bug réel trouvé en revue : sans ceci, l'état restauré gardait
            // l'auteur de l'état PRÉCÉDENT (ou restait "inconnu" pour un
            // schéma jamais encore modifié depuis ce champ) — qui restaure
            // devient l'auteur de l'état restauré, c'est une modification
            // comme une autre.
            lastModifiedByType: input.authorType,
            lastModifiedByName: input.authorName,
          },
        });
        return version;
      });
    },
  };
}

async function getDefaultService() {
  const { prisma } = await import("@/lib/prisma");
  return createProjectSchemaVersionService(prisma as unknown as VersionDb);
}

export async function listProjectSchemaVersions(actor: OwnershipActor, projectId: string) {
  return (await getDefaultService()).list(actor, projectId);
}

export async function createProjectSchemaVersion(actor: OwnershipActor, projectId: string, input: VersionInput) {
  return (await getDefaultService()).create(actor, projectId, input);
}

export async function restoreProjectSchemaVersion(actor: OwnershipActor, projectId: string, versionId: string, input: Omit<VersionInput, "label">) {
  return (await getDefaultService()).restore(actor, projectId, versionId, input);
}

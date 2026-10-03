import type { PrismaClient, ProjectSchema, ProjectSchemaVersionAuthor, Prisma } from "@/lib/generated/prisma/client";
import { conflict, forbidden, notFound, serviceUnavailable } from "@/lib/http-errors";
import type { OwnershipActor } from "@/lib/ownership";
import { logServerEvent } from "@/lib/server-log";
import { getProject } from "@/lib/services/project";
import { isProjectReadOnly } from "@/lib/services/schema-unlock";
import { authorFor, asInputJson, nextVersionNumber, type VersionDb } from "@/lib/services/project-schema-version";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import { displayName } from "@/lib/electrical-components/bom";
import { randomBytes } from "crypto";

type PrismaClientLike = PrismaClient;

// Schéma électrique de /outils/schema, lié à un Project (retour
// utilisateur : "il manque enregistrer lié au compte client"). Même
// structure DI que lib/services/project.ts, relation 1:1 avec Project.
//
// Lot 3 dashboard client (docs/03-DATABASE.md "Lot 3 dashboard client",
// 02/10/2026) : avant, une sauvegarde était un upsert nu, sans aucun
// instantané ni trace d'auteur. saveWithHistory (plus bas) snapshotte
// désormais atomiquement l'état REMPLACÉ dans ProjectSchemaVersion dès que
// le contenu change réellement, et protège contre un écrasement concurrent
// via `expectedUpdatedAt`.
export type SaveProjectSchemaInput = {
  projectName: string;
  nodes: Prisma.InputJsonValue;
  edges: Prisma.InputJsonValue;
  thumbnail?: string | null;
  // Optionnel : aucun appelant actuel ne le transmet encore (le contrat de
  // /api/projects/[projectId]/schema PUT et l'éditeur React n'ont pas
  // encore été mis à jour pour le suivre — voir docs/03-DATABASE.md, "Phase
  // scindée volontairement"). Fourni => la sauvegarde échoue explicitement
  // en conflit si l'état a changé depuis cette lecture, plutôt que
  // d'écraser silencieusement. Absent => comportement actuel inchangé pour
  // les appelants qui ne l'envoient pas encore.
  expectedUpdatedAt?: Date;
};

export type SaveProjectSchemaResult =
  | { status: "saved"; schema: ProjectSchema }
  | { status: "conflict" };

export type ProjectSchemaSummary = { projectId: string; thumbnail: string | null; updatedAt: Date };
export type SharedProjectSchema = Pick<ProjectSchema, "projectName" | "nodes" | "edges" | "updatedAt">;

export type ProjectSchemaDb = {
  findByProjectId(projectId: string): Promise<ProjectSchema | null>;
  saveWithHistory(
    projectId: string,
    input: SaveProjectSchemaInput,
    author: { authorType: ProjectSchemaVersionAuthor; authorName: string }
  ): Promise<SaveProjectSchemaResult>;
  findSummariesByProjectIds(projectIds: string[]): Promise<ProjectSchemaSummary[]>;
  setShareToken?(projectId: string, token: string | null): Promise<ProjectSchema>;
  findSharedByToken?(token: string): Promise<SharedProjectSchema | null>;
};

// Exporté pour test direct : décide si deux états de schéma diffèrent
// réellement — contenu significatif seulement (jamais la miniature,
// cosmétique/dérivée, ni les horodatages). Une sauvegarde identique au
// contenu déjà en base ne doit jamais créer de copie inutile dans
// l'historique.
export function hasSchemaContentChanged(
  current: { projectName: string; nodes: unknown; edges: unknown },
  next: { projectName: string; nodes: unknown; edges: unknown }
): boolean {
  return (
    current.projectName !== next.projectName ||
    JSON.stringify(current.nodes) !== JSON.stringify(next.nodes) ||
    JSON.stringify(current.edges) !== JSON.stringify(next.edges)
  );
}

type ProjectSchemaServiceDeps = {
  assertOwnedProject?: typeof getProject;
  reportSchemaStorageMissing?: (operation: string, error: unknown) => void;
  checkProjectReadOnly?: typeof isProjectReadOnly;
};

// Sentinelle interne pour forcer un vrai ROLLBACK depuis `saveWithHistory`
// (voir le commentaire sur place) — jamais exportée, jamais exposée en
// dehors de ce fichier, convertie en `{status: "conflict"}` juste après la
// transaction.
class SaveConflictSignal extends Error {}

// Filet de sécurité pour le cas plus rare qu'un verrou FOR UPDATE ne peut
// pas couvrir : deux tout-premiers enregistrements concurrents pour le
// même projet (ProjectSchema pas encore créé, rien à verrouiller), ou deux
// instantanés concurrents visant le même (projectSchemaId, versionNumber)
// malgré le verrou (ex. verrou posé par une AUTRE transaction qui ne
// verrouille pas la même ligne — restauration/version manuelle, voir
// project-schema-version.ts). Detection structurelle (code + contrainte),
// même principe que isProjectSchemaTableMissingError ci-dessous.
function isVersionNumberRaceError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; meta?: { target?: unknown } };
  if (candidate.code !== "P2002") return false;
  const target = candidate.meta?.target;
  const targetText = Array.isArray(target) ? target.join(",") : String(target ?? "");
  return targetText.includes("versionNumber") || targetText.includes("projectId");
}

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

  // P2021 : table absente. P2022 : table présente mais une colonne d'une
  // migration plus récente manque encore. Dans les deux cas, l'espace client
  // reste disponible pendant le rattrapage de la base.
  return (candidate.code === "P2021" || candidate.code === "P2022") && (messageMentionsModel || metaMentionsModel);
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
    async saveWithHistory(projectId, input, author) {
      try {
        return await client.$transaction(async (tx) => {
          // SELECT ... FOR UPDATE verrouille la ligne pour toute la
          // transaction : une deuxième sauvegarde concurrente sur LE MÊME
          // projet attend ici plutôt que de calculer le même "prochain
          // numéro de version" en même temps. Repro réel (recette locale,
          // deux sauvegardes lancées en parallèle) sans ce verrou : les
          // deux lisaient le même maximum, violaient la contrainte unique
          // (projectSchemaId, versionNumber) au lieu d'obtenir un conflit
          // propre. Aucune ligne à verrouiller pour un tout premier
          // enregistrement (ProjectSchema pas encore créé) — le filet de
          // sécurité ci-dessous (catch P2002) couvre ce cas plus rare.
          await tx.$queryRaw`SELECT id FROM "ProjectSchema" WHERE "projectId" = ${projectId} FOR UPDATE`;
          const current = await tx.projectSchema.findUnique({ where: { projectId } });

          if (!current) {
            const created = await tx.projectSchema.create({
              data: {
                projectId,
                projectName: input.projectName,
                nodes: input.nodes,
                edges: input.edges,
                thumbnail: input.thumbnail ?? null,
                lastModifiedByType: author.authorType,
                lastModifiedByName: author.authorName,
              },
            });
            return { status: "saved" as const, schema: created };
          }

          // IMPORTANT (revue) : un conflit doit annuler TOUTE la transaction,
          // y compris un instantané déjà créé juste avant de le détecter —
          // un simple `return` depuis ce callback vaudrait un COMMIT normal
          // pour Prisma, ce qui aurait validé cet instantané orphelin.
          // `throw` est la seule façon correcte de déclencher un vrai
          // ROLLBACK ; converti en résultat "conflict" par le catch
          // extérieur, jamais à l'intérieur de la transaction elle-même.
          if (input.expectedUpdatedAt && current.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
            throw new SaveConflictSignal();
          }

          if (hasSchemaContentChanged(current, input)) {
            // Instantané atomique de l'état REMPLACÉ (pas du nouveau), attribué
            // à SON PROPRE auteur connu — jamais celui de la modification qui
            // arrive. UNKNOWN/"Auteur inconnu" pour un schéma antérieur à ce
            // champ, jamais deviné.
            const versionNumber = await nextVersionNumber(tx as unknown as VersionDb, current.id);
            await tx.projectSchemaVersion.create({
              data: {
                projectSchemaId: current.id,
                versionNumber,
                authorType: current.lastModifiedByType ?? "UNKNOWN",
                authorName: current.lastModifiedByName ?? "Auteur inconnu",
                label: null,
                projectName: current.projectName,
                nodes: asInputJson(current.nodes),
                edges: asInputJson(current.edges),
                thumbnail: current.thumbnail,
              },
            });
          }

          // Mise à jour conditionnée sur l'updatedAt lu ci-dessus (jamais une
          // lecture puis écriture séparées) : si une autre écriture a eu lieu
          // entre la lecture et cet instant (deux onglets, admin+client),
          // `count` vaut 0 — on annule TOUTE la transaction (y compris
          // l'instantané ci-dessus) plutôt que de la laisser committer à moitié.
          const result = await tx.projectSchema.updateMany({
            where: { projectId, updatedAt: current.updatedAt },
            data: {
              projectName: input.projectName,
              nodes: input.nodes,
              edges: input.edges,
              thumbnail: input.thumbnail ?? null,
              lastModifiedByType: author.authorType,
              lastModifiedByName: author.authorName,
            },
          });
          if (result.count === 0) {
            throw new SaveConflictSignal();
          }

          const updated = await tx.projectSchema.findUniqueOrThrow({ where: { projectId } });
          return { status: "saved" as const, schema: updated };
        });
      } catch (error) {
        if (error instanceof SaveConflictSignal || isVersionNumberRaceError(error)) {
          return { status: "conflict" as const };
        }
        throw error;
      }
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

type SchemaNodeLike = { id: string; data?: Record<string, unknown> };
type SchemaEdgeLike = { id: string; source: string; target: string; data?: Record<string, unknown> };

export type MissingCableLength = { edgeId: string; label: string };

function nodeDisplayLabel(node: SchemaNodeLike | undefined): string {
  if (!node) return "?";
  const data = node.data ?? {};
  const componentType = String(data.componentType ?? "");
  const def = getComponentDefinition(componentType);
  const fallback = typeof data.label === "string" ? data.label : def?.label ?? "Composant";
  return displayName(componentType, fallback, data);
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
        const result = await db.saveWithHistory(project.id, input, authorFor(actor));
        if (result.status === "conflict") {
          throw conflict("Ce schéma a été modifié ailleurs entre-temps — rechargez avant de réessayer.");
        }
        return result.schema;
      } catch (error) {
        if (isProjectSchemaTableMissingError(error)) {
          reportSchemaStorageMissing("saveProjectSchema", error);
          throw projectSchemaStorageUnavailableError();
        }
        throw error;
      }
    },

    // Retour utilisateur : "rendre participatif (demande des distances de
    // câble ou autre)" — cas régulier de l'accompagnement où l'admin
    // construit la topologie mais ne connaît pas les distances réelles dans
    // le véhicule du client. Dérivé de l'état existant des câbles (même
    // logique que bom.ts:hasLength), aucun nouveau champ en base : un câble
    // sans longueur renseignée apparaît dans la liste à compléter.
    async listMissingCableLengths(actor: OwnershipActor, projectId: string): Promise<MissingCableLength[]> {
      const project = await assertOwnedProject(actor, projectId);
      const schema = await db.findByProjectId(project.id);
      if (!schema) return [];
      const nodes = (schema.nodes as unknown as SchemaNodeLike[]) ?? [];
      const edges = (schema.edges as unknown as SchemaEdgeLike[]) ?? [];
      const nodesById = new Map(nodes.map((n) => [n.id, n]));

      return edges
        .filter((edge) => {
          const length = Number(edge.data?.length);
          return !(Number.isFinite(length) && length > 0);
        })
        .map((edge) => ({
          edgeId: edge.id,
          label: `${nodeDisplayLabel(nodesById.get(edge.source))} → ${nodeDisplayLabel(nodesById.get(edge.target))}`,
        }));
    },

    // Écrit uniquement les longueurs fournies (positives) — les câbles
    // absents de `lengths`, ou avec une valeur invalide, restent inchangés
    // plutôt que d'être écrasés par une saisie partielle du client.
    async setCableLengths(actor: OwnershipActor, projectId: string, lengths: Record<string, number>): Promise<void> {
      const project = await assertOwnedProject(actor, projectId);
      if (actor.role !== "admin" && await checkProjectReadOnly(project.customerId, project.id)) {
        throw forbidden("Project schema is read-only: unlock has expired");
      }
      const schema = await db.findByProjectId(project.id);
      if (!schema) throw notFound("Schéma introuvable.");
      const edges = (schema.edges as unknown as SchemaEdgeLike[]) ?? [];
      const updatedEdges = edges.map((edge) => {
        const value = lengths[edge.id];
        if (value === undefined || !Number.isFinite(value) || value <= 0) return edge;
        return { ...edge, data: { ...(edge.data ?? {}), length: value } };
      });
      const result = await db.saveWithHistory(
        project.id,
        {
          projectName: schema.projectName,
          nodes: schema.nodes as Prisma.InputJsonValue,
          edges: updatedEdges as unknown as Prisma.InputJsonValue,
          thumbnail: schema.thumbnail,
          // Protège contre une écriture concurrente entre la lecture
          // ci-dessus et cette sauvegarde (même schéma complété par le
          // client pendant que l'admin l'édite dans l'éditeur).
          expectedUpdatedAt: schema.updatedAt,
        },
        authorFor(actor)
      );
      if (result.status === "conflict") {
        throw conflict("Ce schéma a été modifié ailleurs entre-temps — rechargez avant de réessayer.");
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

export async function listMissingCableLengths(actor: OwnershipActor, projectId: string) {
  const service = await getDefaultProjectSchemaService();
  return service.listMissingCableLengths(actor, projectId);
}

export async function setCableLengths(
  actor: OwnershipActor,
  projectId: string,
  lengths: Record<string, number>
) {
  const service = await getDefaultProjectSchemaService();
  return service.setCableLengths(actor, projectId, lengths);
}

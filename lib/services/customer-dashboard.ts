import type {
  CoachingProjectStatus,
  DossierOffre,
  PrismaClient,
  ProjectAssetType,
  ProjectStatus,
  ProjectVoltage,
} from "@/lib/generated/prisma/client";

type PrismaClientLike = PrismaClient;

// Lot 1 (PROMPT_CLAUDE_DASHBOARD_CLIENT_V1.md, 02/10/2026) : synthèse
// serveur agrégée pour le dashboard client unifié. Ne duplique AUCUNE
// donnée dans une nouvelle table — lit Project/CoachingProject/DossierClient
// tels qu'ils existent déjà, et résout explicitement leurs liens plutôt que
// de deviner. Même pattern d'injection que lib/services/project.ts
// (createXService(db) + getDefaultXService()) pour rester testable sur
// fixtures, sans jamais toucher une vraie base dans les tests.

export interface CustomerDashboardProjectSummary {
  id: string;
  name: string;
  assetType: ProjectAssetType;
  voltage: ProjectVoltage;
  status: ProjectStatus;
  updatedAt: Date;
  hasSchema: boolean;
  schemaUpdatedAt: Date | null;
  schemaThumbnail: string | null;
  // Résolu depuis Project.linkedCoachingProject (relation réciproque),
  // jamais déduit par nom/date — null = aucun accompagnement rattaché.
  linkedCoachingProjectId: string | null;
}

export interface CustomerDashboardCoachingSummary {
  id: string;
  title: string;
  status: CoachingProjectStatus;
  assetType: ProjectAssetType | null;
  derniereActivite: Date;
  readyForReviewAt: Date | null;
  openClientActionCount: number;
  orderId: string | null;
  // Coordonnées déjà vérifiées pour la visio WhatsApp (jamais inventées) —
  // un lien WhatsApp ouvre une conversation, il ne rejoint pas
  // automatiquement une visio (prompt, décision ferme #3).
  whatsapp: string | null;
  // Résolu depuis CoachingProject.linkedProjectId, jamais déduit.
  linkedProjectId: string | null;
}

// Signal volontairement honnête plutôt qu'une fusion automatique : un
// DossierClient (ancien système) et un CoachingProject peuvent coexister
// pour le même client sans qu'aucune donnée ne permette de certifier qu'ils
// décrivent le même accompagnement — seul un orderId partagé est une preuve
// technique, jamais un rapprochement par nom/e-mail (docs/03-DATABASE.md §9).
export type CustomerDashboardLegacyDossierSignal =
  | { kind: "none" }
  | {
      kind: "present";
      dossierId: string;
      offre: DossierOffre;
      // true seulement si un CoachingProject partage le MÊME orderId (preuve
      // technique de reprise) — jamais déduit autrement. false ne prouve pas
      // l'absence de reprise si le dossier n'a pas d'orderId (ex. découverte).
      absorbedByMatchingOrderId: boolean;
      hasAnyCoachingProject: boolean;
    };

export interface CustomerDashboardContext {
  customerId: string;
  projects: CustomerDashboardProjectSummary[];
  coachingProjects: CustomerDashboardCoachingSummary[];
  legacyDossier: CustomerDashboardLegacyDossierSignal;
}

export interface CustomerDashboardDb {
  listProjects(customerId: string): Promise<CustomerDashboardProjectSummary[]>;
  listCoachingProjects(customerId: string): Promise<CustomerDashboardCoachingSummary[]>;
  findLatestLegacyDossier(customerId: string): Promise<{ id: string; offre: DossierOffre; orderId: string | null } | null>;
}

// Un seul sélecteur de projet commun (navigation cible du prompt) : priorité
// au Project explicitement demandé, puis à celui rattaché à un
// accompagnement actif (le contexte le plus probable pendant un suivi), puis
// au Project le plus récemment modifié. Jamais de correspondance par
// nom/date pour relier coaching et éditeur — seulement le lien déjà
// enregistré en base. Fonction pure (aucun accès base) : importable
// directement par les pages, sans construire un service.
export function resolveSelectedProject(
  context: CustomerDashboardContext,
  requestedProjectId?: string | null
): CustomerDashboardProjectSummary | null {
  if (requestedProjectId) {
    return context.projects.find((p) => p.id === requestedProjectId) ?? null;
  }

  const activeCoachingWithLink = context.coachingProjects.find((c) => c.linkedProjectId && c.status !== "TERMINE");
  if (activeCoachingWithLink?.linkedProjectId) {
    const linked = context.projects.find((p) => p.id === activeCoachingWithLink.linkedProjectId);
    if (linked) return linked;
  }

  if (context.projects.length === 0) return null;
  return [...context.projects].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
}

// CoachingProject correspondant au Project sélectionné, par le lien
// explicite uniquement — permet à "Mon coaching"/"Mon installation" de
// savoir si le projet affiché a un accompagnement actif sans jamais inventer
// une correspondance. Fonction pure, même principe que resolveSelectedProject.
export function resolveLinkedCoaching(
  context: CustomerDashboardContext,
  projectId: string | null
): CustomerDashboardCoachingSummary | null {
  if (!projectId) return null;
  return context.coachingProjects.find((c) => c.linkedProjectId === projectId) ?? null;
}

// Revue (02/10/2026) : un CoachingProject SANS linkedProjectId devenait
// invisible sur l'accueil, parce que la seule façon d'atteindre un
// accompagnement était de passer par resolveLinkedCoaching(selectedProject)
// — un accompagnement pas encore rattaché à un schéma (cas réel : Fabien
// n'a pas encore créé/relié le Project) n'avait donc aucune action ni
// rendez-vous affichés. Résolution indépendante, même priorité que
// resolveSelectedProject (demandé explicitement, puis actif le plus
// récent, puis le plus récent tout court) — jamais déduite du projet
// sélectionné, et jamais l'inverse non plus : ces deux sélections
// restent deux résolutions séparées qui peuvent coïncider (via le lien
// explicite) sans jamais être forcées à coïncider.
export function resolveSelectedCoaching(
  context: CustomerDashboardContext,
  requestedCoachingId?: string | null
): CustomerDashboardCoachingSummary | null {
  if (requestedCoachingId) {
    return context.coachingProjects.find((c) => c.id === requestedCoachingId) ?? null;
  }

  if (context.coachingProjects.length === 0) return null;

  const active = [...context.coachingProjects]
    .filter((c) => c.status !== "TERMINE")
    .sort((a, b) => b.derniereActivite.getTime() - a.derniereActivite.getTime())[0];
  if (active) return active;

  return [...context.coachingProjects].sort((a, b) => b.derniereActivite.getTime() - a.derniereActivite.getTime())[0];
}

export function createCustomerDashboardService(db: CustomerDashboardDb) {
  return {
    async getContext(customerId: string): Promise<CustomerDashboardContext> {
      const [projects, coachingProjects, legacyDossierRow] = await Promise.all([
        db.listProjects(customerId),
        db.listCoachingProjects(customerId),
        db.findLatestLegacyDossier(customerId),
      ]);

      const legacyDossier: CustomerDashboardLegacyDossierSignal = legacyDossierRow
        ? {
            kind: "present",
            dossierId: legacyDossierRow.id,
            offre: legacyDossierRow.offre,
            absorbedByMatchingOrderId:
              legacyDossierRow.orderId !== null && coachingProjects.some((c) => c.orderId === legacyDossierRow.orderId),
            hasAnyCoachingProject: coachingProjects.length > 0,
          }
        : { kind: "none" };

      return { customerId, projects, coachingProjects, legacyDossier };
    },

    resolveSelectedProject,
    resolveLinkedCoaching,
    resolveSelectedCoaching,
  };
}

export function createPrismaCustomerDashboardDb(prisma: PrismaClientLike): CustomerDashboardDb {
  return {
    async listProjects(customerId) {
      const rows = await prisma.project.findMany({
        where: { customerId },
        select: {
          id: true,
          name: true,
          assetType: true,
          voltage: true,
          status: true,
          updatedAt: true,
          schema: { select: { updatedAt: true, thumbnail: true } },
          linkedCoachingProject: { select: { id: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      return rows.map((project) => ({
        id: project.id,
        name: project.name,
        assetType: project.assetType,
        voltage: project.voltage,
        status: project.status,
        updatedAt: project.updatedAt,
        hasSchema: project.schema !== null,
        schemaUpdatedAt: project.schema?.updatedAt ?? null,
        schemaThumbnail: project.schema?.thumbnail ?? null,
        linkedCoachingProjectId: project.linkedCoachingProject?.id ?? null,
      }));
    },

    async listCoachingProjects(customerId) {
      const rows = await prisma.coachingProject.findMany({
        where: { customerId },
        select: {
          id: true,
          title: true,
          status: true,
          assetType: true,
          derniereActivite: true,
          readyForReviewAt: true,
          orderId: true,
          whatsapp: true,
          linkedProjectId: true,
          _count: { select: { actions: { where: { responsible: "CLIENT", status: "A_FAIRE" } } } },
        },
        orderBy: { derniereActivite: "desc" },
      });

      return rows.map((coachingProject) => ({
        id: coachingProject.id,
        title: coachingProject.title,
        status: coachingProject.status,
        assetType: coachingProject.assetType,
        derniereActivite: coachingProject.derniereActivite,
        readyForReviewAt: coachingProject.readyForReviewAt,
        openClientActionCount: coachingProject._count.actions,
        orderId: coachingProject.orderId,
        whatsapp: coachingProject.whatsapp,
        linkedProjectId: coachingProject.linkedProjectId,
      }));
    },

    async findLatestLegacyDossier(customerId) {
      return prisma.dossierClient.findFirst({
        where: { customerId },
        select: { id: true, offre: true, orderId: true },
        orderBy: { createdAt: "desc" },
      });
    },
  };
}

async function getDefaultCustomerDashboardDb(): Promise<CustomerDashboardDb> {
  const { prisma } = await import("@/lib/prisma");
  return createPrismaCustomerDashboardDb(prisma);
}

export async function getCustomerDashboardContext(customerId: string): Promise<CustomerDashboardContext> {
  const db = await getDefaultCustomerDashboardDb();
  const service = createCustomerDashboardService(db);
  return service.getContext(customerId);
}

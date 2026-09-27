import { badRequest, notFound } from "@/lib/http-errors";
import { computeCoachingProjectTimeBalance } from "@/lib/coaching-time-balance";
import type { CoachingProjectTimeBalance } from "@/lib/coaching-time-balance";
import { prisma } from "@/lib/prisma";
import type {
  ClientLevel,
  CoachingActionStatus,
  CoachingPaymentStatus,
  CoachingProjectStatus,
  CoachingProposalStatus,
  CoachingSessionStatus,
} from "@/lib/generated/prisma/client";

// "Un client" dans ce CRM coaching = un Customer possedant au moins un
// CoachingProject (voir prisma/schema.prisma, commentaire au-dessus de
// Prospect) — jamais un second modele d'identite.
export async function listCoachingClients(search?: string) {
  const term = search?.trim();

  const customers = await prisma.customer.findMany({
    where: {
      coachingProjects: { some: {} },
      ...(term
        ? {
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { email: { contains: term, mode: "insensitive" } },
              { phone: { contains: term, mode: "insensitive" } },
              { coachingProjects: { some: { title: { contains: term, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: { coachingProjects: { orderBy: { derniereActivite: "desc" } } },
  });

  return customers
    .map((customer) => ({
      ...customer,
      derniereActivite: customer.coachingProjects.reduce(
        (latest, project) => (project.derniereActivite > latest ? project.derniereActivite : latest),
        customer.coachingProjects[0]?.derniereActivite ?? customer.createdAt
      ),
    }))
    .sort((a, b) => b.derniereActivite.getTime() - a.derniereActivite.getTime());
}

export async function getCoachingClient(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { coachingProjects: { orderBy: { derniereActivite: "desc" } } },
  });
  if (!customer) throw notFound("Client introuvable.");
  return customer;
}

export async function createCoachingProject(input: {
  customerId: string;
  title: string;
  description?: string | null;
  objectifs?: string | null;
  niveauClient?: ClientLevel | null;
}) {
  const customer = await prisma.customer.findUnique({ where: { id: input.customerId }, select: { id: true } });
  if (!customer) throw notFound("Client introuvable.");

  const title = input.title.trim();
  if (!title) throw badRequest("Titre du projet requis.");

  return prisma.coachingProject.create({
    data: {
      customerId: input.customerId,
      title,
      description: input.description?.trim() || null,
      objectifs: input.objectifs?.trim() || null,
      niveauClient: input.niveauClient ?? null,
    },
  });
}

export async function getCoachingProjectForDetail(projectId: string) {
  const project = await prisma.coachingProject.findUnique({
    where: { id: projectId },
    include: {
      customer: true,
      sessions: { orderBy: { scheduledAt: "desc" }, include: { actions: true } },
      actions: { orderBy: [{ status: "asc" }, { dueDate: "asc" }] },
      proposals: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) throw notFound("Projet introuvable.");
  return project;
}

export async function updateCoachingProject(input: {
  projectId: string;
  title?: string;
  description?: string | null;
  objectifs?: string | null;
  niveauClient?: ClientLevel | null;
  status?: CoachingProjectStatus;
  questionsEnAttente?: string | null;
  actionsAPreparer?: string | null;
  notesInternes?: string | null;
}) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");

  return prisma.coachingProject.update({
    where: { id: input.projectId },
    data: {
      title: input.title?.trim() || undefined,
      description: input.description !== undefined ? input.description?.trim() || null : undefined,
      objectifs: input.objectifs !== undefined ? input.objectifs?.trim() || null : undefined,
      niveauClient: input.niveauClient !== undefined ? input.niveauClient : undefined,
      status: input.status,
      questionsEnAttente: input.questionsEnAttente !== undefined ? input.questionsEnAttente?.trim() || null : undefined,
      actionsAPreparer: input.actionsAPreparer !== undefined ? input.actionsAPreparer?.trim() || null : undefined,
      notesInternes: input.notesInternes !== undefined ? input.notesInternes?.trim() || null : undefined,
      derniereActivite: new Date(),
    },
  });
}

// --- Séances ---------------------------------------------------------------

export async function createCoachingSession(input: {
  projectId: string;
  scheduledAt: Date;
  durationMinutes: number;
}) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");
  if (Number.isNaN(input.scheduledAt.getTime())) throw badRequest("Date de séance invalide.");
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) throw badRequest("Durée invalide.");

  return prisma.$transaction(async (tx) => {
    const session = await tx.coachingSession.create({
      data: { projectId: input.projectId, scheduledAt: input.scheduledAt, durationMinutes: input.durationMinutes },
    });
    await tx.coachingProject.update({ where: { id: input.projectId }, data: { derniereActivite: new Date() } });
    return session;
  });
}

// Compte-rendu + statut — jamais un libellé qui laisserait entendre une
// validation de sécurité/conformité à distance (retour utilisateur
// explicite) : ce sont des notes de suivi pédagogique, pas un contrôle.
export async function updateCoachingSessionReport(input: {
  sessionId: string;
  status?: CoachingSessionStatus;
  sujetsAbordes?: string | null;
  explicationsDonnees?: string | null;
  difficultes?: string | null;
  prochaineEtape?: string | null;
}) {
  const session = await prisma.coachingSession.findUnique({ where: { id: input.sessionId }, select: { id: true, projectId: true } });
  if (!session) throw notFound("Séance introuvable.");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coachingSession.update({
      where: { id: input.sessionId },
      data: {
        status: input.status,
        sujetsAbordes: input.sujetsAbordes !== undefined ? input.sujetsAbordes?.trim() || null : undefined,
        explicationsDonnees: input.explicationsDonnees !== undefined ? input.explicationsDonnees?.trim() || null : undefined,
        difficultes: input.difficultes !== undefined ? input.difficultes?.trim() || null : undefined,
        prochaineEtape: input.prochaineEtape !== undefined ? input.prochaineEtape?.trim() || null : undefined,
      },
    });
    await tx.coachingProject.update({ where: { id: session.projectId }, data: { derniereActivite: new Date() } });
    return updated;
  });
}

export async function updateCoachingSessionSchedule(input: { sessionId: string; scheduledAt: Date; durationMinutes: number }) {
  const session = await prisma.coachingSession.findUnique({ where: { id: input.sessionId }, select: { id: true } });
  if (!session) throw notFound("Séance introuvable.");
  if (Number.isNaN(input.scheduledAt.getTime())) throw badRequest("Date de séance invalide.");
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) throw badRequest("Durée invalide.");

  return prisma.coachingSession.update({
    where: { id: input.sessionId },
    data: { scheduledAt: input.scheduledAt, durationMinutes: input.durationMinutes },
  });
}

export async function deleteCoachingSession(sessionId: string) {
  const session = await prisma.coachingSession.findUnique({ where: { id: sessionId }, select: { id: true } });
  if (!session) throw notFound("Séance introuvable.");
  return prisma.coachingSession.delete({ where: { id: sessionId } });
}

// --- Actions à suivre --------------------------------------------------------

export async function createCoachingActionItem(input: {
  projectId: string;
  sessionId?: string | null;
  label: string;
  dueDate?: Date | null;
}) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");

  const label = input.label.trim();
  if (!label) throw badRequest("Libellé de l'action requis.");

  return prisma.coachingActionItem.create({
    data: { projectId: input.projectId, sessionId: input.sessionId ?? null, label, dueDate: input.dueDate ?? null },
  });
}

export async function updateCoachingActionStatus(input: { actionId: string; status: CoachingActionStatus }) {
  const action = await prisma.coachingActionItem.findUnique({ where: { id: input.actionId }, select: { id: true } });
  if (!action) throw notFound("Action introuvable.");
  return prisma.coachingActionItem.update({ where: { id: input.actionId }, data: { status: input.status } });
}

export async function deleteCoachingActionItem(actionId: string) {
  const action = await prisma.coachingActionItem.findUnique({ where: { id: actionId }, select: { id: true } });
  if (!action) throw notFound("Action introuvable.");
  return prisma.coachingActionItem.delete({ where: { id: actionId } });
}

// Actions en retard, toutes projets confondus — alimente "Aujourd'hui".
export async function listOverdueActions(now: Date = new Date()) {
  return prisma.coachingActionItem.findMany({
    where: { status: "A_FAIRE", dueDate: { lt: now } },
    include: { project: { include: { customer: { select: { id: true, name: true, email: true } } } } },
    orderBy: { dueDate: "asc" },
  });
}

// --- Propositions commerciales ----------------------------------------------

export async function createCoachingProposal(input: {
  projectId: string;
  intitule: string;
  montantCents: number;
  dureeMinutes: number;
}) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");

  const intitule = input.intitule.trim();
  if (!intitule) throw badRequest("Intitulé requis.");
  if (!Number.isInteger(input.montantCents) || input.montantCents < 0) throw badRequest("Montant invalide.");
  if (!Number.isInteger(input.dureeMinutes) || input.dureeMinutes <= 0) throw badRequest("Durée invalide.");

  return prisma.coachingProposal.create({
    data: { projectId: input.projectId, intitule, montantCents: input.montantCents, dureeMinutes: input.dureeMinutes },
  });
}

export async function updateCoachingProposal(input: {
  proposalId: string;
  status?: CoachingProposalStatus;
  paymentStatus?: CoachingPaymentStatus;
  montantRecuCents?: number;
}) {
  const proposal = await prisma.coachingProposal.findUnique({ where: { id: input.proposalId }, select: { id: true, montantCents: true } });
  if (!proposal) throw notFound("Proposition introuvable.");
  if (input.montantRecuCents !== undefined && (!Number.isInteger(input.montantRecuCents) || input.montantRecuCents < 0)) {
    throw badRequest("Montant reçu invalide.");
  }

  return prisma.coachingProposal.update({
    where: { id: input.proposalId },
    data: { status: input.status, paymentStatus: input.paymentStatus, montantRecuCents: input.montantRecuCents },
  });
}

// Acheté = propositions ACCEPTEE (le paiement est un suivi séparé, ne
// conditionne pas les heures engagées) ; consommé = séances REALISEE
// uniquement. L'arithmétique elle-même vit dans lib/coaching-time-balance.ts
// (testable sans base de données) — ici on ne fait que rassembler les sommes.
export async function getCoachingProjectTimeBalance(projectId: string): Promise<CoachingProjectTimeBalance> {
  const [proposals, sessions] = await Promise.all([
    prisma.coachingProposal.findMany({ where: { projectId, status: "ACCEPTEE" }, select: { dureeMinutes: true } }),
    prisma.coachingSession.findMany({ where: { projectId, status: "REALISEE" }, select: { durationMinutes: true } }),
  ]);

  const purchasedMinutes = proposals.reduce((sum, p) => sum + p.dureeMinutes, 0);
  const consumedMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  return computeCoachingProjectTimeBalance(purchasedMinutes, consumedMinutes);
}

// Clients dont le temps restant s'épuise (retour utilisateur : "clients dont
// le temps de coaching arrive à épuisement") — seuil d'1h, pour les projets
// ayant réellement un temps acheté (sinon "0 restant" ne veut rien dire).
const LOW_TIME_THRESHOLD_MINUTES = 60;

export async function listProjectsRunningLowOnTime() {
  const projects = await prisma.coachingProject.findMany({
    where: { status: { in: ["EN_COURS", "A_DEMARRER"] }, proposals: { some: { status: "ACCEPTEE" } } },
    include: { customer: { select: { id: true, name: true, email: true } } },
  });

  const withBalance = await Promise.all(
    projects.map(async (project) => ({ project, balance: await getCoachingProjectTimeBalance(project.id) }))
  );

  return withBalance
    .filter(({ balance }) => balance.purchasedMinutes > 0 && balance.remainingMinutes <= LOW_TIME_THRESHOLD_MINUTES)
    .sort((a, b) => a.balance.remainingMinutes - b.balance.remainingMinutes);
}

// --- Séances (vues transverses pour l'agenda / le tableau de bord) ---------

export async function listSessionsInRange(start: Date, end: Date) {
  return prisma.coachingSession.findMany({
    where: { scheduledAt: { gte: start, lte: end } },
    include: { project: { include: { customer: { select: { id: true, name: true, email: true } } } } },
    orderBy: { scheduledAt: "asc" },
  });
}

// --- Documents ---------------------------------------------------------------

export async function assertCoachingProjectStorageQuota(projectId: string, incomingSizeBytes: number) {
  const { COACHING_PROJECT_STORAGE_QUOTA_BYTES } = await import("@/lib/server/coaching-project-storage");
  const existing = await prisma.coachingProjectDocument.aggregate({ where: { projectId }, _sum: { sizeBytes: true } });
  const usedBytes = existing._sum.sizeBytes ?? 0;

  if (usedBytes + incomingSizeBytes > COACHING_PROJECT_STORAGE_QUOTA_BYTES) {
    const remainingMb = Math.max(0, (COACHING_PROJECT_STORAGE_QUOTA_BYTES - usedBytes) / (1024 * 1024));
    throw badRequest(
      `Quota de stockage du projet atteint (${(COACHING_PROJECT_STORAGE_QUOTA_BYTES / (1024 * 1024)).toFixed(0)} Mo max) — encore ${remainingMb.toFixed(1)} Mo disponible(s).`
    );
  }
}

export async function addCoachingProjectDocument(input: {
  projectId: string;
  filename: string;
  bucket: string;
  path: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string;
  // Classement optionnel "par appareil ou projet" (étape 4) — au plus un
  // des deux à la fois.
  deviceId?: string | null;
  materialId?: string | null;
}) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");
  if (input.deviceId && input.materialId) throw badRequest("Un document ne peut être classé que sous un appareil OU un matériel, pas les deux.");

  return prisma.$transaction(async (tx) => {
    const document = await tx.coachingProjectDocument.create({ data: input });
    await tx.coachingProject.update({ where: { id: input.projectId }, data: { derniereActivite: new Date() } });
    return document;
  });
}

export async function getCoachingProjectDocumentById(documentId: string) {
  const document = await prisma.coachingProjectDocument.findUnique({ where: { id: documentId } });
  if (!document) throw notFound("Document introuvable.");
  return document;
}

export async function deleteCoachingProjectDocumentRecord(documentId: string) {
  const document = await prisma.coachingProjectDocument.findUnique({ where: { id: documentId } });
  if (!document) throw notFound("Document introuvable.");
  await prisma.coachingProjectDocument.delete({ where: { id: documentId } });
  return document;
}

import { prisma } from "@/lib/prisma";
import { resolveAuthorName, type CoachingActor } from "@/lib/services/coaching-actor";

export type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// Historique des modifications importantes avec auteur et date (retour
// utilisateur explicite, étape 6) — même principe que DossierEvent/
// ProspectEvent : un seul journal partagé par tout le dossier van plutôt
// que des mécanismes parallèles par section. Bascule aussi
// hasChangesSinceReview dès qu'une relecture a déjà eu lieu (jamais avant :
// une toute première saisie n'a rien "à revoir").
export async function logCoachingProjectEvent(tx: Tx, projectId: string, type: string, actor: CoachingActor, note?: string) {
  const project = await tx.coachingProject.findUnique({ where: { id: projectId }, select: { lastReviewedAt: true } });
  if (project?.lastReviewedAt) {
    await tx.coachingProject.update({ where: { id: projectId }, data: { hasChangesSinceReview: true } });
  }
  await tx.coachingProjectEvent.create({ data: { projectId, type, authorName: resolveAuthorName(actor), note } });
}

import { notFound } from "@/lib/http-errors";
import { prisma } from "@/lib/prisma";
import { buildProjectSnapshot } from "@/lib/services/coaching-dossier-snapshot";
import { logCoachingProjectEvent } from "@/lib/services/coaching-project-events";
import type { CoachingSchemaStatus } from "@/lib/generated/prisma/client";

// Révisions de schéma (étape 6, réservé coach) — "permets de figer un
// instantané du dossier et du bilan associés à une révision du schéma, tout
// en continuant à modifier la version de travail". snapshotJson n'est
// JAMAIS recalculé après la création : c'est justement le point d'un
// instantané, contrairement au reste du dossier (toujours recalculé à la
// lecture, jamais stocké).

export async function listSchemaRevisions(projectId: string) {
  return prisma.coachingSchemaRevision.findMany({ where: { projectId }, orderBy: { revisionNumber: "desc" } });
}

export async function createSchemaRevision(input: { projectId: string; documentId?: string | null }) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");

  const snapshot = await buildProjectSnapshot(input.projectId);
  const lastRevision = await prisma.coachingSchemaRevision.findFirst({
    where: { projectId: input.projectId },
    orderBy: { revisionNumber: "desc" },
    select: { revisionNumber: true },
  });
  const revisionNumber = (lastRevision?.revisionNumber ?? 0) + 1;

  return prisma.$transaction(async (tx) => {
    const revision = await tx.coachingSchemaRevision.create({
      data: {
        projectId: input.projectId,
        revisionNumber,
        documentId: input.documentId || null,
        snapshotJson: snapshot,
      },
    });
    await logCoachingProjectEvent(tx, input.projectId, "SCHEMA_REVISION", { kind: "coach" }, `Révision #${revisionNumber} créée.`);
    return revision;
  });
}

// Le statut du schéma ne vaut pas certification réglementaire (retour
// utilisateur explicite) — jamais un libellé qui suggérerait autre chose
// qu'un simple suivi de workflow, voir lib/dashboard-status-labels.ts.
export async function updateSchemaRevisionStatus(input: { revisionId: string; status: CoachingSchemaStatus }) {
  const revision = await prisma.coachingSchemaRevision.findUnique({ where: { id: input.revisionId }, select: { id: true, projectId: true } });
  if (!revision) throw notFound("Révision introuvable.");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coachingSchemaRevision.update({ where: { id: input.revisionId }, data: { status: input.status } });
    await logCoachingProjectEvent(tx, revision.projectId, "SCHEMA_REVISION", { kind: "coach" }, `Révision passée en statut ${input.status}.`);
    return updated;
  });
}

export async function deleteSchemaRevision(revisionId: string) {
  const revision = await prisma.coachingSchemaRevision.findUnique({ where: { id: revisionId }, select: { id: true } });
  if (!revision) throw notFound("Révision introuvable.");
  return prisma.coachingSchemaRevision.delete({ where: { id: revisionId } });
}

// "Impact sur le bilan ou le schéma à revoir" — dérivé, jamais stocké
// séparément (retour utilisateur : "ne conserve pas silencieusement un
// ancien état de revue pour des données nouvelles"). Un projet a besoin
// d'attention schéma si sa dernière révision est marquée "revue pour
// réalisation" mais que des données ont changé depuis la dernière relecture
// du dossier.
export async function projectNeedsSchemaReview(projectId: string): Promise<boolean> {
  const [project, lastRevision] = await Promise.all([
    prisma.coachingProject.findUnique({ where: { id: projectId }, select: { hasChangesSinceReview: true } }),
    prisma.coachingSchemaRevision.findFirst({ where: { projectId }, orderBy: { revisionNumber: "desc" }, select: { status: true } }),
  ]);
  if (!project || !lastRevision) return false;
  return project.hasChangesSinceReview && lastRevision.status === "REVU_POUR_REALISATION";
}

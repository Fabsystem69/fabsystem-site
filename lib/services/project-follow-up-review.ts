import { Prisma, type ProjectFollowUpReviewStatus } from "@/lib/generated/prisma/client";
import { badRequest, notFound } from "@/lib/http-errors";
import { PROJECT_FOLLOW_UP_STEP_KEYS, type ProjectFollowUpStepKey } from "@/lib/project-follow-up";
import { prisma } from "@/lib/prisma";

const REVIEW_STATUSES = ["PENDING", "APPROVED", "CHANGES_REQUESTED"] as const;

export function isProjectFollowUpStepKey(value: string): value is ProjectFollowUpStepKey {
  return (PROJECT_FOLLOW_UP_STEP_KEYS as readonly string[]).includes(value);
}

export function getProjectFollowUpReviewLabel(status: ProjectFollowUpReviewStatus) {
  if (status === "APPROVED") return "Validé par FabSystem";
  if (status === "CHANGES_REQUESTED") return "Correction demandée";
  return "En attente de revue";
}

export function getProjectFollowUpReviewTone(status: ProjectFollowUpReviewStatus) {
  if (status === "APPROVED") return "success" as const;
  if (status === "CHANGES_REQUESTED") return "warning" as const;
  return "neutral" as const;
}

function normalizeNote(value: string | undefined) {
  const note = value?.trim() ?? "";
  if (note.length > 2000) throw badRequest("La consigne ne peut pas dépasser 2 000 caractères.");
  return note || null;
}

export async function listProjectFollowUpReviews(projectId: string) {
  return prisma.projectFollowUpReview.findMany({
    where: { projectId },
    orderBy: { stepKey: "asc" },
  });
}

export async function listProjectFollowUpEvents(projectId: string) {
  return prisma.projectFollowUpEvent.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function setProjectFollowUpStepOverride(input: { projectId: string; stepKey: string | null }) {
  const projectId = input.projectId.trim();
  const stepKey = input.stepKey?.trim() || null;

  if (stepKey && !isProjectFollowUpStepKey(stepKey)) throw badRequest("Étape de suivi invalide.");

  const project = await prisma.project.findFirst({
    where: { id: projectId, customer: { dataShareConsent: true } },
    select: { id: true },
  });
  if (!project) throw notFound("Projet partagé introuvable.");

  return prisma.project.update({
    where: { id: projectId },
    data: { followUpStepOverride: stepKey },
  });
}

export async function updateProjectFollowUpReview(input: {
  projectId: string;
  stepKey: string;
  status: string;
  adminNote?: string;
}) {
  const projectId = input.projectId.trim();
  const stepKey = input.stepKey.trim();
  const status = input.status.trim();

  if (!projectId || !isProjectFollowUpStepKey(stepKey)) throw badRequest("Étape de suivi invalide.");
  if (!(REVIEW_STATUSES as readonly string[]).includes(status)) throw badRequest("Statut de suivi invalide.");

  const project = await prisma.project.findFirst({
    where: { id: projectId, customer: { dataShareConsent: true } },
    select: { id: true },
  });
  if (!project) throw notFound("Projet partagé introuvable.");

  const normalizedStatus = status as ProjectFollowUpReviewStatus;
  const adminNote = normalizeNote(input.adminNote);
  const eventType =
    normalizedStatus === "APPROVED"
      ? "APPROVED"
      : normalizedStatus === "CHANGES_REQUESTED"
        ? "CHANGES_REQUESTED"
        : "NOTE";

  return prisma.$transaction(async (tx) => {
    const review = await tx.projectFollowUpReview.upsert({
      where: { projectId_stepKey: { projectId, stepKey } },
      create: { projectId, stepKey, status: normalizedStatus, adminNote, reviewedAt: new Date() },
      update: { status: normalizedStatus, adminNote, reviewedAt: new Date() },
    });

    await tx.projectFollowUpEvent.create({
      data: {
        projectId,
        stepKey,
        type: eventType,
        message: adminNote,
      },
    });

    return review;
  });
}

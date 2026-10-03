import { forbidden, notFound } from "@/lib/http-errors";
import { buildReviewNotificationEmail } from "@/lib/crm/review-notification-email";
import { countUnanswered, readSheetAnswers } from "@/lib/crm/discovery-sheet-values";
import type { OwnershipActor } from "@/lib/ownership";
import { prisma } from "@/lib/prisma";
import { advisoryXactLock } from "@/lib/server/advisory-lock";
import { getRequiredBaseUrl } from "@/lib/server/env";
import { logServerEvent } from "@/lib/server-log";

// Transmission du projet par le client (docs/17, « Transmission du projet par
// le client »). AUCUNE migration : l'enregistrement durable est
// `readyForReviewAt` + l'evenement `REVIEW_SUBMITTED:<iso>` (une seule
// transaction) ; l'envoi du mail vient APRES et est retentable grace au
// marqueur `REVIEW_NOTIFIED:<meme iso>`. Garantie « au moins une fois » : un
// crash exactement entre l'envoi et l'ecriture du marqueur peut produire un
// second mail, jamais une perte.

export const REVIEW_SUBMITTED_PREFIX = "REVIEW_SUBMITTED:";
export const REVIEW_NOTIFIED_PREFIX = "REVIEW_NOTIFIED:";
export const MAX_RETRIES_PER_RUN = 20;
const FALLBACK_RECIPIENT = "contact@fabsystem.fr";
const TRANSACTION_OPTIONS = { timeout: 30_000, maxWait: 10_000 };

type SendMailImpl = (options: { to: string; from: string; subject: string; text: string; html?: string }) => Promise<unknown>;
export type ReviewDeps = { sendMailImpl?: SendMailImpl; now?: () => Date; baseUrl?: string };

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export type NotifyResult =
  | { status: "sent"; submittedAt: Date }
  | { status: "already_notified"; submittedAt: Date }
  | { status: "not_pending" }
  | { status: "failed"; error: string };

export type SubmitResult = {
  status: "submitted" | "already_submitted";
  submittedAt: Date;
  notified: boolean;
};

async function getDefaultSendMail(): Promise<SendMailImpl> {
  const { sendMail } = await import("@/lib/server/nodemailer");
  return sendMail;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Erreur inconnue";
}

// Meme logique que assertOwnedProject (app/mon-compte/mon-van/actions.ts),
// reimplementee ici pour que le service soit utilisable et testable seul.
export async function assertCustomerOwnsProject(actor: OwnershipActor, projectId: string) {
  if (actor.role !== "customer") throw forbidden("Accès client requis.");
  const project = await prisma.coachingProject.findUnique({ where: { id: projectId }, select: { customerId: true } });
  if (!project) throw notFound("Projet introuvable.");
  if (project.customerId !== actor.customerId) throw forbidden("Ce projet ne vous appartient pas.");
}

// --- Transmission ------------------------------------------------------------

export async function submitProjectForReview(
  projectId: string,
  actor: OwnershipActor,
  deps?: ReviewDeps
): Promise<SubmitResult> {
  await assertCustomerOwnsProject(actor, projectId);
  const now = (deps?.now ?? (() => new Date()))();

  const outcome = await prisma.$transaction(async (tx) => {
    await advisoryXactLock(tx, `review-submit:${projectId}`);
    const project = await tx.coachingProject.findUnique({ where: { id: projectId }, select: { readyForReviewAt: true } });
    if (!project) throw notFound("Projet introuvable.");
    if (project.readyForReviewAt) {
      return { created: false, submittedAt: project.readyForReviewAt };
    }
    await tx.coachingProject.update({ where: { id: projectId }, data: { readyForReviewAt: now } });
    await tx.coachingProjectEvent.create({
      data: { projectId, type: `${REVIEW_SUBMITTED_PREFIX}${now.toISOString()}`, authorName: "Client" },
    });
    return { created: true, submittedAt: now };
  }, TRANSACTION_OPTIONS);

  // Hors transaction : un echec d'envoi n'annule jamais la transmission.
  const notification = await notifyReviewSubmission(projectId, deps);
  return {
    status: outcome.created ? "submitted" : "already_submitted",
    submittedAt: outcome.submittedAt,
    notified: notification.status === "sent" || notification.status === "already_notified",
  };
}

// --- Notification -------------------------------------------------------------

async function loadNotificationInput(projectId: string, submittedAt: Date, baseUrl: string) {
  const project = await prisma.coachingProject.findUnique({
    where: { id: projectId },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      devices: { select: { name: true, quantity: true, powerSupply: true } },
      documents: { select: { filename: true } },
    },
  });
  if (!project) throw notFound("Projet introuvable.");

  const answers = readSheetAnswers(project);
  return {
    projectId,
    title: project.title,
    customerName: project.customer.name,
    customerEmail: project.customer.email,
    customerPhone: project.customer.phone,
    assetType: project.assetType ?? null,
    vehicleBrand: project.vehicleBrand,
    vehicleModel: project.vehicleModel,
    vehicleYear: project.vehicleYear,
    projectStage: project.projectStage,
    usagePattern: project.usagePattern,
    startDeadline: project.startDeadline,
    materialBudgetCents: project.materialBudgetCents,
    laborBudgetCents: project.laborBudgetCents,
    deviceCount: project.devices.length,
    documentCount: project.documents.length,
    unknownCount: answers.filter((answer) => answer.isUnknown).length,
    unansweredCount: countUnanswered(answers),
    submittedAt,
    baseUrl,
  };
}

async function latestSubmittedMarker(projectId: string): Promise<string | null> {
  const event = await prisma.coachingProjectEvent.findFirst({
    where: { projectId, type: { startsWith: REVIEW_SUBMITTED_PREFIX } },
    orderBy: { createdAt: "desc" },
    select: { type: true },
  });
  return event ? event.type.slice(REVIEW_SUBMITTED_PREFIX.length) : null;
}

async function sendAndMark(projectId: string, stamp: string, deps: ReviewDeps | undefined): Promise<NotifyResult> {
  const submittedAt = new Date(stamp);
  const input = await loadNotificationInput(projectId, submittedAt, deps?.baseUrl ?? getRequiredBaseUrl());
  const email = buildReviewNotificationEmail(input);
  const sendMail = deps?.sendMailImpl ?? (await getDefaultSendMail());
  const to = process.env.CONTACT_TO?.trim() || FALLBACK_RECIPIENT;
  const from = process.env.CONTACT_FROM?.trim() || process.env.SMTP_USER?.trim() || to;

  return prisma.$transaction(async (tx) => {
    await advisoryXactLock(tx, `review-notify:${projectId}:${stamp}`);
    const marker = await tx.coachingProjectEvent.findFirst({
      where: { projectId, type: `${REVIEW_NOTIFIED_PREFIX}${stamp}` },
      select: { id: true },
    });
    if (marker) return { status: "already_notified" as const, submittedAt };

    await sendMail({ to, from, subject: email.subject, text: email.text, html: email.html });
    await tx.coachingProjectEvent.create({
      data: { projectId, type: `${REVIEW_NOTIFIED_PREFIX}${stamp}`, authorName: "Système" },
    });
    return { status: "sent" as const, submittedAt };
  }, TRANSACTION_OPTIONS);
}

// Ne leve jamais : toute erreur (SMTP, base) devient {status:"failed"} et
// aucun marqueur n'est ecrit, donc l'envoi reste retentable.
export async function notifyReviewSubmission(projectId: string, deps?: ReviewDeps): Promise<NotifyResult> {
  try {
    const project = await prisma.coachingProject.findUnique({ where: { id: projectId }, select: { readyForReviewAt: true } });
    if (!project?.readyForReviewAt) return { status: "not_pending" };
    const stamp = await latestSubmittedMarker(projectId);
    if (!stamp) return { status: "not_pending" };

    const alreadyNotified = await prisma.coachingProjectEvent.findFirst({
      where: { projectId, type: `${REVIEW_NOTIFIED_PREFIX}${stamp}` },
      select: { id: true },
    });
    if (alreadyNotified) return { status: "already_notified", submittedAt: new Date(stamp) };

    return await sendAndMark(projectId, stamp, deps);
  } catch (error) {
    logServerEvent("error", "failed to notify coach of project review submission", { error, projectId });
    return { status: "failed", error: errorText(error) };
  }
}

// --- Notifications a renvoyer ---------------------------------------------------

export type PendingReviewNotification = {
  projectId: string;
  title: string;
  customerLabel: string;
  submittedAt: Date;
};

function latestStamp(types: string[], prefix: string): string | null {
  const stamps = types.filter((type) => type.startsWith(prefix)).map((type) => type.slice(prefix.length));
  // Horodatages ISO : l'ordre lexicographique est l'ordre chronologique.
  return stamps.length === 0 ? null : stamps.reduce((max, stamp) => (stamp > max ? stamp : max));
}

export async function listPendingReviewNotifications(): Promise<PendingReviewNotification[]> {
  const projects = await prisma.coachingProject.findMany({
    where: {
      readyForReviewAt: { not: null },
      events: { some: { type: { startsWith: REVIEW_SUBMITTED_PREFIX } } },
    },
    orderBy: { readyForReviewAt: "asc" },
    select: {
      id: true,
      title: true,
      customer: { select: { name: true, email: true } },
      events: { where: { type: { startsWith: "REVIEW_" } }, select: { type: true } },
    },
  });

  return projects.flatMap((project) => {
    const types = project.events.map((event) => event.type);
    const stamp = latestStamp(types, REVIEW_SUBMITTED_PREFIX);
    if (!stamp || types.includes(`${REVIEW_NOTIFIED_PREFIX}${stamp}`)) return [];
    return [
      {
        projectId: project.id,
        title: project.title,
        customerLabel: project.customer.name?.trim() || project.customer.email,
        submittedAt: new Date(stamp),
      },
    ];
  });
}

export type RetryReport = { pending: number; attempted: number; sent: number; failed: number };

export async function retryPendingReviewNotifications(deps?: ReviewDeps): Promise<RetryReport> {
  const pending = await listPendingReviewNotifications();
  const batch = pending.slice(0, MAX_RETRIES_PER_RUN);
  const results: NotifyResult[] = [];
  for (const item of batch) {
    results.push(await notifyReviewSubmission(item.projectId, deps));
  }
  return {
    pending: pending.length,
    attempted: batch.length,
    sent: results.filter((result) => result.status === "sent").length,
    failed: results.filter((result) => result.status === "failed").length,
  };
}

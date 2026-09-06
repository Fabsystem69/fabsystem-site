import { tryAcquireCooldown } from "@/lib/rate-limit";
import { logServerEvent } from "@/lib/server-log";
import { prisma } from "@/lib/prisma";
import { renderEmailTemplate } from "@/lib/services/email-templates";

// Cron quotidien (voir app/api/internal/jobs/dossier-notifications/route.ts),
// meme structure que lib/services/schema-unlock-reminders.ts : chaque
// sous-tache est independante, idempotente, et ne bloque jamais les autres
// en cas d'echec individuel.

const INACTIVITY_REMINDER_DAYS = 14;
const INACTIVITY_REMINDER_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
const J30_FOLLOWUP_DAYS = 30;
const TESTIMONIAL_REMINDER_DAYS = 15;
// Purge (retour utilisateur : liberer de la place progressivement) : les
// documents d'un dossier livre depuis longtemps sont retires du stockage,
// jamais le dossier lui-meme (historique/statut conserves). Avertissement
// un mois avant, pour ne jamais supprimer sans prevenir un client qui
// voudrait encore retrouver son schema.
const PURGE_WARNING_AFTER_DAYS = 335; // ~11 mois
const PURGE_AFTER_DAYS = 365; // 12 mois

type SendMailImpl = (options: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}) => Promise<unknown>;

async function getDefaultSendMail() {
  const { sendMail } = await import("@/lib/server/nodemailer");
  return sendMail;
}

function resolveFromAddress() {
  return process.env.CONTACT_FROM?.trim() || process.env.SMTP_USER?.trim() || "fabien.lages@fabsystem.fr";
}

function greetingFor(name: string | null) {
  return name ? `Bonjour ${name},` : "Bonjour,";
}

async function sendTemplatedEmail(
  sendMailImpl: SendMailImpl,
  to: string,
  templateKey: string,
  variables: Record<string, string>
) {
  const { subject, text, html } = await renderEmailTemplate(templateKey, variables);
  await sendMailImpl({ to, from: resolveFromAddress(), subject, text, html });
}

export type DossierNotificationsResult = {
  inactivityRemindersSent: number;
  j30FollowUpsSent: number;
  testimonialRemindersSent: number;
  purgeWarningsSent: number;
  dossiersPurged: number;
};

export async function runDossierNotifications(
  now: Date = new Date(),
  deps?: { sendMailImpl?: SendMailImpl }
): Promise<DossierNotificationsResult> {
  const sendMailImpl = deps?.sendMailImpl ?? (await getDefaultSendMail());

  const result: DossierNotificationsResult = {
    inactivityRemindersSent: 0,
    j30FollowUpsSent: 0,
    testimonialRemindersSent: 0,
    purgeWarningsSent: 0,
    dossiersPurged: 0,
  };

  // 1. Relance dossier inactif (jamais livre, pas d'activite depuis longtemps)
  const inactivityThreshold = new Date(now.getTime() - INACTIVITY_REMINDER_DAYS * 24 * 60 * 60 * 1000);
  const inactiveDossiers = await prisma.dossierClient
    .findMany({
      where: { dateLivraison: null, derniereActivite: { lte: inactivityThreshold } },
      include: { customer: { select: { email: true, name: true } } },
    })
    .catch(() => []);

  for (const dossier of inactiveDossiers) {
    const canSend = await tryAcquireCooldown(`dossier-inactivity:${dossier.id}`, INACTIVITY_REMINDER_COOLDOWN_MS);
    if (!canSend) continue;

    try {
      await sendTemplatedEmail(sendMailImpl, dossier.customer.email, "dossier-relance-inactif", {
        greeting: greetingFor(dossier.customer.name),
      });
      result.inactivityRemindersSent += 1;
    } catch (error) {
      logServerEvent("error", "failed to send dossier inactivity reminder", { error, dossierId: dossier.id });
    }
  }

  // 2. Message J+30 post-livraison (prise de nouvelles sur le chantier reel)
  const j30Threshold = new Date(now.getTime() - J30_FOLLOWUP_DAYS * 24 * 60 * 60 * 1000);
  const j30Candidates = await prisma.dossierClient
    .findMany({
      where: { dateLivraison: { lte: j30Threshold }, j30MessageEnvoye: false },
      include: { customer: { select: { email: true, name: true } } },
    })
    .catch(() => []);

  for (const dossier of j30Candidates) {
    try {
      await sendTemplatedEmail(sendMailImpl, dossier.customer.email, "dossier-j30", {
        greeting: greetingFor(dossier.customer.name),
      });
      await prisma.dossierClient.update({ where: { id: dossier.id }, data: { j30MessageEnvoye: true } });
      result.j30FollowUpsSent += 1;
    } catch (error) {
      logServerEvent("error", "failed to send dossier J+30 follow-up", { error, dossierId: dossier.id });
    }
  }

  // 3. Rappel temoignage
  const testimonialThreshold = new Date(now.getTime() - TESTIMONIAL_REMINDER_DAYS * 24 * 60 * 60 * 1000);
  const testimonialCandidates = await prisma.dossierClient
    .findMany({
      where: { dateLivraison: { lte: testimonialThreshold }, temoignageDemande: false },
      include: { customer: { select: { email: true, name: true } } },
    })
    .catch(() => []);

  for (const dossier of testimonialCandidates) {
    try {
      await sendTemplatedEmail(sendMailImpl, dossier.customer.email, "dossier-temoignage-demande", {
        greeting: greetingFor(dossier.customer.name),
      });
      await prisma.dossierClient.update({ where: { id: dossier.id }, data: { temoignageDemande: true } });
      result.testimonialRemindersSent += 1;
    } catch (error) {
      logServerEvent("error", "failed to send dossier testimonial reminder", { error, dossierId: dossier.id });
    }
  }

  // 4a. Avertissement de purge (~11 mois post-livraison)
  const purgeWarningThreshold = new Date(now.getTime() - PURGE_WARNING_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const purgeWarningCandidates = await prisma.dossierClient
    .findMany({
      where: {
        dateLivraison: { lte: purgeWarningThreshold },
        documents: { some: {} },
      },
      include: { customer: { select: { email: true, name: true } } },
    })
    .catch(() => []);

  for (const dossier of purgeWarningCandidates) {
    const canSend = await tryAcquireCooldown(`dossier-purge-warning:${dossier.id}`, PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000);
    if (!canSend) continue;

    try {
      await sendTemplatedEmail(sendMailImpl, dossier.customer.email, "dossier-purge-warning", {
        greeting: greetingFor(dossier.customer.name),
      });
      result.purgeWarningsSent += 1;
    } catch (error) {
      logServerEvent("error", "failed to send dossier purge warning", { error, dossierId: dossier.id });
    }
  }

  // 4b. Purge effective (~12 mois post-livraison)
  const purgeThreshold = new Date(now.getTime() - PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const purgeCandidates = await prisma.dossierClient
    .findMany({
      where: { dateLivraison: { lte: purgeThreshold }, documents: { some: {} } },
      include: { documents: true },
    })
    .catch(() => []);

  const { deleteDossierDocumentFile } = await import("@/lib/server/dossier-storage");

  for (const dossier of purgeCandidates) {
    try {
      for (const document of dossier.documents) {
        await deleteDossierDocumentFile(document.path).catch((error) => {
          logServerEvent("error", "failed to delete dossier document file during purge", {
            error,
            documentId: document.id,
          });
        });
      }

      await prisma.$transaction([
        prisma.dossierDocument.deleteMany({ where: { dossierId: dossier.id } }),
        prisma.dossierEvent.create({
          data: {
            dossierId: dossier.id,
            type: "NOTE",
            note: `${dossier.documents.length} document(s) purgé(s) automatiquement (12 mois après livraison).`,
          },
        }),
      ]);

      result.dossiersPurged += 1;
    } catch (error) {
      logServerEvent("error", "failed to purge dossier documents", { error, dossierId: dossier.id });
    }
  }

  return result;
}

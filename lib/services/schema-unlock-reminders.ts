import { tryAcquireCooldown } from "@/lib/rate-limit";
import { logServerEvent } from "@/lib/server-log";
import { SCHEMA_EDITOR_UNLIMITED_CAPABILITY } from "@/lib/services/schema-unlock";
import { renderEmailTemplate } from "@/lib/services/email-templates";

// v2.1 : relance email avant expiration d'un deblocage editeur de schema —
// deux tons distincts (decision produit) :
// - achat unitaire (60 jours, scope PROJECT) : ton support/coaching, jamais
//   pur marketing ("vous etes bloque ou besoin d'aide, contactez-moi").
// - code promo (7 jours, scope CUSTOMER) : ton commercial assume, pousse
//   vers l'achat ou l'accompagnement avant la fin de l'essai gratuit.
// Declenchee par un cron quotidien (voir
// app/api/internal/jobs/schema-unlock-reminders/route.ts), jamais a
// l'octroi de la capacite elle-meme.

const PROJECT_UNLOCK_REMINDER_WINDOW_DAYS = 5;
const TRIAL_REMINDER_WINDOW_DAYS = 2;

// Largement superieur a la duree de vie max d'une capacite (60 jours) : une
// seule relance par capacite sur toute sa duree, jamais un email par jour
// pendant toute la fenetre de rappel.
const REMINDER_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;

type SendMailImpl = (options: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}) => Promise<unknown>;

type ReminderDeps = {
  sendMailImpl?: SendMailImpl;
};

async function getDefaultSendMail() {
  const { sendMail } = await import("@/lib/server/nodemailer");
  return sendMail;
}

function resolveFromAddress(to: string) {
  return process.env.CONTACT_FROM?.trim() || process.env.SMTP_USER?.trim() || to;
}

function daysUntil(date: Date, now: Date) {
  return Math.max(1, Math.ceil((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
}

// Signature commune aux deux relances — domaine absolu (jamais
// NEXT_PUBLIC_BASE_URL) car un client email lit ce lien depuis n'importe
// quel reseau, pas depuis l'environnement de rendu du site.
const SIGNATURE_LOGO_URL = "https://www.fabsystem.fr/logo.png";

const SIGNATURE_TEXT = [
  "",
  "Fabien Lages",
  "FabSystem – Électricité embarquée • Audit • Formation",
  "Solutions électriques embarquées 12V • 24V • 230V",
  "69250 Neuville-sur-Saône",
  "Tél : 06 98 24 77 22   |   Email : fabien.lages@fabsystem.fr",
  "www.fabsystem.fr",
].join("\n");

const SIGNATURE_HTML = `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e5e5;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td style="padding-right:14px;vertical-align:top;">
        <img src="${SIGNATURE_LOGO_URL}" alt="FabSystem" height="44" style="display:block;height:44px;width:auto;" />
      </td>
      <td style="vertical-align:top;font-size:13px;line-height:1.5;color:#444444;">
        <p style="margin:0;font-weight:700;color:#171717;">Fabien Lages</p>
        <p style="margin:0;">FabSystem – Électricité embarquée • Audit • Formation</p>
        <p style="margin:0;">Solutions électriques embarquées 12V • 24V • 230V</p>
        <p style="margin:0;">69250 Neuville-sur-Saône</p>
        <p style="margin:0;">Tél : 06 98 24 77 22&nbsp;&nbsp;|&nbsp;&nbsp;Email : <a href="mailto:fabien.lages@fabsystem.fr" style="color:#171717;">fabien.lages@fabsystem.fr</a></p>
        <p style="margin:0;"><a href="https://www.fabsystem.fr" style="color:#171717;">www.fabsystem.fr</a></p>
      </td>
    </tr>
  </table>
`;

async function sendProjectUnlockExpiryReminder(
  params: { customerEmail: string; projectName: string; expiresAt: Date; now: Date },
  sendMailImpl: SendMailImpl
) {
  const daysLeft = daysUntil(params.expiresAt, params.now);
  const { subject, text, html } = await renderEmailTemplate("schema-unlock-project-expiry", {
    project_name: params.projectName,
    days_left: String(daysLeft),
  });

  await sendMailImpl({
    to: params.customerEmail,
    from: resolveFromAddress(params.customerEmail),
    subject,
    text: `${text}\n${SIGNATURE_TEXT}`,
    html: `${html}${SIGNATURE_HTML}`,
  });
}

async function sendTrialExpiryReminder(
  params: { customerEmail: string; expiresAt: Date; now: Date },
  sendMailImpl: SendMailImpl
) {
  const daysLeft = daysUntil(params.expiresAt, params.now);
  const { subject, text, html } = await renderEmailTemplate("schema-unlock-trial-expiry", {
    days_left: String(daysLeft),
  });

  await sendMailImpl({
    to: params.customerEmail,
    from: resolveFromAddress(params.customerEmail),
    subject,
    text: `${text}\n${SIGNATURE_TEXT}`,
    html: `${html}${SIGNATURE_HTML}`,
  });
}

export type SendExpiringUnlockRemindersResult = {
  projectRemindersSent: number;
  trialRemindersSent: number;
};

export async function sendExpiringUnlockReminders(
  now: Date = new Date(),
  deps?: ReminderDeps
): Promise<SendExpiringUnlockRemindersResult> {
  const { prisma } = await import("@/lib/prisma");
  const sendMailImpl = deps?.sendMailImpl ?? (await getDefaultSendMail());

  let projectRemindersSent = 0;
  let trialRemindersSent = 0;

  const projectThreshold = new Date(
    now.getTime() + PROJECT_UNLOCK_REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );
  const expiringProjectUnlocks = await prisma.customerCapability.findMany({
    where: {
      capability: SCHEMA_EDITOR_UNLIMITED_CAPABILITY,
      scope: "PROJECT",
      status: "ACTIVE",
      expiresAt: { gt: now, lte: projectThreshold },
    },
    include: { customer: true },
  });

  for (const capability of expiringProjectUnlocks) {
    if (!capability.expiresAt || !capability.scopeId) {
      continue;
    }

    const canSend = await tryAcquireCooldown(
      `schema-unlock-reminder:${capability.id}`,
      REMINDER_COOLDOWN_MS
    );
    if (!canSend) {
      continue;
    }

    const project = await prisma.project.findUnique({ where: { id: capability.scopeId } });
    if (!project) {
      continue;
    }

    try {
      await sendProjectUnlockExpiryReminder(
        { customerEmail: capability.customer.email, projectName: project.name, expiresAt: capability.expiresAt, now },
        sendMailImpl
      );
      projectRemindersSent += 1;
    } catch (error) {
      logServerEvent("error", "failed to send project unlock expiry reminder", {
        error,
        capabilityId: capability.id,
      });
    }
  }

  const trialThreshold = new Date(now.getTime() + TRIAL_REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const expiringTrials = await prisma.customerCapability.findMany({
    where: {
      capability: SCHEMA_EDITOR_UNLIMITED_CAPABILITY,
      scope: "CUSTOMER",
      status: "ACTIVE",
      expiresAt: { gt: now, lte: trialThreshold },
    },
    include: { customer: true },
  });

  for (const capability of expiringTrials) {
    if (!capability.expiresAt) {
      continue;
    }

    const canSend = await tryAcquireCooldown(
      `schema-unlock-reminder:${capability.id}`,
      REMINDER_COOLDOWN_MS
    );
    if (!canSend) {
      continue;
    }

    try {
      await sendTrialExpiryReminder(
        { customerEmail: capability.customer.email, expiresAt: capability.expiresAt, now },
        sendMailImpl
      );
      trialRemindersSent += 1;
    } catch (error) {
      logServerEvent("error", "failed to send trial expiry reminder", {
        error,
        capabilityId: capability.id,
      });
    }
  }

  return { projectRemindersSent, trialRemindersSent };
}

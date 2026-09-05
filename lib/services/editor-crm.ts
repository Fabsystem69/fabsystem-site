import { badRequest } from "@/lib/http-errors";
import { prisma } from "@/lib/prisma";
import { logServerEvent } from "@/lib/server-log";

// CRM editeur : segment "a utilise l'editeur de schema, jamais souscrit
// Editeur Plus" (retour utilisateur : "un visu des compte crm pour pouvoir
// faire des opee"). CustomerContactLog (prisma/schema.prisma) est la source
// unique de "dernier contact", partagee entre mailing manuel et relance
// automatique — jamais deux compteurs distincts qui pourraient diverger.

const ACTIVE_SUBSCRIPTION_STATUSES = ["ACTIVE", "TRIALING"] as const;

export type EditorCrmEntry = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  projectCount: number;
  lastActivityAt: Date;
  lastContactedAt: Date | null;
};

export async function listEditorUsersWithoutSubscription(): Promise<EditorCrmEntry[]> {
  const customers = await prisma.customer.findMany({
    where: {
      projects: { some: {} },
      editorSubscriptions: {
        none: { status: { in: [...ACTIVE_SUBSCRIPTION_STATUSES] } },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      projects: {
        select: {
          updatedAt: true,
          schema: { select: { updatedAt: true } },
          retainedValues: {
            select: { updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      },
      contactLogs: {
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return customers.map((customer) => {
    const activityTimestamps = customer.projects
      .flatMap((project) => [project.updatedAt, project.schema?.updatedAt, project.retainedValues[0]?.updatedAt])
      .filter((value): value is Date => Boolean(value));

    const lastActivityAt =
      activityTimestamps.length > 0
        ? new Date(Math.max(...activityTimestamps.map((value) => value.getTime())))
        : customer.createdAt;

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      createdAt: customer.createdAt,
      projectCount: customer.projects.length,
      lastActivityAt,
      lastContactedAt: customer.contactLogs[0]?.createdAt ?? null,
    };
  });
}

function resolveFromAddress() {
  return process.env.CONTACT_FROM?.trim() || process.env.SMTP_USER?.trim() || "fabien.lages@fabsystem.fr";
}

function toHtmlParagraphs(lines: string[]) {
  return lines.map((line) => (line === "" ? "" : `<p style="margin:0 0 12px;">${line}</p>`)).join("");
}

async function getDefaultSendMail() {
  const { sendMail } = await import("@/lib/server/nodemailer");
  return sendMail;
}

export type SendEditorCrmMailingResult = {
  sentCount: number;
  totalRequested: number;
};

export async function sendEditorCrmMailing(
  input: { customerIds: string[]; subject: string; message: string; sentBy?: string },
  deps?: { sendMailImpl?: Awaited<ReturnType<typeof getDefaultSendMail>> }
): Promise<SendEditorCrmMailingResult> {
  const subject = input.subject.trim();
  const message = input.message.trim();
  const customerIds = [...new Set(input.customerIds.map((id) => id.trim()).filter(Boolean))];

  if (!subject) throw badRequest("Objet requis.");
  if (!message) throw badRequest("Message requis.");
  if (customerIds.length === 0) throw badRequest("Aucun destinataire sélectionné.");

  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, email: true },
  });

  const sendMailImpl = deps?.sendMailImpl ?? (await getDefaultSendMail());
  const sentBy = input.sentBy?.trim() || "FabSystem";
  let sentCount = 0;

  for (const customer of customers) {
    try {
      await sendMailImpl({
        to: customer.email,
        from: resolveFromAddress(),
        subject,
        text: message,
        html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#171717;">${toHtmlParagraphs(message.split("\n"))}</div>`,
      });

      await prisma.customerContactLog.create({
        data: { customerId: customer.id, subject, message, sentBy },
      });

      sentCount += 1;
    } catch (error) {
      logServerEvent("error", "failed to send editor CRM mailing", { error, customerId: customer.id });
    }
  }

  return { sentCount, totalRequested: customers.length };
}

// Relance automatique (cron quotidien, voir
// app/api/internal/jobs/editor-crm-reminders/route.ts) : cible les comptes
// inactifs depuis un moment sans jamais spammer — le cooldown couvre aussi
// bien un mailing manuel qu'une relance automatique precedente.
const AUTO_REMINDER_INACTIVITY_DAYS = 14;
const AUTO_REMINDER_COOLDOWN_DAYS = 60;

const AUTO_REMINDER_SUBJECT = "Votre projet électrique FabSystem vous attend";

function buildAutoReminderBody(customerName: string | null) {
  const greeting = customerName ? `Bonjour ${customerName},` : "Bonjour,";
  return [
    greeting,
    "",
    "Vous avez commencé un projet d'installation électrique sur l'éditeur de schéma FabSystem, mais vous n'êtes pas encore passé à Éditeur Plus.",
    "",
    "Éditeur Plus débloque le dimensionnement automatique des câbles et fusibles, des alertes de vérification détaillées, les projets et consommateurs illimités, l'historique des versions, le partage de schéma et l'export sans filigrane.",
    "",
    "Vous pouvez y accéder directement depuis votre projet, ou répondre à cet email si vous préférez être accompagné.",
  ];
}

export type SendEditorCrmAutoRemindersResult = {
  sentCount: number;
  eligibleCount: number;
};

export async function sendEditorCrmAutoReminders(
  now: Date = new Date(),
  deps?: { sendMailImpl?: Awaited<ReturnType<typeof getDefaultSendMail>> }
): Promise<SendEditorCrmAutoRemindersResult> {
  const users = await listEditorUsersWithoutSubscription();
  const inactivityThreshold = new Date(now.getTime() - AUTO_REMINDER_INACTIVITY_DAYS * 24 * 60 * 60 * 1000);
  const cooldownThreshold = new Date(now.getTime() - AUTO_REMINDER_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

  const eligible = users.filter(
    (user) =>
      user.lastActivityAt <= inactivityThreshold &&
      (!user.lastContactedAt || user.lastContactedAt <= cooldownThreshold)
  );

  const sendMailImpl = deps?.sendMailImpl ?? (await getDefaultSendMail());
  let sentCount = 0;

  for (const user of eligible) {
    try {
      const bodyLines = buildAutoReminderBody(user.name);

      await sendMailImpl({
        to: user.email,
        from: resolveFromAddress(),
        subject: AUTO_REMINDER_SUBJECT,
        text: bodyLines.join("\n"),
        html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#171717;">${toHtmlParagraphs(bodyLines)}</div>`,
      });

      await prisma.customerContactLog.create({
        data: {
          customerId: user.id,
          subject: AUTO_REMINDER_SUBJECT,
          message: bodyLines.join("\n"),
          sentBy: "FabSystem (relance automatique)",
        },
      });

      sentCount += 1;
    } catch (error) {
      logServerEvent("error", "failed to send editor CRM auto reminder", { error, customerId: user.id });
    }
  }

  return { sentCount, eligibleCount: eligible.length };
}

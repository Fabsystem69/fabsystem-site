import { badRequest, notFound } from "@/lib/http-errors";
import { EMAIL_TEMPLATE_DEFAULTS, getEmailTemplateDefault } from "@/lib/email-templates-defaults";

function toHtmlParagraphs(text: string) {
  return text
    .split("\n")
    .map((line) => (line === "" ? "" : `<p style="margin:0 0 12px;">${escapeHtml(line)}</p>`))
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function interpolate(template: string, variables: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    return name in variables ? variables[name] : match;
  });
}

// Une ligne EmailTemplate en base = contenu personnalise pour cette cle ;
// son absence = contenu par defaut (lib/email-templates-defaults.ts) utilise
// tel quel. "Reinitialiser" (resetEmailTemplate) supprime simplement la
// ligne plutot que d'ecrire une copie du defaut, pour que les deux restent
// toujours synchronises sans jamais diverger silencieusement.
export async function listEmailTemplates() {
  const { prisma } = await import("@/lib/prisma");
  const overrides = await prisma.emailTemplate.findMany();
  const overridesByKey = new Map(overrides.map((row) => [row.key, row]));

  return EMAIL_TEMPLATE_DEFAULTS.map((definition) => {
    const override = overridesByKey.get(definition.key);
    return {
      ...definition,
      subject: override?.subject ?? definition.subject,
      bodyText: override?.bodyText ?? definition.bodyText,
      isCustomized: Boolean(override),
      updatedAt: override?.updatedAt ?? null,
    };
  });
}

export async function getEmailTemplateForEdit(key: string) {
  const definition = getEmailTemplateDefault(key);
  if (!definition) {
    throw notFound("Email template not found");
  }

  const { prisma } = await import("@/lib/prisma");
  const override = await prisma.emailTemplate.findUnique({ where: { key } });

  return {
    ...definition,
    subject: override?.subject ?? definition.subject,
    bodyText: override?.bodyText ?? definition.bodyText,
    isCustomized: Boolean(override),
  };
}

export async function saveEmailTemplate(key: string, input: { subject: string; bodyText: string }) {
  const definition = getEmailTemplateDefault(key);
  if (!definition) {
    throw notFound("Email template not found");
  }

  const subject = input.subject.trim();
  const bodyText = input.bodyText.trim();

  if (!subject) {
    throw badRequest("Le sujet ne peut pas être vide.");
  }

  if (!bodyText) {
    throw badRequest("Le corps du message ne peut pas être vide.");
  }

  const { prisma } = await import("@/lib/prisma");
  await prisma.emailTemplate.upsert({
    where: { key },
    create: { key, subject, bodyText },
    update: { subject, bodyText },
  });
}

export async function resetEmailTemplate(key: string) {
  const { prisma } = await import("@/lib/prisma");
  await prisma.emailTemplate.deleteMany({ where: { key } });
}

// Recupere le contenu effectif (personnalise ou par defaut) d'une cle et
// remplace les variables — utilise par chaque service d'envoi au moment
// de construire l'email reel. Une variable manquante dans `variables` est
// laissee telle quelle ({{xxx}}) plutot que silencieusement effacee, pour
// qu'une faute de frappe dans un template personnalise reste visible.
export async function renderEmailTemplate(key: string, variables: Record<string, string>) {
  const definition = getEmailTemplateDefault(key);
  if (!definition) {
    throw notFound(`Unknown email template key: ${key}`);
  }

  const { prisma } = await import("@/lib/prisma");
  const override = await prisma.emailTemplate.findUnique({ where: { key } });

  const subjectTemplate = override?.subject ?? definition.subject;
  const bodyTemplate = override?.bodyText ?? definition.bodyText;

  const subject = interpolate(subjectTemplate, variables);
  const text = interpolate(bodyTemplate, variables);
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#171717;">${toHtmlParagraphs(text)}</div>`;

  return { subject, text, html };
}

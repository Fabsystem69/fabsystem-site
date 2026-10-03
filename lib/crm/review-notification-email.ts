import { formatDateTime, formatEuroFromCents } from "@/lib/format";
import { PROJECT_ASSET_TYPE_LABELS } from "@/lib/project-labels";
import type { ProjectAssetType } from "@/lib/generated/prisma/client";

// Mail envoye a Fabien quand un client transmet son projet. Module PUR :
// il ne recoit que des champs explicitement choisis (type ci-dessous) et ne
// peut donc jamais exposer un champ coach (notesInternes, questionsEnAttente,
// actionsAPreparer...) meme si l'appelant lui passe un objet plus large.

export type ReviewNotificationInput = {
  projectId: string;
  title: string;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  assetType: ProjectAssetType | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleYear: string | null;
  projectStage: string | null;
  usagePattern: string | null;
  startDeadline: string | null;
  materialBudgetCents: number | null;
  laborBudgetCents: number | null;
  deviceCount: number;
  documentCount: number;
  unknownCount: number;
  unansweredCount: number;
  submittedAt: Date;
  baseUrl: string;
};

export type ReviewNotificationEmail = { subject: string; text: string; html: string };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Un sujet de mail ne doit jamais contenir de saut de ligne (injection d'en-tete).
function singleLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function present(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count > 1 ? many : one}`;
}

export function buildReviewProjectUrl(baseUrl: string, projectId: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/dashboard/crm/projects/${encodeURIComponent(projectId)}`;
}

function buildLines(input: ReviewNotificationInput): Array<[string, string]> {
  const customerName = present(input.customerName);
  const vehicle = [present(input.vehicleBrand), present(input.vehicleModel), present(input.vehicleYear)]
    .filter((part): part is string => part !== null)
    .join(" ");
  const support = input.assetType ? PROJECT_ASSET_TYPE_LABELS[input.assetType] : null;
  const vehicleLabel = [support, vehicle || null].filter((part): part is string => part !== null).join(" - ");

  const lines: Array<[string, string | null]> = [
    ["Client", customerName ?? input.customerEmail],
    ["E-mail", input.customerEmail],
    ["Téléphone", present(input.customerPhone)],
    ["Véhicule", present(vehicleLabel)],
    ["Stade du projet", present(input.projectStage)],
    ["Usage", present(input.usagePattern)],
    ["Budget matériel", input.materialBudgetCents != null ? formatEuroFromCents(input.materialBudgetCents) : null],
    ["Budget main-d'œuvre", input.laborBudgetCents != null ? formatEuroFromCents(input.laborBudgetCents) : null],
    ["Échéance", present(input.startDeadline)],
    ["Appareils déclarés", String(input.deviceCount)],
    ["Réponses « Je ne sais pas »", String(input.unknownCount)],
    ["Questions non renseignées", String(input.unansweredCount)],
    ["Pièces jointes", plural(input.documentCount, "fichier", "fichiers")],
    ["Transmis le", formatDateTime(input.submittedAt)],
  ];
  return lines.filter((line): line is [string, string] => line[1] !== null);
}

export function buildReviewNotificationEmail(input: ReviewNotificationInput): ReviewNotificationEmail {
  const displayName = present(input.customerName) ?? input.customerEmail;
  const subject = singleLine(`Projet transmis : ${displayName} — ${input.title}`);
  const url = buildReviewProjectUrl(input.baseUrl, input.projectId);
  const lines = buildLines(input);

  const text = [
    `${displayName} vient de transmettre son projet « ${singleLine(input.title)} ».`,
    "",
    ...lines.map(([label, value]) => `${label} : ${value}`),
    "",
    `Ouvrir le dossier (connexion requise) : ${url}`,
  ].join("\n");

  const rows = lines
    .map(([label, value]) => `<tr><th align="left" style="padding:2px 12px 2px 0;font-weight:600">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join("");
  const html = [
    `<p>${escapeHtml(displayName)} vient de transmettre son projet « ${escapeHtml(singleLine(input.title))} ».</p>`,
    `<table cellpadding="0" cellspacing="0" role="presentation">${rows}</table>`,
    `<p><a href="${escapeHtml(url)}">Ouvrir le dossier</a> (connexion au dashboard requise)</p>`,
  ].join("");

  return { subject, text, html };
}

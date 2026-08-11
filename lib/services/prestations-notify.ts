import type Stripe from "stripe";
import { formatEuroFromCents } from "@/lib/format";
import {
  getCategorieLabel,
  getPalierLabel,
  getPrestationsPackDefinitionBySlug,
  isPrestationsPackSlug,
} from "@/lib/prestations-packs";
import { PRESTATIONS_NEEDS_PROGRESS_LABELS } from "@/lib/prestations-needs";
import { getOrderById } from "@/lib/services/order";
import { logServerEvent } from "@/lib/server-log";

type OrderForNotification = Awaited<ReturnType<typeof getOrderById>>;

type SendMailImpl = (options: {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  text: string;
}) => Promise<unknown>;

type NotifyDeps = {
  getOrder?: (orderId: string) => Promise<OrderForNotification>;
  sendMailImpl?: SendMailImpl;
};

// Import paresseux (comme lib/services/customer-email.ts) : "lib/server/nodemailer"
// pose un garde "server-only" qui echoue si le module est charge en dehors
// d'un composant serveur Next.js (par ex. dans les tests unitaires) — le
// chargement dynamique ne se declenche que lorsque sendMailImpl n'est pas
// deja fourni par l'appelant (tests, injection de dependances).
async function getDefaultSendMail() {
  const { sendMail: defaultSendMail } = await import("@/lib/server/nodemailer");
  return defaultSendMail;
}

function resolveNotifyToAddress() {
  return process.env.CONTACT_TO?.trim() || "contact@fabsystem.fr";
}

function resolveNotifyFromAddress(to: string) {
  return process.env.CONTACT_FROM?.trim() || process.env.SMTP_USER?.trim() || to;
}

function metadataValue(metadata: Stripe.Metadata | null | undefined, key: string) {
  const value = metadata?.[key]?.trim();
  return value && value.length > 0 ? value : null;
}

function buildProgressLabel(metadata: Stripe.Metadata | null | undefined) {
  const raw = metadataValue(metadata, "needsProgress");
  if (!raw) return "(non renseigné)";
  return (
    PRESTATIONS_NEEDS_PROGRESS_LABELS[raw as keyof typeof PRESTATIONS_NEEDS_PROGRESS_LABELS] ??
    raw
  );
}

export type SendPrestationsPackNotificationResult =
  | { sent: true }
  | { sent: false; reason: "no_pack_in_order" };

// Envoie a Fabien un email de recontact des qu'une commande payee contient
// au moins un pack d'accompagnement. Independant de tout email de
// confirmation client (aucun n'existe actuellement dans ce projet — voir
// audit). Les reponses du formulaire de projet ne sont jamais persistees en
// base : elles voyagent uniquement via les metadata de la session Stripe
// (voir lib/services/checkout.ts) et sont lues ici, une seule fois.
export async function sendPrestationsPackNotification(
  orderId: string,
  sessionMetadata: Stripe.Metadata | null | undefined,
  deps?: NotifyDeps
): Promise<SendPrestationsPackNotificationResult> {
  const getOrder = deps?.getOrder ?? getOrderById;

  const order = await getOrder(orderId);
  const packItems = order.items.filter((item) => isPrestationsPackSlug(item.productSlug));

  if (packItems.length === 0) {
    return { sent: false, reason: "no_pack_in_order" };
  }

  const sendMailImpl = deps?.sendMailImpl ?? (await getDefaultSendMail());

  const lines: string[] = [];
  lines.push(`Client : ${order.customerName || "(nom non renseigné)"} <${order.customerEmail}>`);
  lines.push(`Commande : ${order.orderNumber}`);
  lines.push(`Montant payé : ${formatEuroFromCents(order.totalCents)} (${order.currency})`);
  lines.push("");
  lines.push("Pack(s) commandé(s) :");

  for (const item of packItems) {
    const definition = getPrestationsPackDefinitionBySlug(item.productSlug);
    const detail = definition
      ? `${getPalierLabel(definition.categorie, definition.palier)} · ${getCategorieLabel(definition.categorie)}`
      : item.productSlug;
    lines.push(`- ${item.productName} (${detail}) — ${formatEuroFromCents(item.unitAmountCents)}`);
  }

  lines.push("");
  lines.push("Réponses au formulaire de projet :");
  lines.push(`Véhicule / bateau : ${metadataValue(sessionMetadata, "needsVehicle") ?? "(non renseigné)"}`);
  lines.push(
    `Description du projet : ${metadataValue(sessionMetadata, "needsDescription") ?? "(non renseigné)"}`
  );
  lines.push(`Avancement : ${buildProgressLabel(sessionMetadata)}`);
  lines.push(`Contrainte de délai : ${metadataValue(sessionMetadata, "needsDeadline") ?? "—"}`);
  lines.push(`Autre précision : ${metadataValue(sessionMetadata, "needsOther") ?? "—"}`);

  const to = resolveNotifyToAddress();
  const from = resolveNotifyFromAddress(to);
  const subject = `FabSystem — Nouveau pack (${order.customerName || order.customerEmail})`;

  await sendMailImpl({
    to,
    from,
    replyTo: order.customerEmail,
    subject,
    text: lines.join("\n"),
  });

  logServerEvent("info", "prestations pack notification sent", {
    orderId: order.id,
    orderNumber: order.orderNumber,
    packSlugs: packItems.map((item) => item.productSlug),
  });

  return { sent: true };
}

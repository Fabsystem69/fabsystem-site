import { formatEuroFromCents } from "@/lib/format";
import { getRequiredBaseUrl } from "@/lib/server/env";
import { signDownloadEmailToken } from "@/lib/server/download-email-token";
import { getOrderById } from "@/lib/services/order";
import { listDownloadGrantsForOrder } from "@/lib/services/download-grant";
import { logServerEvent } from "@/lib/server-log";

type OrderForEmail = Awaited<ReturnType<typeof getOrderById>>;
type GrantsForEmail = Awaited<ReturnType<typeof listDownloadGrantsForOrder>>;

type SendMailImpl = (options: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
}) => Promise<unknown>;

type CustomerDownloadEmailDeps = {
  getOrder?: (orderId: string) => Promise<OrderForEmail>;
  listGrants?: (orderId: string) => Promise<GrantsForEmail>;
  sendMailImpl?: SendMailImpl;
};

async function getDefaultSendMail() {
  const { sendMail } = await import("@/lib/server/nodemailer");
  return sendMail;
}

function resolveFromAddress() {
  return process.env.CONTACT_FROM?.trim() || process.env.SMTP_USER?.trim() || "contact@fabsystem.fr";
}

function toHtmlParagraphs(lines: string[]) {
  return lines.map((line) => (line === "" ? "" : `<p style="margin:0 0 12px;">${line}</p>`)).join("");
}

// Declenchee apres chaque commande payee contenant au moins un telechargement
// actif — retour utilisateur : deux clients payants n'ont pas su retrouver
// leur ebook depuis /mon-compte et ont du etre depannes a la main par email.
// Chaque lien est un token signe (lib/server/download-email-token.ts) valide
// 30 jours, sans connexion requise : le client peut telecharger directement
// depuis sa boite mail, meme sur un autre appareil que celui de l'achat.
// Idempotente comme le reste des notifications de commande (redeliveries
// Stripe) : au pire un email en double, jamais un accès silencieusement
// manquant.
export async function sendCustomerDownloadEmail(orderId: string, deps?: CustomerDownloadEmailDeps) {
  try {
    const getOrder = deps?.getOrder ?? getOrderById;
    const listGrants = deps?.listGrants ?? listDownloadGrantsForOrder;

    const [order, grants] = await Promise.all([getOrder(orderId), listGrants(orderId)]);
    const activeGrants = grants.filter((grant) => grant.status === "ACTIVE");

    if (activeGrants.length === 0) {
      return { status: "not_applicable" as const };
    }

    const baseUrl = getRequiredBaseUrl();
    const greeting = order.customerName ? `Bonjour ${order.customerName},` : "Bonjour,";

    const downloadLines = activeGrants.map((grant) => {
      const token = signDownloadEmailToken(grant.id);
      const url = `${baseUrl}/api/downloads/email/${token}`;
      return `${grant.product.name} : ${url}`;
    });

    const bodyLines = [
      greeting,
      "",
      `Merci pour votre achat (commande ${order.orderNumber}, ${formatEuroFromCents(order.totalCents)}).`,
      "",
      "Vous pouvez télécharger directement vos fichiers ci-dessous :",
      "",
      ...downloadLines,
      "",
      "Ces liens restent valables 30 jours. Vous pouvez aussi retrouver vos achats à tout moment depuis votre espace client, rubrique \"Mes achats\".",
    ];

    const sendMailImpl = deps?.sendMailImpl ?? (await getDefaultSendMail());
    await sendMailImpl({
      to: order.customerEmail,
      from: resolveFromAddress(),
      subject: `Votre commande ${order.orderNumber} — liens de téléchargement`,
      text: bodyLines.join("\n"),
      html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#171717;">${toHtmlParagraphs(bodyLines)}</div>`,
    });

    return { status: "sent" as const, grantCount: activeGrants.length };
  } catch (error) {
    logServerEvent("error", "failed to send customer download email", { error, orderId });
    return { status: "error" as const };
  }
}

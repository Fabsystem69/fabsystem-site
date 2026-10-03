import { z } from "zod";
import { badRequest } from "@/lib/http-errors";
import { formatEuroFromCents } from "@/lib/format";
import { getRequiredBaseUrl } from "@/lib/server/env";
import { logServerEvent } from "@/lib/server-log";
import { getProductBySlug } from "@/lib/services/catalog";
import { renderEmailTemplate } from "@/lib/services/email-templates";

export const purchaseLinkInputSchema = z.object({
  productSlug: z.string().trim().min(1, "Choisissez un produit."),
  customerEmail: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
  customerName: z.string().trim().max(120).optional(),
  personalNote: z.string().trim().max(1000).optional(),
});

export type PurchaseLinkInput = z.input<typeof purchaseLinkInputSchema>;

type SendMailImpl = (options: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
}) => Promise<unknown>;

export function buildAccountStep(input: { customerEmail: string; baseUrl: string; hasAccount: boolean }) {
  if (input.hasAccount) {
    return [
      `2. Connectez-vous à votre espace client avec l'adresse ${input.customerEmail} : ${input.baseUrl.replace(/\/+$/, "")}/connexion-client`,
      "   Première connexion (votre espace a été créé par FabSystem) ou mot de passe oublié : cliquez sur « Première connexion » / « Mot de passe oublié ? » pour recevoir un lien par e-mail, puis choisissez votre mot de passe.",
      "   Puis revenez sur le lien d'achat ci-dessus : le produit reste dans votre panier.",
    ].join("\n");
  }

  return `2. Dans le panier, créez votre compte avec l'adresse ${input.customerEmail} (prénom, nom, téléphone et un mot de passe).`;
}

export async function listCustomersForPurchaseLink() {
  const { prisma } = await import("@/lib/prisma");
  const customers = await prisma.customer.findMany({
    where: { status: "ACTIVE" },
    select: { email: true, name: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return customers;
}

async function findCustomerByEmail(email: string) {
  const { prisma } = await import("@/lib/prisma");
  return prisma.customer.findUnique({ where: { email }, select: { name: true } });
}

export function buildPurchaseLink(baseUrl: string, productSlug: string) {
  return `${baseUrl.replace(/\/+$/, "")}/acheter/${encodeURIComponent(productSlug)}`;
}

function resolveFromAddress() {
  return process.env.CONTACT_FROM?.trim() || process.env.SMTP_USER?.trim() || "contact@fabsystem.fr";
}

// Envoi manuel (depuis le dashboard) du lien d'achat direct /acheter/<slug>
// accompagne du mail explicatif editable "purchase-link". Aucune commande
// n'est creee ici : le client ajoute lui-meme le produit a son panier en
// cliquant, le prix reste recalcule cote serveur au checkout.
export async function sendPurchaseLinkEmail(
  rawInput: PurchaseLinkInput,
  deps?: { sendMailImpl?: SendMailImpl }
) {
  const parsed = purchaseLinkInputSchema.safeParse(rawInput);

  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Données invalides.");
  }

  const input = parsed.data;
  const product = await getProductBySlug(input.productSlug);
  const price = product.prices.find((candidate) => candidate.status === "ACTIVE");

  if (product.status !== "ACTIVE" || product.purchaseMode !== "BUY_NOW" || !price) {
    throw badRequest("Ce produit n'est pas achetable actuellement.");
  }

  const baseUrl = getRequiredBaseUrl();
  const customer = await findCustomerByEmail(input.customerEmail);
  const customerName = input.customerName || customer?.name || undefined;
  const greeting = customerName ? `Bonjour ${customerName},` : "Bonjour,";
  const purchaseLink = buildPurchaseLink(baseUrl, product.slug);

  const { subject, text, html } = await renderEmailTemplate("purchase-link", {
    greeting,
    product_name: product.name,
    price: formatEuroFromCents(price.unitAmountCents),
    purchase_link: purchaseLink,
    customer_email: input.customerEmail,
    account_step: buildAccountStep({
      customerEmail: input.customerEmail,
      baseUrl,
      hasAccount: Boolean(customer),
    }),
    personal_note: input.personalNote ? `\n${input.personalNote}\n` : "",
  });

  const sendMailImpl =
    deps?.sendMailImpl ?? (await import("@/lib/server/nodemailer")).sendMail;

  await sendMailImpl({ to: input.customerEmail, from: resolveFromAddress(), subject, text, html });
  logServerEvent("info", "purchase_link.email.sent", { productSlug: product.slug });

  return { purchaseLink, productName: product.name };
}

import { after } from "next/server";
import Stripe from "stripe";
import { uploadEbookFile } from "@/lib/ebook-blob";
import { renderEbookHtml } from "@/lib/ebook-html";
import { signEbookToken } from "@/lib/ebook-token";
import { logServerEvent } from "@/lib/server-log";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/server/nodemailer";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

async function generateAndDeliver(
  orderId: string,
  name: string,
  email: string,
  origin: string
) {
  // Bloc 1 : génération + upload. Une erreur ici signifie qu'il n'y a pas de
  // fichier à livrer — la commande passe légitimement en FAILED.
  try {
    await prisma.ebookOrder.update({
      where: { id: orderId },
      data: { status: "GENERATING" },
    });

    const buyer = { name, email };
    const [desktopHtml, pocketHtml] = await Promise.all([
      renderEbookHtml("desktop", buyer),
      renderEbookHtml("pocket", buyer),
    ]);

    const htmlContentType = "text/html; charset=utf-8";
    const [desktopBlobPath, pocketBlobPath] = await Promise.all([
      uploadEbookFile(`ebooks/${orderId}/bureau.html`, desktopHtml, htmlContentType),
      uploadEbookFile(`ebooks/${orderId}/poche.html`, pocketHtml, htmlContentType),
    ]);

    await prisma.ebookOrder.update({
      where: { id: orderId },
      data: { status: "READY", desktopBlobPath, pocketBlobPath },
    });

    logServerEvent("info", "ebook file generated", { orderId });
  } catch (error) {
    logServerEvent("error", "ebook order generation failed", { orderId, error });
    await prisma.ebookOrder.update({
      where: { id: orderId },
      data: {
        status: "FAILED",
        failureReason: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return;
  }

  // Bloc 2 : email. Indépendant du bloc 1 — un incident SMTP ne doit jamais
  // faire régresser une commande déjà READY (le fichier existe et est
  // téléchargeable indépendamment de l'envoi de l'email).
  try {
    const accessToken = signEbookToken(orderId, email);
    const accessUrl = `${origin}/ebook/acces/${accessToken}`;

    await sendMail({
      to: email,
      from: process.env.SMTP_USER,
      subject: "Votre ebook « Câbler son van sans se planter »",
      text: [
        `Bonjour ${name},`,
        "",
        "Merci pour votre achat ! Votre exemplaire personnel est prêt.",
        `Téléchargez-le ici (lien valable 72h) : ${accessUrl}`,
        "",
        "Ce lien est personnel, ne le partagez pas.",
      ].join("\n"),
    });

    await prisma.ebookOrder.update({
      where: { id: orderId },
      data: { emailSentAt: new Date() },
    });

    logServerEvent("info", "ebook order delivered", { orderId, email });
  } catch (error) {
    logServerEvent("error", "ebook order email failed", { orderId, error });
    await prisma.ebookOrder.update({
      where: { id: orderId },
      data: {
        emailError: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logServerEvent("error", "stripe webhook: missing STRIPE_WEBHOOK_SECRET", {});
    return Response.json({ error: "Configuration manquante" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  // IMPORTANT : req.text() lit le corps brut, pas req.json() — la vérification
  // de signature Stripe échoue si le corps a été reparsé/reformaté.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing stripe-signature header");
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    logServerEvent("warn", "stripe webhook: signature verification failed", { error });
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    logServerEvent("info", "stripe webhook: event ignored", { type: event.type });
    return Response.json({ ok: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const email =
    session.customer_email ?? session.customer_details?.email ?? session.metadata?.email;
  const name = session.metadata?.name ?? session.customer_details?.name ?? "Client";

  logServerEvent("info", "stripe webhook: checkout.session.completed received", {
    sessionId: session.id,
    email,
    name,
    amountTotal: session.amount_total,
    currency: session.currency,
    paymentStatus: session.payment_status,
  });

  if (!email) {
    logServerEvent("error", "stripe webhook: no email on session", { sessionId: session.id });
    return Response.json({ ok: true });
  }

  const existing = await prisma.ebookOrder.findUnique({
    where: { stripeSessionId: session.id },
  });

  if (existing) {
    // Événement déjà traité (Stripe peut renvoyer le même webhook plusieurs fois).
    return Response.json({ ok: true });
  }

  const order = await prisma.ebookOrder.create({
    data: {
      email,
      name,
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      status: "PAID",
    },
  });

  const origin = new URL(req.url).origin;
  after(() => generateAndDeliver(order.id, name, email, origin));

  return Response.json({ ok: true });
}

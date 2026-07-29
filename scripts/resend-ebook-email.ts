// Renvoie manuellement l'email de livraison pour une commande ebook déjà
// READY (fichiers déjà générés/uploadés) dont l'envoi initial a échoué
// (SMTP down, secret manquant, etc. — voir EbookOrder.emailError).
//
// Usage :
//   node --env-file=.env.production.local --import tsx scripts/resend-ebook-email.ts <orderId> [origin]
//
// origin par défaut : https://www.fabsystem.fr

import { prisma } from "@/lib/prisma";
import { signEbookToken } from "@/lib/ebook-token";
import { sendMail } from "@/lib/server/nodemailer";

async function main() {
  const [, , orderId, origin = "https://www.fabsystem.fr"] = process.argv;

  if (!orderId) {
    console.error("Usage: resend-ebook-email.ts <orderId> [origin]");
    process.exit(1);
  }

  const order = await prisma.ebookOrder.findUnique({ where: { id: orderId } });

  if (!order) {
    console.error(`Commande introuvable : ${orderId}`);
    process.exit(1);
  }

  if (order.status !== "READY") {
    console.error(`Commande pas prête (status=${order.status}), rien envoyé.`);
    process.exit(1);
  }

  const accessToken = signEbookToken(order.id, order.email);
  const accessUrl = `${origin}/ebook/acces/${accessToken}`;

  await sendMail({
    to: order.email,
    from: process.env.SMTP_USER,
    subject: "Votre ebook « Câbler son van sans se planter »",
    encoding: "base64",
    text: [
      `Bonjour ${order.name},`,
      "",
      "Merci pour votre achat ! Votre exemplaire personnel est prêt.",
      `Téléchargez-le ici (lien valable 72h) : ${accessUrl}`,
      "",
      "Ce lien est personnel, ne le partagez pas.",
    ].join("\n"),
  });

  await prisma.ebookOrder.update({
    where: { id: order.id },
    data: { emailSentAt: new Date(), emailError: null },
  });

  console.log(`Email renvoyé à ${order.email} pour la commande ${order.id}.`);
}

main()
  .catch((error) => {
    console.error("Échec du renvoi :", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

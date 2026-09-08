import { badRequest } from "@/lib/http-errors";
import { prisma } from "@/lib/prisma";
import { logServerEvent } from "@/lib/server-log";

// Mailing manuel groupé vers n'importe quelle sélection de clients — extrait
// de l'ancien lib/services/editor-crm.ts (qui ne ciblait que le segment
// "éditeur sans abonnement") pour servir tous les segments de
// /dashboard/customers (Éditeur Plus, Accompagnement, Ebook, Juste inscrit).
// CustomerContactLog reste la source unique de "dernier contact", partagée
// avec les relances automatiques (schema-editor-plus, dossier-notifications).

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

export type SendCustomerMailingResult = {
  sentCount: number;
  totalRequested: number;
};

export async function sendCustomerMailing(
  input: { customerIds: string[]; subject: string; message: string; sentBy?: string },
  deps?: { sendMailImpl?: Awaited<ReturnType<typeof getDefaultSendMail>> }
): Promise<SendCustomerMailingResult> {
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
      logServerEvent("error", "failed to send customer mailing", { error, customerId: customer.id });
    }
  }

  return { sentCount, totalRequested: customers.length };
}

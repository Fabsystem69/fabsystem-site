import { NextResponse } from "next/server";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { requireApiSession } from "@/lib/internal-api";
import { createQuoteSignatureLink } from "@/lib/quote-signature-service";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { sendMail } from "@/lib/server/nodemailer";
import { renderQuotePdfBuffer } from "@/lib/server/pdf";
import { generateQrDataUrl } from "@/lib/server/qrcode";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;

  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (!quote.customer.email) {
      return NextResponse.json(
        { error: "Customer email is missing" },
        { status: 400 }
      );
    }

    const qrDataUrl = await generateQrDataUrl("https://www.fabsystem.fr/contact", {
      margin: 0,
      width: 256,
    });

    const [{ url }, pdf] = await Promise.all([
      createQuoteSignatureLink(id, { request }),
      renderQuotePdfBuffer(id, qrDataUrl),
    ]);

    const from =
      process.env.CONTACT_FROM ||
      process.env.SMTP_USER ||
      "contact@fabsystem.fr";

    const subject = `Devis ${quote.number} – Signature`;
    const validity = quote.validUntil ? formatDate(quote.validUntil) : "Non renseignée";
    const total = formatEuroFromCents(quote.total);

    const text = [
      `Bonjour ${quote.customer.name},`,
      "",
      `Votre devis ${quote.number} est prêt.`,
      `Montant total: ${total}`,
      `Validité: ${validity}`,
      "",
      "Vous pouvez le consulter, le signer et nous le retourner via ce lien :",
      url,
      "",
      "Nos coordonnées directes :",
      "https://www.fabsystem.fr/contact",
      "",
      "Le devis PDF est également joint à ce message.",
      "",
      "FabSystem",
    ].join("\n");

    await sendMail({
      to: quote.customer.email,
      from,
      subject,
      text,
      attachments: [
        {
          filename: `${quote.number}.pdf`,
          content: pdf.buffer,
          contentType: "application/pdf",
        },
      ],
    });

    if (quote.status === "DRAFT") {
      await prisma.quote.update({
        where: { id },
        data: { status: "SENT" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Quote not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.message === "Quote already signed") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return databaseErrorResponse(error);
  }
}

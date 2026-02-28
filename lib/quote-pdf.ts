import QRCode from "qrcode";
import { renderDocumentPdf } from "@/lib/pdf-documents";
import { prisma } from "@/lib/prisma";

export async function getQuoteForPdf(quoteId: string) {
  return prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      customer: true,
      items: {
        orderBy: { position: "asc" },
      },
    },
  });
}

export async function generateQuotePdfBuffer(quoteId: string) {
  const quote = await getQuoteForPdf(quoteId);

  if (!quote) {
    throw new Error("Quote not found");
  }

  const qrDataUrl = await QRCode.toDataURL("https://fabsystem.fr", {
    margin: 0,
    width: 128,
  });

  const { buffer, filename } = await renderDocumentPdf(
    {
      kind: "quote",
      number: quote.number,
      status: quote.status,
      issueDate: quote.issueDate,
      dueDate: quote.validUntil,
      notes: quote.notes,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      customer: quote.customer,
      items: quote.items,
      signedAt: quote.signedAt,
      signedName: quote.signedName,
      agreementChecked: quote.agreementChecked,
      signatureDataUrl: quote.signatureDataUrl,
    },
    qrDataUrl
  );

  return {
    quote,
    buffer,
    filename,
  };
}

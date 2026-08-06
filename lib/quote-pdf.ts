import { renderDocumentPdf, toCustomerInfo } from "@/lib/pdf-documents";
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

export async function generateQuotePdfBuffer(quoteId: string, qrDataUrl: string) {
  const quote = await getQuoteForPdf(quoteId);

  if (!quote) {
    throw new Error("Quote not found");
  }

  const { buffer, filename } = await renderDocumentPdf(
    {
      kind: "quote",
      number: quote.number,
      status: quote.status,
      issueDate: quote.issueDate,
      dueDate: quote.validUntil,
      serviceType: quote.serviceType,
      deliveryMode: quote.deliveryMode,
      serviceDate: quote.serviceDate,
      notes: quote.notes,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      customer: toCustomerInfo(quote.customer),
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

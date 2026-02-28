import "server-only";
import type { UrssafSummary } from "@/lib/accounting";

export async function renderQuotePdfBuffer(quoteId: string, qrDataUrl: string) {
  const { generateQuotePdfBuffer } = await import("@/lib/quote-pdf");
  return generateQuotePdfBuffer(quoteId, qrDataUrl);
}

export async function renderInvoicePdf(
  data: Parameters<typeof import("@/lib/pdf-documents")["renderDocumentPdf"]>[0],
  qrDataUrl: string
) {
  const { renderDocumentPdf } = await import("@/lib/pdf-documents");
  return renderDocumentPdf(data, qrDataUrl);
}

export async function renderUrssafPdfBuffer(summary: UrssafSummary) {
  const { renderUrssafPdf } = await import("@/lib/accounting-pdf");
  return renderUrssafPdf(summary);
}

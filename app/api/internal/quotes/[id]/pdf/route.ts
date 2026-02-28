import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireApiSession } from "@/lib/internal-api";
import { renderDocumentPdf } from "@/lib/pdf-documents";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;

  try {
    const qrDataUrl = await QRCode.toDataURL("https://fabsystem.fr", {
      margin: 0,
      width: 128,
    });

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

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

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

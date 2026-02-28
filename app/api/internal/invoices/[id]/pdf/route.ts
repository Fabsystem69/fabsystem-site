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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const { buffer, filename } = await renderDocumentPdf(
      {
        kind: "invoice",
        number: invoice.number,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        serviceType: invoice.serviceType,
        deliveryMode: invoice.deliveryMode,
        serviceDate: invoice.serviceDate,
        notes: invoice.notes,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        customer: invoice.customer,
        items: invoice.items,
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

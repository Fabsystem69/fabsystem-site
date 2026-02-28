import { NextResponse } from "next/server";
import { generateDocumentNumber } from "@/lib/document-number";
import { requireApiSession } from "@/lib/internal-api";
import { createInvoiceTotals } from "@/lib/invoice-payload";
import { addDays, normalizePaymentTermsDays } from "@/lib/payment-terms";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const paymentTermsDays = normalizePaymentTermsDays(json?.paymentTermsDays);

  try {
    const existingInvoice = await prisma.invoice.findUnique({
      where: { sourceQuoteId: id },
      select: { id: true },
    });

    if (existingInvoice) {
      return NextResponse.json({ ok: true, invoiceId: existingInvoice.id });
    }

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const issueDate = new Date();
    const dueDate = addDays(issueDate, paymentTermsDays);
    const { normalizedItems, subtotal, tax, total } = createInvoiceTotals(
      quote.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    );

    const invoice = await prisma.invoice.create({
      data: {
        number: generateDocumentNumber("INV"),
        status: "DRAFT",
        customerId: quote.customerId,
        sourceQuoteId: quote.id,
        issueDate,
        dueDate,
        serviceDate: quote.serviceDate,
        serviceType: quote.serviceType,
        deliveryMode: quote.deliveryMode,
        notes: quote.notes,
        subtotal,
        tax,
        total,
        items: {
          create: normalizedItems,
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, invoiceId: invoice.id }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

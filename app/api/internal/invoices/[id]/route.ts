import { NextResponse } from "next/server";
import { createInvoiceTotals, invoiceUpsertSchema } from "@/lib/invoice-payload";
import { requireApiSession } from "@/lib/internal-api";
import { rememberItemTemplates } from "@/lib/item-templates";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse, isDatabaseConnectionError } from "@/lib/prisma-errors";

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

    return NextResponse.json({ invoice });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = invoiceUpsertSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invoice payload" }, { status: 400 });
  }

  try {
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      select: { id: true, paidAt: true, status: true, sourceQuoteId: true },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (parsed.data.sourceQuoteId) {
      const sourceQuote = await prisma.quote.findUnique({
        where: { id: parsed.data.sourceQuoteId },
        select: { id: true },
      });

      if (!sourceQuote) {
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      }

      const existingSourceInvoice = await prisma.invoice.findFirst({
        where: {
          sourceQuoteId: parsed.data.sourceQuoteId,
          NOT: { id },
        },
        select: { id: true },
      });

      if (existingSourceInvoice) {
        return NextResponse.json(
          {
            error: "An invoice already exists for this quote",
            invoiceId: existingSourceInvoice.id,
          },
          { status: 409 }
        );
      }
    }

    const customer = await prisma.customer.findUnique({
      where: { id: parsed.data.customerId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const { normalizedItems, subtotal, tax, total } = createInvoiceTotals(parsed.data.items);
    const nextStatus = parsed.data.status ?? "DRAFT";
    const paidAt =
      nextStatus === "PAID"
        ? parsed.data.paidAt
          ? new Date(parsed.data.paidAt)
          : existingInvoice.paidAt ?? new Date()
        : null;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        customerId: parsed.data.customerId,
        issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : new Date(),
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        serviceDate: parsed.data.serviceDate ? new Date(parsed.data.serviceDate) : null,
        serviceType: parsed.data.serviceType ?? "INTERVENTION",
        deliveryMode: parsed.data.deliveryMode ?? "ONSITE",
        status: nextStatus,
        notes: parsed.data.notes || null,
        subtotal,
        tax,
        total,
        sourceQuoteId: parsed.data.sourceQuoteId ?? existingInvoice.sourceQuoteId ?? null,
        paidAt,
        paymentMethod: parsed.data.paymentMethod || null,
        paymentRef: parsed.data.paymentRef || null,
        items: {
          deleteMany: {},
          createMany: {
            data: normalizedItems,
          },
        },
      },
      include: {
        customer: true,
        items: {
          orderBy: { position: "asc" },
        },
      },
    });

    await rememberItemTemplates(normalizedItems).catch(() => undefined);

    return NextResponse.json({ ok: true, invoice });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return databaseErrorResponse(error);
    }

    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft invoices can be deleted" },
        { status: 409 }
      );
    }

    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return databaseErrorResponse(error);
    }

    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
}

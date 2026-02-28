import { NextResponse } from "next/server";
import { generateDocumentNumber } from "@/lib/document-number";
import { createInvoiceTotals, invoiceUpsertSchema } from "@/lib/invoice-payload";
import { requireApiSession } from "@/lib/internal-api";
import { rememberItemTemplates } from "@/lib/item-templates";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";

export async function GET() {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: true,
        items: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function POST(req: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const json = await req.json().catch(() => null);
  const parsed = invoiceUpsertSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invoice payload" }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parsed.data.customerId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const { normalizedItems, subtotal, tax, total } = createInvoiceTotals(parsed.data.items);

    const invoice = await prisma.invoice.create({
      data: {
        number: generateDocumentNumber("INV"),
        status: parsed.data.status ?? "DRAFT",
        customerId: parsed.data.customerId,
        issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : new Date(),
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        notes: parsed.data.notes || null,
        subtotal,
        tax,
        total,
        items: {
          create: normalizedItems,
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

    return NextResponse.json({ ok: true, invoice }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { getInvoicesPage, normalizeSearchQuery, parsePageParam } from "@/lib/document-list";
import { generateDocumentNumber } from "@/lib/document-number";
import { createInvoiceTotals, invoiceUpsertSchema } from "@/lib/invoice-payload";
import { requireApiSession } from "@/lib/internal-api";
import { rememberItemTemplates } from "@/lib/item-templates";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";

export async function GET(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = normalizeSearchQuery(searchParams.get("search"));
    const page = parsePageParam(searchParams.get("page"));
    const { invoices, totalCount, totalPages, currentPage } = await getInvoicesPage(
      search,
      page
    );

    return NextResponse.json({
      invoices,
      totalCount,
      totalPages,
      currentPage,
      pageSize: 10,
    });
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
    const nextStatus = parsed.data.status ?? "DRAFT";
    const paidAt =
      nextStatus === "PAID"
        ? parsed.data.paidAt
          ? new Date(parsed.data.paidAt)
          : new Date()
        : null;

    const invoice = await prisma.invoice.create({
      data: {
        number: generateDocumentNumber("INV"),
        status: nextStatus,
        customerId: parsed.data.customerId,
        issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : new Date(),
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        serviceDate: parsed.data.serviceDate ? new Date(parsed.data.serviceDate) : null,
        serviceType: parsed.data.serviceType ?? "INTERVENTION",
        deliveryMode: parsed.data.deliveryMode ?? "ONSITE",
        notes: parsed.data.notes || null,
        subtotal,
        tax,
        total,
        paidAt,
        paymentMethod: parsed.data.paymentMethod || null,
        paymentRef: parsed.data.paymentRef || null,
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

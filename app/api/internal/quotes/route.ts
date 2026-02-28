import { NextResponse } from "next/server";
import { generateDocumentNumber } from "@/lib/document-number";
import { getQuotesPage, normalizeSearchQuery, parsePageParam } from "@/lib/document-list";
import { requireApiSession } from "@/lib/internal-api";
import { rememberItemTemplates } from "@/lib/item-templates";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { createQuoteTotals, quoteUpsertSchema } from "@/lib/quote-payload";

export async function GET(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = normalizeSearchQuery(searchParams.get("search"));
    const page = parsePageParam(searchParams.get("page"));
    const { quotes, totalCount, totalPages, currentPage } = await getQuotesPage(
      search,
      page
    );

    return NextResponse.json({
      quotes,
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
  const parsed = quoteUpsertSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quote payload" }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parsed.data.customerId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const { normalizedItems, subtotal, tax, total } = createQuoteTotals(parsed.data.items);

    const quote = await prisma.quote.create({
      data: {
        number: generateDocumentNumber("QUO"),
        status: parsed.data.status ?? "DRAFT",
        customerId: parsed.data.customerId,
        issueDate: parsed.data.issueDate
          ? new Date(parsed.data.issueDate)
          : new Date(),
        validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
        serviceDate: parsed.data.serviceDate ? new Date(parsed.data.serviceDate) : null,
        serviceType: parsed.data.serviceType ?? "INTERVENTION",
        deliveryMode: parsed.data.deliveryMode ?? "ONSITE",
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

    return NextResponse.json({ ok: true, quote }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { generateDocumentNumber } from "@/lib/document-number";
import { requireApiSession } from "@/lib/internal-api";
import { rememberItemTemplates } from "@/lib/item-templates";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { createQuoteTotals, quoteUpsertSchema } from "@/lib/quote-payload";

export async function GET() {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const quotes = await prisma.quote.findMany({
      include: {
        customer: true,
        items: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ quotes });
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

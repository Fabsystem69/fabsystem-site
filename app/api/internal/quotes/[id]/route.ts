import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/internal-api";
import { rememberItemTemplates } from "@/lib/item-templates";
import { createQuoteTotals, quoteUpsertSchema } from "@/lib/quote-payload";
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

    return NextResponse.json({ quote });
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
  const parsed = quoteUpsertSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quote payload" }, { status: 400 });
  }

  try {
    const existingQuote = await prisma.quote.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingQuote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: parsed.data.customerId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const { normalizedItems, subtotal, tax, total } = createQuoteTotals(parsed.data.items);

    const quote = await prisma.quote.update({
      where: { id },
      data: {
        customerId: parsed.data.customerId,
        issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : new Date(),
        status: parsed.data.status ?? "DRAFT",
        validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
        serviceDate: parsed.data.serviceDate ? new Date(parsed.data.serviceDate) : null,
        serviceType: parsed.data.serviceType ?? "INTERVENTION",
        deliveryMode: parsed.data.deliveryMode ?? "ONSITE",
        notes: parsed.data.notes || null,
        subtotal,
        tax,
        total,
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

    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return databaseErrorResponse(error);
    }

    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;

  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (quote.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft quotes can be deleted" },
        { status: 409 }
      );
    }

    await prisma.quote.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return databaseErrorResponse(error);
    }

    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }
}

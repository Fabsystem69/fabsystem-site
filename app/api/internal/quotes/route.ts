import { NextResponse } from "next/server";
import { z } from "zod";
import { generateDocumentNumber } from "@/lib/document-number";
import { requireApiSession } from "@/lib/internal-api";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";

const quoteStatusSchema = z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED"]);

const quoteItemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
});

const quoteCreateSchema = z.object({
  customerId: z.string().trim().min(1),
  issueDate: z.string().datetime().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  tax: z.number().int().nonnegative(),
  status: quoteStatusSchema.optional(),
  items: z.array(quoteItemSchema).min(1),
});

function createQuoteTotals(
  items: Array<{ description: string; quantity: number; unitPrice: number }>
) {
  const normalizedItems = items.map((item, index) => {
    const lineTotal = item.quantity * item.unitPrice;

    return {
      ...item,
      lineTotal,
      position: index,
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);

  return { normalizedItems, subtotal };
}

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
  const parsed = quoteCreateSchema.safeParse(json);

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

    const { normalizedItems, subtotal } = createQuoteTotals(parsed.data.items);
    const tax = parsed.data.tax;
    const total = subtotal + tax;

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

    return NextResponse.json({ ok: true, quote }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

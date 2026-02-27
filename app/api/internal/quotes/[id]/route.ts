import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/internal-api";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse, isDatabaseConnectionError } from "@/lib/prisma-errors";

const quotePatchSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED"]).optional(),
  validUntil: z.string().datetime().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

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
  const parsed = quotePatchSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quote payload" }, { status: 400 });
  }

  try {
    const quote = await prisma.quote.update({
      where: { id },
      data: {
        status: parsed.data.status,
        validUntil:
          parsed.data.validUntil === undefined
            ? undefined
            : parsed.data.validUntil
              ? new Date(parsed.data.validUntil)
              : null,
        notes:
          parsed.data.notes === undefined ? undefined : parsed.data.notes || null,
      },
      include: {
        customer: true,
        items: {
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return databaseErrorResponse(error);
    }

    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }
}

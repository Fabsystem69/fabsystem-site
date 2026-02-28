import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/internal-api";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";

const paymentSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "CANCELLED"]).default("PAID"),
  paidAt: z.string().datetime().nullable().optional(),
  paymentMethod: z.string().trim().nullable().optional(),
  paymentRef: z.string().trim().nullable().optional(),
});

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = paymentSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { id: true, paidAt: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const status = parsed.data.status;
    const paidAt =
      status === "PAID"
        ? parsed.data.paidAt
          ? new Date(parsed.data.paidAt)
          : invoice.paidAt ?? new Date()
        : null;

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        paidAt,
        paymentMethod: parsed.data.paymentMethod || null,
        paymentRef: parsed.data.paymentRef || null,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json({ ok: true, invoice: updated });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

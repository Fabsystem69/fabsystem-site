import { NextResponse } from "next/server";
import { customerInputSchema, normalizeCustomerData } from "@/lib/customer-payload";
import { requireApiSession } from "@/lib/internal-api";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";

export async function GET() {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ customers });
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
  const parsed = customerInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid customer payload" },
      { status: 400 }
    );
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        ...normalizeCustomerData(parsed.data),
      },
    });

    return NextResponse.json({ ok: true, customer }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { customerInputSchema, normalizeCustomerData } from "@/lib/customer-payload";
import { requireApiSession } from "@/lib/internal-api";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";

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
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ customer });
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
  const parsed = customerInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid customer payload" }, { status: 400 });
  }

  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: normalizeCustomerData(parsed.data),
    });

    return NextResponse.json({ ok: true, customer });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { customerInputSchema } from "@/lib/customer-payload";
import { badRequest } from "@/lib/http-errors";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { getCustomerById, updateCustomer } from "@/lib/services/customers";

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
    const customer = await getCustomerById(id);

    return NextResponse.json({ customer });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.customers.by-id.get");
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
    return databaseErrorResponse(badRequest("Invalid customer payload"));
  }

  try {
    const customer = await updateCustomer(id, parsed.data);

    return NextResponse.json({ ok: true, customer });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.customers.by-id.patch");
  }
}

import { NextResponse } from "next/server";
import { customerInputSchema } from "@/lib/customer-payload";
import { badRequest } from "@/lib/http-errors";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import {
  createCustomer,
  getCustomersPage,
  parseCustomerLimitParam,
  parseCustomerPageParam,
  normalizeCustomerSearchQuery,
} from "@/lib/services/customers";

export async function GET(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = normalizeCustomerSearchQuery(searchParams.get("search"));
    const page = parseCustomerPageParam(searchParams.get("page"));
    const limit = parseCustomerLimitParam(searchParams.get("limit"));
    const result = await getCustomersPage({ search, page, limit });

    return NextResponse.json(result);
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.customers.get");
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
    return databaseErrorResponse(badRequest("Invalid customer payload"));
  }

  try {
    const customer = await createCustomer(parsed.data);

    return NextResponse.json({ ok: true, customer }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.customers.post");
  }
}

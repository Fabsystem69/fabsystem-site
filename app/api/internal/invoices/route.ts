import { NextResponse } from "next/server";
import { getInvoicesPage, normalizeSearchQuery, parsePageParam } from "@/lib/document-list";
import { badRequest } from "@/lib/http-errors";
import { invoiceUpsertSchema } from "@/lib/invoice-payload";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { createInvoice } from "@/lib/services/invoices";

export async function GET(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = normalizeSearchQuery(searchParams.get("search"));
    const page = parsePageParam(searchParams.get("page"));
    const { invoices, totalCount, totalPages, currentPage } = await getInvoicesPage(
      search,
      page
    );

    return NextResponse.json({
      invoices,
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
  const parsed = invoiceUpsertSchema.safeParse(json);

  if (!parsed.success) {
    return databaseErrorResponse(badRequest("Invalid invoice payload"));
  }

  try {
    const invoice = await createInvoice(parsed.data);

    return NextResponse.json({ ok: true, invoice }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.invoices.post");
  }
}

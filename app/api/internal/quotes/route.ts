import { NextResponse } from "next/server";
import { getQuotesPage, normalizeSearchQuery, parsePageParam } from "@/lib/document-list";
import { badRequest } from "@/lib/http-errors";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { quoteUpsertSchema } from "@/lib/quote-payload";
import { createQuote } from "@/lib/services/quotes";

export async function GET(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = normalizeSearchQuery(searchParams.get("search"));
    const page = parsePageParam(searchParams.get("page"));
    const { quotes, totalCount, totalPages, currentPage } = await getQuotesPage(
      search,
      page
    );

    return NextResponse.json({
      quotes,
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
  const parsed = quoteUpsertSchema.safeParse(json);

  if (!parsed.success) {
    return databaseErrorResponse(badRequest("Invalid quote payload"));
  }

  try {
    const quote = await createQuote(parsed.data);

    return NextResponse.json({ ok: true, quote }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.quotes.post");
  }
}

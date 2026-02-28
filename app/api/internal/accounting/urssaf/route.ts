import { NextResponse } from "next/server";
import { getUrssafSummary, parseAccountingYear } from "@/lib/accounting";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";

export async function GET(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { searchParams } = new URL(request.url);
  const year = parseAccountingYear(searchParams.get("year"));

  try {
    const summary = await getUrssafSummary(year);
    return NextResponse.json(summary);
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

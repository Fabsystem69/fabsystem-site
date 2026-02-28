import { NextResponse } from "next/server";
import { getUrssafSummary, parseAccountingYear } from "@/lib/accounting";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { searchParams } = new URL(request.url);
  const year = parseAccountingYear(searchParams.get("year"));

  try {
    const summary = await getUrssafSummary(year);
    const { renderUrssafPdf } = await import("@/lib/accounting-pdf");
    const buffer = await renderUrssafPdf(summary);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="urssaf-${year}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { formatCentsForCsv, getUrssafSummary, parseAccountingYear } from "@/lib/accounting";
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
    const rows = [
      "Trimestre;MontantEncaisseEUR;NombreEncaissements",
      ...summary.quarters.map((quarter) =>
        [`T${quarter.quarter}`, formatCentsForCsv(quarter.paidCents), String(quarter.paidCount)].join(
          ";"
        )
      ),
    ];

    return new NextResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="urssaf-trimestres-${year}.csv"`,
      },
    });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

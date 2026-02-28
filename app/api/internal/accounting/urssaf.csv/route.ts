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
      "DateEncaissement;Client;NumeroFacture;MontantEncaisseEUR;ModePaiement;Reference",
      ...summary.receipts.map((receipt) =>
        [
          receipt.paidAt.toISOString().slice(0, 10),
          receipt.customerName,
          receipt.invoiceNumber,
          formatCentsForCsv(receipt.totalCents),
          receipt.paymentMethod ?? "",
          receipt.paymentRef ?? "",
        ].join(";")
      ),
    ];

    return new NextResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="livre-recettes-${year}.csv"`,
      },
    });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

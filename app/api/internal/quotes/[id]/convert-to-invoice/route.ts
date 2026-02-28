import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { createInvoiceFromQuote } from "@/lib/services/invoices";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;
  const json = await req.json().catch(() => null);

  try {
    const result = await createInvoiceFromQuote(id, {
      paymentTermsDays: json?.paymentTermsDays,
    });

    return NextResponse.json(
      { ok: true, invoiceId: result.invoiceId },
      { status: result.created ? 201 : 200 }
    );
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.quotes.convert-to-invoice");
  }
}

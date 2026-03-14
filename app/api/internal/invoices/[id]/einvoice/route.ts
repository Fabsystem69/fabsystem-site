import { NextResponse } from "next/server";
import {
  electronicInvoiceInclude,
  mapInvoiceToElectronicInvoiceData,
} from "@/lib/einvoice/mapper";
import { validateElectronicInvoiceData } from "@/lib/einvoice/validators";
import { requireApiSession } from "@/lib/internal-api";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: electronicInvoiceInclude,
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const document = mapInvoiceToElectronicInvoiceData(invoice);
    const validation = validateElectronicInvoiceData(document);

    return NextResponse.json({
      document,
      validationIssues: validation.issues,
      errors: validation.errors,
      warnings: validation.warnings,
      isReadyForExport: validation.errors.length === 0,
    });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.invoices.einvoice");
  }
}

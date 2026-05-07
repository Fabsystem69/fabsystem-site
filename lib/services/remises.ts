import { notFound } from "@/lib/http-errors";
import { reserveDocumentNumber } from "@/lib/document-number";
import { prisma } from "@/lib/prisma";
import type { RemiseCreateInput } from "@/lib/remise-payload";

export async function createRemise(input: RemiseCreateInput) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { id: input.customerId },
      select: { id: true },
    });

    if (!customer) {
      throw notFound("Customer not found");
    }

    if (input.invoiceId) {
      const invoice = await tx.invoice.findUnique({
        where: { id: input.invoiceId },
        select: { id: true },
      });

      if (!invoice) {
        throw notFound("Invoice not found");
      }
    }

    const number = await reserveDocumentNumber("REM", { tx });

    return tx.remise.create({
      data: {
        number,
        status: input.status ?? "DRAFT",
        customerId: input.customerId,
        invoiceId: input.invoiceId ?? null,
        amount: input.amount,
        reason: input.reason ?? null,
        date: new Date(input.date),
      },
    });
  });
}

import type { z } from "zod";
import { type Prisma } from "@/lib/generated/prisma/client";
import { notFound } from "@/lib/http-errors";
import { reserveDocumentNumber } from "@/lib/document-number";
import { rememberItemTemplates } from "@/lib/item-templates";
import { prisma } from "@/lib/prisma";
import { createQuoteTotals, quoteUpsertSchema } from "@/lib/quote-payload";

export type QuoteUpsertInput = z.infer<typeof quoteUpsertSchema>;

async function assertQuoteCustomerExists(
  customerId: string,
  tx: Prisma.TransactionClient
) {
  const customer = await tx.customer.findUnique({
    where: { id: customerId },
    select: { id: true },
  });

  if (!customer) {
    throw notFound("Customer not found");
  }
}

export async function createQuote(input: QuoteUpsertInput) {
  const { normalizedItems, subtotal, tax, total } = createQuoteTotals(input.items);

  const quote = await prisma.$transaction(async (tx) => {
    await assertQuoteCustomerExists(input.customerId, tx);
    const number = await reserveDocumentNumber("QUO", { tx });

    return tx.quote.create({
      data: {
        number,
        status: input.status ?? "DRAFT",
        customerId: input.customerId,
        issueDate: input.issueDate ? new Date(input.issueDate) : new Date(),
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        serviceDate: input.serviceDate ? new Date(input.serviceDate) : null,
        serviceType: input.serviceType ?? "INTERVENTION",
        deliveryMode: input.deliveryMode ?? "ONSITE",
        notes: input.notes || null,
        subtotal,
        tax,
        total,
        items: {
          create: normalizedItems,
        },
      },
      include: {
        customer: true,
        items: {
          orderBy: { position: "asc" },
        },
      },
    });
  });

  await rememberItemTemplates(normalizedItems).catch(() => undefined);

  return quote;
}

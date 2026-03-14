import type { z } from "zod";
import { type Prisma } from "@/lib/generated/prisma/client";
import { conflict, notFound } from "@/lib/http-errors";
import { reserveDocumentNumber } from "@/lib/document-number";
import { rememberItemTemplates } from "@/lib/item-templates";
import { prisma } from "@/lib/prisma";
import { createInvoiceTotals, invoiceUpsertSchema } from "@/lib/invoice-payload";
import { addDays, normalizePaymentTermsDays } from "@/lib/payment-terms";

export type InvoiceUpsertInput = z.infer<typeof invoiceUpsertSchema>;

async function assertInvoiceCustomerExists(
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

async function assertSourceQuoteAvailability(
  sourceQuoteId: string,
  tx: Prisma.TransactionClient
) {
  const sourceQuote = await tx.quote.findUnique({
    where: { id: sourceQuoteId },
    select: { id: true },
  });

  if (!sourceQuote) {
    throw notFound("Quote not found");
  }

  const existingInvoice = await tx.invoice.findUnique({
    where: { sourceQuoteId },
    select: { id: true },
  });

  if (existingInvoice) {
    throw conflict("An invoice already exists for this quote");
  }
}

export async function createInvoice(input: InvoiceUpsertInput) {
  const { normalizedItems, subtotal, tax, total } = createInvoiceTotals(input.items);
  const nextStatus = input.status ?? "DRAFT";
  const paidAt =
    nextStatus === "PAID"
      ? input.paidAt
        ? new Date(input.paidAt)
        : new Date()
      : null;

  const invoice = await prisma.$transaction(async (tx) => {
    if (input.sourceQuoteId) {
      await assertSourceQuoteAvailability(input.sourceQuoteId, tx);
    }

    await assertInvoiceCustomerExists(input.customerId, tx);
    const number = await reserveDocumentNumber("INV", { tx });

    return tx.invoice.create({
      data: {
        number,
        status: nextStatus,
        customerId: input.customerId,
        issueDate: input.issueDate ? new Date(input.issueDate) : new Date(),
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        currency: input.currency ?? "EUR",
        customerReference: input.customerReference || null,
        projectReference: input.projectReference || null,
        serviceReference: input.serviceReference || null,
        serviceDate: input.serviceDate ? new Date(input.serviceDate) : null,
        serviceType: input.serviceType ?? "INTERVENTION",
        deliveryMode: input.deliveryMode ?? "ONSITE",
        notes: input.notes || null,
        subtotal,
        tax,
        total,
        sourceQuoteId: input.sourceQuoteId || null,
        paidAt,
        paymentMethod: input.paymentMethod || null,
        paymentRef: input.paymentRef || null,
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

  return invoice;
}

export async function createInvoiceFromQuote(
  quoteId: string,
  options?: { paymentTermsDays?: number | null }
) {
  const paymentTermsDays = normalizePaymentTermsDays(options?.paymentTermsDays);

  return prisma.$transaction(async (tx) => {
    const existingInvoice = await tx.invoice.findUnique({
      where: { sourceQuoteId: quoteId },
      select: { id: true },
    });

    if (existingInvoice) {
      return { invoiceId: existingInvoice.id, created: false as const };
    }

    const quote = await tx.quote.findUnique({
      where: { id: quoteId },
      include: {
        items: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!quote) {
      throw notFound("Quote not found");
    }

    const issueDate = new Date();
    const dueDate = addDays(issueDate, paymentTermsDays);
    const { normalizedItems, subtotal, tax, total } = createInvoiceTotals(
      quote.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    );
    const number = await reserveDocumentNumber("INV", { tx });

    const invoice = await tx.invoice.create({
      data: {
        number,
        status: "DRAFT",
        customerId: quote.customerId,
        sourceQuoteId: quote.id,
        issueDate,
        dueDate,
        currency: "EUR",
        serviceDate: quote.serviceDate,
        serviceType: quote.serviceType,
        deliveryMode: quote.deliveryMode,
        notes: quote.notes,
        subtotal,
        tax,
        total,
        items: {
          create: normalizedItems,
        },
      },
      select: { id: true },
    });

    await rememberItemTemplates(normalizedItems).catch(() => undefined);

    return { invoiceId: invoice.id, created: true as const };
  });
}

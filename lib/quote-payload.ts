import { z } from "zod";

export const quoteStatusSchema = z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED"]);

export const quoteItemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
});

export const quoteUpsertSchema = z.object({
  customerId: z.string().trim().min(1),
  issueDate: z.string().datetime().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  status: quoteStatusSchema.optional(),
  items: z.array(quoteItemSchema).min(1),
});

export type QuoteItemInput = z.infer<typeof quoteItemSchema>;

export function createQuoteTotals(items: QuoteItemInput[]) {
  const normalizedItems = items.map((item, index) => {
    const lineTotal = item.quantity * item.unitPrice;

    return {
      ...item,
      lineTotal,
      position: index,
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    normalizedItems,
    subtotal,
    tax: 0,
    total: subtotal,
  };
}

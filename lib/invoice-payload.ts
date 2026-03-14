import { z } from "zod";

export const invoiceStatusSchema = z.enum(["DRAFT", "SENT", "PAID", "CANCELLED"]);

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
});

export const invoiceUpsertSchema = z.object({
  customerId: z.string().trim().min(1),
  sourceQuoteId: z.string().trim().min(1).nullable().optional(),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  currency: z.string().trim().min(1).optional(),
  customerReference: z.string().trim().nullable().optional(),
  projectReference: z.string().trim().nullable().optional(),
  serviceReference: z.string().trim().nullable().optional(),
  serviceDate: z.string().datetime().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  status: invoiceStatusSchema.optional(),
  serviceType: z
    .enum(["INTERVENTION", "FORMATION", "AUDIT", "CONSEIL"])
    .optional(),
  deliveryMode: z.enum(["ONSITE", "REMOTE"]).optional(),
  paidAt: z.string().datetime().nullable().optional(),
  paymentMethod: z.string().trim().nullable().optional(),
  paymentRef: z.string().trim().nullable().optional(),
  items: z.array(invoiceItemSchema).min(1),
});

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;

export function createInvoiceTotals(items: InvoiceItemInput[]) {
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

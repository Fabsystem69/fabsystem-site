import { z } from "zod";

export const remiseStatusSchema = z.enum(["DRAFT", "SENT", "APPLIED"]);

export const remiseCreateSchema = z.object({
  customerId: z.string().trim().min(1),
  invoiceId: z.string().trim().min(1).nullable().optional(),
  amount: z.number().int().positive(),
  reason: z.string().trim().nullable().optional(),
  date: z.string().datetime(),
  status: remiseStatusSchema.optional(),
});

export type RemiseCreateInput = z.infer<typeof remiseCreateSchema>;

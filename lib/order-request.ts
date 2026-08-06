import { z } from "zod";
import { badRequest } from "@/lib/http-errors";

export const createOrderRequestSchema = z.object({
  customerEmail: z.string().trim().email(),
  customerName: z.string().trim().min(1).max(120).optional(),
  discountCode: z.string().trim().min(1).max(64).optional(),
});

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

export function parseCreateOrderRequest(input: unknown): CreateOrderRequest {
  const parsed = createOrderRequestSchema.safeParse(input);

  if (!parsed.success) {
    throw badRequest("Invalid order payload", parsed.error.flatten());
  }

  return parsed.data;
}

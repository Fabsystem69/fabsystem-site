import { z } from "zod";
import { badRequest } from "@/lib/http-errors";

export const createCheckoutRequestSchema = z.object({
  orderId: z.string().trim().min(1),
});

export type CreateCheckoutRequest = z.infer<typeof createCheckoutRequestSchema>;

export function parseCreateCheckoutRequest(input: unknown): CreateCheckoutRequest {
  const parsed = createCheckoutRequestSchema.safeParse(input);

  if (!parsed.success) {
    throw badRequest("Invalid checkout payload", parsed.error.flatten());
  }

  return parsed.data;
}

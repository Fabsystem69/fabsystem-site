import { z } from "zod";
import { badRequest } from "@/lib/http-errors";
import { prestationsNeedsAnswersInputSchema } from "@/lib/prestations-needs";

export const createCheckoutRequestSchema = z.object({
  orderId: z.string().trim().min(1),
  needsAnswers: prestationsNeedsAnswersInputSchema,
});

export type CreateCheckoutRequest = z.infer<typeof createCheckoutRequestSchema>;

export function parseCreateCheckoutRequest(input: unknown): CreateCheckoutRequest {
  const parsed = createCheckoutRequestSchema.safeParse(input);

  if (!parsed.success) {
    throw badRequest("Invalid checkout payload", parsed.error.flatten());
  }

  return parsed.data;
}

import { z } from "zod";
import { badRequest } from "@/lib/http-errors";

export const createOrderRequestSchema = z.object({
  // L'identite reelle de la commande vient toujours de la session client
  // cote route (app/api/orders/route.ts), jamais de ce champ — conserve
  // optionnel uniquement pour ne pas casser un appel qui l'enverrait encore.
  customerEmail: z.string().trim().email().optional(),
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

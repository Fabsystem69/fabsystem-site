import { z } from "zod";
import { badRequest } from "@/lib/http-errors";

const MIN_FORM_FILL_MS = 1500;

const optionalText = z
  .string()
  .trim()
  .max(160)
  .optional()
  .nullable()
  .transform((value) => (value && value.length > 0 ? value : null));

const publicTestimonialSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  customerType: z.enum(["VAN", "CAMPING_CAR", "BOAT", "OTHER"]),
  vehicleModel: optionalText,
  region: optionalText,
  rating: z.coerce.number().int().min(1).max(5),
  quote: z.string().trim().min(20).max(2000),
  relatedOffer: optionalText,
  company: z
    .string()
    .optional()
    .transform((value) => (value ? value.trim() : "")),
  startedAt: z.coerce.number().int().positive(),
});

export type PublicTestimonialRequest = z.infer<typeof publicTestimonialSchema>;

export function assertPublicTestimonialHumanDelay(startedAt: number) {
  const elapsedMs = Date.now() - startedAt;

  if (elapsedMs < MIN_FORM_FILL_MS) {
    throw badRequest("Form submitted too quickly", {
      elapsedMs,
      minMs: MIN_FORM_FILL_MS,
    });
  }
}

export function parsePublicTestimonialPayload(payload: unknown) {
  const parsed = publicTestimonialSchema.safeParse(payload);

  if (!parsed.success) {
    throw badRequest("Invalid testimonial payload", parsed.error.flatten());
  }

  return parsed.data;
}

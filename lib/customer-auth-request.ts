import { z } from "zod";
import { badRequest } from "@/lib/http-errors";

export const customerAuthRequestLinkSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(120).optional(),
});

export type CustomerAuthRequestLinkInput = z.infer<typeof customerAuthRequestLinkSchema>;

export function parseCustomerAuthRequestLink(input: unknown): CustomerAuthRequestLinkInput {
  const parsed = customerAuthRequestLinkSchema.safeParse(input);

  if (!parsed.success) {
    throw badRequest("Invalid customer auth payload", parsed.error.flatten());
  }

  return parsed.data;
}

export function buildCustomerAuthRequestLinkResponse(
  result: { magicLink?: string },
  runtimeEnvironment = process.env.NODE_ENV
) {
  const response: {
    ok: true;
    message: string;
    magicLink?: string;
  } = {
    ok: true,
    message:
      "Si cette adresse peut accéder à un espace client, un lien de connexion sera envoyé.",
  };

  if (runtimeEnvironment !== "production" && result.magicLink) {
    response.magicLink = result.magicLink;
  }

  return response;
}

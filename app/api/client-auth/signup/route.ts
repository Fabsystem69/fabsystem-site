import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest } from "@/lib/http-errors";
import { toErrorResponse } from "@/lib/server/error-response";
import { createRateLimitKeyPart, enforceRateLimit } from "@/lib/rate-limit";
import {
  CUSTOMER_SESSION_COOKIE_NAME,
  getCustomerSessionCookieOptions,
} from "@/lib/server/customer-session";
import { signUpCustomer } from "@/lib/services/customer-signup";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  // Retour utilisateur : "on va obliger à mettre nom et prénom à
  // l'inscription" — remplace l'ancien `name` optionnel jamais rempli en
  // pratique.
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  marketingConsent: z.literal(true),
});

export async function POST(request: Request) {
  try {
    // Limite par IP (contrairement au login, il n'y a pas encore d'email
    // "cible" à cibler pour la clé) — une inscription reste une écriture
    // en base, pas juste une lecture, donc un plafond plus strict que la
    // plupart des routes publiques.
    await enforceRateLimit(request, {
      name: "client-auth-signup",
      limit: 8,
      windowMs: 60 * 60 * 1000,
      blockDurationMs: 60 * 60 * 1000,
    });

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      throw badRequest("Invalid signup request");
    }

    // Clé secondaire par email : bloque aussi un bruteforce ciblé sur une
    // seule adresse (essayer de deviner si un compte existe en boucle).
    await enforceRateLimit(request, {
      name: "client-auth-signup-email",
      limit: 5,
      windowMs: 60 * 60 * 1000,
      blockDurationMs: 60 * 60 * 1000,
      keyParts: [createRateLimitKeyPart(parsed.data.email)],
    });

    const result = await signUpCustomer(parsed.data);

    if (result.status === "email_taken") {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email — connectez-vous plutôt.", status: result.status },
        { status: 409 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, result.sessionToken, {
      ...getCustomerSessionCookieOptions(),
    });

    return response;
  } catch (error) {
    return toErrorResponse(error, "api.client-auth.signup.post");
  }
}

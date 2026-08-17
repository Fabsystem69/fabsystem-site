import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, toErrorResponse } from "@/lib/http-errors";
import { createRateLimitKeyPart, enforceRateLimit } from "@/lib/rate-limit";
import {
  CUSTOMER_SESSION_COOKIE_NAME,
  getCustomerSessionCookieOptions,
} from "@/lib/server/customer-session";
import { loginWithPassword } from "@/lib/services/customer-password-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      throw badRequest("Invalid login request");
    }

    // Cle par email (comme client-auth-request-link) : un attaquant qui
    // bruteforce un mot de passe contre un seul compte est bloque
    // independamment du reste du trafic.
    await enforceRateLimit(request, {
      name: "client-auth-login",
      limit: 5,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
      keyParts: [createRateLimitKeyPart(parsed.data.email)],
    });

    const result = await loginWithPassword(parsed.data.email, parsed.data.password);

    if (result.status !== "ok") {
      // Meme message pour "compte inexistant", "mauvais mot de passe" et
      // "pas encore de mot de passe defini" : ne jamais reveler laquelle de
      // ces situations s'applique (anti-enumeration).
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, result.sessionToken, {
      ...getCustomerSessionCookieOptions(),
    });

    return response;
  } catch (error) {
    return toErrorResponse(error, "api.client-auth.login.post");
  }
}

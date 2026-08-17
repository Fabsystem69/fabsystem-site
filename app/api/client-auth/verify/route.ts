import { NextResponse } from "next/server";
import {
  CUSTOMER_SESSION_COOKIE_NAME,
  getCustomerSessionCookieOptions,
} from "@/lib/server/customer-session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { consumeMagicLoginToken } from "@/lib/services/customer-auth";

export const dynamic = "force-dynamic";

const INVALID_TOKEN_REDIRECT_PATH = "/connexion-client?error=invalid_token";
// v2.1 : le lien magique ne sert plus qu'a definir/reinitialiser le mot de
// passe (retour utilisateur : email+mdp remplace le lien magique comme mode
// de connexion habituel) — atterrit donc toujours ici, jamais directement
// sur /mon-compte.
const SUCCESS_REDIRECT_PATH = "/mon-compte/definir-mot-de-passe";

function buildRedirect(request: Request, path: string) {
  return new URL(path, request.url);
}

export async function GET(request: Request) {
  await enforceRateLimit(request, {
    name: "client-auth-verify",
    limit: 10,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 30 * 60 * 1000,
  });

  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    const response = NextResponse.redirect(
      buildRedirect(request, INVALID_TOKEN_REDIRECT_PATH)
    );
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, "", {
      ...getCustomerSessionCookieOptions(),
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  }

  try {
    const result = await consumeMagicLoginToken({ token });
    const response = NextResponse.redirect(buildRedirect(request, SUCCESS_REDIRECT_PATH));
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, result.sessionToken, {
      ...getCustomerSessionCookieOptions(),
    });

    return response;
  } catch {
    const response = NextResponse.redirect(
      buildRedirect(request, INVALID_TOKEN_REDIRECT_PATH)
    );
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, "", {
      ...getCustomerSessionCookieOptions(),
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  }
}

import { NextResponse } from "next/server";
import {
  CUSTOMER_SESSION_COOKIE_NAME,
  getCustomerSessionCookieOptions,
} from "@/lib/server/customer-session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { consumeMagicLoginToken } from "@/lib/services/customer-auth";

export const dynamic = "force-dynamic";

const INVALID_TOKEN_REDIRECT_PATH = "/connexion-client?error=invalid_token";
const SUCCESS_REDIRECT_PATH = "/mon-compte";

function buildRedirect(request: Request, path: string) {
  return new URL(path, request.url);
}

export async function GET(request: Request) {
  enforceRateLimit(request, {
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

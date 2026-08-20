import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  base64UrlToBytes,
  decodeUtf8Base64Url,
  splitSignedToken,
} from "@/lib/session-token";

const SESSION_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "fabsystem_session";
const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";

async function isValidSession(
  token: string,
  options?: { onReject?: (reason: string) => void }
): Promise<boolean> {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    options?.onReject?.("missing-secret");
    return false;
  }

  const parts = splitSignedToken(token);
  if (!parts) {
    options?.onReject?.("malformed-token");
    return false;
  }
  const { body, signature } = parts;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signature),
      enc.encode(body)
    );
    if (!valid) {
      options?.onReject?.("bad-signature");
      return false;
    }

    const payload = JSON.parse(decodeUtf8Base64Url(body)) as { exp?: number };
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number") {
      options?.onReject?.("missing-exp");
      return false;
    }

    if (payload.exp <= now) {
      options?.onReject?.("expired");
      return false;
    }

    return true;
  } catch {
    options?.onReject?.("invalid-payload");
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    let rejectReason = "missing-cookie";
    const hasCookie = Boolean(token);
    const isValid = token
      ? await isValidSession(token, {
          onReject(reason) {
            rejectReason = reason;
          },
        })
      : false;

    if (IS_DEVELOPMENT) {
      console.info(
        JSON.stringify({
          scope: "admin-middleware",
          pathname,
          cookieName: SESSION_COOKIE_NAME,
          hasCookie,
          secureMode: process.env.NODE_ENV === "production",
          sessionValid: isValid,
          rejectReason: isValid ? null : rejectReason,
        })
      );
    }

    if (!isValid) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

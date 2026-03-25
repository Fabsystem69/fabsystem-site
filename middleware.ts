import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "fabsystem_session";

function b64urlToBuffer(s: string): ArrayBuffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const binary = atob(s);
  const buf = new ArrayBuffer(binary.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return buf;
}

async function isValidSession(token: string): Promise<boolean> {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [body, sig] = parts;

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
      b64urlToBuffer(sig),
      enc.encode(body)
    );
    if (!valid) return false;

    const payload = JSON.parse(
      new TextDecoder().decode(b64urlToBuffer(body))
    ) as { exp?: number };
    const now = Math.floor(Date.now() / 1000);
    return typeof payload.exp === "number" && payload.exp > now;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token || !(await isValidSession(token))) {
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

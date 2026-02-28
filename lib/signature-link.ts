import crypto from "node:crypto";

export const SIGNATURE_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function generateSignatureToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSignatureToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createSignatureExpiry() {
  return new Date(Date.now() + SIGNATURE_TOKEN_TTL_MS);
}

export function buildBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const origin = request.headers.get("origin");
  if (origin) {
    return origin.replace(/\/+$/, "");
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");

  if (!host) {
    return "http://localhost:3000";
  }

  return `${proto}://${host}`;
}

export function isSignatureTokenExpired(date: Date | null | undefined) {
  return !date || date.getTime() <= Date.now();
}

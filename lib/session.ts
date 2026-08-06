import crypto from "crypto";
import {
  base64UrlToBytes,
  bytesToBase64Url,
  decodeUtf8Base64Url,
  encodeUtf8Base64Url,
  splitSignedToken,
} from "@/lib/session-token";

export type SessionPayload = {
  sub: string; // email
  role?: "admin";
  iat: number; // issued at (sec)
  exp: number; // expiry (sec)
};

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
export const SESSION_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME ?? "fabsystem_session";

function hmac(data: string, secret: string) {
  return bytesToBase64Url(crypto.createHmac("sha256", secret).update(data).digest());
}

export function signSession<T extends { exp: number }>(payload: T, secret: string) {
  const body = encodeUtf8Base64Url(JSON.stringify(payload));
  const sig = hmac(body, secret);
  return `${body}.${sig}`;
}

export type SessionRejectReason = "malformed" | "bad-signature" | "expired" | "invalid-payload";

export function verifySession<T extends { exp: number } = SessionPayload>(
  token: string,
  secret: string,
  options?: { onReject?: (reason: SessionRejectReason) => void }
): T | null {
  const parts = splitSignedToken(token);
  if (!parts) {
    options?.onReject?.("malformed");
    return null;
  }
  const { body, signature } = parts;
  const expected = hmac(body, secret);
  // timing-safe compare
  const a = Buffer.from(base64UrlToBytes(signature));
  const b = Buffer.from(base64UrlToBytes(expected));
  if (a.length !== b.length) {
    options?.onReject?.("bad-signature");
    return null;
  }
  if (!crypto.timingSafeEqual(a, b)) {
    options?.onReject?.("bad-signature");
    return null;
  }

  try {
    const payload = JSON.parse(decodeUtf8Base64Url(body)) as T;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      options?.onReject?.("expired");
      return null;
    }
    return payload;
  } catch {
    options?.onReject?.("invalid-payload");
    return null;
  }
}

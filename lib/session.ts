import crypto from "crypto";

export type SessionPayload = {
  sub: string; // email
  role?: "admin";
  iat: number; // issued at (sec)
  exp: number; // expiry (sec)
};

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
export const SESSION_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME ?? "fabsystem_session";

const enc = (buf: Buffer) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const dec = (s: string) => {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
};

function hmac(data: string, secret: string) {
  return enc(crypto.createHmac("sha256", secret).update(data).digest());
}

export function signSession(payload: SessionPayload, secret: string) {
  const body = enc(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = hmac(body, secret);
  return `${body}.${sig}`;
}

export function verifySession(token: string, secret: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = hmac(body, secret);
  // timing-safe compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(dec(body).toString("utf8")) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

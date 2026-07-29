import "server-only";
import { signSession, verifySession } from "@/lib/session";
import { logServerEvent } from "@/lib/server-log";

export type EbookTokenPayload = {
  sub: string; // orderId
  email: string;
  iat: number;
  exp: number;
};

export const EBOOK_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 72; // 72 heures

function getSecret() {
  const secret = process.env.EBOOK_ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error("Missing EBOOK_ACCESS_TOKEN_SECRET");
  return secret;
}

export function signEbookToken(orderId: string, email: string) {
  const now = Math.floor(Date.now() / 1000);
  return signSession<EbookTokenPayload>(
    { sub: orderId, email, iat: now, exp: now + EBOOK_TOKEN_MAX_AGE_SECONDS },
    getSecret()
  );
}

export function verifyEbookToken(token: string): EbookTokenPayload | null {
  const payload = verifySession<EbookTokenPayload>(token, getSecret(), {
    onReject: (reason) => {
      logServerEvent("warn", "ebook token rejected", {
        reason,
        tokenLength: token.length,
      });
    },
  });
  return payload;
}

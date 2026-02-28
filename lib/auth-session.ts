import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySession,
} from "@/lib/session";

function getSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) throw new Error("Missing AUTH_SESSION_SECRET");
  return secret;
}

export async function setSession() {
  const now = Math.floor(Date.now() / 1000);
  const token = signSession(
    { sub: "admin", role: "admin", iat: now, exp: now + SESSION_MAX_AGE_SECONDS },
    getSecret()
  );
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
}

export async function isAuthedFromRequestCookie(cookieValue?: string) {
  if (!cookieValue) return false;
  return Boolean(verifySession(cookieValue, getSecret()));
}

export async function isAuthedServer() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return isAuthedFromRequestCookie(token);
}

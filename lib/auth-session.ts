import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "fabsystem_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

export async function setSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function clearSession() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
}

export async function isAuthedFromRequestCookie(cookieValue?: string) {
  if (!cookieValue) return false;
  try {
    await jwtVerify(cookieValue, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function isAuthedServer() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return isAuthedFromRequestCookie(token);
}
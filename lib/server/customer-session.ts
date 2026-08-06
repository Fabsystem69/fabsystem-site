import "server-only";

import { cookies } from "next/headers";
import { isHttpError } from "@/lib/http-errors";
import {
  CUSTOMER_SESSION_COOKIE_NAME,
  getCustomerSessionCookieOptions,
} from "@/lib/customer-session-cookie";
import { getCustomerSession } from "@/lib/services/customer-auth";

export {
  CUSTOMER_SESSION_COOKIE_MAX_AGE_SECONDS,
  CUSTOMER_SESSION_COOKIE_NAME,
  getCustomerSessionCookieOptions,
} from "@/lib/customer-session-cookie";

export async function setCustomerSessionCookie(sessionToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    CUSTOMER_SESSION_COOKIE_NAME,
    sessionToken,
    getCustomerSessionCookieOptions()
  );
}

export async function clearCustomerSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE_NAME, "", {
    ...getCustomerSessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function getCustomerSessionTokenFromCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getCustomerSessionFromCookie() {
  const sessionToken = await getCustomerSessionTokenFromCookie();

  if (!sessionToken) {
    return null;
  }

  try {
    return await getCustomerSession(sessionToken);
  } catch (error) {
    if (isHttpError(error) && (error.status === 404 || error.status === 409)) {
      return null;
    }

    throw error;
  }
}

import "server-only";

import { cookies } from "next/headers";
import { isHttpError } from "@/lib/http-errors";
import {
  CUSTOMER_SESSION_COOKIE_NAME,
  getCustomerSessionCookieOptions,
} from "@/lib/customer-session-cookie";
import { getCustomerSession } from "@/lib/services/customer-auth";
import { logServerEvent } from "@/lib/server-log";

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

    // Une session invalide/expirée est un état normal (géré ci-dessus via
    // isHttpError). Une erreur infra/DB inattendue ici (ex. dérive de
    // schéma) ne doit jamais faire planter une page publique qui ne fait
    // que vérifier "le visiteur est-il connecté ?" — on dégrade en visiteur
    // anonyme et on journalise pour ne pas masquer le problème réel.
    logServerEvent("error", "customer session lookup failed unexpectedly", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

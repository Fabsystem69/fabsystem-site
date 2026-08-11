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

// Résolution stricte : un `null` signifie explicitement "pas de session
// valide" (pas de cookie, ou session introuvable/expirée/révoquée — les
// seuls cas couverts par isHttpError 404/409, des états normaux). Toute
// autre erreur (infra/DB inattendue) est propagée : les appelants qui
// utilisent ce `null` pour décider d'un accès (redirection login, 401,
// /mon-compte, requireCustomerActor) ne doivent jamais confondre une panne
// réelle avec une simple déconnexion — sinon un client réellement connecté
// se ferait déconnecter silencieusement pendant un incident infra, ce qui
// masque le vrai problème au lieu de le signaler.
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

// Variante pour les pages publiques où la session ne sert qu'à une
// personnalisation facultative (ex. "Déjà dans votre bibliothèque" sur
// /boutique) : la page reste utilisable sans session, donc une erreur de
// résolution — normale (pas de session) ou infra inattendue — dégrade
// toujours vers "visiteur anonyme" plutôt que de faire planter toute la
// page. L'erreur inattendue est journalisée pour ne pas être masquée en
// silence. Ne jamais utiliser cette variante pour décider d'un accès
// (une page qui exige une session doit utiliser getCustomerSessionFromCookie
// ci-dessus, qui propage les pannes réelles).
export async function getCustomerSessionFromCookieOrAnonymous() {
  try {
    return await getCustomerSessionFromCookie();
  } catch (error) {
    logServerEvent("error", "customer session lookup failed unexpectedly", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

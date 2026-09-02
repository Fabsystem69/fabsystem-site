import "server-only";

import { unauthorized } from "@/lib/http-errors";
import type { OwnershipActor } from "@/lib/ownership";
import { getSessionFromCookies } from "@/lib/require-session";
import { getCustomerSessionFromCookie } from "@/lib/server/customer-session";
import { setRequestCustomerId } from "@/lib/server/request-context";

// Résout l'acteur (Phase 2 : OwnershipActor) à partir de la session client
// existante — aucune nouvelle mécanique d'authentification introduite.
export async function requireCustomerActor(): Promise<OwnershipActor> {
  const session = await getCustomerSessionFromCookie();

  if (!session) {
    throw unauthorized("Customer session not found");
  }

  // Retour utilisateur : "remontées d'erreur avec l'id du client" — posé ici
  // (point de passage commun à toutes les routes authentifiées) plutôt que
  // dans chaque route, pour que `toErrorResponse` le retrouve automatiquement
  // si une erreur survient plus loin dans le traitement.
  setRequestCustomerId(session.customer.id);

  return { role: "customer", customerId: session.customer.id };
}

export function adminActor(): OwnershipActor {
  return { role: "admin" };
}

// Les routes de schéma sont communes à l'espace client et au dashboard : le
// projet reste toujours protégé par son ownership côté service, mais un admin
// authentifié peut l'ouvrir depuis la fiche du client pour l'accompagnement.
export async function requireProjectActor(): Promise<OwnershipActor> {
  const customerSession = await getCustomerSessionFromCookie();
  if (customerSession) {
    setRequestCustomerId(customerSession.customer.id);
    return { role: "customer", customerId: customerSession.customer.id };
  }

  const adminSession = await getSessionFromCookies();
  if (adminSession) {
    return adminActor();
  }

  throw unauthorized("Customer or admin session not found");
}

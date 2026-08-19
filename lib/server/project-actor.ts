import "server-only";

import { unauthorized } from "@/lib/http-errors";
import type { OwnershipActor } from "@/lib/ownership";
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

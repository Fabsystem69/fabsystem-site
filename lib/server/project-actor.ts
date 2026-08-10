import "server-only";

import { unauthorized } from "@/lib/http-errors";
import type { OwnershipActor } from "@/lib/ownership";
import { getCustomerSessionFromCookie } from "@/lib/server/customer-session";

// Résout l'acteur (Phase 2 : OwnershipActor) à partir de la session client
// existante — aucune nouvelle mécanique d'authentification introduite.
export async function requireCustomerActor(): Promise<OwnershipActor> {
  const session = await getCustomerSessionFromCookie();

  if (!session) {
    throw unauthorized("Customer session not found");
  }

  return { role: "customer", customerId: session.customer.id };
}

export function adminActor(): OwnershipActor {
  return { role: "admin" };
}

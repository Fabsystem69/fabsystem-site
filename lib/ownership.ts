import { forbidden } from "@/lib/http-errors";

// Couche 2 (MASTER-11) : helpers génériques de propriété/accès, préparés
// pour être branchés sur Project plus tard (MASTER-10 §40, §83 : ownership
// serveur, un identifiant seul n'accorde jamais un accès). Aucune dépendance
// à Project aujourd'hui : ce module compare uniquement des identifiants.

export type OwnershipActor =
  | { role: "customer"; customerId: string }
  | { role: "admin" };

export function isAdminActor(actor: OwnershipActor): boolean {
  return actor.role === "admin";
}

export function isResourceOwner(
  actor: OwnershipActor,
  resourceOwnerCustomerId: string
): boolean {
  return actor.role === "customer" && actor.customerId === resourceOwnerCustomerId;
}

/** Un Admin ou le propriétaire réel de la ressource peuvent y accéder. */
export function canAccessOwnedResource(
  actor: OwnershipActor,
  resourceOwnerCustomerId: string
): boolean {
  return isAdminActor(actor) || isResourceOwner(actor, resourceOwnerCustomerId);
}

/** Lève une erreur 403 si l'acteur n'est ni Admin ni propriétaire. */
export function requireOwnerOrAdmin(
  actor: OwnershipActor,
  resourceOwnerCustomerId: string
): void {
  if (!canAccessOwnedResource(actor, resourceOwnerCustomerId)) {
    throw forbidden("Access denied");
  }
}

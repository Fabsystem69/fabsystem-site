import "server-only";

// Surface de consommation officielle pour les futurs modules. La logique
// testable vit dans lib/ownership.ts (sans "server-only").
export {
  canAccessOwnedResource,
  isAdminActor,
  isResourceOwner,
  requireOwnerOrAdmin,
} from "@/lib/ownership";

export type { OwnershipActor } from "@/lib/ownership";

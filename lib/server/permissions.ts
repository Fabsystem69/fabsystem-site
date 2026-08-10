import "server-only";

// Surface de consommation officielle pour les futurs modules (Project,
// Volta, Accompagnement...). La logique testable vit dans lib/entitlements.ts
// (sans "server-only", comme lib/supabase-storage.ts / lib/cart-session.ts).
export {
  getCustomerCapabilities,
  getCustomerEntitlements,
  hasCapability,
  requireCapability,
} from "@/lib/entitlements";

export type {
  ActiveEntitlement,
  HasCapabilityOptions,
} from "@/lib/entitlements";

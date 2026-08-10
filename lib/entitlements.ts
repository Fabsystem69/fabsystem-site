import type { CapabilityScope, CustomerCapability } from "@/lib/generated/prisma/client";
import { forbidden } from "@/lib/http-errors";
import { listCustomerCapabilities } from "@/lib/services/capabilities";

// Couche 2 (MASTER-11) : moteur de calcul des droits actifs ("entitlements")
// à partir des droits bruts attribués ("capabilities"). Aucune interface,
// aucun écran : uniquement le moteur et les helpers serveur réutilisables.
//
// Un entitlement actif = une capability dont le statut est ACTIVE, la
// fenêtre [startsAt, expiresAt) couvre l'instant `now`, et qui n'a pas été
// révoquée. Ce module ne connaît ni Product, ni Stripe, ni Project.

export type ActiveEntitlement = {
  id: string;
  capability: string;
  scope: CapabilityScope;
  scopeId: string | null;
  source: string | null;
  startsAt: Date;
  expiresAt: Date | null;
};

export type HasCapabilityOptions = {
  scope?: CapabilityScope;
  scopeId?: string | null;
  now?: Date;
};

type EntitlementsDeps = {
  listCustomerCapabilities?: (customerId: string) => Promise<CustomerCapability[]>;
};

function isCapabilityCurrentlyActive(capability: CustomerCapability, now: Date) {
  if (capability.status !== "ACTIVE") {
    return false;
  }

  if (capability.startsAt > now) {
    return false;
  }

  if (capability.expiresAt && capability.expiresAt <= now) {
    return false;
  }

  return true;
}

function toActiveEntitlement(capability: CustomerCapability): ActiveEntitlement {
  return {
    id: capability.id,
    capability: capability.capability,
    scope: capability.scope,
    scopeId: capability.scopeId,
    source: capability.source,
    startsAt: capability.startsAt,
    expiresAt: capability.expiresAt,
  };
}

/**
 * Fonction pure : dérive les entitlements actuellement actifs à partir d'une
 * liste de capabilities brutes déjà chargées. Ne touche jamais la base.
 */
export function computeActiveEntitlements(
  capabilities: CustomerCapability[],
  now: Date = new Date()
): ActiveEntitlement[] {
  return capabilities
    .filter((capability) => isCapabilityCurrentlyActive(capability, now))
    .map(toActiveEntitlement);
}

function entitlementMatches(
  entitlement: ActiveEntitlement,
  capability: string,
  options: HasCapabilityOptions
) {
  if (entitlement.capability !== capability) {
    return false;
  }

  if (options.scope && entitlement.scope !== options.scope) {
    return false;
  }

  if (typeof options.scopeId !== "undefined" && entitlement.scopeId !== options.scopeId) {
    return false;
  }

  return true;
}

/**
 * Fabrique testable (même convention que createCustomerAuthService,
 * createDownloadAccessService...) : injecte la source des capabilities
 * brutes pour permettre des tests unitaires sans base de données.
 */
export function createEntitlementsService(deps?: EntitlementsDeps) {
  const listCapabilities = deps?.listCustomerCapabilities ?? listCustomerCapabilities;

  async function getCustomerCapabilities(customerId: string): Promise<CustomerCapability[]> {
    return listCapabilities(customerId);
  }

  async function getCustomerEntitlements(
    customerId: string,
    now: Date = new Date()
  ): Promise<ActiveEntitlement[]> {
    const capabilities = await listCapabilities(customerId);
    return computeActiveEntitlements(capabilities, now);
  }

  async function hasCapability(
    customerId: string,
    capability: string,
    options: HasCapabilityOptions = {}
  ): Promise<boolean> {
    const entitlements = await getCustomerEntitlements(customerId, options.now);
    return entitlements.some((entitlement) => entitlementMatches(entitlement, capability, options));
  }

  async function requireCapability(
    customerId: string,
    capability: string,
    options: HasCapabilityOptions = {}
  ): Promise<void> {
    const granted = await hasCapability(customerId, capability, options);

    if (!granted) {
      throw forbidden(`Missing capability: ${capability}`);
    }
  }

  return {
    getCustomerCapabilities,
    getCustomerEntitlements,
    hasCapability,
    requireCapability,
  };
}

const defaultEntitlementsService = createEntitlementsService();

/** Helper serveur : liste brute de toutes les capabilities d'un Customer
 * (actives, expirées ou révoquées) — pour audit/administration. */
export const getCustomerCapabilities = defaultEntitlementsService.getCustomerCapabilities;

/** Helper serveur : entitlements actifs d'un Customer à l'instant `now`. */
export const getCustomerEntitlements = defaultEntitlementsService.getCustomerEntitlements;

/** Helper serveur : la capacité demandée est-elle active pour ce Customer ? */
export const hasCapability = defaultEntitlementsService.hasCapability;

/** Helper serveur : lève une erreur 403 si la capacité n'est pas active. */
export const requireCapability = defaultEntitlementsService.requireCapability;

import type {
  CapabilityScope,
  CustomerCapability,
  CustomerCapabilityStatus,
  PrismaClient,
} from "@/lib/generated/prisma/client";
import { badRequest, notFound } from "@/lib/http-errors";

type PrismaClientLike = PrismaClient;

// Couche 2 (MASTER-11) : gestion brute des droits attribués à un Customer.
// Générique et indépendante des produits, de Stripe et de Project — voir
// MASTER-00 §9 et MASTER-10 §44. `capability` est un identifiant fonctionnel
// libre : ce module ne fige aucune liste de capacités métier définitive.

export type GrantCapabilityInput = {
  customerId: string;
  capability: string;
  scope?: CapabilityScope;
  scopeId?: string | null;
  source?: string | null;
  startsAt?: Date;
  expiresAt?: Date | null;
};

export type CapabilitiesDb = {
  createCapability(data: {
    customerId: string;
    capability: string;
    scope: CapabilityScope;
    scopeId: string | null;
    source: string | null;
    startsAt: Date;
    expiresAt: Date | null;
  }): Promise<CustomerCapability>;
  findCapabilityById(id: string): Promise<CustomerCapability | null>;
  updateCapabilityStatus(
    id: string,
    data: { status: CustomerCapabilityStatus; revokedAt: Date | null }
  ): Promise<CustomerCapability>;
  listCapabilitiesByCustomerId(customerId: string): Promise<CustomerCapability[]>;
};

type CapabilitiesDeps = {
  now?: () => Date;
};

function assertNonEmpty(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw badRequest(`${label} is required`);
  }

  return normalized;
}

function createPrismaCapabilitiesDb(client: PrismaClientLike): CapabilitiesDb {
  return {
    async createCapability(data) {
      return client.customerCapability.create({ data });
    },
    async findCapabilityById(id) {
      return client.customerCapability.findUnique({ where: { id } });
    },
    async updateCapabilityStatus(id, data) {
      return client.customerCapability.update({ where: { id }, data });
    },
    async listCapabilitiesByCustomerId(customerId) {
      return client.customerCapability.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
      });
    },
  };
}

async function getDefaultCapabilitiesService() {
  const { prisma } = await import("@/lib/prisma");
  return createCapabilitiesService(createPrismaCapabilitiesDb(prisma));
}

export function createCapabilitiesService(db: CapabilitiesDb, deps?: CapabilitiesDeps) {
  const now = deps?.now ?? (() => new Date());

  return {
    async grantCapability(input: GrantCapabilityInput): Promise<CustomerCapability> {
      const customerId = assertNonEmpty(input.customerId, "Customer id");
      const capability = assertNonEmpty(input.capability, "Capability");

      return db.createCapability({
        customerId,
        capability,
        scope: input.scope ?? "CUSTOMER",
        scopeId: input.scopeId ?? null,
        source: input.source ?? null,
        startsAt: input.startsAt ?? now(),
        expiresAt: input.expiresAt ?? null,
      });
    },

    async revokeCapability(capabilityId: string): Promise<CustomerCapability> {
      const id = assertNonEmpty(capabilityId, "Capability id");
      const capability = await db.findCapabilityById(id);

      if (!capability) {
        throw notFound("Capability not found");
      }

      if (capability.status === "REVOKED") {
        return capability;
      }

      return db.updateCapabilityStatus(id, { status: "REVOKED", revokedAt: now() });
    },

    async listCustomerCapabilities(customerId: string): Promise<CustomerCapability[]> {
      return db.listCapabilitiesByCustomerId(assertNonEmpty(customerId, "Customer id"));
    },
  };
}

export async function grantCapability(input: GrantCapabilityInput) {
  const service = await getDefaultCapabilitiesService();
  return service.grantCapability(input);
}

export async function revokeCapability(capabilityId: string) {
  const service = await getDefaultCapabilitiesService();
  return service.revokeCapability(capabilityId);
}

export async function listCustomerCapabilities(customerId: string) {
  const service = await getDefaultCapabilitiesService();
  return service.listCustomerCapabilities(customerId);
}

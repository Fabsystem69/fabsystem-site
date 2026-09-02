import { forbidden, notFound } from "@/lib/http-errors";
import type { OwnershipActor } from "@/lib/ownership";
import {
  customerProfileInputSchema,
  normalizeCustomerProfileData,
  type CustomerProfileInput,
} from "@/lib/customer-profile-payload";

// Auto-service client sur /mon-compte/profil — jamais de `customerId` pris
// en parametre depuis l'exterieur : on opere toujours sur `actor.customerId`
// (deduit de la session), ce qui rend une modification croisee entre
// comptes structurellement impossible, contrairement a
// lib/services/customers.ts:updateCustomer (Admin, prend un id explicite,
// sans verification d'appartenance — jamais a exposer tel quel cote client,
// voir le commentaire historique dans app/mon-compte/profil/page.tsx).
function requireCustomerId(actor: OwnershipActor) {
  if (actor.role !== "customer") {
    throw forbidden("Only a customer can manage their own profile");
  }

  return actor.customerId;
}

export async function getOwnCustomerProfile(actor: OwnershipActor) {
  const customerId = requireCustomerId(actor);
  const { prisma } = await import("@/lib/prisma");

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });

  if (!customer) {
    throw notFound("Customer not found");
  }

  return customer;
}

export async function updateOwnCustomerProfile(
  actor: OwnershipActor,
  input: CustomerProfileInput
) {
  const customerId = requireCustomerId(actor);
  const parsed = customerProfileInputSchema.parse(input);
  const { prisma } = await import("@/lib/prisma");

  return prisma.customer.update({
    where: { id: customerId },
    data: normalizeCustomerProfileData(parsed),
  });
}

// Consentement distinct et reversible: l'accompagnement ne doit jamais voir
// les projets d'un client par defaut, mais le choix doit etre disponible au
// moment pertinent dans l'editeur, pas cache uniquement dans le profil.
export async function updateOwnProjectSharingConsent(actor: OwnershipActor, enabled: boolean) {
  const customerId = requireCustomerId(actor);
  const { prisma } = await import("@/lib/prisma");

  return prisma.customer.update({
    where: { id: customerId },
    data: {
      dataShareConsent: enabled,
      dataShareConsentAt: enabled ? new Date() : null,
    },
  });
}

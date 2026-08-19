import type { Prisma } from "@/lib/generated/prisma/client";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/http-errors";
import type { OwnershipActor } from "@/lib/ownership";
import { validateCustomItemImageDataUrl } from "@/lib/custom-catalog-image";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";

// Item de catalogue personnalisé (retour utilisateur : "widget de création
// d'item personnalisé si manquant, 10 items max par compte") — un compte ne
// peut jamais en avoir plus de 10 : ce plafond protège autant l'espace de
// stockage (chaque item embarque sa photo en base64) que la lisibilité de
// la bibliothèque personnelle de l'utilisateur.
export const MAX_CUSTOM_ITEMS_PER_CUSTOMER = 10;

export interface CreateCustomCatalogItemInput {
  componentType: string;
  brand: string;
  model: string;
  defaults: Record<string, unknown>;
  imageDataUrl: string;
}

function requireCustomerRole(actor: OwnershipActor): string {
  if (actor.role !== "customer" || !actor.customerId) {
    throw unauthorized("Customer account required");
  }
  return actor.customerId;
}

export async function createCustomCatalogItem(actor: OwnershipActor, input: CreateCustomCatalogItemInput) {
  const customerId = requireCustomerRole(actor);

  const def = getComponentDefinition(input.componentType);
  if (!def) {
    throw badRequest("Unknown component type");
  }

  const brand = input.brand.trim();
  const model = input.model.trim();
  if (!brand || !model) {
    throw badRequest("Brand and model are required");
  }

  validateCustomItemImageDataUrl(input.imageDataUrl);

  const { prisma } = await import("@/lib/prisma");

  const existingCount = await prisma.customCatalogItem.count({ where: { customerId } });
  if (existingCount >= MAX_CUSTOM_ITEMS_PER_CUSTOMER) {
    throw forbidden(`Limite de ${MAX_CUSTOM_ITEMS_PER_CUSTOMER} items personnalisés atteinte`);
  }

  return prisma.customCatalogItem.create({
    data: {
      customerId,
      componentType: input.componentType,
      brand,
      model,
      defaults: input.defaults as Prisma.InputJsonValue,
      imageDataUrl: input.imageDataUrl,
    },
  });
}

export async function listCustomCatalogItemsForCustomer(actor: OwnershipActor) {
  const customerId = requireCustomerRole(actor);
  const { prisma } = await import("@/lib/prisma");
  return prisma.customCatalogItem.findMany({ where: { customerId }, orderBy: { createdAt: "desc" } });
}

export async function deleteCustomCatalogItem(actor: OwnershipActor, id: string) {
  const customerId = requireCustomerRole(actor);
  const { prisma } = await import("@/lib/prisma");

  const item = await prisma.customCatalogItem.findUnique({ where: { id } });
  if (!item) {
    throw notFound("Custom catalog item not found");
  }
  if (item.customerId !== customerId) {
    throw forbidden("Not your custom catalog item");
  }

  await prisma.customCatalogItem.delete({ where: { id } });
}

// Réservé à la page admin (app/dashboard, authentification staff via
// requireSession — pas un OwnershipActor client, voir lib/require-session.ts)
// — retour utilisateur : "avoir accès à tous les items créés pour
// éventuellement les intégrer officiellement dans la bibliothèque".
export async function listAllCustomCatalogItems() {
  const { prisma } = await import("@/lib/prisma");
  return prisma.customCatalogItem.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { email: true, name: true } } },
  });
}

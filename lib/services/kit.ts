import { badRequest, notFound } from "@/lib/http-errors";
import { prisma } from "@/lib/prisma";

// Meme principe simple que lib/services/project-follow-up-review.ts (Prisma
// direct, pas d'interface DB injectable) — un Kit est une entite basse
// volumetrie geree uniquement depuis le dashboard, contrairement au
// catalogue produit (lib/services/catalog.ts) qui a besoin de tests
// unitaires poussés sur des flux d'achat reels.

const PRIORITIES = ["Indispensable", "Option officielle"] as const;

export async function listKits() {
  return prisma.kit.findMany({
    include: { items: true, _count: { select: { projects: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getKitForEdit(kitId: string) {
  const kit = await prisma.kit.findUnique({
    where: { id: kitId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!kit) throw notFound("Kit introuvable.");
  return kit;
}

export async function createKit(input: { name: string }) {
  const name = input.name.trim();
  if (!name) throw badRequest("Le nom du kit est requis.");
  return prisma.kit.create({ data: { name } });
}

export async function updateKit(
  kitId: string,
  input: { name?: string; photoControls?: string[]; powerControls?: string[]; checklist?: string[] }
) {
  const data: { name?: string; photoControls?: string[]; powerControls?: string[]; checklist?: string[] } = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw badRequest("Le nom du kit est requis.");
    data.name = name;
  }
  if (input.photoControls !== undefined) data.photoControls = input.photoControls;
  if (input.powerControls !== undefined) data.powerControls = input.powerControls;
  if (input.checklist !== undefined) data.checklist = input.checklist;

  return prisma.kit.update({ where: { id: kitId }, data });
}

export async function deleteKit(kitId: string) {
  const projectCount = await prisma.project.count({ where: { kitId } });
  if (projectCount > 0) {
    throw badRequest(`Ce kit est assigné à ${projectCount} projet(s) — retirez l'assignation avant de le supprimer.`);
  }
  await prisma.kit.delete({ where: { id: kitId } });
}

export async function addKitItem(
  kitId: string,
  input: { priority: string; block: string; name: string; why: string; budgetCents: number; href: string }
) {
  const priority = input.priority.trim();
  if (!(PRIORITIES as readonly string[]).includes(priority)) throw badRequest("Priorité invalide.");
  const block = input.block.trim();
  const name = input.name.trim();
  const why = input.why.trim();
  const href = input.href.trim();
  if (!block || !name || !why || !href) throw badRequest("Tous les champs de l'article sont requis.");
  if (!Number.isFinite(input.budgetCents) || input.budgetCents < 0) throw badRequest("Budget invalide.");

  const kit = await prisma.kit.findUnique({ where: { id: kitId }, select: { id: true } });
  if (!kit) throw notFound("Kit introuvable.");

  const lastItem = await prisma.kitItem.findFirst({ where: { kitId }, orderBy: { sortOrder: "desc" } });

  return prisma.kitItem.create({
    data: {
      kitId,
      priority,
      block,
      name,
      why,
      budgetCents: input.budgetCents,
      href,
      sortOrder: (lastItem?.sortOrder ?? -1) + 1,
    },
  });
}

export async function deleteKitItem(kitItemId: string) {
  await prisma.kitItem.delete({ where: { id: kitItemId } });
}

export async function setProjectKit(projectId: string, kitId: string | null) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");

  if (kitId) {
    const kit = await prisma.kit.findUnique({ where: { id: kitId }, select: { id: true } });
    if (!kit) throw notFound("Kit introuvable.");
  }

  return prisma.project.update({ where: { id: projectId }, data: { kitId } });
}

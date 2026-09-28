import { badRequest, forbidden, notFound } from "@/lib/http-errors";
import { prisma } from "@/lib/prisma";
import type { CoachingActor } from "@/lib/services/coaching-actor";
import { logCoachingProjectEvent } from "@/lib/services/coaching-project-events";
import type { CoachingDeviceState, CoachingMaterialCategory } from "@/lib/generated/prisma/client";

// Matériel du système électrique (étape 4) — distinct des CoachingDevice
// (appareils consommateurs). Même espace partagé coach/client que la
// phase 1 pour l'inventaire ; les caractéristiques de compatibilité
// (rated*) sont visibles par les deux mais avant tout utiles au coach —
// aucune séparation stricte au niveau service (même pattern que
// CoachingDevice), seule l'UI cliente n'en propose pas la saisie.

export type MaterialFields = {
  category: CoachingMaterialCategory;
  brand?: string | null;
  reference?: string | null;
  quantity: number;
  state?: CoachingDeviceState;
  keepExisting?: boolean | null;
  ratedVoltage?: number | null;
  ratedCurrentA?: number | null;
  ratedPowerW?: number | null;
  capacityAh?: number | null;
  characteristicsNotes?: string | null;
  knownIssues?: string | null;
};

export async function listMaterialsForProject(projectId: string) {
  return prisma.coachingMaterial.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } });
}

export async function createMaterial(input: { projectId: string; actor: CoachingActor } & MaterialFields) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) throw badRequest("Quantité invalide.");

  return prisma.$transaction(async (tx) => {
    const material = await tx.coachingMaterial.create({
      data: {
        projectId: input.projectId,
        category: input.category,
        brand: input.brand?.trim() || null,
        reference: input.reference?.trim() || null,
        quantity: input.quantity,
        state: input.state,
        keepExisting: input.keepExisting ?? null,
        ratedVoltage: input.ratedVoltage,
        ratedCurrentA: input.ratedCurrentA,
        ratedPowerW: input.ratedPowerW,
        capacityAh: input.capacityAh,
        characteristicsNotes: input.characteristicsNotes?.trim() || null,
        knownIssues: input.knownIssues?.trim() || null,
      },
    });
    await tx.coachingProject.update({ where: { id: input.projectId }, data: { derniereActivite: new Date() } });
    await logCoachingProjectEvent(tx, input.projectId, "MATERIAL", input.actor, `Matériel ajouté : ${input.category}`);
    return material;
  });
}

export async function updateMaterial(input: { materialId: string; actor: CoachingActor } & Partial<MaterialFields>) {
  const material = await prisma.coachingMaterial.findUnique({ where: { id: input.materialId }, select: { id: true, projectId: true } });
  if (!material) throw notFound("Matériel introuvable.");
  if (input.quantity !== undefined && (!Number.isInteger(input.quantity) || input.quantity <= 0)) {
    throw badRequest("Quantité invalide.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coachingMaterial.update({
      where: { id: input.materialId },
      data: {
        category: input.category,
        brand: input.brand !== undefined ? input.brand?.trim() || null : undefined,
        reference: input.reference !== undefined ? input.reference?.trim() || null : undefined,
        quantity: input.quantity,
        state: input.state,
        keepExisting: input.keepExisting,
        ratedVoltage: input.ratedVoltage,
        ratedCurrentA: input.ratedCurrentA,
        ratedPowerW: input.ratedPowerW,
        capacityAh: input.capacityAh,
        characteristicsNotes: input.characteristicsNotes !== undefined ? input.characteristicsNotes?.trim() || null : undefined,
        knownIssues: input.knownIssues !== undefined ? input.knownIssues?.trim() || null : undefined,
      },
    });
    await logCoachingProjectEvent(tx, material.projectId, "MATERIAL", input.actor);
    return updated;
  });
}

// projectId revérifié pour la même raison que deleteDevice (ci-dessus,
// coaching-van-dossier.ts) : le formulaire ne prouve la propriété que du
// projectId, jamais du materialId lui-même. Suppression + marqueur "à
// revoir" + événement d'historique forment une seule opération (constat
// d'audit — suppressions non journalisées).
export async function deleteMaterial(materialId: string, projectId: string, actor: CoachingActor) {
  const material = await prisma.coachingMaterial.findUnique({
    where: { id: materialId },
    select: { id: true, projectId: true, category: true, brand: true, reference: true },
  });
  if (!material) throw notFound("Matériel introuvable.");
  if (material.projectId !== projectId) throw forbidden("Ce matériel n'appartient pas à ce projet.");
  const label = [material.category, material.brand, material.reference].filter(Boolean).join(" ");
  return prisma.$transaction(async (tx) => {
    await tx.coachingMaterial.delete({ where: { id: materialId } });
    await tx.coachingProject.update({ where: { id: projectId }, data: { derniereActivite: new Date() } });
    await logCoachingProjectEvent(tx, projectId, "MATERIAL", actor, `Matériel supprimé : ${label}`);
  });
}

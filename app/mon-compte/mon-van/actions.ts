"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { badRequest, forbidden, isHttpError, notFound } from "@/lib/http-errors";
import { projectAssetTypeSchema } from "@/lib/project-payload";
import { requireCustomerActor } from "@/lib/server/project-actor";
import type { OwnershipActor } from "@/lib/ownership";
import { prisma } from "@/lib/prisma";
import {
  createDevice,
  deleteDevice,
  ensureDefaultScenario,
  markProjectReadyForReview,
  updateImplantationInfo,
  updateUsagesInfo,
  updateVehicleInfo,
  upsertDeviceUsage,
} from "@/lib/services/coaching-van-dossier";
import { createMaterial, deleteMaterial } from "@/lib/services/coaching-material";
import {
  addCoachingProjectDocument,
  assertCoachingProjectStorageQuota,
  updateCoachingActionStatusByClient,
} from "@/lib/services/coaching-project";
import { uploadCoachingProjectDocument } from "@/lib/server/coaching-project-storage";
import type {
  ClientLevel,
  CoachingActionStatus,
  CoachingCalcMethod,
  CoachingDevicePhase,
  CoachingDevicePriority,
  CoachingDeviceState,
  CoachingMaterialCategory,
  CoachingPowerSupply,
} from "@/lib/generated/prisma/client";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = getString(formData, key).trim();
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function errorMessage(error: unknown) {
  if (isHttpError(error)) return error.message;
  return error instanceof Error ? error.message : "Une erreur est survenue.";
}

// Un client ne peut agir que sur SES propres projets — jamais un id passé
// en formulaire sans revérification ici (même en confiance sur l'UI).
// requireCustomerActor() ne renvoie en pratique que le rôle "customer", mais
// son type reste l'union OwnershipActor — on le revérifie explicitement.
async function assertOwnedProject(actor: OwnershipActor, projectId: string) {
  if (actor.role !== "customer") throw forbidden("Accès client requis.");
  const project = await prisma.coachingProject.findUnique({ where: { id: projectId }, select: { customerId: true } });
  if (!project) throw notFound("Projet introuvable.");
  if (project.customerId !== actor.customerId) throw forbidden("Ce projet ne vous appartient pas.");
}

export async function updateVehicleInfoAction(formData: FormData) {
  const actor = await requireCustomerActor();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await assertOwnedProject(actor, projectId);
    await updateVehicleInfo({
      projectId,
      actor: { kind: "client" },
      expectedVehicleInfoUpdatedAt: new Date(getString(formData, "expectedVehicleInfoUpdatedAt")),
      fields: {
        assetType: (() => {
          const raw = getString(formData, "assetType").trim();
          if (!raw) return null; // "je ne sais pas encore" — jamais une valeur inventée
          const parsed = projectAssetTypeSchema.safeParse(raw);
          if (!parsed.success) throw badRequest("Support invalide.");
          return parsed.data;
        })(),
        vehicleBrand: getString(formData, "vehicleBrand") || null,
        vehicleModel: getString(formData, "vehicleModel") || null,
        vehicleYear: getString(formData, "vehicleYear") || null,
        vehicleEngine: getString(formData, "vehicleEngine") || null,
        vehicleFormat: getString(formData, "vehicleFormat") || null,
        vehicleDimensions: getString(formData, "vehicleDimensions") || null,
        registrationCountry: getString(formData, "registrationCountry") || null,
        usageCountry: getString(formData, "usageCountry") || null,
        homologationNotes: getString(formData, "homologationNotes") || null,
        projectStage: getString(formData, "projectStage") || null,
        niveauClient: (getString(formData, "niveauClient") || null) as ClientLevel | null,
        whoDoesTheWork: getString(formData, "whoDoesTheWork") || null,
        coachingTopics: getString(formData, "coachingTopics") || null,
        objectifs: getString(formData, "objectifs") || null,
        threePriorities: getString(formData, "threePriorities") || null,
        startDeadline: getString(formData, "startDeadline") || null,
      },
    });
    target = `/mon-compte/mon-van/${projectId}?step=1&success=${encodeURIComponent("Enregistré.")}`;
  } catch (error) {
    target = `/mon-compte/mon-van/${projectId}?step=1&error=${encodeURIComponent(errorMessage(error))}`;
  }
  revalidatePath(`/mon-compte/mon-van/${projectId}`);
  redirect(target);
}

export async function updateUsagesInfoAction(formData: FormData) {
  const actor = await requireCustomerActor();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await assertOwnedProject(actor, projectId);
    await updateUsagesInfo({
      projectId,
      actor: { kind: "client" },
      expectedUsagesUpdatedAt: new Date(getString(formData, "expectedUsagesUpdatedAt")),
      fields: {
        travelerCount: getString(formData, "travelerCount") || null,
        usagePattern: getString(formData, "usagePattern") || null,
        remoteWorkNotes: getString(formData, "remoteWorkNotes") || null,
        seasonsRegionsNotes: getString(formData, "seasonsRegionsNotes") || null,
        parkingExposure: getString(formData, "parkingExposure") || null,
        daysWithoutRecharge: getString(formData, "daysWithoutRecharge") || null,
        minAutonomyNoRecharge: getString(formData, "minAutonomyNoRecharge") || null,
        criticalDevicesWhenLow: getString(formData, "criticalDevicesWhenLow") || null,
        drivingHabits: getString(formData, "drivingHabits") || null,
        shorePowerAvailability: getString(formData, "shorePowerAvailability") || null,
        solarPreference: getString(formData, "solarPreference") || null,
        solarMounting: getString(formData, "solarMounting") || null,
        solarRoofSpaceNotes: getString(formData, "solarRoofSpaceNotes") || null,
        otherEnergySources: getString(formData, "otherEnergySources") || null,
        plannedEquipmentNotes: getString(formData, "plannedEquipmentNotes") || null,
      },
    });
    target = `/mon-compte/mon-van/${projectId}?step=2&success=${encodeURIComponent("Enregistré.")}`;
  } catch (error) {
    target = `/mon-compte/mon-van/${projectId}?step=2&error=${encodeURIComponent(errorMessage(error))}`;
  }
  revalidatePath(`/mon-compte/mon-van/${projectId}`);
  redirect(target);
}

export async function createDeviceAction(formData: FormData) {
  const actor = await requireCustomerActor();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await assertOwnedProject(actor, projectId);
    const scenario = await ensureDefaultScenario(projectId);

    const quantity = Number(getString(formData, "quantity")) || 1;
    const device = await createDevice({
      projectId,
      actor: { kind: "client" },
      name: getString(formData, "name"),
      category: getString(formData, "category"),
      quantity,
      brand: getString(formData, "brand") || null,
      reference: getString(formData, "reference") || null,
      state: (getString(formData, "state") || undefined) as CoachingDeviceState | undefined,
      phase: (getString(formData, "phase") || undefined) as CoachingDevicePhase | undefined,
      priority: (getString(formData, "priority") || undefined) as CoachingDevicePriority | undefined,
      powerSupply: (getString(formData, "powerSupply") || undefined) as CoachingPowerSupply | undefined,
    });

    const calcMethod = getString(formData, "calcMethod") as CoachingCalcMethod;
    if (calcMethod) {
      await upsertDeviceUsage({
        deviceId: device.id,
        scenarioId: scenario.id,
        actor: { kind: "client" },
        calcMethod,
        continuousPowerW: getOptionalNumber(formData, "continuousPowerW"),
        effectiveHoursPerDay: getOptionalNumber(formData, "effectiveHoursPerDay"),
        dailyEnergyWhPerUnit: getOptionalNumber(formData, "dailyEnergyWhPerUnit"),
        energyPerCycleWh: getOptionalNumber(formData, "energyPerCycleWh"),
        cyclesPerDay: getOptionalNumber(formData, "cyclesPerDay"),
      });
    }

    target = `/mon-compte/mon-van/${projectId}?step=3&success=${encodeURIComponent("Appareil ajouté.")}`;
  } catch (error) {
    target = `/mon-compte/mon-van/${projectId}?step=3&error=${encodeURIComponent(errorMessage(error))}`;
  }
  revalidatePath(`/mon-compte/mon-van/${projectId}`);
  redirect(target);
}

export async function deleteDeviceAction(formData: FormData) {
  const actor = await requireCustomerActor();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await assertOwnedProject(actor, projectId);
    await deleteDevice(getString(formData, "deviceId"), projectId, { kind: "client" });
    target = `/mon-compte/mon-van/${projectId}?step=3&success=${encodeURIComponent("Appareil retiré.")}`;
  } catch (error) {
    target = `/mon-compte/mon-van/${projectId}?step=3&error=${encodeURIComponent(errorMessage(error))}`;
  }
  revalidatePath(`/mon-compte/mon-van/${projectId}`);
  redirect(target);
}

export async function sendForReviewAction(formData: FormData) {
  const actor = await requireCustomerActor();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await assertOwnedProject(actor, projectId);
    await markProjectReadyForReview(projectId);
    target = `/mon-compte/mon-van/${projectId}?success=${encodeURIComponent("Envoyé pour relecture — votre coach va recevoir une alerte.")}`;
  } catch (error) {
    target = `/mon-compte/mon-van/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  revalidatePath(`/mon-compte/mon-van/${projectId}`);
  redirect(target);
}

export async function updateImplantationInfoAction(formData: FormData) {
  const actor = await requireCustomerActor();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await assertOwnedProject(actor, projectId);
    await updateImplantationInfo({
      projectId,
      actor: { kind: "client" },
      expectedImplantationUpdatedAt: new Date(getString(formData, "expectedImplantationUpdatedAt")),
      fields: {
        implantationNotes: getString(formData, "implantationNotes") || null,
        ventilationConstraints: getString(formData, "ventilationConstraints") || null,
        outletsLightingNotes: getString(formData, "outletsLightingNotes") || null,
        vehicleElectricalNotes: getString(formData, "vehicleElectricalNotes") || null,
        vehicleElectricalSource: getString(formData, "vehicleElectricalSource") || null,
      },
    });
    target = `/mon-compte/mon-van/${projectId}?step=5&success=${encodeURIComponent("Enregistré.")}`;
  } catch (error) {
    target = `/mon-compte/mon-van/${projectId}?step=5&error=${encodeURIComponent(errorMessage(error))}`;
  }
  revalidatePath(`/mon-compte/mon-van/${projectId}`);
  redirect(target);
}

export async function createMaterialAction(formData: FormData) {
  const actor = await requireCustomerActor();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await assertOwnedProject(actor, projectId);
    await createMaterial({
      projectId,
      actor: { kind: "client" },
      category: getString(formData, "category") as CoachingMaterialCategory,
      brand: getString(formData, "brand") || null,
      reference: getString(formData, "reference") || null,
      quantity: Number(getString(formData, "quantity")) || 1,
      state: (getString(formData, "state") || undefined) as CoachingDeviceState | undefined,
      keepExisting: getString(formData, "keepExisting") ? getString(formData, "keepExisting") === "true" : null,
      knownIssues: getString(formData, "knownIssues") || null,
    });
    target = `/mon-compte/mon-van/${projectId}?step=4&success=${encodeURIComponent("Matériel ajouté.")}`;
  } catch (error) {
    target = `/mon-compte/mon-van/${projectId}?step=4&error=${encodeURIComponent(errorMessage(error))}`;
  }
  revalidatePath(`/mon-compte/mon-van/${projectId}`);
  redirect(target);
}

export async function deleteMaterialAction(formData: FormData) {
  const actor = await requireCustomerActor();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await assertOwnedProject(actor, projectId);
    await deleteMaterial(getString(formData, "materialId"), projectId, { kind: "client" });
    target = `/mon-compte/mon-van/${projectId}?step=4&success=${encodeURIComponent("Matériel retiré.")}`;
  } catch (error) {
    target = `/mon-compte/mon-van/${projectId}?step=4&error=${encodeURIComponent(errorMessage(error))}`;
  }
  revalidatePath(`/mon-compte/mon-van/${projectId}`);
  redirect(target);
}

// Retour utilisateur : "permets le téléversement depuis le téléphone de
// photos, plans et PDF" — demande uniquement des photos prises sans danger
// (rappel affiché côté formulaire, pas applicable ici côté serveur).
export async function uploadOwnCoachingProjectDocumentAction(formData: FormData) {
  const actor = await requireCustomerActor();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await assertOwnedProject(actor, projectId);

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw badRequest("Fichier requis.");

    await assertCoachingProjectStorageQuota(projectId, file.size);

    const buffer = Buffer.from(await file.arrayBuffer());
    const { bucket, path } = await uploadCoachingProjectDocument({ projectId, filename: file.name, contentType: file.type, buffer });

    await addCoachingProjectDocument({
      projectId,
      filename: file.name,
      bucket,
      path,
      contentType: file.type,
      sizeBytes: buffer.byteLength,
      uploadedBy: "Client",
      deviceId: getString(formData, "deviceId") || null,
      materialId: getString(formData, "materialId") || null,
    });

    target = `/mon-compte/mon-van/${projectId}?step=4&success=${encodeURIComponent("Document envoyé.")}`;
  } catch (error) {
    target = `/mon-compte/mon-van/${projectId}?step=4&error=${encodeURIComponent(errorMessage(error))}`;
  }
  revalidatePath(`/mon-compte/mon-van/${projectId}`);
  redirect(target);
}

// "Ce qu'il vous reste à faire" (page projet) était jusqu'ici en lecture
// seule — le client devait prévenir son coach par un autre canal pour
// qu'une action soit cochée. L'ownership et le champ `responsible` sont
// revérifiés côté service (updateCoachingActionStatusByClient), pas
// seulement ici : un projectId de formulaire ne suffit jamais à lui seul.
export async function markOwnActionStatusAction(formData: FormData) {
  const actor = await requireCustomerActor();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    if (actor.role !== "customer") throw forbidden("Accès client requis.");
    await updateCoachingActionStatusByClient({
      actionId: getString(formData, "actionId"),
      customerId: actor.customerId,
      status: getString(formData, "status") as CoachingActionStatus,
    });
    target = `/mon-compte/mon-van/${projectId}?success=${encodeURIComponent("Mis à jour.")}`;
  } catch (error) {
    target = `/mon-compte/mon-van/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  revalidatePath(`/mon-compte/mon-van/${projectId}`);
  redirect(target);
}

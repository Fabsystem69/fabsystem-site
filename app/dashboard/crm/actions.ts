"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { badRequest, isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import { parseAdminVehicleFields } from "@/lib/coaching-vehicle-form";
import { readExistingInstallationPatchFromForm } from "@/lib/crm/existing-installation";
import type { CoachingInvitationState } from "@/lib/coaching-invitation";
import { parseLocalDateTimeInTimeZone } from "@/lib/timezone";
import {
  addCoachingProjectDocument,
  assertCoachingProjectStorageQuota,
  createCoachingActionItem,
  createCoachingProposal,
  createCoachingSession,
  deleteCoachingActionItem,
  deleteCoachingProjectDocumentRecord,
  deleteCoachingSession,
  updateCoachingActionStatus,
  updateCoachingProposal,
  updateCoachingSessionReport,
  updateCoachingSessionSchedule,
} from "@/lib/services/coaching-project";
import {
  createDevice,
  createScenario,
  deleteDevice,
  deleteDeviceUsage,
  ensureDefaultScenario,
  markProjectReviewed,
  updateImplantationInfo,
  updateUsagesInfo,
  updateVehicleInfo,
  upsertDeviceUsage,
} from "@/lib/services/coaching-van-dossier";
import { createMaterial, deleteMaterial } from "@/lib/services/coaching-material";
import { createCircuit, deleteCircuit, updateCircuit } from "@/lib/services/coaching-circuit";
import { createSchemaRevision, deleteSchemaRevision, updateSchemaRevisionStatus } from "@/lib/services/coaching-schema-revision";
import { requestMagicLoginLink } from "@/lib/services/customer-auth";
import { getRequiredBaseUrl } from "@/lib/server/env";
import { prisma } from "@/lib/prisma";
import { deleteCoachingProjectDocumentFile, uploadCoachingProjectDocument } from "@/lib/server/coaching-project-storage";
import type {
  CoachingActionStatus,
  CoachingCalcMethod,
  CoachingCircuitReviewStatus,
  CoachingDataOrigin,
  CoachingDevicePhase,
  CoachingDevicePriority,
  CoachingDeviceState,
  CoachingMaterialCategory,
  CoachingPaymentStatus,
  CoachingPowerSupply,
  CoachingProposalStatus,
  CoachingResponsible,
  CoachingSchemaStatus,
  CoachingSessionStatus,
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

export async function createCoachingSessionAction(formData: FormData) {
  await requireSession();

  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await createCoachingSession({
      projectId,
      scheduledAt: parseLocalDateTimeInTimeZone(getString(formData, "scheduledAt")),
      durationMinutes: Number(getString(formData, "durationMinutes")) || 60,
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    revalidatePath("/dashboard/crm/agenda");
    revalidatePath("/dashboard/crm");
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Séance programmée.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function updateCoachingSessionReportAction(formData: FormData) {
  await requireSession();

  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await updateCoachingSessionReport({
      sessionId: getString(formData, "sessionId"),
      status: (getString(formData, "status") || undefined) as CoachingSessionStatus | undefined,
      sujetsAbordes: getString(formData, "sujetsAbordes") || null,
      explicationsDonnees: getString(formData, "explicationsDonnees") || null,
      difficultes: getString(formData, "difficultes") || null,
      prochaineEtape: getString(formData, "prochaineEtape") || null,
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    revalidatePath("/dashboard/crm/agenda");
    revalidatePath("/dashboard/crm");
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Compte-rendu enregistré.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function updateCoachingSessionScheduleAction(formData: FormData) {
  await requireSession();

  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await updateCoachingSessionSchedule({
      sessionId: getString(formData, "sessionId"),
      scheduledAt: parseLocalDateTimeInTimeZone(getString(formData, "scheduledAt")),
      durationMinutes: Number(getString(formData, "durationMinutes")) || 60,
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    revalidatePath("/dashboard/crm/agenda");
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Séance mise à jour.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function deleteCoachingSessionAction(formData: FormData) {
  await requireSession();

  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await deleteCoachingSession(getString(formData, "sessionId"));
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    revalidatePath("/dashboard/crm/agenda");
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Séance supprimée.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function createCoachingActionItemAction(formData: FormData) {
  await requireSession();

  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    const dueDateRaw = getString(formData, "dueDate");
    await createCoachingActionItem({
      projectId,
      sessionId: getString(formData, "sessionId") || null,
      label: getString(formData, "label"),
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      responsible: (getString(formData, "responsible") || null) as CoachingResponsible | null,
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    revalidatePath("/dashboard/crm");
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Action ajoutée.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function updateCoachingActionStatusAction(formData: FormData) {
  await requireSession();

  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await updateCoachingActionStatus({
      actionId: getString(formData, "actionId"),
      status: getString(formData, "status") as CoachingActionStatus,
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    revalidatePath("/dashboard/crm");
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Action mise à jour.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function deleteCoachingActionItemAction(formData: FormData) {
  await requireSession();

  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await deleteCoachingActionItem(getString(formData, "actionId"));
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Action supprimée.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function createCoachingProposalAction(formData: FormData) {
  await requireSession();

  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    const montantEuros = Number(getString(formData, "montantEuros").replace(",", "."));
    const dureeHeures = Number(getString(formData, "dureeHeures").replace(",", "."));
    if (!Number.isFinite(montantEuros) || montantEuros < 0) throw badRequest("Montant invalide.");
    if (!Number.isFinite(dureeHeures) || dureeHeures <= 0) throw badRequest("Durée invalide.");

    await createCoachingProposal({
      projectId,
      intitule: getString(formData, "intitule"),
      montantCents: Math.round(montantEuros * 100),
      dureeMinutes: Math.round(dureeHeures * 60),
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Proposition ajoutée.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function updateCoachingProposalAction(formData: FormData) {
  await requireSession();

  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    const montantRecuRaw = getString(formData, "montantRecuEuros");
    await updateCoachingProposal({
      proposalId: getString(formData, "proposalId"),
      status: (getString(formData, "status") || undefined) as CoachingProposalStatus | undefined,
      paymentStatus: (getString(formData, "paymentStatus") || undefined) as CoachingPaymentStatus | undefined,
      montantRecuCents: montantRecuRaw ? Math.round(Number(montantRecuRaw.replace(",", ".")) * 100) : undefined,
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Proposition mise à jour.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function uploadCoachingProjectDocumentAction(formData: FormData) {
  await requireSession();

  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw badRequest("Fichier requis.");

    await assertCoachingProjectStorageQuota(projectId, file.size);

    const buffer = Buffer.from(await file.arrayBuffer());
    const { bucket, path } = await uploadCoachingProjectDocument({
      projectId,
      filename: file.name,
      contentType: file.type,
      buffer,
    });

    await addCoachingProjectDocument({
      projectId,
      filename: file.name,
      bucket,
      path,
      contentType: file.type,
      sizeBytes: buffer.byteLength,
      uploadedBy: "FabSystem",
      deviceId: getString(formData, "deviceId") || null,
      materialId: getString(formData, "materialId") || null,
    });

    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Document ajouté.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function deleteCoachingProjectDocumentAction(formData: FormData) {
  await requireSession();

  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    const document = await deleteCoachingProjectDocumentRecord(getString(formData, "documentId"));
    await deleteCoachingProjectDocumentFile(document.path).catch(() => {});
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Document retiré.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

// --- Dossier van évolutif (docs/_local/Prompt_Claude_Fabsystem_Dossier_Van.md) ---
// Ces actions appellent exactement les mêmes fonctions de service que
// app/mon-compte/mon-van/actions.ts (lib/services/coaching-van-dossier.ts) —
// seul le contrôle d'accès diffère (session admin ici, ownership client
// là-bas). Espace vraiment partagé, pas deux jeux de données séparés.

export async function updateVehicleInfoAdminAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await updateVehicleInfo({
      projectId,
      actor: { kind: "coach" },
      expectedVehicleInfoUpdatedAt: new Date(getString(formData, "expectedVehicleInfoUpdatedAt")),
      fields: parseAdminVehicleFields(formData),
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Enregistré.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function updateUsagesInfoAdminAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await updateUsagesInfo({
      projectId,
      actor: { kind: "coach" },
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
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Enregistré.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function markProjectReviewedAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await markProjectReviewed(projectId);
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    revalidatePath("/dashboard/crm");
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Marqué comme revu.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

// Retour utilisateur : "je crée un dossier puis je copie un lien
// d'invitation à envoyer moi-même sur Messenger" — jamais d'e-mail
// automatique (contrairement à l'action équivalente sur la fiche client
// e-commerce, app/dashboard/customers/[id]/actions.ts, qui envoie un
// e-mail) : ici le lien est juste affiché pour être copié.
export async function generateInviteLinkAction(
  _previousState: CoachingInvitationState,
  formData: FormData
): Promise<CoachingInvitationState> {
  await requireSession();
  const projectId = getString(formData, "projectId");
  try {
    const project = await prisma.coachingProject.findUniqueOrThrow({ where: { id: projectId }, include: { customer: true } });
    const result = await requestMagicLoginLink({ email: project.customer.email, name: project.customer.name ?? undefined, baseUrl: getRequiredBaseUrl() });
    if (result.status !== "created" || !result.magicLink) {
      return { status: "error", message: "Impossible de générer le lien." };
    }
    // Le jeton reste dans la réponse authentifiée, jamais dans l'URL du dashboard.
    return { status: "created", magicLink: result.magicLink, expiresAt: result.expiresAt.toISOString() };
  } catch {
    return { status: "error", message: "Impossible de générer le lien. Réessayez dans un instant." };
  }
}

export async function createScenarioAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await createScenario({ projectId, name: getString(formData, "name") });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Scénario ajouté.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function createDeviceAdminAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    const scenarioId = getString(formData, "scenarioId") || (await ensureDefaultScenario(projectId)).id;
    const device = await createDevice({
      projectId,
      actor: { kind: "coach" },
      name: getString(formData, "name"),
      category: getString(formData, "category"),
      quantity: Number(getString(formData, "quantity")) || 1,
      brand: getString(formData, "brand") || null,
      reference: getString(formData, "reference") || null,
      manufacturerLink: getString(formData, "manufacturerLink") || null,
      state: (getString(formData, "state") || undefined) as CoachingDeviceState | undefined,
      phase: (getString(formData, "phase") || undefined) as CoachingDevicePhase | undefined,
      priority: (getString(formData, "priority") || undefined) as CoachingDevicePriority | undefined,
      powerSupply: (getString(formData, "powerSupply") || undefined) as CoachingPowerSupply | undefined,
    });

    const calcMethod = getString(formData, "calcMethod") as CoachingCalcMethod;
    if (calcMethod) {
      await upsertDeviceUsage({
        deviceId: device.id,
        scenarioId,
        actor: { kind: "coach" },
        calcMethod,
        continuousPowerW: getOptionalNumber(formData, "continuousPowerW"),
        effectiveHoursPerDay: getOptionalNumber(formData, "effectiveHoursPerDay"),
        dailyEnergyWhPerUnit: getOptionalNumber(formData, "dailyEnergyWhPerUnit"),
        energyPerCycleWh: getOptionalNumber(formData, "energyPerCycleWh"),
        cyclesPerDay: getOptionalNumber(formData, "cyclesPerDay"),
      });
    }

    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Appareil ajouté.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function deleteDeviceAdminAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await deleteDevice(getString(formData, "deviceId"), projectId, { kind: "coach" });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Appareil retiré.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function deleteDeviceUsageAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await deleteDeviceUsage(getString(formData, "usageId"), { kind: "coach" });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Usage retiré.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

// --- Phase 2 : implantation, matériel, circuits, révisions de schéma ------

export async function updateImplantationInfoAdminAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    const patch = readExistingInstallationPatchFromForm(formData);
    if (!patch.success) throw badRequest(patch.error);
    await updateImplantationInfo({
      projectId,
      actor: { kind: "coach" },
      existingInstallationPatch: patch.data,
      expectedImplantationUpdatedAt: new Date(getString(formData, "expectedImplantationUpdatedAt")),
      fields: {
        implantationNotes: getString(formData, "implantationNotes") || null,
        ventilationConstraints: getString(formData, "ventilationConstraints") || null,
        outletsLightingNotes: getString(formData, "outletsLightingNotes") || null,
        vehicleElectricalNotes: getString(formData, "vehicleElectricalNotes") || null,
        vehicleElectricalSource: getString(formData, "vehicleElectricalSource") || null,
      },
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Enregistré.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function createMaterialAdminAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await createMaterial({
      projectId,
      actor: { kind: "coach" },
      category: getString(formData, "category") as CoachingMaterialCategory,
      brand: getString(formData, "brand") || null,
      reference: getString(formData, "reference") || null,
      quantity: Number(getString(formData, "quantity")) || 1,
      state: (getString(formData, "state") || undefined) as CoachingDeviceState | undefined,
      keepExisting: getString(formData, "keepExisting") ? getString(formData, "keepExisting") === "true" : null,
      ratedVoltage: getOptionalNumber(formData, "ratedVoltage"),
      ratedCurrentA: getOptionalNumber(formData, "ratedCurrentA"),
      ratedPowerW: getOptionalNumber(formData, "ratedPowerW"),
      capacityAh: getOptionalNumber(formData, "capacityAh"),
      characteristicsNotes: getString(formData, "characteristicsNotes") || null,
      knownIssues: getString(formData, "knownIssues") || null,
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Matériel ajouté.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function deleteMaterialAdminAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await deleteMaterial(getString(formData, "materialId"), projectId, { kind: "coach" });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Matériel retiré.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function createCircuitAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await createCircuit({
      projectId,
      label: getString(formData, "label"),
      deviceId: getString(formData, "deviceId") || null,
      source: getString(formData, "source") || null,
      destination: getString(formData, "destination") || null,
      systemVoltage: getOptionalNumber(formData, "systemVoltage"),
      calculatedCurrentA: getOptionalNumber(formData, "calculatedCurrentA"),
      outboundLengthM: getOptionalNumber(formData, "outboundLengthM"),
      outboundLengthOrigin: (getString(formData, "outboundLengthOrigin") || undefined) as CoachingDataOrigin | undefined,
      returnPathPlanned: getString(formData, "returnPathPlanned") || null,
      returnLengthM: getOptionalNumber(formData, "returnLengthM"),
      electricalLengthM: getOptionalNumber(formData, "electricalLengthM"),
      installMethod: getString(formData, "installMethod") || null,
      section: getString(formData, "section") || null,
      protectionType: getString(formData, "protectionType") || null,
      protectionReference: getString(formData, "protectionReference") || null,
      protectionRatingA: getOptionalNumber(formData, "protectionRatingA"),
      protectionRatedVoltage: getOptionalNumber(formData, "protectionRatedVoltage"),
      protectionBreakingCapacityA: getOptionalNumber(formData, "protectionBreakingCapacityA"),
      protectionLocation: getString(formData, "protectionLocation") || null,
      justification: getString(formData, "justification") || null,
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Circuit ajouté.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function updateCircuitReviewStatusAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await updateCircuit({
      circuitId: getString(formData, "circuitId"),
      reviewStatus: getString(formData, "reviewStatus") as CoachingCircuitReviewStatus,
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Circuit mis à jour.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function deleteCircuitAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await deleteCircuit(getString(formData, "circuitId"));
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Circuit retiré.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function createSchemaRevisionAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await createSchemaRevision({ projectId, documentId: getString(formData, "documentId") || null });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Révision figée.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function updateSchemaRevisionStatusAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await updateSchemaRevisionStatus({
      revisionId: getString(formData, "revisionId"),
      status: getString(formData, "status") as CoachingSchemaStatus,
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Statut mis à jour.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function deleteSchemaRevisionAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await deleteSchemaRevision(getString(formData, "revisionId"));
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Révision supprimée.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

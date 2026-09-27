import { badRequest, conflict, notFound } from "@/lib/http-errors";
import { prisma } from "@/lib/prisma";
import { computeScenarioBilan, type CoachingDeviceUsageInput, type ScenarioDeviceInput } from "@/lib/calc/coaching-consumption";
import type { CoachingActor } from "@/lib/services/coaching-actor";
import { logCoachingProjectEvent } from "@/lib/services/coaching-project-events";
import type {
  ClientLevel,
  CoachingCalcMethod,
  CoachingDataOrigin,
  CoachingDevicePhase,
  CoachingDevicePriority,
  CoachingDeviceState,
  CoachingMeasurementPoint,
  CoachingPowerSupply,
} from "@/lib/generated/prisma/client";

// Dossier client van évolutif (docs/_local/Prompt_Claude_Fabsystem_Dossier_Van.md,
// phase 1 : étapes 1-3). Espace RÉELLEMENT partagé — ces fonctions sont
// appelées aussi bien par app/mon-compte/mon-van/actions.ts (client) que par
// l'extension de app/dashboard/crm/actions.ts (coach) : le contrôle d'accès
// (ownership vs session admin) vit dans l'appelant, jamais ici.

// --- Étape 1 : projet & véhicule ---------------------------------------------

export type VehicleInfoFields = Partial<{
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleYear: string | null;
  vehicleEngine: string | null;
  vehicleFormat: string | null;
  vehicleDimensions: string | null;
  registrationCountry: string | null;
  usageCountry: string | null;
  homologationNotes: string | null;
  projectStage: string | null;
  niveauClient: ClientLevel | null;
  whoDoesTheWork: string | null;
  coachingTopics: string | null;
  objectifs: string | null;
  threePriorities: string | null;
  startDeadline: string | null;
  materialBudgetCents: number | null;
  laborBudgetCents: number | null;
}>;

export async function updateVehicleInfo(input: {
  projectId: string;
  expectedVehicleInfoUpdatedAt: Date;
  fields: VehicleInfoFields;
  actor: CoachingActor;
}) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { vehicleInfoUpdatedAt: true } });
  if (!project) throw notFound("Projet introuvable.");
  if (project.vehicleInfoUpdatedAt.getTime() !== input.expectedVehicleInfoUpdatedAt.getTime()) {
    throw conflict("Cette section a été modifiée entre-temps — rechargez la page pour voir les derniers changements.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coachingProject.update({
      where: { id: input.projectId },
      data: { ...input.fields, vehicleInfoUpdatedAt: new Date(), derniereActivite: new Date() },
    });
    await logCoachingProjectEvent(tx, input.projectId, "VEHICLE_INFO", input.actor);
    return updated;
  });
}

// --- Étape 2 : usages & recharge ---------------------------------------------

export type UsagesInfoFields = Partial<{
  travelerCount: string | null;
  usagePattern: string | null;
  remoteWorkNotes: string | null;
  seasonsRegionsNotes: string | null;
  parkingExposure: string | null;
  daysWithoutRecharge: string | null;
  minAutonomyNoRecharge: string | null;
  criticalDevicesWhenLow: string | null;
  drivingHabits: string | null;
  shorePowerAvailability: string | null;
  solarPreference: string | null;
  solarMounting: string | null;
  solarRoofSpaceNotes: string | null;
  otherEnergySources: string | null;
  plannedEquipmentNotes: string | null;
}>;

export async function updateUsagesInfo(input: {
  projectId: string;
  expectedUsagesUpdatedAt: Date;
  fields: UsagesInfoFields;
  actor: CoachingActor;
}) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { usagesUpdatedAt: true } });
  if (!project) throw notFound("Projet introuvable.");
  if (project.usagesUpdatedAt.getTime() !== input.expectedUsagesUpdatedAt.getTime()) {
    throw conflict("Cette section a été modifiée entre-temps — rechargez la page pour voir les derniers changements.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coachingProject.update({
      where: { id: input.projectId },
      data: { ...input.fields, usagesUpdatedAt: new Date(), derniereActivite: new Date() },
    });
    await logCoachingProjectEvent(tx, input.projectId, "USAGES", input.actor);
    return updated;
  });
}

// --- Étape 5 : implantation (contexte partagé) ------------------------------

export type ImplantationInfoFields = Partial<{
  implantationNotes: string | null;
  ventilationConstraints: string | null;
  outletsLightingNotes: string | null;
  vehicleElectricalNotes: string | null;
  vehicleElectricalSource: string | null;
}>;

export async function updateImplantationInfo(input: {
  projectId: string;
  expectedImplantationUpdatedAt: Date;
  fields: ImplantationInfoFields;
  actor: CoachingActor;
}) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { implantationUpdatedAt: true } });
  if (!project) throw notFound("Projet introuvable.");
  if (project.implantationUpdatedAt.getTime() !== input.expectedImplantationUpdatedAt.getTime()) {
    throw conflict("Cette section a été modifiée entre-temps — rechargez la page pour voir les derniers changements.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coachingProject.update({
      where: { id: input.projectId },
      data: { ...input.fields, implantationUpdatedAt: new Date(), derniereActivite: new Date() },
    });
    await logCoachingProjectEvent(tx, input.projectId, "IMPLANTATION", input.actor);
    return updated;
  });
}

// --- Relecture ---------------------------------------------------------------

export async function markProjectReadyForReview(projectId: string) {
  const project = await prisma.coachingProject.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");
  return prisma.coachingProject.update({ where: { id: projectId }, data: { readyForReviewAt: new Date() } });
}

// Réservé coach : vide le drapeau de relecture et repart à zéro pour la
// détection de changement ("hasChangesSinceReview").
export async function markProjectReviewed(projectId: string) {
  const project = await prisma.coachingProject.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");
  return prisma.coachingProject.update({
    where: { id: projectId },
    data: { readyForReviewAt: null, lastReviewedAt: new Date(), hasChangesSinceReview: false },
  });
}

// --- Scénarios -----------------------------------------------------------------

export async function listScenarios(projectId: string) {
  return prisma.coachingScenario.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } });
}

export async function createScenario(input: { projectId: string; name: string }) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");

  const name = input.name.trim();
  if (!name) throw badRequest("Nom du scénario requis.");

  const existingCount = await prisma.coachingScenario.count({ where: { projectId: input.projectId } });
  return prisma.coachingScenario.create({ data: { projectId: input.projectId, name, isDefault: existingCount === 0 } });
}

// Un scénario par défaut ("Général") doit toujours exister avant qu'on
// puisse ajouter un appareil — créé à la volée au premier accès plutôt que
// forcé dans une migration de données.
export async function ensureDefaultScenario(projectId: string) {
  const existing = await prisma.coachingScenario.findFirst({ where: { projectId }, orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return prisma.coachingScenario.create({ data: { projectId, name: "Général", isDefault: true } });
}

export async function deleteScenario(scenarioId: string) {
  const scenario = await prisma.coachingScenario.findUnique({ where: { id: scenarioId }, select: { id: true, projectId: true } });
  if (!scenario) throw notFound("Scénario introuvable.");
  const scenarioCount = await prisma.coachingScenario.count({ where: { projectId: scenario.projectId } });
  if (scenarioCount <= 1) throw badRequest("Impossible de supprimer le dernier scénario du projet.");
  return prisma.coachingScenario.delete({ where: { id: scenarioId } });
}

// --- Appareils -----------------------------------------------------------------

export type DeviceFields = {
  name: string;
  category: string;
  quantity: number;
  brand?: string | null;
  reference?: string | null;
  manufacturerLink?: string | null;
  state?: CoachingDeviceState;
  phase?: CoachingDevicePhase;
  priority?: CoachingDevicePriority;
  powerSupply?: CoachingPowerSupply;
  measurementPoint?: CoachingMeasurementPoint | null;
  dataOrigin?: CoachingDataOrigin | null;
};

export async function listDevicesForProject(projectId: string) {
  return prisma.coachingDevice.findMany({ where: { projectId }, orderBy: { createdAt: "asc" }, include: { usages: true } });
}

export async function createDevice(input: { projectId: string; actor: CoachingActor } & DeviceFields) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");

  const name = input.name.trim();
  if (!name) throw badRequest("Nom de l'appareil requis.");
  const category = input.category.trim();
  if (!category) throw badRequest("Catégorie requise.");
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) throw badRequest("Quantité invalide.");

  return prisma.$transaction(async (tx) => {
    const device = await tx.coachingDevice.create({
      data: {
        projectId: input.projectId,
        name,
        category,
        quantity: input.quantity,
        brand: input.brand?.trim() || null,
        reference: input.reference?.trim() || null,
        manufacturerLink: input.manufacturerLink?.trim() || null,
        state: input.state,
        phase: input.phase,
        priority: input.priority,
        powerSupply: input.powerSupply,
        measurementPoint: input.measurementPoint,
        dataOrigin: input.dataOrigin,
      },
    });
    await tx.coachingProject.update({ where: { id: input.projectId }, data: { derniereActivite: new Date() } });
    await logCoachingProjectEvent(tx, input.projectId, "DEVICE", input.actor, `Appareil ajouté : ${name}`);
    return device;
  });
}

export async function updateDevice(input: { deviceId: string; actor: CoachingActor } & Partial<DeviceFields>) {
  const device = await prisma.coachingDevice.findUnique({ where: { id: input.deviceId }, select: { id: true, projectId: true } });
  if (!device) throw notFound("Appareil introuvable.");
  if (input.quantity !== undefined && (!Number.isInteger(input.quantity) || input.quantity <= 0)) {
    throw badRequest("Quantité invalide.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coachingDevice.update({
      where: { id: input.deviceId },
      data: {
        name: input.name?.trim() || undefined,
        category: input.category?.trim() || undefined,
        quantity: input.quantity,
        brand: input.brand !== undefined ? input.brand?.trim() || null : undefined,
        reference: input.reference !== undefined ? input.reference?.trim() || null : undefined,
        manufacturerLink: input.manufacturerLink !== undefined ? input.manufacturerLink?.trim() || null : undefined,
        state: input.state,
        phase: input.phase,
        priority: input.priority,
        powerSupply: input.powerSupply,
        measurementPoint: input.measurementPoint,
        dataOrigin: input.dataOrigin,
      },
    });
    await logCoachingProjectEvent(tx, device.projectId, "DEVICE", input.actor);
    return updated;
  });
}

export async function deleteDevice(deviceId: string) {
  const device = await prisma.coachingDevice.findUnique({ where: { id: deviceId }, select: { id: true } });
  if (!device) throw notFound("Appareil introuvable.");
  return prisma.coachingDevice.delete({ where: { id: deviceId } });
}

// --- Usage par scénario ----------------------------------------------------

export type DeviceUsageFields = {
  calcMethod: CoachingCalcMethod;
  continuousPowerW?: number | null;
  peakPowerW?: number | null;
  peakDurationMinutes?: number | null;
  effectiveHoursPerDay?: number | null;
  availabilityHoursPerDay?: number | null;
  dutyCycleRatio?: number | null;
  dailyEnergyWhPerUnit?: number | null;
  dailyEnergyIsGroupTotal?: boolean;
  energyPerCycleWh?: number | null;
  cyclesPerDay?: number | null;
};

// Une ligne par (appareil, scénario) — crée ou remplace, jamais de doublon
// (@@unique([deviceId, scenarioId]) en base).
export async function upsertDeviceUsage(input: { deviceId: string; scenarioId: string; actor: CoachingActor } & DeviceUsageFields) {
  const device = await prisma.coachingDevice.findUnique({ where: { id: input.deviceId }, select: { id: true, projectId: true } });
  if (!device) throw notFound("Appareil introuvable.");
  const scenario = await prisma.coachingScenario.findUnique({ where: { id: input.scenarioId }, select: { id: true, projectId: true } });
  if (!scenario) throw notFound("Scénario introuvable.");
  if (scenario.projectId !== device.projectId) throw badRequest("Ce scénario n'appartient pas au même projet que cet appareil.");

  const { deviceId, scenarioId, actor, ...fields } = input;

  return prisma.$transaction(async (tx) => {
    const usage = await tx.coachingDeviceUsage.upsert({
      where: { deviceId_scenarioId: { deviceId, scenarioId } },
      create: { deviceId, scenarioId, ...fields },
      update: fields,
    });
    await logCoachingProjectEvent(tx, device.projectId, "DEVICE", actor);
    return usage;
  });
}

export async function deleteDeviceUsage(usageId: string) {
  const usage = await prisma.coachingDeviceUsage.findUnique({ where: { id: usageId }, select: { id: true } });
  if (!usage) throw notFound("Usage introuvable.");
  return prisma.coachingDeviceUsage.delete({ where: { id: usageId } });
}

// --- Bilan -----------------------------------------------------------------

export async function getScenarioBilan(scenarioId: string) {
  const scenario = await prisma.coachingScenario.findUnique({ where: { id: scenarioId } });
  if (!scenario) throw notFound("Scénario introuvable.");

  const usages = await prisma.coachingDeviceUsage.findMany({ where: { scenarioId }, include: { device: true } });

  const deviceInputs: ScenarioDeviceInput[] = usages.map((usage) => {
    const usageInput: CoachingDeviceUsageInput = {
      calcMethod: usage.calcMethod,
      continuousPowerW: usage.continuousPowerW,
      effectiveHoursPerDay: usage.effectiveHoursPerDay,
      availabilityHoursPerDay: usage.availabilityHoursPerDay,
      dutyCycleRatio: usage.dutyCycleRatio,
      dailyEnergyWhPerUnit: usage.dailyEnergyWhPerUnit,
      dailyEnergyIsGroupTotal: usage.dailyEnergyIsGroupTotal,
      energyPerCycleWh: usage.energyPerCycleWh,
      cyclesPerDay: usage.cyclesPerDay,
    };
    return {
      deviceId: usage.deviceId,
      quantity: usage.device.quantity,
      powerSupply: usage.device.powerSupply,
      usage: usageInput,
    };
  });

  const bilan = computeScenarioBilan(deviceInputs);
  const deviceById = new Map(usages.map((u) => [u.deviceId, u.device]));

  return { scenario, bilan, deviceById };
}

// --- Vues transverses pour le tableau de bord "Aujourd'hui" -----------------

// Projets envoyés pour relecture par le client — jamais ceux déjà revus
// depuis (readyForReviewAt est vidé par markProjectReviewed).
export async function listProjectsAwaitingReview() {
  return prisma.coachingProject.findMany({
    where: { readyForReviewAt: { not: null } },
    include: { customer: { select: { id: true, name: true, email: true } } },
    orderBy: { readyForReviewAt: "asc" },
  });
}

// Bilan incomplet du scénario par défaut de chaque projet actif — sondage
// simple (pas d'agrégat SQL dédié) : le volume attendu reste petit.
export async function listProjectsWithIncompleteBilan() {
  const projects = await prisma.coachingProject.findMany({
    where: { status: { in: ["A_DEMARRER", "EN_COURS"] } },
    include: { customer: { select: { id: true, name: true, email: true } }, scenarios: { orderBy: { createdAt: "asc" }, take: 1 } },
  });

  const results: { project: (typeof projects)[number]; incompleteCount: number }[] = [];
  for (const project of projects) {
    const defaultScenario = project.scenarios[0];
    if (!defaultScenario) continue;
    const { bilan } = await getScenarioBilan(defaultScenario.id);
    if (bilan.isIncomplete) results.push({ project, incompleteCount: bilan.incompleteCount });
  }
  return results;
}

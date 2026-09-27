import { prisma } from "@/lib/prisma";
import { computeScenarioBilan, type CoachingDeviceUsageInput, type ScenarioDeviceInput } from "@/lib/calc/coaching-consumption";

// Instantané complet et sérialisable du dossier (projet + appareils par
// scénario + bilans + matériel + circuits) — utilisé à la fois pour figer
// une CoachingSchemaRevision (snapshotJson, jamais recalculé après coup) et
// pour les exports CSV/imprimable, qui doivent refléter EXACTEMENT le même
// contenu que ce que le coach a sous les yeux à l'instant T.
export async function buildProjectSnapshot(projectId: string) {
  const project = await prisma.coachingProject.findUniqueOrThrow({
    where: { id: projectId },
    include: { customer: { select: { name: true, email: true } } },
  });

  const [scenarios, devices, materials] = await Promise.all([
    prisma.coachingScenario.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
    prisma.coachingDevice.findMany({ where: { projectId }, orderBy: { createdAt: "asc" }, include: { usages: true } }),
    prisma.coachingMaterial.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
  ]);

  const bilansByScenario = await Promise.all(
    scenarios.map(async (scenario) => {
      const usages = await prisma.coachingDeviceUsage.findMany({ where: { scenarioId: scenario.id }, include: { device: true } });
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
        return { deviceId: usage.deviceId, quantity: usage.device.quantity, powerSupply: usage.device.powerSupply, usage: usageInput };
      });
      return { scenarioId: scenario.id, scenarioName: scenario.name, bilan: computeScenarioBilan(deviceInputs) };
    })
  );

  return {
    generatedAt: new Date().toISOString(),
    project: {
      id: project.id,
      title: project.title,
      customerName: project.customer.name,
      customerEmail: project.customer.email,
      vehicleBrand: project.vehicleBrand,
      vehicleModel: project.vehicleModel,
      vehicleYear: project.vehicleYear,
      projectStage: project.projectStage,
      niveauClient: project.niveauClient,
    },
    devices: devices.map((d) => ({ id: d.id, name: d.name, category: d.category, quantity: d.quantity, powerSupply: d.powerSupply, state: d.state, phase: d.phase })),
    materials: materials.map((m) => ({ id: m.id, category: m.category, brand: m.brand, reference: m.reference, quantity: m.quantity, state: m.state })),
    scenarios: bilansByScenario,
  };
}

export type ProjectSnapshot = Awaited<ReturnType<typeof buildProjectSnapshot>>;

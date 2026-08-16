import type { Prisma, Project } from "@/lib/generated/prisma/client";
import type { OwnershipActor } from "@/lib/ownership";
import { getSchemaTemplate, type SchemaTemplate } from "@/features/schemas/templates";
import type { BaseEngine, EngineResult } from "@/lib/engines/types";
import { createEngineRunner } from "@/lib/engines/runner";
import { getEngineRegistry } from "@/lib/engines/index";
import type { EnergyEngineInput } from "@/lib/engines/energy-engine";
import type { BatteryEngineInput } from "@/lib/engines/battery-engine";
import type { AlternatorEngineInput } from "@/lib/engines/alternator-engine";
import type { SolarEngineInput } from "@/lib/engines/solar-engine";
import type { ChargerEngineInput } from "@/lib/engines/charger-engine";
import type { CircuitEngineInput, CircuitEngineOutput } from "@/lib/engines/circuit-engine";
import type { CableEngineInput } from "@/lib/engines/cable-engine";
import type { ProtectionEngineInput } from "@/lib/engines/protection-engine";
import type { DiagramEngineInput } from "@/lib/engines/diagram-engine";
import type { GlobalEnergyBalanceEngineInput } from "@/lib/engines/global-energy-balance-engine";
import { saveProjectSchema } from "@/lib/services/project-schema";
import type { ProjectStarterId } from "@/lib/project-starter-contract";

type RunStarterEngine = <TInput, TOutput>(
  actor: OwnershipActor,
  projectId: string,
  engineId: string,
  input: TInput
) => Promise<EngineResult<TOutput>>;

type SaveStarterSchema = typeof saveProjectSchema;

type ProjectStarterDeps = {
  runEngine?: RunStarterEngine;
  saveSchema?: SaveStarterSchema;
  getTemplate?: (id: string) => SchemaTemplate | undefined;
};

type StarterCircuitName =
  | "Refrigerateur 12V"
  | "Pompe a eau"
  | "Ports USB"
  | "Eclairage LED";

type StarterCableConfig = Record<
  StarterCircuitName,
  {
    oneWayLengthM: number;
    maxVoltageDropPercentage: number;
    availableSectionsMm2: number[];
  }
>;

type StarterProtectionConfig = Record<
  StarterCircuitName,
  {
    ratingA: number;
    minMarginRatio: number;
    maxMarginRatio: number;
  }
>;

type StarterRecipe = {
  energy: EnergyEngineInput;
  battery: BatteryEngineInput;
  alternator: AlternatorEngineInput;
  solar: SolarEngineInput;
  charger: ChargerEngineInput;
  globalEnergyBalance: GlobalEnergyBalanceEngineInput;
  circuits: CircuitEngineInput;
  cableConfig: StarterCableConfig;
  protectionConfig: StarterProtectionConfig;
  templateId: string;
};

const COMMON_CONSUMERS: EnergyEngineInput = {
  consumers: [
    { name: "Refrigerateur 12V", powerW: 45, dailyUsageHours: 12, quantity: 1 },
    { name: "Pompe a eau", powerW: 60, dailyUsageHours: 0.2, quantity: 1 },
    { name: "Ports USB", powerW: 15, dailyUsageHours: 4, quantity: 1 },
    { name: "Eclairage LED", powerW: 10, dailyUsageHours: 5, quantity: 1 },
  ],
};

const P280_BATTERY: BatteryEngineInput = {
  technology: "LIFEPO4",
  maxDepthOfDischarge: 0.8,
  desiredAutonomyDays: 2,
  systemVoltageV: 12,
};

const P280_ALTERNATOR: AlternatorEngineInput = {
  nominalCurrentA: 60,
  availableCurrentA: 45,
  referenceRpm: 2000,
  rollingDurationHours: 2,
};

const P280_SOLAR: SolarEngineInput = {
  panelPowerWp: 200,
  equivalentSunHours: 4,
  systemEfficiencyRatio: 0.8,
};

const P280_CHARGER: ChargerEngineInput = {
  nominalPowerW: 300,
  maxCurrentA: 25,
  outputVoltageV: 12,
  systemEfficiencyRatio: 0.9,
  chargingDurationHours: 3,
};

const COMMON_CIRCUITS: CircuitEngineInput = {
  circuits: [
    { name: "Refrigerateur 12V", circuitType: "froid", consumerNames: ["Refrigerateur 12V"] },
    { name: "Pompe a eau", circuitType: "eau", consumerNames: ["Pompe a eau"] },
    { name: "Ports USB", circuitType: "confort", consumerNames: ["Ports USB"] },
    { name: "Eclairage LED", circuitType: "eclairage", consumerNames: ["Eclairage LED"] },
  ],
};

const P280_GLOBAL_ENERGY_BALANCE: GlobalEnergyBalanceEngineInput = {};
const VICTRON_GLOBAL_ENERGY_BALANCE: GlobalEnergyBalanceEngineInput = {};

const VICTRON_BATTERY: BatteryEngineInput = {
  technology: "LIFEPO4",
  maxDepthOfDischarge: 0.8,
  desiredAutonomyDays: 2,
  systemVoltageV: 12,
};

const VICTRON_ALTERNATOR: AlternatorEngineInput = {
  nominalCurrentA: 18,
  availableCurrentA: 18,
  referenceRpm: 2000,
  efficiencyRatio: 0.92,
  rollingDurationHours: 2,
};

const VICTRON_SOLAR: SolarEngineInput = {
  panelPowerWp: 200,
  equivalentSunHours: 4,
  systemEfficiencyRatio: 0.8,
};

const VICTRON_CHARGER: ChargerEngineInput = {
  nominalPowerW: 500,
  maxCurrentA: 35,
  outputVoltageV: 12,
  systemEfficiencyRatio: 0.9,
  chargingDurationHours: 3,
};

const P280_CABLE_CONFIG: StarterCableConfig = {
  "Refrigerateur 12V": {
    oneWayLengthM: 3,
    maxVoltageDropPercentage: 3,
    availableSectionsMm2: [1.5, 2.5, 4, 6, 10, 16, 25],
  },
  "Pompe a eau": {
    oneWayLengthM: 2.5,
    maxVoltageDropPercentage: 3,
    availableSectionsMm2: [1.5, 2.5, 4, 6, 10, 16, 25],
  },
  "Ports USB": {
    oneWayLengthM: 2,
    maxVoltageDropPercentage: 3,
    availableSectionsMm2: [0.75, 1.5, 2.5, 4, 6],
  },
  "Eclairage LED": {
    oneWayLengthM: 5,
    maxVoltageDropPercentage: 5,
    availableSectionsMm2: [0.75, 1.5, 2.5, 4, 6],
  },
};

const VICTRON_CABLE_CONFIG: StarterCableConfig = {
  "Refrigerateur 12V": {
    oneWayLengthM: 3,
    maxVoltageDropPercentage: 3,
    availableSectionsMm2: [4, 6, 10, 16, 25],
  },
  "Pompe a eau": {
    oneWayLengthM: 2.5,
    maxVoltageDropPercentage: 3,
    availableSectionsMm2: [4, 6, 10, 16, 25],
  },
  "Ports USB": {
    oneWayLengthM: 2,
    maxVoltageDropPercentage: 3,
    availableSectionsMm2: [2.5, 4, 6],
  },
  "Eclairage LED": {
    oneWayLengthM: 5,
    maxVoltageDropPercentage: 5,
    availableSectionsMm2: [0.75, 1.5, 2.5, 4, 6],
  },
};

const COMMON_PROTECTION_CONFIG: StarterProtectionConfig = {
  "Refrigerateur 12V": {
    ratingA: 15,
    minMarginRatio: 0.5,
    maxMarginRatio: 5,
  },
  "Pompe a eau": {
    ratingA: 10,
    minMarginRatio: 0.5,
    maxMarginRatio: 5,
  },
  "Ports USB": {
    ratingA: 10,
    minMarginRatio: 0.5,
    maxMarginRatio: 8,
  },
  "Eclairage LED": {
    ratingA: 5,
    minMarginRatio: 0.5,
    maxMarginRatio: 8,
  },
};

const P280_RECIPE: StarterRecipe = {
  energy: COMMON_CONSUMERS,
  battery: P280_BATTERY,
  alternator: P280_ALTERNATOR,
  solar: P280_SOLAR,
  charger: P280_CHARGER,
  globalEnergyBalance: P280_GLOBAL_ENERGY_BALANCE,
  circuits: COMMON_CIRCUITS,
  cableConfig: P280_CABLE_CONFIG,
  protectionConfig: COMMON_PROTECTION_CONFIG,
  templateId: "station-aferiy-p280",
};

const VICTRON_LIGHT_RECIPE: StarterRecipe = {
  energy: COMMON_CONSUMERS,
  battery: VICTRON_BATTERY,
  alternator: VICTRON_ALTERNATOR,
  solar: VICTRON_SOLAR,
  charger: VICTRON_CHARGER,
  globalEnergyBalance: VICTRON_GLOBAL_ENERGY_BALANCE,
  circuits: COMMON_CIRCUITS,
  cableConfig: VICTRON_CABLE_CONFIG,
  protectionConfig: COMMON_PROTECTION_CONFIG,
  templateId: "victron-light-van",
};

function defaultRunEngine<TInput, TOutput>(
  actor: OwnershipActor,
  projectId: string,
  engineId: string,
  input: TInput
): Promise<EngineResult<TOutput>> {
  const engine = getEngineRegistry().get(engineId) as BaseEngine<TInput, TOutput> | undefined;
  if (!engine) {
    throw new Error(`Unknown starter engine "${engineId}"`);
  }

  const runner = createEngineRunner();
  return runner.run(actor, projectId, engine, input);
}

function circuitIdByName(output: CircuitEngineOutput, name: string) {
  const circuit = output.circuits.find((item) => item.name === name);
  if (!circuit) {
    throw new Error(`Starter circuit "${name}" was not produced by the engine`);
  }
  return circuit.id;
}

function buildStarterCableInput(
  circuits: CircuitEngineOutput,
  config: StarterCableConfig
): CableEngineInput {
  return {
    cables: (Object.entries(config) as Array<[StarterCircuitName, StarterCableConfig[StarterCircuitName]]>).map(
      ([name, item]) => ({
        circuitId: circuitIdByName(circuits, name),
        oneWayLengthM: item.oneWayLengthM,
        maxVoltageDropPercentage: item.maxVoltageDropPercentage,
        conductorResistivityOhmMm2PerM: 0.0175,
        availableSectionsMm2: item.availableSectionsMm2,
      })
    ),
  };
}

function buildStarterProtectionInput(
  circuits: CircuitEngineOutput,
  config: StarterProtectionConfig
): ProtectionEngineInput {
  return {
    protections: (
      Object.entries(config) as Array<
        [StarterCircuitName, StarterProtectionConfig[StarterCircuitName]]
      >
    ).map(([name, item]) => ({
      circuitId: circuitIdByName(circuits, name),
      minMarginRatio: item.minMarginRatio,
      maxMarginRatio: item.maxMarginRatio,
      catalog: [{ type: "fusible", ratingA: item.ratingA }],
    })),
  };
}

function buildStarterDiagramInput(circuits: CircuitEngineOutput): DiagramEngineInput {
  return {
    circuits: circuits.circuits.map((circuit) => ({ circuitId: circuit.id })),
  };
}

async function applyStarterRecipe(
  actor: OwnershipActor,
  project: Project,
  recipe: StarterRecipe,
  deps: ProjectStarterDeps
) {
  const runEngine = deps.runEngine ?? defaultRunEngine;
  const saveSchema = deps.saveSchema ?? saveProjectSchema;
  const getTemplate = deps.getTemplate ?? getSchemaTemplate;

  await runEngine<EnergyEngineInput, unknown>(
    actor,
    project.id,
    "energy.consumption",
    recipe.energy
  );
  await runEngine<BatteryEngineInput, unknown>(
    actor,
    project.id,
    "battery.sizing",
    recipe.battery
  );
  await runEngine<AlternatorEngineInput, unknown>(
    actor,
    project.id,
    "alternator.charging",
    recipe.alternator
  );
  await runEngine<SolarEngineInput, unknown>(
    actor,
    project.id,
    "solar.production",
    recipe.solar
  );
  await runEngine<ChargerEngineInput, unknown>(
    actor,
    project.id,
    "charger.recharging",
    recipe.charger
  );
  await runEngine<GlobalEnergyBalanceEngineInput, unknown>(
    actor,
    project.id,
    "energyBalance.global",
    recipe.globalEnergyBalance
  );

  const circuitResult = await runEngine<CircuitEngineInput, CircuitEngineOutput>(
    actor,
    project.id,
    "circuit.structure",
    recipe.circuits
  );

  await runEngine<CableEngineInput, unknown>(
    actor,
    project.id,
    "cable.sizing",
    buildStarterCableInput(circuitResult.output, recipe.cableConfig)
  );
  await runEngine<ProtectionEngineInput, unknown>(
    actor,
    project.id,
    "protection.selection",
    buildStarterProtectionInput(circuitResult.output, recipe.protectionConfig)
  );
  await runEngine<DiagramEngineInput, unknown>(
    actor,
    project.id,
    "diagram.model",
    buildStarterDiagramInput(circuitResult.output)
  );

  const template = getTemplate(recipe.templateId);
  if (!template) {
    throw new Error(`Schema template "${recipe.templateId}" was not found`);
  }

  const schema = template.build();
  await saveSchema(actor, project.id, {
    projectName: project.name,
    nodes: schema.nodes as unknown as Prisma.InputJsonValue,
    edges: schema.edges as unknown as Prisma.InputJsonValue,
    thumbnail: null,
  });
}

async function applyAferiyP280Starter(
  actor: OwnershipActor,
  project: Project,
  deps: ProjectStarterDeps
) {
  return applyStarterRecipe(actor, project, P280_RECIPE, deps);
}

async function applyVictronLightStarter(
  actor: OwnershipActor,
  project: Project,
  deps: ProjectStarterDeps
) {
  return applyStarterRecipe(actor, project, VICTRON_LIGHT_RECIPE, deps);
}

export async function applyProjectStarter(
  actor: OwnershipActor,
  project: Project,
  starterId: ProjectStarterId,
  deps: ProjectStarterDeps = {}
) {
  switch (starterId) {
    case "aferiy-p280-guide":
      return applyAferiyP280Starter(actor, project, deps);
    case "victron-light-guide":
      return applyVictronLightStarter(actor, project, deps);
    default: {
      const exhaustiveCheck: never = starterId;
      return exhaustiveCheck;
    }
  }
}

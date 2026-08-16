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

const P280_CONSUMERS: EnergyEngineInput = {
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

const P280_CIRCUITS: CircuitEngineInput = {
  circuits: [
    { name: "Refrigerateur 12V", circuitType: "froid", consumerNames: ["Refrigerateur 12V"] },
    { name: "Pompe a eau", circuitType: "eau", consumerNames: ["Pompe a eau"] },
    { name: "Ports USB", circuitType: "confort", consumerNames: ["Ports USB"] },
    { name: "Eclairage LED", circuitType: "eclairage", consumerNames: ["Eclairage LED"] },
  ],
};

const P280_GLOBAL_ENERGY_BALANCE: GlobalEnergyBalanceEngineInput = {};

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

function buildP280CableInput(circuits: CircuitEngineOutput): CableEngineInput {
  return {
    cables: [
      {
        circuitId: circuitIdByName(circuits, "Refrigerateur 12V"),
        oneWayLengthM: 3,
        maxVoltageDropPercentage: 3,
        conductorResistivityOhmMm2PerM: 0.0175,
        availableSectionsMm2: [1.5, 2.5, 4, 6, 10, 16, 25],
      },
      {
        circuitId: circuitIdByName(circuits, "Pompe a eau"),
        oneWayLengthM: 2.5,
        maxVoltageDropPercentage: 3,
        conductorResistivityOhmMm2PerM: 0.0175,
        availableSectionsMm2: [1.5, 2.5, 4, 6, 10, 16, 25],
      },
      {
        circuitId: circuitIdByName(circuits, "Ports USB"),
        oneWayLengthM: 2,
        maxVoltageDropPercentage: 3,
        conductorResistivityOhmMm2PerM: 0.0175,
        availableSectionsMm2: [0.75, 1.5, 2.5, 4, 6],
      },
      {
        circuitId: circuitIdByName(circuits, "Eclairage LED"),
        oneWayLengthM: 5,
        maxVoltageDropPercentage: 5,
        conductorResistivityOhmMm2PerM: 0.0175,
        availableSectionsMm2: [0.75, 1.5, 2.5, 4, 6],
      },
    ],
  };
}

function buildP280ProtectionInput(circuits: CircuitEngineOutput): ProtectionEngineInput {
  return {
    protections: [
      {
        circuitId: circuitIdByName(circuits, "Refrigerateur 12V"),
        minMarginRatio: 0.5,
        maxMarginRatio: 5,
        catalog: [{ type: "fusible", ratingA: 15 }],
      },
      {
        circuitId: circuitIdByName(circuits, "Pompe a eau"),
        minMarginRatio: 0.5,
        maxMarginRatio: 5,
        catalog: [{ type: "fusible", ratingA: 10 }],
      },
      {
        circuitId: circuitIdByName(circuits, "Ports USB"),
        minMarginRatio: 0.5,
        maxMarginRatio: 8,
        catalog: [{ type: "fusible", ratingA: 10 }],
      },
      {
        circuitId: circuitIdByName(circuits, "Eclairage LED"),
        minMarginRatio: 0.5,
        maxMarginRatio: 8,
        catalog: [{ type: "fusible", ratingA: 5 }],
      },
    ],
  };
}

function buildP280DiagramInput(circuits: CircuitEngineOutput): DiagramEngineInput {
  return {
    circuits: circuits.circuits.map((circuit) => ({ circuitId: circuit.id })),
  };
}

async function applyAferiyP280Starter(
  actor: OwnershipActor,
  project: Project,
  deps: ProjectStarterDeps
) {
  const runEngine = deps.runEngine ?? defaultRunEngine;
  const saveSchema = deps.saveSchema ?? saveProjectSchema;
  const getTemplate = deps.getTemplate ?? getSchemaTemplate;

  await runEngine<EnergyEngineInput, unknown>(
    actor,
    project.id,
    "energy.consumption",
    P280_CONSUMERS
  );
  await runEngine<BatteryEngineInput, unknown>(
    actor,
    project.id,
    "battery.sizing",
    P280_BATTERY
  );
  await runEngine<AlternatorEngineInput, unknown>(
    actor,
    project.id,
    "alternator.charging",
    P280_ALTERNATOR
  );
  await runEngine<SolarEngineInput, unknown>(
    actor,
    project.id,
    "solar.production",
    P280_SOLAR
  );
  await runEngine<ChargerEngineInput, unknown>(
    actor,
    project.id,
    "charger.recharging",
    P280_CHARGER
  );
  await runEngine<GlobalEnergyBalanceEngineInput, unknown>(
    actor,
    project.id,
    "energyBalance.global",
    P280_GLOBAL_ENERGY_BALANCE
  );

  const circuitResult = await runEngine<CircuitEngineInput, CircuitEngineOutput>(
    actor,
    project.id,
    "circuit.structure",
    P280_CIRCUITS
  );

  await runEngine<CableEngineInput, unknown>(
    actor,
    project.id,
    "cable.sizing",
    buildP280CableInput(circuitResult.output)
  );
  await runEngine<ProtectionEngineInput, unknown>(
    actor,
    project.id,
    "protection.selection",
    buildP280ProtectionInput(circuitResult.output)
  );
  await runEngine<DiagramEngineInput, unknown>(
    actor,
    project.id,
    "diagram.model",
    buildP280DiagramInput(circuitResult.output)
  );

  const template = getTemplate("station-aferiy-p280");
  if (!template) {
    throw new Error('Schema template "station-aferiy-p280" was not found');
  }

  const schema = template.build();
  await saveSchema(actor, project.id, {
    projectName: project.name,
    nodes: schema.nodes as unknown as Prisma.InputJsonValue,
    edges: schema.edges as unknown as Prisma.InputJsonValue,
    thumbnail: null,
  });
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
    default: {
      const exhaustiveCheck: never = starterId;
      return exhaustiveCheck;
    }
  }
}

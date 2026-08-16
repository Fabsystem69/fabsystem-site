import assert from "node:assert/strict";
import test from "node:test";
import type { Project, ProjectSchema } from "@/lib/generated/prisma/client";
import type { OwnershipActor } from "@/lib/ownership";
import { applyProjectStarter } from "@/lib/project-starters";
import type { EngineResult } from "@/lib/engines/types";

function createProjectRecord(overrides: Partial<Project> = {}): Project {
  const now = new Date("2026-08-16T00:00:00.000Z");

  return {
    id: overrides.id ?? "proj_1",
    customerId: overrides.customerId ?? "cust_1",
    name: overrides.name ?? "Van VW T5/T6 - installation AFERIY P280",
    assetType: overrides.assetType ?? "VAN",
    voltage: overrides.voltage ?? "V12",
    status: overrides.status ?? "ACTIVE",
    archivedAt: overrides.archivedAt ?? null,
    deleteScheduledAt: overrides.deleteScheduledAt ?? null,
    preScheduleStatus: overrides.preScheduleStatus ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

const OWNER: OwnershipActor = { role: "customer", customerId: "cust_1" };
const MOCK_CIRCUITS = [
  { id: "frigo-12v", name: "Refrigerateur 12V" },
  { id: "pompe-a-eau", name: "Pompe a eau" },
  { id: "ports-usb", name: "Ports USB" },
  { id: "eclairage-led", name: "Eclairage LED" },
];

function createStarterDeps(
  project: Project,
  calls: Array<{ engineId: string; input: unknown }>,
  savedSchemas: Array<{ projectId: string; projectName: string }>,
  templateId: string,
  templateName: string
) {
  return {
    async runEngine<TInput, TOutput>(
      _actor: OwnershipActor,
      projectId: string,
      engineId: string,
      input: TInput
    ): Promise<EngineResult<TOutput>> {
      calls.push({ engineId, input });
      assert.equal(projectId, project.id);

      if (engineId === "circuit.structure") {
        return {
          output: {
            circuits: MOCK_CIRCUITS,
          },
        } as EngineResult<TOutput>;
      }

      return { output: {} as TOutput } as EngineResult<TOutput>;
    },
    async saveSchema(_actor: OwnershipActor, projectId: string, input: { projectName: string; nodes: unknown; edges: unknown; thumbnail?: string | null }) {
      savedSchemas.push({ projectId, projectName: input.projectName });
      return {
        id: "schema_1",
        projectId,
        projectName: input.projectName,
        nodes: input.nodes,
        edges: input.edges,
        thumbnail: input.thumbnail ?? null,
        createdAt: new Date("2026-08-16T00:00:00.000Z"),
        updatedAt: new Date("2026-08-16T00:00:00.000Z"),
      } as ProjectSchema;
    },
    getTemplate(id: string) {
      if (id !== templateId) {
        return undefined;
      }

      return {
        id: templateId,
        label: templateName,
        description: "Template de test",
        build() {
          return {
            projectName: `Gabarit : ${templateName}`,
            nodes: [{ id: "n1", type: "electrical" }] as never[],
            edges: [{ id: "e1", source: "n1", target: "n2" }] as never[],
          };
        },
      };
    },
  };
}

test("applyProjectStarter pre-remplit le guide AFERIY P280 et rattache le schema", async () => {
  const project = createProjectRecord();
  const calls: Array<{ engineId: string; input: unknown }> = [];
  const savedSchemas: Array<{ projectId: string; projectName: string }> = [];

  await applyProjectStarter(
    OWNER,
    project,
    "aferiy-p280-guide",
    createStarterDeps(project, calls, savedSchemas, "station-aferiy-p280", "AFERIY P280 dans un van")
  );

  assert.deepEqual(
    calls.map((call) => call.engineId),
    [
      "energy.consumption",
      "battery.sizing",
      "alternator.charging",
      "solar.production",
      "charger.recharging",
      "energyBalance.global",
      "circuit.structure",
      "cable.sizing",
      "protection.selection",
      "diagram.model",
    ]
  );

  assert.deepEqual(calls[7]?.input, {
    cables: [
      {
        circuitId: "frigo-12v",
        oneWayLengthM: 3,
        maxVoltageDropPercentage: 3,
        conductorResistivityOhmMm2PerM: 0.0175,
        availableSectionsMm2: [1.5, 2.5, 4, 6, 10, 16, 25],
      },
      {
        circuitId: "pompe-a-eau",
        oneWayLengthM: 2.5,
        maxVoltageDropPercentage: 3,
        conductorResistivityOhmMm2PerM: 0.0175,
        availableSectionsMm2: [1.5, 2.5, 4, 6, 10, 16, 25],
      },
      {
        circuitId: "ports-usb",
        oneWayLengthM: 2,
        maxVoltageDropPercentage: 3,
        conductorResistivityOhmMm2PerM: 0.0175,
        availableSectionsMm2: [0.75, 1.5, 2.5, 4, 6],
      },
      {
        circuitId: "eclairage-led",
        oneWayLengthM: 5,
        maxVoltageDropPercentage: 5,
        conductorResistivityOhmMm2PerM: 0.0175,
        availableSectionsMm2: [0.75, 1.5, 2.5, 4, 6],
      },
    ],
  });

  assert.deepEqual(calls[8]?.input, {
    protections: [
      {
        circuitId: "frigo-12v",
        minMarginRatio: 0.5,
        maxMarginRatio: 5,
        catalog: [{ type: "fusible", ratingA: 15 }],
      },
      {
        circuitId: "pompe-a-eau",
        minMarginRatio: 0.5,
        maxMarginRatio: 5,
        catalog: [{ type: "fusible", ratingA: 10 }],
      },
      {
        circuitId: "ports-usb",
        minMarginRatio: 0.5,
        maxMarginRatio: 8,
        catalog: [{ type: "fusible", ratingA: 10 }],
      },
      {
        circuitId: "eclairage-led",
        minMarginRatio: 0.5,
        maxMarginRatio: 8,
        catalog: [{ type: "fusible", ratingA: 5 }],
      },
    ],
  });

  assert.deepEqual(calls[9]?.input, {
    circuits: [
      { circuitId: "frigo-12v" },
      { circuitId: "pompe-a-eau" },
      { circuitId: "ports-usb" },
      { circuitId: "eclairage-led" },
    ],
  });

  assert.deepEqual(savedSchemas, [
    { projectId: project.id, projectName: project.name },
  ]);
});

test("applyProjectStarter pre-remplit le guide Victron leger et rattache le schema", async () => {
  const project = createProjectRecord({
    name: "Van VW T5/T6 - solution Victron legere",
  });
  const calls: Array<{ engineId: string; input: unknown }> = [];
  const savedSchemas: Array<{ projectId: string; projectName: string }> = [];

  await applyProjectStarter(
    OWNER,
    project,
    "victron-light-guide",
    createStarterDeps(project, calls, savedSchemas, "victron-light-van", "Le Victron leger")
  );

  assert.deepEqual(calls[2]?.input, {
    nominalCurrentA: 18,
    availableCurrentA: 18,
    referenceRpm: 2000,
    efficiencyRatio: 0.92,
    rollingDurationHours: 2,
  });

  assert.deepEqual(calls[4]?.input, {
    nominalPowerW: 500,
    maxCurrentA: 35,
    outputVoltageV: 12,
    systemEfficiencyRatio: 0.9,
    chargingDurationHours: 3,
  });

  assert.deepEqual(calls[7]?.input, {
    cables: [
      {
        circuitId: "frigo-12v",
        oneWayLengthM: 3,
        maxVoltageDropPercentage: 3,
        conductorResistivityOhmMm2PerM: 0.0175,
        availableSectionsMm2: [4, 6, 10, 16, 25],
      },
      {
        circuitId: "pompe-a-eau",
        oneWayLengthM: 2.5,
        maxVoltageDropPercentage: 3,
        conductorResistivityOhmMm2PerM: 0.0175,
        availableSectionsMm2: [4, 6, 10, 16, 25],
      },
      {
        circuitId: "ports-usb",
        oneWayLengthM: 2,
        maxVoltageDropPercentage: 3,
        conductorResistivityOhmMm2PerM: 0.0175,
        availableSectionsMm2: [2.5, 4, 6],
      },
      {
        circuitId: "eclairage-led",
        oneWayLengthM: 5,
        maxVoltageDropPercentage: 5,
        conductorResistivityOhmMm2PerM: 0.0175,
        availableSectionsMm2: [0.75, 1.5, 2.5, 4, 6],
      },
    ],
  });

  assert.deepEqual(savedSchemas, [
    { projectId: project.id, projectName: project.name },
  ]);
});

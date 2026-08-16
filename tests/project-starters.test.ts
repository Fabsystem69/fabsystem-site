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

test("applyProjectStarter pre-remplit le guide AFERIY P280 et rattache le schema", async () => {
  const project = createProjectRecord();
  const calls: Array<{ engineId: string; input: unknown }> = [];
  const savedSchemas: Array<{ projectId: string; projectName: string }> = [];

  await applyProjectStarter(OWNER, project, "aferiy-p280-guide", {
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
            circuits: [
              { id: "frigo-12v", name: "Refrigerateur 12V" },
              { id: "pompe-a-eau", name: "Pompe a eau" },
              { id: "ports-usb", name: "Ports USB" },
              { id: "eclairage-led", name: "Eclairage LED" },
            ],
          },
        } as EngineResult<TOutput>;
      }

      return { output: {} as TOutput } as EngineResult<TOutput>;
    },
    async saveSchema(_actor, projectId, input) {
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
    getTemplate() {
      return {
        id: "station-aferiy-p280",
        label: "AFERIY P280 dans un van",
        description: "Template de test",
        build() {
          return {
            projectName: "Gabarit : AFERIY P280 van",
            nodes: [{ id: "n1", type: "electrical" }] as never[],
            edges: [{ id: "e1", source: "n1", target: "n2" }] as never[],
          };
        },
      };
    },
  });

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

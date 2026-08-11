"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EngineActionBar } from "@/components/customer/dashboard/engines/EngineActionBar";
import { useEngineRun } from "@/components/customer/dashboard/engines/useEngineRun";

type CableRow = {
  circuitId: string;
  oneWayLengthM: string;
  maxVoltageDropPercentage: string;
  conductorResistivityOhmMm2PerM: string;
  availableSectionsMm2: string;
};

type CableComputation = {
  circuitId: string;
  retainedSectionMm2: number;
  computedVoltageDropPercentage: number;
};
type CableOutput = { cables: CableComputation[] };

function emptyRow(circuitId: string): CableRow {
  return {
    circuitId,
    oneWayLengthM: "3",
    maxVoltageDropPercentage: "3",
    conductorResistivityOhmMm2PerM: "0.0175",
    availableSectionsMm2: "1.5,2.5,4,6,10,16,25",
  };
}

// Moteur réel : cable.sizing (lib/engines/cable-engine.ts). Lit circuit.<id>
// déjà retenu — la liste des circuits disponibles vient du module Circuits.
export function CableModule({
  projectId,
  circuits,
}: {
  projectId: string;
  circuits: { id: string; name: string }[];
}) {
  const [rows, setRows] = useState<CableRow[]>(
    circuits.length > 0 ? [emptyRow(circuits[0].id)] : []
  );
  const { output, warnings, error, pending, justRetained, run } = useEngineRun(
    projectId,
    "cable.sizing"
  );
  const result = output as CableOutput | null;

  function updateRow(index: number, patch: Partial<CableRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function buildInput() {
    return {
      cables: rows
        .filter((row) => row.circuitId)
        .map((row) => ({
          circuitId: row.circuitId,
          oneWayLengthM: Number(row.oneWayLengthM),
          maxVoltageDropPercentage: Number(row.maxVoltageDropPercentage),
          conductorResistivityOhmMm2PerM: Number(row.conductorResistivityOhmMm2PerM),
          availableSectionsMm2: row.availableSectionsMm2
            .split(",")
            .map((v) => Number(v.trim()))
            .filter((v) => Number.isFinite(v) && v > 0),
        })),
    };
  }

  if (circuits.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-base font-semibold text-neutral-950">Câbles</h3>
        <p className="mt-2 text-sm text-neutral-600">
          Retenez d&apos;abord au moins un circuit dans le module Circuits pour dimensionner ses
          câbles.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-neutral-950">Câbles</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Dimensionne les conducteurs de chaque circuit déjà retenu.
      </p>

      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="grid gap-2 rounded-lg border border-neutral-200 p-3 sm:grid-cols-5">
            <select
              value={row.circuitId}
              onChange={(e) => updateRow(index, { circuitId: e.target.value })}
              className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400"
            >
              {circuits.map((circuit) => (
                <option key={circuit.id} value={circuit.id}>
                  {circuit.name}
                </option>
              ))}
            </select>
            <input type="number" placeholder="Longueur aller (m)" value={row.oneWayLengthM} onChange={(e) => updateRow(index, { oneWayLengthM: e.target.value })} className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
            <input type="number" placeholder="Chute de tension max (%)" value={row.maxVoltageDropPercentage} onChange={(e) => updateRow(index, { maxVoltageDropPercentage: e.target.value })} className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
            <input type="number" step="0.0001" placeholder="Résistivité (Ω·mm²/m)" value={row.conductorResistivityOhmMm2PerM} onChange={(e) => updateRow(index, { conductorResistivityOhmMm2PerM: e.target.value })} className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
            <input type="text" placeholder="Sections dispo (mm²)" value={row.availableSectionsMm2} onChange={(e) => updateRow(index, { availableSectionsMm2: e.target.value })} className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
          </div>
        ))}
        <div className="flex gap-3">
          <button type="button" onClick={() => setRows((current) => [...current, emptyRow(circuits[0].id)])} className="text-sm font-medium text-brand-700 underline underline-offset-4">
            + Ajouter un câble
          </button>
          {rows.length > 1 ? (
            <button type="button" onClick={() => setRows((current) => current.slice(0, -1))} className="text-sm font-medium text-neutral-500 underline underline-offset-4">
              Retirer le dernier
            </button>
          ) : null}
        </div>
      </div>

      {result ? (
        <div className="mt-4 space-y-2 rounded-lg bg-neutral-50 p-4 text-sm">
          {result.cables.map((cable) => (
            <p key={cable.circuitId}>
              {circuits.find((c) => c.id === cable.circuitId)?.name ?? cable.circuitId} — section
              retenue <strong>{cable.retainedSectionMm2} mm²</strong> (chute {cable.computedVoltageDropPercentage.toFixed(2)} %)
            </p>
          ))}
        </div>
      ) : null}

      <EngineActionBar
        pending={pending}
        hasOutput={Boolean(output)}
        justRetained={justRetained}
        error={error}
        warnings={warnings}
        onCalculate={() => run(buildInput(), false)}
        onRetain={() => run(buildInput(), true)}
      />
    </Card>
  );
}

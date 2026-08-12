"use client";

import { useState } from "react";
import { EngineActionBar } from "@/components/customer/dashboard/engines/EngineActionBar";
import { useEngineRun } from "@/components/customer/dashboard/engines/useEngineRun";

type CircuitRow = {
  name: string;
  circuitType: string;
  consumerNames: string;
};

type CircuitComputation = { id: string; name: string; cumulatedPowerW: number };
type CircuitOutput = { circuits: CircuitComputation[] };

function emptyRow(): CircuitRow {
  return { name: "", circuitType: "", consumerNames: "" };
}

// Moteur réel : circuit.structure (lib/engines/circuit-engine.ts). Lit
// energy.consumers déjà retenu — un consommateur cité ici doit correspondre
// à un nom déjà saisi dans le module Énergie.
export function CircuitModule({
  projectId,
  consumerNames,
}: {
  projectId: string;
  consumerNames: string[];
}) {
  const [rows, setRows] = useState<CircuitRow[]>([emptyRow()]);
  const { output, warnings, notices, error, pending, justRetained, run } = useEngineRun(
    projectId,
    "circuit.structure"
  );
  const result = output as CircuitOutput | null;

  function updateRow(index: number, patch: Partial<CircuitRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function buildInput() {
    return {
      circuits: rows
        .filter((row) => row.name.trim())
        .map((row) => ({
          name: row.name.trim(),
          circuitType: row.circuitType.trim() || undefined,
          consumerNames: row.consumerNames
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
        })),
    };
  }

  return (
    <>
      <p className="text-xs text-neutral-500">
        {consumerNames.length > 0
          ? `Consommateurs disponibles : ${consumerNames.join(", ")}.`
          : "Aucun consommateur retenu pour l'instant — complétez d'abord le module Énergie."}
      </p>

      <div className="mt-3 space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="grid gap-2 rounded-lg border border-neutral-200 p-3 sm:grid-cols-3">
            <input
              type="text"
              placeholder="Nom du circuit (ex : Éclairage)"
              value={row.name}
              onChange={(e) => updateRow(index, { name: e.target.value })}
              className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400"
            />
            <input
              type="text"
              placeholder="Type (optionnel)"
              value={row.circuitType}
              onChange={(e) => updateRow(index, { circuitType: e.target.value })}
              className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400"
            />
            <input
              type="text"
              placeholder="Consommateurs (séparés par des virgules)"
              value={row.consumerNames}
              onChange={(e) => updateRow(index, { consumerNames: e.target.value })}
              className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
        ))}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setRows((current) => [...current, emptyRow()])}
            className="text-sm font-medium text-brand-700 underline underline-offset-4"
          >
            + Ajouter un circuit
          </button>
          {rows.length > 1 ? (
            <button
              type="button"
              onClick={() => setRows((current) => current.slice(0, -1))}
              className="text-sm font-medium text-neutral-500 underline underline-offset-4"
            >
              Retirer le dernier
            </button>
          ) : null}
        </div>
      </div>

      {result ? (
        <div className="mt-4 space-y-2 rounded-lg bg-neutral-50 p-4 text-sm">
          {result.circuits.map((circuit) => (
            <p key={circuit.id}>
              {circuit.name} — <strong>{circuit.cumulatedPowerW.toFixed(0)} W</strong> (id : {circuit.id})
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
        notices={notices}
        onCalculate={() => run(buildInput(), false)}
        onRetain={() => run(buildInput(), true)}
      />
    </>
  );
}

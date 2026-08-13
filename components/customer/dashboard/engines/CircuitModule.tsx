"use client";

import { useState } from "react";
import { EngineActionBar } from "@/components/customer/dashboard/engines/EngineActionBar";
import { useEngineRun } from "@/components/customer/dashboard/engines/useEngineRun";

type CircuitRow = {
  name: string;
  circuitType: string;
  consumerNames: string[];
};

type CircuitComputation = { id: string; name: string; cumulatedPowerW: number };
type CircuitOutput = { circuits: CircuitComputation[] };

function emptyRow(): CircuitRow {
  return { name: "", circuitType: "", consumerNames: [] };
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

  function toggleConsumer(index: number, consumerName: string) {
    setRows((current) =>
      current.map((row, i) => {
        if (i !== index) return row;
        const has = row.consumerNames.includes(consumerName);
        return {
          ...row,
          consumerNames: has
            ? row.consumerNames.filter((name) => name !== consumerName)
            : [...row.consumerNames, consumerName],
        };
      })
    );
  }

  function buildInput() {
    return {
      circuits: rows
        .filter((row) => row.name.trim())
        .map((row) => ({
          name: row.name.trim(),
          circuitType: row.circuitType.trim() || undefined,
          consumerNames: row.consumerNames,
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
          <div key={index} className="space-y-2 rounded-lg border border-neutral-200 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
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
            </div>
            {consumerNames.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {consumerNames.map((name) => {
                  const selected = row.consumerNames.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleConsumer(index, name)}
                      aria-pressed={selected}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        selected
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-300 text-neutral-600 hover:border-neutral-500"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            ) : null}
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
              {circuit.name} — <strong>{circuit.cumulatedPowerW.toFixed(0)} W</strong>
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

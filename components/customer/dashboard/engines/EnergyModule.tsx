"use client";

import { useState } from "react";
import { EngineActionBar } from "@/components/customer/dashboard/engines/EngineActionBar";
import { useEngineRun } from "@/components/customer/dashboard/engines/useEngineRun";

type ConsumerRow = {
  name: string;
  powerW: string;
  dailyUsageHours: string;
  quantity: string;
};

type EnergyOutput = {
  totalPowerW: number;
  dailyWh: number;
  dailyAh: number;
  maxCurrentA: number;
  complete: boolean;
};

function emptyRow(): ConsumerRow {
  return { name: "", powerW: "", dailyUsageHours: "", quantity: "1" };
}

// Moteur réel : energy.consumption (lib/engines/energy-engine.ts). Aucune
// formule n'est reproduite ici — ce module ne fait que collecter les
// entrées et afficher le résultat renvoyé par le moteur.
export function EnergyModule({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<ConsumerRow[]>([emptyRow()]);
  const { output, warnings, notices, error, pending, justRetained, run } = useEngineRun(
    projectId,
    "energy.consumption"
  );
  const result = output as EnergyOutput | null;

  function updateRow(index: number, patch: Partial<ConsumerRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function buildInput() {
    return {
      consumers: rows
        .filter((row) => row.name.trim())
        .map((row) => ({
          name: row.name.trim(),
          powerW: row.powerW ? Number(row.powerW) : undefined,
          dailyUsageHours: row.dailyUsageHours ? Number(row.dailyUsageHours) : 0,
          quantity: row.quantity ? Number(row.quantity) : 1,
        })),
    };
  }

  return (
    <>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="grid gap-2 rounded-lg border border-neutral-200 p-3 sm:grid-cols-4">
            <input
              type="text"
              placeholder="Nom (ex : Frigo)"
              value={row.name}
              onChange={(e) => updateRow(index, { name: e.target.value })}
              className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400"
            />
            <input
              type="number"
              placeholder="Puissance (W)"
              value={row.powerW}
              onChange={(e) => updateRow(index, { powerW: e.target.value })}
              className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400"
            />
            <input
              type="number"
              placeholder="Usage quotidien (h)"
              value={row.dailyUsageHours}
              onChange={(e) => updateRow(index, { dailyUsageHours: e.target.value })}
              className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400"
            />
            <input
              type="number"
              placeholder="Quantité"
              value={row.quantity}
              onChange={(e) => updateRow(index, { quantity: e.target.value })}
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
            + Ajouter un appareil
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
        <div className="mt-4 grid gap-3 rounded-lg bg-neutral-50 p-4 text-sm sm:grid-cols-2">
          <p>Puissance totale : <strong>{result.totalPowerW.toFixed(0)} W</strong></p>
          <p>Consommation quotidienne : <strong>{result.dailyWh.toFixed(0)} Wh</strong> ({result.dailyAh.toFixed(1)} Ah)</p>
          <p>Courant maximal simultané : <strong>{result.maxCurrentA.toFixed(1)} A</strong></p>
          <p>{result.complete ? "Toutes les valeurs sont calculables." : "Certains appareils manquent de données pour être calculés."}</p>
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

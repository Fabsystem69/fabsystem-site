"use client";

import { useState } from "react";
import { EngineActionBar } from "@/components/customer/dashboard/engines/EngineActionBar";
import { useEngineRun } from "@/components/customer/dashboard/engines/useEngineRun";
import { PRESETS_APPAREILS, type EnergyPresetItem } from "@/lib/outils/energy-presets";

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
//
// Une seule ligne est éditable à la fois (editingIndex) : les appareils déjà
// saisis se replient en résumé compact. Un formulaire à 4 champs par
// appareil, tous ouverts en permanence, devient très long sur mobile dès
// 6-8 appareils (cas réel d'un van) — le repli résout ça sans changer la
// donnée collectée.
export function EnergyModule({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<ConsumerRow[]>([emptyRow()]);
  const [editingIndex, setEditingIndex] = useState<number | null>(0);
  const [showPicker, setShowPicker] = useState(false);
  const { output, warnings, notices, error, pending, justRetained, run } = useEngineRun(
    projectId,
    "energy.consumption"
  );
  const result = output as EnergyOutput | null;

  function updateRow(index: number, patch: Partial<ConsumerRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, i) => i !== index));
    setEditingIndex((current) => {
      if (current === null) return null;
      if (current === index) return null;
      return current > index ? current - 1 : current;
    });
  }

  function addRow() {
    setRows((current) => [...current, emptyRow()]);
    setEditingIndex(rows.length);
  }

  // Appareil déjà complet (nom + puissance + heures connus) : ajouté replié
  // directement, pas besoin de repasser par le mode édition — même logique
  // que addPresetAppareil sur l'outil public /outils/bilan-consommation.
  function addPresetRow(preset: EnergyPresetItem) {
    setRows((current) => [
      ...current,
      { name: preset.nom, powerW: preset.puissance, dailyUsageHours: String(preset.heures), quantity: "1" },
    ]);
    setEditingIndex(null);
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
      <div className="space-y-2">
        {rows.map((row, index) => {
          const isEditing = editingIndex === index || !row.name.trim();

          if (!isEditing) {
            return (
              <div
                key={index}
                className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium text-neutral-900">{row.name}</span>
                  {row.powerW ? <span className="text-neutral-500"> · {row.powerW} W</span> : null}
                  {row.dailyUsageHours ? (
                    <span className="text-neutral-500"> · {row.dailyUsageHours} h/j</span>
                  ) : null}
                  {row.quantity && row.quantity !== "1" ? (
                    <span className="text-neutral-500"> · ×{row.quantity}</span>
                  ) : null}
                </span>
                <span className="flex shrink-0 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(index)}
                    className="text-xs font-medium text-brand-700 underline underline-offset-4"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="text-xs font-medium text-neutral-500 underline underline-offset-4"
                  >
                    Retirer
                  </button>
                </span>
              </div>
            );
          }

          return (
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
              {row.name.trim() ? (
                <div className="sm:col-span-4">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="text-xs font-medium text-brand-700 underline underline-offset-4"
                  >
                    Replier
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addRow}
            className="text-sm font-medium text-brand-700 underline underline-offset-4"
          >
            + Ajouter un appareil
          </button>
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:border-brand-400"
          >
            {showPicker ? "Masquer" : "+"} Appareils courants
          </button>
        </div>

        {showPicker ? (
          <div className="mt-3 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            {PRESETS_APPAREILS.map((cat) => (
              <div key={cat.groupe}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{cat.groupe}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {cat.items.map((item) => (
                    <button
                      key={item.nom}
                      type="button"
                      onClick={() => addPresetRow(item)}
                      className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-700 hover:border-brand-400 hover:text-brand-700"
                    >
                      {item.nom} <span className="text-neutral-400">{item.puissance}W · {item.heures}h/j</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
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

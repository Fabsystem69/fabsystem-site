"use client";

import { useState } from "react";
import { computeInverterSize, type ApplianceLoad } from "@/lib/calc/inverter-size";
import { OpenProjectLink } from "@/components/outils/project-bridge/OpenProjectLink";

let nextId = 1;
type Row = ApplianceLoad & { id: number };

const DEFAULT_ROWS: Row[] = [
  { id: nextId++, label: "Chargeur d'ordinateur", watts: 65, surge: false },
  { id: nextId++, label: "Réfrigérateur à compression", watts: 90, surge: true },
];

export default function InverterSizeCalculator() {
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS);
  const [tension, setTension] = useState<"12" | "24" | "48">("12");
  const [longueur, setLongueur] = useState("2");

  const t = parseFloat(tension) as 12 | 24 | 48;
  const appliances: ApplianceLoad[] = rows.filter((r) => r.watts > 0);
  const hasResult = appliances.length > 0;
  const result = hasResult ? computeInverterSize(appliances, t, parseFloat(longueur) || 2) : null;

  const inputClass = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20";
  const labelClass = "block text-xs font-semibold text-neutral-700 mb-1.5";

  function updateRow(id: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: nextId++, label: "", watts: 0, surge: false }]);
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Inputs ── */}
      <div className="space-y-5">
        <div>
          <span className={labelClass}>Appareils branchés sur l&apos;onduleur</span>
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nom de l'appareil"
                  value={row.label}
                  onChange={(e) => updateRow(row.id, { label: e.target.value })}
                  className={`${inputClass} flex-1`}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="W"
                  value={row.watts || ""}
                  onChange={(e) => updateRow(row.id, { watts: parseFloat(e.target.value) || 0 })}
                  className={`${inputClass} w-20`}
                />
                <label className="flex shrink-0 items-center gap-1 text-[11px] text-neutral-500" title="Fort appel au démarrage (compresseur, moteur)">
                  <input type="checkbox" checked={row.surge} onChange={(e) => updateRow(row.id, { surge: e.target.checked })} />
                  Moteur
                </label>
                <button type="button" onClick={() => removeRow(row.id)} className="shrink-0 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-400 hover:text-red-600" title="Retirer">
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addRow} className="mt-2 rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:border-brand-400 hover:text-brand-700">
            + Ajouter un appareil
          </button>
          <p className="mt-1.5 text-xs text-neutral-400">
            Cochez « Moteur » pour un appareil à compresseur/moteur (frigo, micro-ondes, perceuse…) — l&apos;appel au démarrage dépasse largement sa puissance nominale.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Tension système</label>
            <select value={tension} onChange={(e) => setTension(e.target.value as "12" | "24" | "48")} className={inputClass}>
              <option value="12">12 V</option>
              <option value="24">24 V</option>
              <option value="48">48 V</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Longueur câble batterie → onduleur (m)</label>
            <input type="number" min="0" step="0.5" value={longueur} onChange={(e) => setLongueur(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* ── Résultat ── */}
      <div>
        {hasResult && result ? (
          <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>

            <div>
              <p className="text-xs text-neutral-500">Onduleur recommandé</p>
              <p className="text-4xl font-bold text-neutral-950">{result.recommendedInverterW.toLocaleString("fr-FR")} W</p>
              <p className="mt-1 text-sm font-semibold text-brand-700">Pointe estimée : {result.peakW.toFixed(0)} W</p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-brand-200 pt-4">
              <div>
                <p className="text-xs text-neutral-500">Charge continue</p>
                <p className="text-lg font-bold text-neutral-900">{result.continuousW.toFixed(0)} W</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Courant DC batterie</p>
                <p className="text-lg font-bold text-neutral-900">{result.dcCurrentA.toFixed(0)} A</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Fusible DC conseillé</p>
                <p className="text-lg font-bold text-neutral-900">
                  {result.dcFuseA !== null ? `${result.dcFuseA} A` : "> 400 A"} ({result.dcFuseFormatLabel})
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Câble DC conseillé</p>
                <p className="text-lg font-bold text-neutral-900">{result.dcCableSectionMm2} mm²</p>
              </div>
            </div>

            <div className="rounded-lg bg-neutral-100 border border-neutral-200 px-3 py-2 text-xs text-neutral-600">
              ℹ️ Ce calcul suppose tous les appareils cochés en même temps. En pratique, dimensionnez surtout pour votre plus gros appareil utilisé seul plus vos charges permanentes (veille onduleur, etc.).
            </div>

            <p className="text-xs text-neutral-500">Rendement onduleur 90 % appliqué. Câble dimensionné pour une chute de tension de 3 %.</p>
            <OpenProjectLink label="Continuer dans mon projet" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
            <p className="text-center text-sm text-neutral-400">Ajoutez au moins un appareil avec sa puissance pour dimensionner l&apos;onduleur.</p>
          </div>
        )}
      </div>
    </div>
  );
}

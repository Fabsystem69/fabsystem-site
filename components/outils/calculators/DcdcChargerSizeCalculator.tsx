"use client";

import { useState } from "react";
import { computeDcdcChargerSize, type DcdcBatteryChemistry } from "@/lib/calc/dcdc-charger-size";
import { OpenProjectLink } from "@/components/outils/project-bridge/OpenProjectLink";

export default function DcdcChargerSizeCalculator() {
  const [alternatorA, setAlternatorA] = useState("120");
  const [chemistry, setChemistry] = useState<DcdcBatteryChemistry>("lithium");
  const [capacite, setCapacite] = useState("");
  const [driveHours, setDriveHours] = useState("2");

  const alt = parseFloat(alternatorA) || 0;
  const cap = parseFloat(capacite) || 0;
  const hours = parseFloat(driveHours) || 0;
  const hasResult = alt > 0 && cap > 0;
  const result = hasResult ? computeDcdcChargerSize(alt, chemistry, cap, hours) : null;

  const inputClass = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20";
  const labelClass = "block text-xs font-semibold text-neutral-700 mb-1.5";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Inputs ── */}
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Courant nominal alternateur (A)</label>
            <input type="number" min="0" placeholder="ex : 120" value={alternatorA} onChange={(e) => setAlternatorA(e.target.value)} className={inputClass} />
            <p className="mt-1 text-xs text-neutral-400">Indiqué sur l&apos;alternateur ou la fiche véhicule.</p>
          </div>
          <div>
            <label className={labelClass}>Chimie batterie servitude</label>
            <select value={chemistry} onChange={(e) => setChemistry(e.target.value as DcdcBatteryChemistry)} className={inputClass}>
              <option value="lithium">Lithium LiFePO₄</option>
              <option value="agm-gel">AGM / Gel (plomb)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Capacité batterie servitude (Ah)</label>
            <input type="number" min="0" placeholder="ex : 200" value={capacite} onChange={(e) => setCapacite(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Temps de conduite par jour (h)</label>
            <input type="number" min="0" step="0.5" value={driveHours} onChange={(e) => setDriveHours(e.target.value)} className={inputClass} />
            <p className="mt-1 text-xs text-neutral-400">Sert uniquement à estimer les Ah rechargés par trajet.</p>
          </div>
        </div>
      </div>

      {/* ── Résultat ── */}
      <div>
        {hasResult && result ? (
          <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>

            <div>
              <p className="text-xs text-neutral-500">Chargeur DC-DC recommandé</p>
              <p className="text-4xl font-bold text-neutral-950">{result.recommendedChargerA} A</p>
              <p className="mt-1 text-sm font-semibold text-brand-700">Facteur limitant : {result.limitingFactor}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-brand-200 pt-4">
              <div>
                <p className="text-xs text-neutral-500">Max sûr côté alternateur</p>
                <p className="text-lg font-bold text-neutral-900">{result.maxFromAlternatorA.toFixed(0)} A</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Max accepté par la batterie</p>
                <p className="text-lg font-bold text-neutral-900">{result.maxFromBatteryA.toFixed(0)} A</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Fusible conseillé</p>
                <p className="text-lg font-bold text-neutral-900">
                  {result.dcFuseA !== null ? `${result.dcFuseA} A` : "> 400 A"} ({result.dcFuseFormatLabel})
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Recharge par trajet</p>
                <p className="text-lg font-bold text-neutral-900">≈ {result.ahPerDrive.toFixed(0)} Ah</p>
              </div>
            </div>

            {result.limitingFactor === "alternateur" ? (
              <div className="rounded-lg bg-neutral-100 border border-neutral-200 px-3 py-2 text-xs text-neutral-600">
                ℹ️ Tirer plus de 35 % en continu sur un alternateur d&apos;origine peut l&apos;user prématurément (bobinage, diodes). C&apos;est ce qui borne le calibre ici, pas la batterie.
              </div>
            ) : (
              <div className="rounded-lg bg-neutral-100 border border-neutral-200 px-3 py-2 text-xs text-neutral-600">
                ℹ️ La batterie n&apos;accepte pas plus que ce taux de charge en toute sécurité ({chemistry === "lithium" ? "0,5 C" : "0,2 C"}) — un chargeur plus puissant ne rechargerait pas plus vite.
              </div>
            )}

            <p className="text-xs text-neutral-500">Un chargeur DC-DC (pas un simple câble direct) reste nécessaire pour un profil de charge correct et pour isoler la batterie moteur.</p>
            <OpenProjectLink label="Continuer dans mon projet" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
            <p className="text-center text-sm text-neutral-400">Renseignez l&apos;alternateur et la capacité de la batterie pour dimensionner le chargeur.</p>
          </div>
        )}
      </div>
    </div>
  );
}

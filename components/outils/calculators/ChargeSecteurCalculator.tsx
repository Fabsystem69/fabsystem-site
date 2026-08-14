"use client";

import { useState } from "react";
import { computeChargeSecteur, type ChargeChemistry } from "@/lib/calc/charge-secteur";
import { OpenProjectLink } from "@/components/outils/project-bridge/OpenProjectLink";

const BORNES = [
  { value: "6", label: "6 A — petite borne camping" },
  { value: "10", label: "10 A — borne camping standard" },
  { value: "16", label: "16 A — borne port / camping (la plus courante)" },
  { value: "32", label: "32 A — borne renforcée" },
];

export default function ChargeSecteurCalculator() {
  const [chemistry, setChemistry] = useState<ChargeChemistry>("agm-gel");
  const [tension, setTension] = useState<"12" | "24">("12");
  const [capacite, setCapacite] = useState("");
  const [borne, setBorne] = useState("16");

  const cap = parseFloat(capacite) || 0;
  const availableA = parseFloat(borne) || 0;
  const hasResult = cap > 0;
  const t = tension === "24" ? 24 : 12;

  const result = hasResult ? computeChargeSecteur(chemistry, t, cap, availableA) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Inputs ── */}
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Type de batterie</label>
            <select
              value={chemistry}
              onChange={(e) => setChemistry(e.target.value as ChargeChemistry)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            >
              <option value="agm-gel">AGM / Gel (plomb)</option>
              <option value="lithium">Lithium LiFePO₄</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Tension banc batterie</label>
            <select
              value={tension}
              onChange={(e) => setTension(e.target.value as "12" | "24")}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            >
              <option value="12">12 V</option>
              <option value="24">24 V</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Capacité totale du banc (Ah)</label>
            <input
              type="number"
              min="0"
              placeholder="ex : 200"
              value={capacite}
              onChange={(e) => setCapacite(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Borne / prise secteur disponible</label>
            <select
              value={borne}
              onChange={(e) => setBorne(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            >
              {BORNES.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-neutral-400">Calibre du disjoncteur de la borne de camping ou de port (230 V monophasé).</p>
          </div>
        </div>
      </div>

      {/* ── Résultat ── */}
      <div>
        {hasResult && result ? (
          <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>

            <div>
              <p className="text-xs text-neutral-500">Courant de charge recommandé</p>
              <p className="text-4xl font-bold text-neutral-950">{result.chargeCurrentA.toFixed(0)} A</p>
              <p className="mt-1 text-sm font-semibold text-brand-700">
                Chargeur ≥ {result.dcPowerW.toFixed(0)} W ({t} V)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-brand-200 pt-4">
              <div>
                <p className="text-xs text-neutral-500">Courant tiré côté secteur</p>
                <p className={`text-lg font-bold ${result.fitsAvailable ? "text-neutral-900" : "text-red-600"}`}>
                  {result.mainsCurrentA.toFixed(1)} A
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Borne choisie</p>
                <p className="text-lg font-bold text-neutral-900">{availableA} A</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Fusible/disjoncteur DC conseillé</p>
                <p className="text-lg font-bold text-neutral-900">{result.dcFuseA}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Taux de charge appliqué</p>
                <p className="text-lg font-bold text-neutral-900">{chemistry === "lithium" ? "0,5 C" : "0,2 C"}</p>
              </div>
            </div>

            {!result.fitsAvailable && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                🔴 Le courant de charge recommandé dépasse la borne choisie ({availableA} A). Limitez le chargeur à environ {result.maxChargeCurrentForAvailableA.toFixed(0)} A côté batterie, ou utilisez une borne de calibre supérieur.
              </div>
            )}

            <div className="rounded-lg bg-neutral-100 border border-neutral-200 px-3 py-2 text-xs text-neutral-600">
              ℹ️ Prévoir en amont un disjoncteur différentiel 30 mA (obligatoire pour une alimentation secteur sur bateau ou véhicule) et un disjoncteur secteur calibré juste au-dessus du courant tiré.
            </div>

            <p className="text-xs text-neutral-500">
              Rendement chargeur 87 % appliqué. Taux de charge prudent par défaut — un BMS lithium peut parfois accepter davantage : vérifiez sa fiche technique.
            </p>
            <OpenProjectLink label="Continuer dans mon projet" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
            <p className="text-center text-sm text-neutral-400">
              Renseignez la capacité du banc de batteries pour dimensionner le chargeur secteur.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

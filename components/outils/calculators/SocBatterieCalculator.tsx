"use client";

import { useState } from "react";
import { estimateSoc, getSocTable, type BatteryChemistry } from "@/lib/calc/battery-soc";
import { OpenProjectLink } from "@/components/outils/project-bridge/OpenProjectLink";

export default function SocBatterieCalculator() {
  const [chemistry, setChemistry] = useState<BatteryChemistry>("agm-gel");
  const [nominal, setNominal] = useState<"12" | "24">("12");
  const [tension, setTension] = useState("");
  const [repos, setRepos] = useState("ok");
  const [capacite, setCapacite] = useState("");

  const v = parseFloat(tension);
  const hasResult = tension !== "" && !Number.isNaN(v) && v > 0;
  const nominalNum = nominal === "24" ? 24 : 12;
  const result = hasResult ? estimateSoc(chemistry, nominalNum, v) : null;
  const cap = parseFloat(capacite) || 0;
  const ahRestants = result ? (cap * result.soc) / 100 : 0;

  const niveau = (soc: number) => {
    if (soc >= 80) return { color: "text-green-600", label: "Batterie bien chargée" };
    if (soc >= 50) return { color: "text-green-600", label: "Charge correcte" };
    if (soc >= 30) return { color: "text-yellow-600", label: "Charge faible — pensez à recharger" };
    return { color: "text-red-600", label: "Charge critique — rechargez rapidement" };
  };

  const table = getSocTable(chemistry).map((p) => ({
    soc: p.soc,
    voltage: p.voltage12V * (nominalNum / 12),
  }));

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Inputs ── */}
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Type de batterie</label>
            <select
              value={chemistry}
              onChange={(e) => setChemistry(e.target.value as BatteryChemistry)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            >
              <option value="agm-gel">AGM / Gel (plomb)</option>
              <option value="lithium">Lithium LiFePO₄</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Tension nominale</label>
            <select
              value={nominal}
              onChange={(e) => setNominal(e.target.value as "12" | "24")}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            >
              <option value="12">12 V</option>
              <option value="24">24 V</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Tension mesurée (V)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder={nominal === "12" ? "ex : 12.40" : "ex : 24.80"}
              value={tension}
              onChange={(e) => setTension(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
            <p className="mt-1.5 text-xs text-neutral-400">Mesurée au multimètre, aux bornes de la batterie.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Batterie au repos depuis</label>
            <select
              value={repos}
              onChange={(e) => setRepos(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            >
              <option value="charge">Encore en charge / décharge (mesure en cours d&apos;usage)</option>
              <option value="short">Moins de 30 min sans charge ni consommation</option>
              <option value="ok">Plus de 30 min sans charge ni consommation</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Capacité batterie (Ah) <span className="font-normal text-neutral-400">— optionnel</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="ex : 200"
              value={capacite}
              onChange={(e) => setCapacite(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
            <p className="mt-1.5 text-xs text-neutral-400">Pour convertir le résultat en Ah restants.</p>
          </div>
        </div>

        {/* Table de référence */}
        <div className="overflow-x-auto rounded-2xl border border-neutral-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600">SoC</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600">
                  Tension à vide ({nominal} V)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {table.map((row) => (
                <tr key={row.soc} className={row.soc === result?.soc ? "bg-brand-50/60" : ""}>
                  <td className="px-4 py-2 font-bold text-neutral-900">{row.soc} %</td>
                  <td className="px-4 py-2 text-neutral-600">{row.voltage.toFixed(2)} V</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Résultat ── */}
      <div>
        {hasResult && result ? (
          <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>

            <div>
              <p className="text-xs text-neutral-500">État de charge estimé</p>
              <p className="text-4xl font-bold text-neutral-950">{result.soc} %</p>
              <p className={`mt-1 text-sm font-semibold ${niveau(result.soc).color}`}>
                {niveau(result.soc).label}
              </p>
            </div>

            {cap > 0 && (
              <div className="grid grid-cols-2 gap-3 border-t border-brand-200 pt-4">
                <div>
                  <p className="text-xs text-neutral-500">Capacité restante</p>
                  <p className="text-lg font-bold text-neutral-900">{ahRestants.toFixed(0)} Ah</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Capacité totale</p>
                  <p className="text-lg font-bold text-neutral-900">{cap.toFixed(0)} Ah</p>
                </div>
              </div>
            )}

            {repos !== "ok" && (
              <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700">
                🟡 {repos === "charge"
                  ? "Mesure prise en charge ou en consommation : la tension est faussée, laissez reposer la batterie puis remesurez."
                  : "Moins de 30 min de repos : le résultat est approximatif, attendez idéalement 1 à 2 h pour une lecture fiable."}
              </div>
            )}

            {chemistry === "lithium" && (
              <div className="rounded-lg bg-neutral-100 border border-neutral-200 px-3 py-2 text-xs text-neutral-600">
                ℹ️ La courbe du lithium LiFePO₄ est très plate entre 20 % et 90 % : une petite erreur de mesure change beaucoup le résultat. Pour un suivi précis, préférez un moniteur de batterie (shunt) ou le BMS.
              </div>
            )}

            {result.outOfRange && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                🔴 Tension hors de la plage habituelle pour ce type de batterie — vérifiez la mesure ou l&apos;état de la batterie.
              </div>
            )}

            <p className="text-xs text-neutral-500">
              Estimation par tension à vide, valeurs indicatives constructeur. Varie selon l&apos;âge, la température et l&apos;état réel de la batterie.
            </p>
            <OpenProjectLink label="Continuer dans mon projet" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
            <p className="text-center text-sm text-neutral-400">
              Renseignez la tension mesurée pour estimer l&apos;état de charge.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

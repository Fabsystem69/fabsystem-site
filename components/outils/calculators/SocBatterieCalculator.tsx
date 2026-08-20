"use client";

import { useState } from "react";
import { estimateSoc, estimateVoltageForSoc, getSocTable, RECOMMENDED_MIN_SOC, type BatteryChemistry } from "@/lib/calc/battery-soc";
import { OpenProjectLink } from "@/components/outils/project-bridge/OpenProjectLink";
import { ToggleGroup } from "@/components/outils/calc-ui/ToggleGroup";
import { CalcSlider } from "@/components/outils/calc-ui/CalcSlider";
import { CalcSafetyNotice } from "@/components/outils/calc-ui/CalcSafetyNotice";
import { CalcGuidesLink } from "@/components/outils/calc-ui/CalcGuidesLink";

const CHEMISTRY_NOTES: Record<BatteryChemistry, string[]> = {
  lithium: [
    "Courbe très plate : la tension varie peu entre 90% et 20% — une petite erreur de mesure change beaucoup le résultat estimé.",
    "Tension à vide fiable seulement après 30+ minutes sans charge ni consommation.",
    "Le BMS peut couper avant 0% pour protéger les cellules — la plage réellement exploitable est en pratique plus proche de 10-100%.",
  ],
  "agm-gel": [
    "Courbe plus linéaire que le lithium — la tension à vide reste un indicateur d'état de charge assez fiable.",
    "Tension à vide fiable seulement après 30+ minutes sans charge ni consommation.",
    "Décharger sous 50% de façon répétée réduit fortement la durée de vie de ce type de batterie.",
  ],
};

// Retour utilisateur (comparatif Wireframe, "Battery Voltage Chart — State
// of Charge Lookup") : ajout de la tension 48V, de la recherche inverse
// (SoC → tension attendue), d'une barre visuelle du résultat, et d'un
// avertissement sous le SoC minimum recommandé par chimie — même
// convention que USABLE_CAPACITY_RATIO déjà établie ailleurs sur le site
// (90% LiFePO4, 50% AGM/Gel). Notes spécifiques par chimie affichées au
// lieu d'un unique bloc générique.
export default function SocBatterieCalculator() {
  const [chemistry, setChemistry] = useState<BatteryChemistry>("lithium");
  const [nominal, setNominal] = useState<"12" | "24" | "48">("12");
  const [mode, setMode] = useState<"voltage-to-soc" | "soc-to-voltage">("voltage-to-soc");
  const [tension, setTension] = useState("");
  const [targetSoc, setTargetSoc] = useState(50);
  const [repos, setRepos] = useState("ok");
  const [capacite, setCapacite] = useState("");

  const nominalNum = nominal === "48" ? 48 : nominal === "24" ? 24 : 12;
  const v = parseFloat(tension);
  const hasVoltageResult = mode === "voltage-to-soc" && tension !== "" && !Number.isNaN(v) && v > 0;

  const result = hasVoltageResult ? estimateSoc(chemistry, nominalNum, v) : null;
  const reverseVoltage = mode === "soc-to-voltage" ? estimateVoltageForSoc(chemistry, nominalNum, targetSoc) : null;

  const cap = parseFloat(capacite) || 0;
  const ahRestants = result ? (cap * result.soc) / 100 : 0;
  const minSoc = RECOMMENDED_MIN_SOC[chemistry];

  const niveau = (soc: number) => {
    if (soc >= 80) return { color: "text-green-600", bar: "bg-green-500", label: "Batterie bien chargée" };
    if (soc >= 50) return { color: "text-green-600", bar: "bg-green-500", label: "Charge correcte" };
    if (soc >= 30) return { color: "text-yellow-600", bar: "bg-yellow-500", label: "Charge faible — pensez à recharger" };
    return { color: "text-red-600", bar: "bg-red-500", label: "Charge critique — rechargez rapidement" };
  };

  const table = getSocTable(chemistry).map((p) => ({ soc: p.soc, voltage: p.voltage12V * (nominalNum / 12) }));

  const labelClass = "block text-xs font-semibold text-neutral-700 mb-1.5";
  const inputClass = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20";

  return (
    <div className="space-y-6">
      <div>
        <span className={labelClass}>Chimie de la batterie</span>
        <ToggleGroup
          value={chemistry}
          onChange={setChemistry}
          options={[
            { value: "lithium", label: "LiFePO₄ (Lithium)" },
            { value: "agm-gel", label: "AGM / Gel (plomb)" },
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className={labelClass}>Tension système</span>
          <ToggleGroup
            value={nominal}
            onChange={setNominal}
            options={[
              { value: "12", label: "12 V" },
              { value: "24", label: "24 V" },
              { value: "48", label: "48 V" },
            ]}
          />
        </div>
        <div>
          <span className={labelClass}>Je veux chercher…</span>
          <ToggleGroup
            value={mode}
            onChange={setMode}
            options={[
              { value: "voltage-to-soc", label: "Tension → SoC" },
              { value: "soc-to-voltage", label: "SoC → Tension" },
            ]}
          />
        </div>
      </div>

      {mode === "voltage-to-soc" ? (
        <div>
          <label className={labelClass}>Tension mesurée (V)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder={nominal === "12" ? "ex : 12.40" : nominal === "24" ? "ex : 24.80" : "ex : 49.60"}
            value={tension}
            onChange={(e) => setTension(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-neutral-400">Mesurée au multimètre, aux bornes de la batterie — pas une valeur à estimer au curseur, la précision compte ici.</p>
        </div>
      ) : (
        <CalcSlider label="État de charge recherché" value={targetSoc} onChange={setTargetSoc} min={0} max={100} step={5} unit="%" />
      )}

      <div>
        <label className={labelClass}>Batterie au repos depuis</label>
        <select value={repos} onChange={(e) => setRepos(e.target.value)} className={inputClass}>
          <option value="charge">Encore en charge / décharge (mesure en cours d&apos;usage)</option>
          <option value="short">Moins de 30 min sans charge ni consommation</option>
          <option value="ok">Plus de 30 min sans charge ni consommation</option>
        </select>
      </div>

      {mode === "voltage-to-soc" && (
        <div>
          <label className={labelClass}>
            Capacité batterie (Ah) <span className="font-normal text-neutral-400">— optionnel</span>
          </label>
          <input type="number" min="0" placeholder="ex : 200" value={capacite} onChange={(e) => setCapacite(e.target.value)} className={inputClass} />
          <p className="mt-1.5 text-xs text-neutral-400">Pour convertir le résultat en Ah restants.</p>
        </div>
      )}

      {/* ── Résultat ── */}
      {mode === "voltage-to-soc" && hasVoltageResult && result ? (
        <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>

          <div>
            <p className="text-xs text-neutral-500">État de charge estimé</p>
            <p className="text-4xl font-bold text-neutral-950">
              {result.soc}% <span className="text-lg font-semibold text-neutral-500">({v.toFixed(2)} V)</span>
            </p>
            <p className={`mt-1 text-sm font-semibold ${niveau(result.soc).color}`}>{niveau(result.soc).label}</p>
          </div>

          <div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200">
              <div className={`h-full rounded-full ${niveau(result.soc).bar}`} style={{ width: `${Math.min(100, Math.max(0, result.soc))}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
              <span>0% — Vide</span>
              <span>Min recommandé : {minSoc}%</span>
              <span>100% — Plein</span>
            </div>
          </div>

          {result.soc < minSoc && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
              🔴 Sous le SoC minimum recommandé ({minSoc}%) pour {chemistry === "lithium" ? "du LiFePO₄" : "de l'AGM/Gel"} — {chemistry === "lithium" ? "le BMS peut se déconnecter pour protéger les cellules." : "la durée de vie de la batterie en souffre."}
            </div>
          )}

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

          {result.outOfRange && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
              Tension hors de la plage habituelle pour ce type de batterie — vérifiez la mesure ou l&apos;état de la batterie.
            </div>
          )}

          <OpenProjectLink label="Continuer dans mon projet" />
        </div>
      ) : mode === "soc-to-voltage" && reverseVoltage !== null ? (
        <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>
          <p className="text-xs text-neutral-500">Tension à vide attendue à {targetSoc}% de charge</p>
          <p className="text-4xl font-bold text-neutral-950">{reverseVoltage.toFixed(2)} V</p>
          {targetSoc < minSoc && (
            <p className="text-xs font-semibold text-red-600">Sous le SoC minimum recommandé ({minSoc}%) pour cette chimie.</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
          <p className="text-center text-sm text-neutral-400">Renseignez la tension mesurée pour estimer l&apos;état de charge.</p>
        </div>
      )}

      {/* Table de référence */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600">SoC</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600">Tension à vide ({nominal} V)</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {table.map((row) => (
              <tr key={row.soc} className={row.soc === result?.soc ? "bg-brand-50/60" : ""}>
                <td className="px-4 py-2 font-bold text-neutral-900">{row.soc}%</td>
                <td className="px-4 py-2 text-neutral-600">{row.voltage.toFixed(2)} V</td>
                <td className={`px-4 py-2 text-xs font-semibold ${row.soc < minSoc ? "text-red-600" : row.soc < 70 ? "text-orange-600" : "text-green-600"}`}>
                  {row.soc < minSoc ? "Critique" : row.soc < 70 ? "Correct" : "Bon"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600">
        <p className="mb-1.5 font-semibold text-neutral-700">{chemistry === "lithium" ? "LiFePO₄ — points d'attention" : "AGM / Gel — points d'attention"}</p>
        <ul className="space-y-1">
          {CHEMISTRY_NOTES[chemistry].map((note) => (
            <li key={note}>• {note}</li>
          ))}
        </ul>
      </div>

      <CalcGuidesLink
        examples={[
          { slug: "schema-bateau-complet-lynx", title: "Schéma bateau complet avec bus Lynx" },
          { slug: "schema-victron-leger-van", title: "Schéma Victron léger pour van" },
        ]}
      />

      <CalcSafetyNotice
        standards={[
          "Tables tension/SoC constructeur usuelles (AGM/Gel plomb, LiFePO4 4S) — valeurs indicatives, pas une lecture certifiée",
          "Tension à vide fiable uniquement après repos ≥30 minutes sans charge ni consommation",
          "SoC minimum recommandé par chimie (10% LiFePO4, 50% AGM/Gel) — même convention que le reste du site",
        ]}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { computeWireSize } from "@/lib/calc/wire-size";
import { WIRE_TABLE, type InsulationRating, type AmbientTemp, type CableBundling } from "@/lib/calc/wire-ampacity";
import { AddCableToProjectButton } from "@/components/outils/project-bridge/AddCableToProjectButton";
import { ToggleGroup } from "@/components/outils/calc-ui/ToggleGroup";
import { CalcSlider } from "@/components/outils/calc-ui/CalcSlider";
import { StatGrid } from "@/components/outils/calc-ui/StatGrid";
import { CalcSafetyNotice } from "@/components/outils/calc-ui/CalcSafetyNotice";
import { CalcGuidesLink } from "@/components/outils/calc-ui/CalcGuidesLink";

const AMBIENT_OPTIONS: AmbientTemp[] = [25, 30, 35, 40, 45, 50, 55, 60];

const EXEMPLES_MARINE = [
  { equipement: "Pompe de cale automatique", intensite: "3–5 A", section: "1,5 mm²", awg: "AWG 16", fusible: "10 A", notes: "Câble court, toujours en 12V" },
  { equipement: "Pompe de cale haute capacité", intensite: "8–15 A", section: "2,5 mm²", awg: "AWG 14", fusible: "20 A", notes: "Selon longueur de câble" },
  { equipement: "Frigo 12V (compresseur)", intensite: "4–8 A", section: "2,5 mm²", awg: "AWG 14", fusible: "15 A", notes: "Pointe au démarrage ×2–3" },
  { equipement: "Éclairage LED cabine", intensite: "1–3 A", section: "1,5 mm²", awg: "AWG 16", fusible: "5 A", notes: "Par circuit/zone" },
  { equipement: "VHF fixe", intensite: "6 A (TX)", section: "2,5 mm²", awg: "AWG 14", fusible: "10 A", notes: "Courant de transmission" },
  { equipement: "AIS / instruments", intensite: "1–2 A", section: "1,5 mm²", awg: "AWG 16", fusible: "5 A", notes: "Bus NMEA 2000 séparé" },
  { equipement: "Pilote automatique", intensite: "5–30 A", section: "4–6 mm²", awg: "AWG 10–12", fusible: "40 A", notes: "Variable selon cap et mer" },
  { equipement: "Guindeau électrique", intensite: "60–150 A", section: "16–35 mm²", awg: "AWG 4–6", fusible: "150 A", notes: "Câble direct sur batterie" },
  { equipement: "Treuil de grand-voile", intensite: "30–80 A", section: "10–16 mm²", awg: "AWG 6–8", fusible: "80 A", notes: "Pointe courte, câble court" },
  { equipement: "Convertisseur / onduleur 1000W", intensite: "85 A @ 12V", section: "16 mm²", awg: "AWG 6", fusible: "100 A", notes: "Câble le plus court possible" },
  { equipement: "Chargeur de quai 30A", intensite: "30 A", section: "6 mm²", awg: "AWG 10", fusible: "40 A", notes: "Côté DC / sortie chargeur" },
  { equipement: "Régulateur MPPT (sortie)", intensite: "Selon capacité", section: "6–10 mm²", awg: "AWG 8–10", fusible: "= courant max MPPT +25%" },
];

// Fusion Section de câble + AWG↔mm² — retour utilisateur (comparatif
// Wireframe, "Wire Size Calculator") : deux manques réels comblés en même
// temps. 1) Notre ancien calculateur ne vérifiait QUE la chute de tension,
// jamais l'ampacité (le courant max que le câble supporte sans
// surchauffer) — exactement le risque que Wireframe met en avant en
// premier ("Undersized cables overheat and can cause fires"). 2) "je pense
// qu'on peux fusionner mm awg aussi avec" — l'équivalent AWG est affiché
// directement dans le résultat au lieu d'un second outil séparé ; la table
// de référence complète et les exemples marine sont conservés en bas de
// page plutôt que perdus.
export default function SectionCableCalculator() {
  const [mode, setMode] = useState<"amps" | "watts">("amps");
  const [amps, setAmps] = useState(0);
  const [watts, setWatts] = useState(0);
  const [systemVoltage, setSystemVoltage] = useState<"12" | "24" | "48">("12");
  const [lengthOneWayM, setLengthOneWayM] = useState(3);
  const [continuous, setContinuous] = useState(true);
  const [insulation, setInsulation] = useState<InsulationRating>("pvc");
  const [ambient, setAmbient] = useState<AmbientTemp>(30);
  const [bundling, setBundling] = useState<CableBundling>("single");
  const [maxDropPct, setMaxDropPct] = useState<"3" | "5">("3");

  const [activeTab, setActiveTab] = useState<"resultat" | "table" | "exemples">("resultat");
  const [search, setSearch] = useState("");
  const [awgInput, setAwgInput] = useState("");
  const [mm2Input, setMm2Input] = useState("");

  const t = parseFloat(systemVoltage);
  const loadCurrentA = mode === "amps" ? amps : t > 0 ? watts / t : 0;
  const hasResult = loadCurrentA > 0 && lengthOneWayM > 0;

  const result = hasResult
    ? computeWireSize(loadCurrentA, continuous, lengthOneWayM, t, parseFloat(maxDropPct), insulation, ambient, bundling)
    : null;

  const labelClass = "block text-xs font-semibold text-neutral-700 mb-1.5";
  const inputClass = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20";

  const filteredExemples = EXEMPLES_MARINE.filter(
    (e) => e.equipement.toLowerCase().includes(search.toLowerCase()) || (e.notes ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const awgToMm2Result = (() => {
    const row = WIRE_TABLE.find((r) => r.awg === awgInput.trim());
    return row ? `${row.mm2} mm²  (I max ≈ ${row.ampacityA} A)` : null;
  })();
  const mm2ToAwgResult = (() => {
    const val = parseFloat(mm2Input);
    if (!val) return null;
    const row = WIRE_TABLE.find((r) => r.mm2 >= val);
    return row ? `AWG ${row.awg}  (I max ≈ ${row.ampacityA} A)` : "Câble > AWG 4/0 — hors table standard";
  })();

  return (
    <div className="space-y-6">
      <div>
        <span className={labelClass}>Je connais…</span>
        <ToggleGroup
          value={mode}
          onChange={setMode}
          options={[
            { value: "amps", label: "Le courant (A)" },
            { value: "watts", label: "La puissance (W)" },
          ]}
        />
      </div>

      {mode === "amps" ? (
        <CalcSlider label="Courant du circuit" value={amps} onChange={setAmps} min={0} max={200} step={1} unit="A" />
      ) : (
        <CalcSlider label="Puissance de l'appareil" value={watts} onChange={setWatts} min={0} max={3000} step={10} unit="W" />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className={labelClass}>Tension système</span>
          <ToggleGroup
            value={systemVoltage}
            onChange={setSystemVoltage}
            options={[
              { value: "12", label: "12 V" },
              { value: "24", label: "24 V" },
              { value: "48", label: "48 V" },
            ]}
          />
        </div>
        <div>
          <span className={labelClass}>Circuit</span>
          <ToggleGroup
            value={continuous ? "continu" : "non-continu"}
            onChange={(v) => setContinuous(v === "continu")}
            options={[
              { value: "continu", label: "Continu (≥3h)" },
              { value: "non-continu", label: "Non continu" },
            ]}
          />
        </div>
      </div>

      <CalcSlider
        label="Longueur simple aller"
        value={lengthOneWayM}
        onChange={setLengthOneWayM}
        min={0}
        max={20}
        step={0.5}
        unit="m"
        helpText={`Aller-retour : ${(lengthOneWayM * 2).toFixed(1)} m — le calcul applique automatiquement le facteur ×2.`}
      />

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-500">Type de câble et facteurs de dérating</p>
        <div className="space-y-4">
          <div>
            <span className={labelClass}>Isolant</span>
            <ToggleGroup
              value={insulation}
              onChange={setInsulation}
              options={[
                { value: "pvc", label: "PVC (70°C)" },
                { value: "xlpe", label: "XLPE/EPR (90°C)" },
                { value: "silicone", label: "Silicone (105°C)" },
              ]}
            />
          </div>

          <div>
            <span className={labelClass}>Température ambiante</span>
            <div className="grid grid-cols-4 gap-2">
              {AMBIENT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAmbient(opt)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    ambient === opt ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {opt}°C
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={labelClass}>Regroupement de câbles</span>
            <ToggleGroup
              value={bundling}
              onChange={setBundling}
              options={[
                { value: "single", label: "Câble seul" },
                { value: "small", label: "Petit faisceau (2-4)" },
                { value: "large", label: "Grand faisceau (5+)" },
              ]}
            />
          </div>

          <div>
            <span className={labelClass}>Chute de tension max</span>
            <ToggleGroup
              value={maxDropPct}
              onChange={setMaxDropPct}
              options={[
                { value: "3", label: "3% — Éclairage (EN 1648-2)" },
                { value: "5", label: "5% — Général" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* ── Résultat ── */}
      {hasResult && result ? (
        <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>

          <div>
            <p className="text-xs text-neutral-500">Section recommandée</p>
            <p className="text-4xl font-bold text-neutral-950">
              {result.recommendedMm2} mm² <span className="text-2xl text-neutral-500">(AWG {result.recommendedAwg})</span>
            </p>
            <p className="mt-1 text-sm font-semibold text-brand-700">Facteur limitant : {result.limitingFactor}</p>
          </div>

          <p className="border-t border-brand-200 pt-4 text-sm text-neutral-700">
            {loadCurrentA.toFixed(1)} A × {continuous ? "1,25 (continu)" : "1 (non continu)"} ={" "}
            <span className="font-semibold text-neutral-950">{result.designCurrentA.toFixed(1)} A</span> courant de dimensionnement
          </p>

          <StatGrid
            stats={[
              { label: "Ampacité dérated", value: `${result.deratedAmpacityA.toFixed(0)} A`, tone: result.deratedAmpacityA >= result.designCurrentA ? "success" : "danger" },
              { label: "Chute de tension", value: `${result.voltageDropV.toFixed(2)} V (${result.voltageDropPct.toFixed(1)}%)`, tone: result.voltageDropPct <= parseFloat(maxDropPct) ? "success" : "danger" },
            ]}
          />

          <div className="rounded-lg bg-neutral-100 border border-neutral-200 px-3 py-2 text-xs text-neutral-600">
            ℹ️ Placez toujours le fusible côté source, au calibre ≤ ampacité dérated du câble — voir le{" "}
            <a href="/outils/fusible" className="font-semibold underline underline-offset-2">
              calculateur de fusible
            </a>
            .
          </div>

          <AddCableToProjectButton form={{ intensite: String(loadCurrentA), longueur: String(lengthOneWayM), chute: maxDropPct, tension: systemVoltage }} />
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
          <p className="text-center text-sm text-neutral-400">Renseignez le courant et la longueur pour obtenir la section recommandée.</p>
        </div>
      )}

      {hasResult && result && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">Comparatif des sections</p>
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                <th className="pb-2 font-semibold">Section</th>
                <th className="pb-2 font-semibold">Ampacité dérated</th>
                <th className="pb-2 font-semibold">Ampacité</th>
                <th className="pb-2 font-semibold">Chute</th>
                <th className="pb-2 font-semibold">Chute %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {result.comparison.map((row) => (
                <tr key={row.mm2} className={row.mm2 === result.recommendedMm2 ? "bg-brand-50/60" : ""}>
                  <td className="py-2 font-semibold text-neutral-900">
                    {row.mm2} mm² (AWG {row.awg})
                  </td>
                  <td className={`py-2 ${row.ampacityPass ? "text-green-600" : "text-red-600"}`}>
                    {row.ampacityPass ? "✓" : "✗"} {row.deratedAmpacityA.toFixed(0)} A
                  </td>
                  <td className="py-2 text-neutral-500">{row.baseAmpacityA} A</td>
                  <td className="py-2 text-neutral-600">{row.voltageDropV.toFixed(2)} V</td>
                  <td className={`py-2 ${row.voltageDropPass ? "text-green-600" : "text-red-600"}`}>
                    {row.voltageDropPass ? "✓" : "✗"} {row.voltageDropPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Référence AWG ↔ mm² (fusion de l'ancien calculateur AWG) ── */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
          {(["table", "exemples"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${activeTab === tab ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
            >
              {tab === "table" ? "⚡ Table AWG ↔ mm²" : "🚢 Usages typiques bateau / van"}
            </button>
          ))}
        </div>

        {activeTab === "table" && (
          <div className="mt-4 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">AWG → mm²</p>
                <select value={awgInput} onChange={(e) => setAwgInput(e.target.value)} className={inputClass}>
                  <option value="">Choisir AWG…</option>
                  {WIRE_TABLE.map((r) => (
                    <option key={r.awg} value={r.awg}>
                      AWG {r.awg}
                    </option>
                  ))}
                </select>
                {awgInput && (
                  <div className="rounded-lg bg-white border border-brand-200 px-4 py-2.5">
                    <span className="text-sm font-bold text-neutral-900">{awgToMm2Result}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">mm² → AWG</p>
                <select value={mm2Input} onChange={(e) => setMm2Input(e.target.value)} className={inputClass}>
                  <option value="">Choisir mm²…</option>
                  {WIRE_TABLE.filter((r) => r.mm2 >= 0.5).map((r) => (
                    <option key={r.mm2} value={String(r.mm2)}>
                      {r.mm2} mm²
                    </option>
                  ))}
                </select>
                {mm2Input && (
                  <div className="rounded-lg bg-white border border-brand-200 px-4 py-2.5">
                    <span className="text-sm font-bold text-neutral-900">{mm2ToAwgResult}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-neutral-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600">AWG</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600">mm²</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600">Intensité max (A)</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600">Usage courant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {WIRE_TABLE.map((row) => (
                    <tr key={row.awg} className={row.mm2 === result?.recommendedMm2 ? "bg-brand-50/40" : ""}>
                      <td className="px-4 py-2.5 font-bold text-neutral-900">AWG {row.awg}</td>
                      <td className="px-4 py-2.5 font-semibold text-neutral-700">{row.mm2} mm²</td>
                      <td className="px-4 py-2.5 text-neutral-600">{row.ampacityA} A</td>
                      <td className="px-4 py-2.5 text-xs text-neutral-500">{row.usage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-400">
              Intensités max indicatives en air libre (câble cuivre 60°C, référence 30°C ambiant). Utilisez le calculateur ci-dessus pour une section dérated selon vos conditions réelles.
            </p>
          </div>
        )}

        {activeTab === "exemples" && (
          <div className="mt-4 space-y-4">
            <input
              type="text"
              placeholder="Filtrer… (ex : guindeau, frigo, pilote)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClass}
            />
            <div className="overflow-x-auto rounded-2xl border border-neutral-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600">Équipement</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600">Intensité</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600">Section</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600">AWG</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600">Fusible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredExemples.map((e) => (
                    <tr key={e.equipement} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-semibold text-neutral-900">{e.equipement}</td>
                      <td className="px-4 py-3 text-neutral-600">{e.intensite}</td>
                      <td className="px-4 py-3 font-bold text-brand-700">{e.section}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{e.awg}</td>
                      <td className="px-4 py-3 text-neutral-600">{e.fusible}</td>
                    </tr>
                  ))}
                  {filteredExemples.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">
                        Aucun équipement trouvé pour &quot;{search}&quot;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CalcGuidesLink
        examples={[
          { slug: "schema-electrique-van-complet", title: "Schéma électrique van complet 12V" },
          { slug: "schema-bateau-complet-lynx", title: "Schéma bateau complet avec bus Lynx" },
        ]}
      />

      <CalcSafetyNotice
        standards={[
          "EN 1648-2 — Installations électriques 12V des véhicules de loisir (chute de tension max 3% éclairage)",
          "Câble multi-brins souple (classe 5) recommandé en installation mobile — pas de câble rigide monobrin",
          "Marge de 25% sur le courant de dimensionnement d'un circuit continu — même convention que le reste du site",
          "Facteurs de dérating (isolant, température, regroupement) — approximations prudentes, à confirmer avec la fiche technique du câble choisi",
        ]}
      />
    </div>
  );
}

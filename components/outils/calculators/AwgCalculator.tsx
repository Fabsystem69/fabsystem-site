"use client";

import { useState } from "react";

// Extrait tel quel de components/CalcSection.tsx (UI-7.1) — aucun
// changement de comportement.
const AWG_TABLE = [
  { awg: "28", mm2: 0.08, a_max: 0.5 },
  { awg: "26", mm2: 0.14, a_max: 1 },
  { awg: "24", mm2: 0.20, a_max: 2 },
  { awg: "22", mm2: 0.35, a_max: 3 },
  { awg: "20", mm2: 0.50, a_max: 5 },
  { awg: "18", mm2: 0.75, a_max: 7 },
  { awg: "16", mm2: 1.50, a_max: 13 },
  { awg: "14", mm2: 2.50, a_max: 17 },
  { awg: "12", mm2: 4.00, a_max: 23 },
  { awg: "10", mm2: 6.00, a_max: 33 },
  { awg: "8",  mm2: 10.0, a_max: 46 },
  { awg: "6",  mm2: 16.0, a_max: 62 },
  { awg: "4",  mm2: 25.0, a_max: 84 },
  { awg: "2",  mm2: 35.0, a_max: 108 },
  { awg: "1/0", mm2: 50.0, a_max: 140 },
  { awg: "2/0", mm2: 70.0, a_max: 165 },
  { awg: "3/0", mm2: 95.0, a_max: 195 },
  { awg: "4/0", mm2: 120.0, a_max: 230 },
];

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
  { equipement: "Moteur électrique hors-bord 1kW", intensite: "85 A @ 12V", section: "16–25 mm²", awg: "AWG 4–6", fusible: "100 A", notes: "Court circuit direct batterie" },
  { equipement: "Spot cockpit / feu de mouillage", intensite: "1–2 A", section: "1,5 mm²", awg: "AWG 16", fusible: "5 A", notes: "" },
  { equipement: "Van — Compresseur frigo", intensite: "5–10 A", section: "2,5 mm²", awg: "AWG 14", fusible: "15 A", notes: "" },
  { equipement: "Van — Éclairage habitacle", intensite: "2–4 A", section: "1,5 mm²", awg: "AWG 16", fusible: "5 A", notes: "" },
  { equipement: "Van — Chargeur ordi/USB", intensite: "3–5 A", section: "1,5 mm²", awg: "AWG 16", fusible: "10 A", notes: "" },
];

export default function AwgCalculator() {
  const [search, setSearch] = useState("");
  const [awgInput, setAwgInput] = useState("");
  const [mm2Input, setMm2Input] = useState("");
  const [activeTab, setActiveTab] = useState<"table" | "exemples">("table");

  // Conversion AWG → mm²
  const awgToMm2 = () => {
    const row = AWG_TABLE.find((r) => r.awg === awgInput.trim());
    return row ? `${row.mm2} mm²  (I max ≈ ${row.a_max} A)` : null;
  };

  // Conversion mm² → AWG (section normalisée la plus proche supérieure)
  const mm2ToAwg = () => {
    const val = parseFloat(mm2Input);
    if (!val) return null;
    const row = AWG_TABLE.find((r) => r.mm2 >= val);
    return row ? `AWG ${row.awg}  (I max ≈ ${row.a_max} A)` : "Câble > AWG 4/0 — hors table standard";
  };

  const filteredExemples = EXEMPLES_MARINE.filter(
    (e) =>
      e.equipement.toLowerCase().includes(search.toLowerCase()) ||
      (e.notes ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
        {(["table", "exemples"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors duration-150 ${
              activeTab === tab
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab === "table" ? "⚡ Table AWG ↔ mm²" : "🚢 Usages typiques bateau / van"}
          </button>
        ))}
      </div>

      {activeTab === "table" && (
        <div className="space-y-6">
          {/* Convertisseur rapide */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">AWG → mm²</p>
              <div className="flex gap-2">
                <select
                  value={awgInput}
                  onChange={(e) => setAwgInput(e.target.value)}
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                >
                  <option value="">Choisir AWG…</option>
                  {AWG_TABLE.map((r) => (
                    <option key={r.awg} value={r.awg}>AWG {r.awg}</option>
                  ))}
                </select>
              </div>
              {awgInput && (
                <div className="rounded-lg bg-white border border-brand-200 px-4 py-2.5">
                  <span className="text-sm font-bold text-neutral-900">{awgToMm2()}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">mm² → AWG</p>
              <div className="flex gap-2">
                <select
                  value={mm2Input}
                  onChange={(e) => setMm2Input(e.target.value)}
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                >
                  <option value="">Choisir mm²…</option>
                  {[0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120].map((v) => (
                    <option key={v} value={String(v)}>{v} mm²</option>
                  ))}
                </select>
              </div>
              {mm2Input && (
                <div className="rounded-lg bg-white border border-brand-200 px-4 py-2.5">
                  <span className="text-sm font-bold text-neutral-900">{mm2ToAwg()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Table complète */}
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
                {AWG_TABLE.map((row) => {
                  const usages: Record<string, string> = {
                    "28": "Signaux, bus NMEA",
                    "26": "Signaux, capteurs",
                    "24": "Signaux, télécommandes",
                    "22": "Signaux, LED",
                    "20": "LED, signaux",
                    "18": "LED, instruments, VHF",
                    "16": "Éclairage, pompe cale, frigo",
                    "14": "Frigo, VHF, pompe cale",
                    "12": "Frigo compresseur, pilote",
                    "10": "Pilote auto, chargeur MPPT",
                    "8":  "Moteur trim, treuil léger",
                    "6":  "Guindeau léger, onduleur, MPPT",
                    "4":  "Guindeau, moteur élec.",
                    "2":  "Guindeau lourd, démarreur",
                    "1/0": "Moteur principal, banc batteries",
                    "2/0": "Banc batteries, liaison principale",
                    "3/0": "Câble de masse, grosse liaison",
                    "4/0": "Masse principale, démarreur diesel",
                  };
                  const highlight = ["16","14","12","10","8","6"].includes(row.awg);
                  return (
                    <tr key={row.awg} className={highlight ? "bg-brand-50/40" : ""}>
                      <td className="px-4 py-2.5 font-bold text-neutral-900">AWG {row.awg}</td>
                      <td className="px-4 py-2.5 font-semibold text-neutral-700">{row.mm2} mm²</td>
                      <td className="px-4 py-2.5 text-neutral-600">{row.a_max} A</td>
                      <td className="px-4 py-2.5 text-xs text-neutral-500">{usages[row.awg] ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-400">
            Intensités max indicatives en air libre (câble cuivre 60°C). Réduisez de 20–30 % en conduit ou faisceau groupé. Valeurs CEI 60228 / ABYC E-11.
          </p>
        </div>
      )}

      {activeTab === "exemples" && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Filtrer… (ex : guindeau, frigo, pilote)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-600 hidden lg:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredExemples.map((e, i) => (
                  <tr key={i} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-neutral-900">{e.equipement}</td>
                    <td className="px-4 py-3 text-neutral-600">{e.intensite}</td>
                    <td className="px-4 py-3 font-bold text-brand-700">{e.section}</td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">{e.awg}</td>
                    <td className="px-4 py-3 text-neutral-600">{e.fusible}</td>
                    <td className="px-4 py-3 text-xs text-neutral-400 hidden lg:table-cell">{e.notes}</td>
                  </tr>
                ))}
                {filteredExemples.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-400">
                      Aucun équipement trouvé pour &quot;{search}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-400">
            Valeurs indicatives pour des câbles cuivre de bonne qualité, pose en air libre sur courte distance. Utilisez le calculateur de section pour un dimensionnement précis selon votre longueur réelle.
          </p>
        </div>
      )}
    </div>
  );
}

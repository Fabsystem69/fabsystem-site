"use client";

import { useEffect, useState } from "react";
import { writeBilanSnapshot, type Appareil } from "@/lib/calc/bilan-storage";

// Extrait de components/CalcSection.tsx (UI-7.1). Comportement de calcul
// inchangé. Seule différence : au lieu de remonter son état à un
// composant parent monté sur la même page (ancienne architecture
// monopage), ce calculateur écrit son résultat dans le stockage local du
// navigateur (lib/calc/bilan-storage.ts) à chaque changement, pour que la
// page /outils/autonomie-batterie puisse le relire — voir
// docs/audits/UI-7.1-PAGES-OUTILS.md, "Bilan vers Autonomie".
const PRESETS_APPAREILS: { groupe: string; items: { nom: string; puissance: string; heures: string }[] }[] = [
  {
    groupe: "Froid",
    items: [
      { nom: "Frigo 12V compresseur (petit)", puissance: "40", heures: "12" },
      { nom: "Frigo 12V compresseur (grand)", puissance: "75", heures: "14" },
    ],
  },
  {
    groupe: "Éclairage",
    items: [
      { nom: "Éclairage LED cabine (circuit)", puissance: "25", heures: "5" },
      { nom: "Spot LED cockpit", puissance: "10", heures: "4" },
      { nom: "Feux de navigation", puissance: "10", heures: "8" },
      { nom: "Feu de mouillage", puissance: "5", heures: "10" },
    ],
  },
  {
    groupe: "Navigation & électronique",
    items: [
      { nom: "VHF fixe", puissance: "6", heures: "4" },
      { nom: "GPS / traceur de chart", puissance: "15", heures: "8" },
      { nom: "AIS récepteur", puissance: "3", heures: "24" },
      { nom: "Pilote automatique (navigation)", puissance: "20", heures: "8" },
      { nom: "Sondeur / loch", puissance: "5", heures: "8" },
    ],
  },
  {
    groupe: "Confort & divers",
    items: [
      { nom: "Pompe à eau électrique", puissance: "30", heures: "1" },
      { nom: "Chargeur téléphone / USB", puissance: "10", heures: "4" },
      { nom: "Chargeur ordinateur portable", puissance: "45", heures: "3" },
      { nom: "Radio FM / DAB+", puissance: "5", heures: "6" },
      { nom: "Convertisseur 230V (usage ponctuel)", puissance: "150", heures: "1" },
    ],
  },
  {
    groupe: "Manœuvres (usage court)",
    items: [
      { nom: "Guindeau électrique", puissance: "1200", heures: "0.05" },
      { nom: "Winch électrique", puissance: "500", heures: "0.08" },
    ],
  },
  {
    groupe: "Van / camping-car",
    items: [
      { nom: "Van — Chauffage diesel (ventilateur)", puissance: "20", heures: "8" },
      { nom: "Van — Pompe eau (usage)", puissance: "30", heures: "0.3" },
      { nom: "Van — Éclairage habitacle", puissance: "20", heures: "5" },
      { nom: "Van — Chargeur ordi / USB", puissance: "55", heures: "4" },
    ],
  },
];

export default function BilanConsommationCalculator() {
  const [appareils, setAppareils] = useState<Appareil[]>([
    { id: 1, nom: "Frigo 12V", puissance: "50", heures: "12" },
    { id: 2, nom: "Éclairage LED", puissance: "20", heures: "6" },
    { id: 3, nom: "VHF / instruments", puissance: "15", heures: "4" },
  ]);
  const [tension, setTension] = useState("12");
  const [autonomie, setAutonomie] = useState("2");

  const addAppareil = () => {
    setAppareils((prev) => [
      ...prev,
      { id: Date.now(), nom: "", puissance: "", heures: "" },
    ]);
  };

  const removeAppareil = (id: number) => {
    setAppareils((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAppareil = (id: number, field: keyof Appareil, value: string) => {
    setAppareils((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const totalWh = appareils.reduce((sum, a) => {
    const p = parseFloat(a.puissance) || 0;
    const h = parseFloat(a.heures) || 0;
    return sum + p * h;
  }, 0);

  const totalAh = totalWh / parseFloat(tension);
  const capaciteRecommandee = (totalAh * parseFloat(autonomie)) / 0.5; // 50% DOD

  // Persiste le résultat localement pour Autonomie batterie (voir
  // lib/calc/bilan-storage.ts).
  useEffect(() => {
    writeBilanSnapshot({ appareils, tension, autonomie, totalWh });
  }, [totalWh, appareils, tension, autonomie]);

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = appareils
      .filter(a => a.nom || a.puissance)
      .map(a => {
        const wh = (parseFloat(a.puissance) || 0) * (parseFloat(a.heures) || 0);
        return `
          <tr>
            <td>${a.nom || '—'}</td>
            <td>${a.puissance || 0} W</td>
            <td>${a.heures || 0} h</td>
            <td><strong>${wh} Wh</strong></td>
          </tr>`;
      }).join('');

    const capaciteRecommandeeVal = ((totalWh / parseFloat(tension)) * parseFloat(autonomie)) / 0.5;
    const date = new Date().toLocaleDateString('fr-FR');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Bilan de consommation — FabSystem</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #111; }
          .logo { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
          .logo span { color: #f59e0b; }
          .meta { text-align: right; font-size: 11px; color: #666; }
          .meta strong { display: block; font-size: 14px; color: #111; margin-bottom: 2px; }
          h1 { font-size: 20px; font-weight: 800; margin-bottom: 6px; }
          .subtitle { font-size: 12px; color: #666; margin-bottom: 28px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 13px; }
          thead tr { background: #111; color: white; }
          thead th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
          tbody tr:nth-child(even) { background: #f9f9f9; }
          tbody td { padding: 10px 14px; border-bottom: 1px solid #eee; }
          tfoot tr { background: #fef3c7; }
          tfoot td { padding: 10px 14px; font-weight: 700; font-size: 14px; }
          .results { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
          .card { border: 2px solid #e5e7eb; border-radius: 10px; padding: 16px; }
          .card.highlight { border-color: #f59e0b; background: #fffbeb; }
          .card .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
          .card .value { font-size: 22px; font-weight: 900; color: #111; }
          .card .sub { font-size: 10px; color: #aaa; margin-top: 4px; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 10px; color: #aaa; display: flex; justify-content: space-between; }
          .note { background: #f3f4f6; border-radius: 8px; padding: 12px 16px; font-size: 11px; color: #555; margin-bottom: 20px; }
          .note strong { color: #111; }
          @media print { body { padding: 20px; } @page { margin: 1cm; size: A4; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${typeof window !== 'undefined' ? window.location.origin : ''}/FabSystem-Logo.svg" alt="FabSystem" style="height:36px;width:auto;" />
          <div class="meta">
            <strong>Bilan de consommation électrique</strong>
            Généré le ${date}
          </div>
        </div>
        <h1>Bilan de consommation</h1>
        <p class="subtitle">Tension : ${tension}V · Autonomie souhaitée : ${autonomie} jour(s)</p>
        <table>
          <thead>
            <tr>
              <th>Appareil</th>
              <th>Puissance (W)</th>
              <th>Durée (h/j)</th>
              <th>Consommation (Wh/j)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="3">Total journalier</td>
              <td>${totalWh.toFixed(0)} Wh/j</td>
            </tr>
          </tfoot>
        </table>
        <div class="results">
          <div class="card">
            <div class="label">Consommation / jour</div>
            <div class="value">${totalWh.toFixed(0)} Wh</div>
            <div class="sub">${(totalWh / parseFloat(tension)).toFixed(1)} Ah à ${tension}V</div>
          </div>
          <div class="card">
            <div class="label">Pour ${autonomie}j d'autonomie</div>
            <div class="value">${((totalWh / parseFloat(tension)) * parseFloat(autonomie)).toFixed(0)} Ah</div>
            <div class="sub">consommation brute</div>
          </div>
          <div class="card highlight">
            <div class="label">Capacité batterie recommandée</div>
            <div class="value">${capaciteRecommandeeVal.toFixed(0)} Ah</div>
            <div class="sub">DOD 50% — AGM/GEL</div>
          </div>
        </div>
        <div class="note">
          <strong>Note :</strong> DOD 50% appliqué pour batteries AGM/GEL.
          Pour du lithium LiFePO₄ (DOD 80%), la capacité recommandée est
          <strong>${(capaciteRecommandeeVal / 1.6).toFixed(0)} Ah</strong>.
          Ces valeurs sont indicatives — consultez un installateur qualifié pour votre installation.
        </div>
        <div class="footer">
          <span>FabSystem — Électricité marine & camping-car</span>
          <span>Document généré automatiquement · Non contractuel</span>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Tension (V)</label>
          <select
            value={tension}
            onChange={(e) => setTension(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
          >
            <option value="12">12 V</option>
            <option value="24">24 V</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Jours d&apos;autonomie souhaités</label>
          <select
            value={autonomie}
            onChange={(e) => setAutonomie(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={String(n)}>
                {n} jour{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table appareils */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600">Appareil</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600">Puissance (W)</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600">Heures/j</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600">Wh/j</th>
              <th className="w-10 px-2 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {appareils.map((a) => {
              const wh = (parseFloat(a.puissance) || 0) * (parseFloat(a.heures) || 0);
              return (
                <tr key={a.id}>
                  <td className="px-4 py-2">
                    <input
                      value={a.nom}
                      onChange={(e) => updateAppareil(a.id, "nom", e.target.value)}
                      placeholder="Nom"
                      className="w-full rounded border border-transparent px-1 py-0.5 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/20"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      value={a.puissance}
                      onChange={(e) => updateAppareil(a.id, "puissance", e.target.value)}
                      placeholder="W"
                      className="w-20 rounded border border-transparent px-1 py-0.5 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/20"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={a.heures}
                      onChange={(e) => updateAppareil(a.id, "heures", e.target.value)}
                      placeholder="h"
                      className="w-16 rounded border border-transparent px-1 py-0.5 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/20"
                    />
                  </td>
                  <td className="px-4 py-2 font-semibold text-neutral-700">{wh > 0 ? `${wh} Wh` : "—"}</td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => removeAppareil(a.id)}
                      className="text-neutral-300 hover:text-red-500 transition-colors"
                      aria-label="Supprimer"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-neutral-200 bg-neutral-50">
              <td colSpan={3} className="px-4 py-2.5 text-xs font-bold text-neutral-700">Total / jour</td>
              <td className="px-4 py-2.5 text-sm font-bold text-neutral-900">{totalWh.toFixed(0)} Wh</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={addAppareil}
          className="text-sm font-semibold text-neutral-600 underline underline-offset-4 hover:text-neutral-900 transition-colors"
        >
          + Ajouter manuellement
        </button>
        <span className="text-neutral-300 text-sm">ou</span>
        <div className="flex items-center gap-2">
          <select
            id="preset-select"
            defaultValue=""
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 max-w-xs"
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              const [g, idx] = val.split(":");
              const item = PRESETS_APPAREILS[parseInt(g)].items[parseInt(idx)];
              setAppareils((prev) => [...prev, { id: Date.now(), ...item }]);
              e.target.value = "";
            }}
          >
            <option value="">Ajouter un appareil type…</option>
            {PRESETS_APPAREILS.map((groupe, gi) => (
              <optgroup key={gi} label={groupe.groupe}>
                {groupe.items.map((item, ii) => (
                  <option key={ii} value={`${gi}:${ii}`}>
                    {item.nom} ({item.puissance}W · {item.heures}h/j)
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Résultats */}
      {totalWh > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Consommation/jour", value: `${totalWh.toFixed(0)} Wh`, sub: `${totalAh.toFixed(1)} Ah à ${tension}V` },
            { label: `Pour ${autonomie}j d'autonomie`, value: `${(totalAh * parseFloat(autonomie)).toFixed(0)} Ah`, sub: "consommation brute" },
            { label: "Capacité batterie recommandée", value: `${capaciteRecommandee.toFixed(0)} Ah`, sub: "DOD 50% — AGM/GEL", highlight: true },
          ].map((r) => (
            <div
              key={r.label}
              className={`rounded-2xl p-4 ${r.highlight ? "border-2 border-brand-400 bg-brand-50" : "border border-neutral-200 bg-neutral-50"}`}
            >
              <p className="text-xs text-neutral-500">{r.label}</p>
              <p className={`text-2xl font-bold ${r.highlight ? "text-neutral-950" : "text-neutral-900"}`}>{r.value}</p>
              <p className="text-xs text-neutral-400">{r.sub}</p>
            </div>
          ))}
        </div>
      )}
      {totalWh > 0 && (
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 rounded-xl border-2 border-neutral-900 bg-neutral-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
        >
          📄 Exporter en PDF
        </button>
      )}
      <p className="text-xs text-neutral-400">
        DOD 50 % appliqué pour AGM/GEL. Pour du lithium LiFePO₄ (DOD 80 %), divisez par 1,6.
      </p>
    </div>
  );
}

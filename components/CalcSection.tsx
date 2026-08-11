"use client";

import { useState, useEffect } from "react";
import { calcSection, fusibleRecommande } from "@/lib/calc/section-cable";
import { OUTILS_CALCULATEURS } from "@/lib/outils-catalog";

/* ─── Calculateur 1 : Section de câble ─────────────────────────────────── */
function CalcSectionCable() {
  const [intensite, setIntensite] = useState("");
  const [longueur, setLongueur] = useState("");
  const [chute, setChute] = useState("3");
  const [tension, setTension] = useState("12");
  const [result, setResult] = useState<{ sMin: string; section: number; fusible: string; intensite: number } | null>(null);

  const calculate = () => {
    const i = parseFloat(intensite);
    const l = parseFloat(longueur);
    const c = parseFloat(chute);
    const t = parseFloat(tension);
    if (!i || !l || !c || !t || i <= 0 || l <= 0) return;
    const { sMin, section } = calcSection(i, l, c, t);
    setResult({ sMin, section, fusible: fusibleRecommande(i), intensite: i });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Intensité (A)
            </label>
            <input
              type="number"
              min="0"
              placeholder="ex : 20"
              value={intensite}
              onChange={(e) => setIntensite(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Longueur simple aller (m)
            </label>
            <input
              type="number"
              min="0"
              placeholder="ex : 6"
              value={longueur}
              onChange={(e) => setLongueur(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
            <p className="mt-1 text-xs text-neutral-400">Le calcul applique automatiquement le facteur ×2 (aller-retour).</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Chute de tension max (%)
            </label>
            <select
              value={chute}
              onChange={(e) => setChute(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            >
              <option value="2">2 % — Précision (instruments)</option>
              <option value="3">3 % — Standard recommandé</option>
              <option value="5">5 % — Tolérance max</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Tension du circuit (V)
            </label>
            <select
              value={tension}
              onChange={(e) => setTension(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            >
              <option value="12">12 V</option>
              <option value="24">24 V</option>
              <option value="48">48 V</option>
            </select>
          </div>
        </div>
        <button
          onClick={calculate}
          className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-800 sm:w-auto sm:px-8"
        >
          Calculer →
        </button>
      </div>

      <div>
        {result ? (
          <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-neutral-500">Section calculée minimale</p>
                <p className="text-2xl font-bold text-neutral-900">{result.sMin} mm²</p>
              </div>
              <div className="border-t border-brand-200 pt-4">
                <p className="text-xs text-neutral-500">Section normalisée à utiliser</p>
                <p className="text-3xl font-bold text-neutral-950">{result.section} mm²</p>
              </div>
              <div className="border-t border-brand-200 pt-4">
                <p className="text-xs text-neutral-500">Fusible recommandé</p>
                <p className="text-xl font-bold text-neutral-900">{result.fusible}</p>
              </div>
            </div>
            {/* Avertissements section */}
            {(() => {
              const sMinNum = parseFloat(result.sMin);
              if (result.section < 1.5) return (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                  ⚠️ Section inférieure à 1,5 mm² — minimum recommandé en marine (norme ABYC E-11)
                </div>
              );
              if (result.section < sMinNum * 1.5) return (
                <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700">
                  ⚡ Section juste — majorez d&apos;un calibre si câble en conduit ou température &gt; 40°C
                </div>
              );
              return (
                <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs font-semibold text-green-700">
                  ✅ Section confortable pour cette application
                </div>
              );
            })()}
            {result.intensite > 100 && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                ⚠️ Intensité &gt; 100 A — prévoyez un câble direct sur batterie avec fusible ANL.
              </div>
            )}
            <p className="mt-4 text-xs text-neutral-500">
              Calcul basé sur la résistivité du cuivre (ρ = 0,0175 Ω·mm²/m).
              Majorez d&apos;une section si câble en conduit ou forte chaleur.
            </p>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
            <p className="text-center text-sm text-neutral-400">
              Renseignez les paramètres et cliquez sur <strong>Calculer</strong> pour obtenir le résultat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Calculateur 2 : Bilan de consommation ─────────────────────────────── */
type Appareil = { id: number; nom: string; puissance: string; heures: string };

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

function CalcBilanConso({
  onConsoChange,
  onBilanSnapshot,
}: {
  onConsoChange: (wh: number) => void;
  onBilanSnapshot: (s: { appareils: Appareil[]; tension: string; autonomie: string; totalWh: number }) => void;
}) {
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

  // Synchronise l'état partagé avec le parent
  useEffect(() => {
    onConsoChange(totalWh);
    onBilanSnapshot({ appareils, tension, autonomie, totalWh });
  }, [totalWh, appareils, tension, autonomie]); // eslint-disable-line react-hooks/exhaustive-deps

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

/* ─── Calculateur 3 : Autonomie batterie + solaire ─────────────────────── */
function CalcAutonomie({
  importedConsoWh,
  bilanSnapshot,
}: {
  importedConsoWh: number;
  bilanSnapshot: { appareils: Appareil[]; tension: string; autonomie: string; totalWh: number } | null;
}) {
  const [capacite, setCapacite] = useState("");
  const [etat, setEtat] = useState("100");
  const [conso, setConso] = useState("");
  const [dod, setDod] = useState("50");
  const [tension, setTension] = useState("12");
  // Solaire
  const [withSolar, setWithSolar] = useState(false);
  const [panneauxWc, setPanneauxWc] = useState("");
  const [psh, setPsh] = useState("4");

  const cap = parseFloat(capacite) || 0;
  const consoWh = parseFloat(conso) || 0;   // Wh/j saisis par l'utilisateur
  const consoW = consoWh / 24;              // équivalent puissance moyenne sur 24h
  const dodPct = parseFloat(dod) / 100;
  const etatPct = parseFloat(etat) / 100;
  const t = parseFloat(tension);

  // Énergie batterie disponible (Wh)
  const energieDisponibleWh = cap * t * dodPct * etatPct;

  // Production solaire journalière (Wh/j) avec rendement système 0.75
  const productionWh = withSolar
    ? (parseFloat(panneauxWc) || 0) * parseFloat(psh) * 0.75
    : 0;
  // Puissance solaire moyenne équivalente sur 24h
  const productionMoyenneW = productionWh / 24;

  // Consommation nette après solaire
  const consoNetteW = Math.max(0, consoW - productionMoyenneW);
  const solarCoversAll = withSolar && productionMoyenneW >= consoW && consoW > 0;

  // Autonomie sans solaire / avec solaire
  const heuresSansSolaire = consoW > 0 ? energieDisponibleWh / consoW : 0;
  const heuresAvecSolaire = consoNetteW > 0 ? energieDisponibleWh / consoNetteW : 0;
  const heures = withSolar ? heuresAvecSolaire : heuresSansSolaire;

  const formatDuree = (h: number) => {
    if (h <= 0) return "—";
    const j = Math.floor(h / 24);
    const hReste = Math.floor(h % 24);
    const m = Math.round((h - Math.floor(h)) * 60);
    if (j > 0) return `${j}j ${hReste}h`;
    if (hReste > 0) return `${hReste}h${m > 0 ? ` ${m}min` : ""}`;
    return `${m} min`;
  };

  const niveau = (h: number, infini: boolean) => {
    if (infini) return { color: "text-green-600", label: "☀️ Autonomie illimitée" };
    if (h <= 0) return null;
    if (h < 12) return { color: "text-red-600", label: "Autonomie faible" };
    if (h < 48) return { color: "text-yellow-600", label: "Autonomie correcte" };
    if (h < 120) return { color: "text-green-600", label: "Bonne autonomie" };
    return { color: "text-green-600", label: "Très bonne autonomie" };
  };

  const niv = niveau(heures, solarCoversAll);
  const hasResult = cap > 0 && consoWh > 0;

  const exportCompletPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const date = new Date().toLocaleDateString('fr-FR');
    const logoSrc = `${window.location.origin}/FabSystem-Logo.svg`;

    // Section bilan
    let bilanHTML = '';
    if (bilanSnapshot && bilanSnapshot.totalWh > 0) {
      const rows = bilanSnapshot.appareils
        .filter(a => a.nom || a.puissance)
        .map(a => {
          const wh = (parseFloat(a.puissance) || 0) * (parseFloat(a.heures) || 0);
          return `<tr><td>${a.nom || '—'}</td><td>${a.puissance || 0} W</td><td>${a.heures || 0} h</td><td><strong>${wh} Wh</strong></td></tr>`;
        }).join('');
      const capRecoWh = ((bilanSnapshot.totalWh / parseFloat(bilanSnapshot.tension)) * parseFloat(bilanSnapshot.autonomie)) / 0.5;
      bilanHTML = `
        <div class="section-title">Bilan de consommation</div>
        <p class="subtitle">Tension : ${bilanSnapshot.tension}V · Autonomie souhaitée : ${bilanSnapshot.autonomie} jour(s)</p>
        <table>
          <thead><tr><th>Appareil</th><th>Puissance (W)</th><th>Durée (h/j)</th><th>Consommation (Wh/j)</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="3">Total journalier</td><td>${bilanSnapshot.totalWh.toFixed(0)} Wh/j</td></tr></tfoot>
        </table>
        <div class="results">
          <div class="card"><div class="label">Consommation / jour</div><div class="value">${bilanSnapshot.totalWh.toFixed(0)} Wh</div><div class="sub">${(bilanSnapshot.totalWh / parseFloat(bilanSnapshot.tension)).toFixed(1)} Ah à ${bilanSnapshot.tension}V</div></div>
          <div class="card"><div class="label">Pour ${bilanSnapshot.autonomie}j d'autonomie</div><div class="value">${((bilanSnapshot.totalWh / parseFloat(bilanSnapshot.tension)) * parseFloat(bilanSnapshot.autonomie)).toFixed(0)} Ah</div><div class="sub">consommation brute</div></div>
          <div class="card highlight"><div class="label">Capacité batterie recommandée</div><div class="value">${capRecoWh.toFixed(0)} Ah</div><div class="sub">DOD 50% — AGM/GEL</div></div>
        </div>`;
    }

    // Section autonomie
    const autonomieVal = solarCoversAll ? '∞' : formatDuree(heures);
    const nivLabel = solarCoversAll ? '☀️ Autonomie illimitée' : (niv ? niv.label : '');
    const consoNetteAff = solarCoversAll ? '0 Wh/j' : `${(consoNetteW * 24).toFixed(0)} Wh/j`;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport électrique complet — FabSystem</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Helvetica Neue',Arial,sans-serif; color:#111; padding:40px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:3px solid #111; }
    .meta { text-align:right; font-size:11px; color:#666; }
    .meta strong { display:block; font-size:14px; color:#111; margin-bottom:2px; }
    .section-title { font-size:16px; font-weight:800; margin:28px 0 6px; padding-bottom:6px; border-bottom:2px solid #e5e7eb; }
    .subtitle { font-size:12px; color:#666; margin-bottom:16px; }
    table { width:100%; border-collapse:collapse; margin-bottom:20px; font-size:13px; }
    thead tr { background:#111; color:white; }
    thead th { padding:8px 12px; text-align:left; font-size:11px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; }
    tbody tr:nth-child(even) { background:#f9f9f9; }
    tbody td { padding:8px 12px; border-bottom:1px solid #eee; }
    tfoot tr { background:#fef3c7; }
    tfoot td { padding:8px 12px; font-weight:700; font-size:13px; }
    .results { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
    .card { border:2px solid #e5e7eb; border-radius:8px; padding:12px; }
    .card.highlight { border-color:#f59e0b; background:#fffbeb; }
    .card .label { font-size:9px; color:#888; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
    .card .value { font-size:20px; font-weight:900; color:#111; }
    .card .sub { font-size:9px; color:#aaa; margin-top:3px; }
    .autonomie-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:16px; }
    .aut-main { grid-column:1/-1; border:2px solid #f59e0b; border-radius:8px; padding:16px; background:#fffbeb; }
    .aut-main .big { font-size:40px; font-weight:900; color:#111; }
    .aut-main .niv { font-size:13px; font-weight:700; margin-top:4px; }
    .aut-card { border:1px solid #e5e7eb; border-radius:8px; padding:12px; }
    .aut-card .label { font-size:9px; color:#888; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
    .aut-card .value { font-size:16px; font-weight:700; color:#111; }
    .note { background:#f3f4f6; border-radius:8px; padding:10px 14px; font-size:11px; color:#555; margin-bottom:16px; }
    .footer { margin-top:24px; padding-top:12px; border-top:1px solid #eee; font-size:10px; color:#aaa; display:flex; justify-content:space-between; }
    @media print { body { padding:20px; } @page { margin:1cm; size:A4; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoSrc}" alt="FabSystem" style="height:36px;width:auto;" />
    <div class="meta">
      <strong>Rapport électrique complet</strong>
      Généré le ${date}
    </div>
  </div>
  ${bilanHTML}
  <div class="section-title">Autonomie batterie${withSolar ? ' (avec solaire)' : ''}</div>
  <p class="subtitle">Batterie ${capacite} Ah · ${tension}V · DOD ${dod}% · État ${etat}%${withSolar && panneauxWc ? ` · Solaire ${panneauxWc} Wc` : ''}</p>
  <div class="autonomie-grid">
    <div class="aut-main">
      <div class="label">Autonomie estimée${withSolar ? ' avec solaire' : ''}</div>
      <div class="big">${autonomieVal}</div>
      <div class="niv">${nivLabel}</div>
    </div>
    <div class="aut-card"><div class="label">Énergie batterie dispo.</div><div class="value">${energieDisponibleWh.toFixed(0)} Wh</div></div>
    <div class="aut-card"><div class="label">Consommation journalière</div><div class="value">${consoWh.toFixed(0)} Wh/j</div></div>
    ${withSolar && productionWh > 0 ? `
    <div class="aut-card"><div class="label">Production solaire/j</div><div class="value">${productionWh.toFixed(0)} Wh</div></div>
    <div class="aut-card"><div class="label">Conso nette/j</div><div class="value">${consoNetteAff}</div></div>
    ${!solarCoversAll ? `<div class="aut-card" style="grid-column:1/-1"><div class="label">Autonomie sans solaire (réf)</div><div class="value">${formatDuree(heuresSansSolaire)}</div></div>` : ''}
    ` : ''}
  </div>
  <div class="note">Ces valeurs sont indicatives. Résultats réels variables selon température, âge de la batterie, profil de consommation réel et ensoleillement effectif.</div>
  <div class="footer">
    <span>FabSystem — Électricité marine &amp; camping-car</span>
    <span>Document généré automatiquement · Non contractuel</span>
  </div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Inputs ── */}
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Capacité batterie (Ah)</label>
            <input
              type="number" min="0" placeholder="ex : 200"
              value={capacite} onChange={(e) => setCapacite(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Tension (V)</label>
            <select value={tension} onChange={(e) => setTension(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20">
              <option value="12">12 V</option>
              <option value="24">24 V</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">État de charge (%)</label>
            <select value={etat} onChange={(e) => setEtat(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20">
              {[100, 90, 80, 70, 60, 50].map((n) => (
                <option key={n} value={String(n)}>{n} %</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Profondeur de décharge max</label>
            <select value={dod} onChange={(e) => setDod(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20">
              <option value="50">50 % — AGM / GEL</option>
              <option value="80">80 % — Lithium LiFePO₄</option>
              <option value="100">100 % — Lithium (max absolu)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Consommation journalière (Wh/j)
            </label>
            <input
              type="number" min="0" placeholder="ex : 500"
              value={conso} onChange={(e) => setConso(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
            {importedConsoWh > 0 && (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2">
                <span className="text-xs font-semibold text-brand-700">
                  📊 Bilan calculé : <strong>{importedConsoWh.toFixed(0)} Wh/j</strong>
                </span>
                <button
                  onClick={() => setConso(String(Math.round(importedConsoWh)))}
                  className="rounded-lg bg-brand-400 px-3 py-1 text-xs font-bold text-neutral-900 transition-colors hover:bg-brand-300"
                >
                  Utiliser ↗
                </button>
              </div>
            )}
            <p className="mt-1.5 text-xs text-neutral-400 leading-relaxed">
              Total d&apos;énergie consommée sur une journée complète (24 h).{" "}
              <span className="font-medium text-neutral-500">
                Exemples : frigo 12V seul ≈ 600 Wh/j · éclairage + instruments ≈ 200 Wh/j · installation complète ≈ 800–1 500 Wh/j.
              </span>
            </p>
          </div>
        </div>

        {/* Toggle solaire */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <div
              onClick={() => setWithSolar((v) => !v)}
              className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${withSolar ? "bg-brand-400" : "bg-neutral-300"}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${withSolar ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </div>
            <span className="text-sm font-semibold text-neutral-800">
              ☀️ Ajouter la production solaire
            </span>
          </label>

          {withSolar && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Puissance panneaux (Wc)
                </label>
                <input
                  type="number" min="0" placeholder="ex : 400"
                  value={panneauxWc} onChange={(e) => setPanneauxWc(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                />
                <p className="mt-1 text-xs text-neutral-400">Total Wc-crête installés</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Ensoleillement (h/j)
                </label>
                <select value={psh} onChange={(e) => setPsh(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20">
                  <option value="2.5">2,5 h — Hiver / nord France</option>
                  <option value="3.5">3,5 h — Printemps / automne</option>
                  <option value="4">4 h — Été / façade atlantique</option>
                  <option value="5">5 h — Été / Méditerranée</option>
                  <option value="6">6 h — Été / plein soleil tropical</option>
                </select>
                <p className="mt-1 text-xs text-neutral-400">Heures de pic solaire (PSH)</p>
              </div>
              {panneauxWc && (
                <div className="sm:col-span-2 rounded-lg bg-white border border-brand-200 px-4 py-3 text-sm">
                  <span className="font-semibold text-neutral-700">Production estimée : </span>
                  <span className="font-bold text-brand-600">
                    {productionWh.toFixed(0)} Wh/j
                  </span>
                  <span className="text-neutral-400 text-xs ml-2">
                    (rendement système 75 % appliqué)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Résultat ── */}
      <div>
        {hasResult ? (
          <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>

            {solarCoversAll ? (
              <div>
                <p className="text-xs text-neutral-500">Autonomie estimée</p>
                <p className="text-4xl font-bold text-green-700">∞</p>
                <p className="mt-1 text-sm font-semibold text-green-600">
                  ☀️ Le solaire couvre toute la consommation
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-neutral-500">
                  Autonomie estimée{withSolar ? " (avec solaire)" : ""}
                </p>
                <p className="text-4xl font-bold text-neutral-950">{formatDuree(heures)}</p>
                {niv && <p className={`mt-1 text-sm font-semibold ${niv.color}`}>{niv.label}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 border-t border-brand-200 pt-4">
              <div>
                <p className="text-xs text-neutral-500">Énergie batterie dispo.</p>
                <p className="text-lg font-bold text-neutral-900">{energieDisponibleWh.toFixed(0)} Wh</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Conso moy. (24 h)</p>
                <p className="text-lg font-bold text-neutral-900">{consoW.toFixed(1)} W moy.</p>
              </div>
              {withSolar && productionWh > 0 && (
                <>
                  <div>
                    <p className="text-xs text-neutral-500">Production solaire/j</p>
                    <p className="text-lg font-bold text-green-700">{productionWh.toFixed(0)} Wh</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Conso nette/j</p>
                    <p className={`text-lg font-bold ${solarCoversAll ? "text-green-700" : "text-neutral-900"}`}>
                      {solarCoversAll ? "0 Wh/j" : `${(consoNetteW * 24).toFixed(0)} Wh/j`}
                    </p>
                  </div>
                  {!solarCoversAll && (
                    <div className="col-span-2 rounded-lg bg-white border border-neutral-200 px-3 py-2">
                      <p className="text-xs text-neutral-500">Autonomie sans solaire (ref)</p>
                      <p className="text-base font-bold text-neutral-500">{formatDuree(heuresSansSolaire)}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-neutral-500">
              {withSolar
                ? "Rendement système 75 % appliqué sur la production solaire. Résultat indicatif — varie selon météo, orientation et ombrage."
                : "Estimation sans recharge. Activez le solaire pour simuler avec panneaux."}
            </p>
            <button
              onClick={exportCompletPDF}
              className="flex items-center gap-2 rounded-xl border-2 border-neutral-900 bg-neutral-900 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
            >
              📄 Exporter le rapport complet
            </button>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
            <p className="text-center text-sm text-neutral-400">
              Renseignez la capacité et la consommation pour obtenir l&apos;autonomie estimée.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Calculateur 4 : Dimensionnement MPPT ─────────────────────────────── */
function CalcMPPT() {
  const [tensionBat, setTensionBat] = useState("12");
  const [puissanceWc, setPuissanceWc] = useState("");
  const [voc, setVoc] = useState("");
  const [vmp, setVmp] = useState("");
  const [nbSerie, setNbSerie] = useState("1");
  const [nbParallele, setNbParallele] = useState("1");
  const [longueurMPPT, setLongueurMPPT] = useState("2");

  const wc = parseFloat(puissanceWc) || 0;
  const vocN = parseFloat(voc) || 0;
  const vmpN = parseFloat(vmp) || 0;
  const serie = parseInt(nbSerie) || 1;
  const parallele = parseInt(nbParallele) || 1;
  const t = parseFloat(tensionBat);

  const vocString = vocN * serie;
  const vmpString = vmpN * serie;
  const iscTotal = vmpN > 0 ? (wc / vmpN) * parallele : 0;
  const iSortieMPPT = t > 0 ? wc / t : 0;
  const puissanceMPPT = wc * 1.25;

  const sectionPanneaux = wc > 0 && vmpString > 0
    ? calcSection(iscTotal, 3, 3, vmpString)
    : null;
  const sectionMPPTBat = wc > 0
    ? calcSection(iSortieMPPT, parseFloat(longueurMPPT) || 2, 3, t)
    : null;

  const hasResult = wc > 0 && vocN > 0 && vmpN > 0;

  type Alert = { color: "red" | "orange" | "yellow"; msg: string };
  const alerts: Alert[] = [];
  if (vocString > 150) alerts.push({ color: "red", msg: "Tension Voc trop élevée pour un MPPT standard — vérifiez la fiche technique de votre régulateur" });
  else if (vocString > 100) alerts.push({ color: "orange", msg: "Tension élevée — vérifiez la limite Voc max de votre MPPT" });
  if (iSortieMPPT > 60) alerts.push({ color: "orange", msg: "Courant de sortie élevé — envisagez deux régulateurs MPPT en parallèle" });
  if (serie > 1 && tensionBat === "12") alerts.push({ color: "orange", msg: "Panneaux en série sur batterie 12V — assurez-vous que Vmp_string reste compatible avec votre MPPT" });

  const alertClass = (color: Alert["color"]) => {
    if (color === "red") return "bg-red-50 border border-red-200 text-red-700";
    return "bg-orange-50 border border-orange-200 text-orange-700";
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Inputs ── */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Tension batterie (V)</label>
            <select value={tensionBat} onChange={(e) => setTensionBat(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20">
              <option value="12">12 V</option>
              <option value="24">24 V</option>
              <option value="48">48 V</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Puissance totale panneaux (Wc)</label>
            <input type="number" min="0" placeholder="ex : 400"
              value={puissanceWc} onChange={(e) => setPuissanceWc(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Tension Voc panneau (V)</label>
            <input type="number" min="0" placeholder="ex : 44"
              value={voc} onChange={(e) => setVoc(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20" />
            <p className="mt-1 text-xs text-neutral-400">Tension circuit ouvert — fiche technique panneau</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Tension Vmp panneau (V)</label>
            <input type="number" min="0" placeholder="ex : 36"
              value={vmp} onChange={(e) => setVmp(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20" />
            <p className="mt-1 text-xs text-neutral-400">Tension point de puissance max</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Panneaux en série</label>
            <input type="number" min="1" placeholder="ex : 1"
              value={nbSerie} onChange={(e) => setNbSerie(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Strings en parallèle</label>
            <input type="number" min="1" placeholder="ex : 2"
              value={nbParallele} onChange={(e) => setNbParallele(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Longueur câble MPPT → batterie (m)</label>
            <input type="number" min="0" placeholder="ex : 2"
              value={longueurMPPT} onChange={(e) => setLongueurMPPT(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20" />
          </div>
        </div>
      </div>

      {/* ── Résultat ── */}
      <div>
        {hasResult ? (
          <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>

            {/* Puissance MPPT — card principale */}
            <div>
              <p className="text-xs text-neutral-500">Puissance MPPT recommandée</p>
              <p className="text-4xl font-bold text-neutral-950">{puissanceMPPT.toFixed(0)} W</p>
              <p className="mt-1 text-sm font-semibold text-brand-700">
                Choisissez un MPPT ≥ {Math.ceil(iSortieMPPT)} A / {puissanceMPPT.toFixed(0)} W
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-brand-200 pt-4">
              <div>
                <p className="text-xs text-neutral-500">Voc string</p>
                <p className={`text-lg font-bold ${vocString > 150 ? "text-red-600" : vocString > 100 ? "text-orange-600" : "text-neutral-900"}`}>
                  {vocString.toFixed(1)} V
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Vmp string</p>
                <p className="text-lg font-bold text-neutral-900">{vmpString.toFixed(1)} V</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Courant sortie MPPT</p>
                <p className={`text-lg font-bold ${iSortieMPPT > 60 ? "text-orange-600" : "text-neutral-900"}`}>
                  {Math.ceil(iSortieMPPT)} A
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Courant Isc total</p>
                <p className="text-lg font-bold text-neutral-900">{iscTotal.toFixed(1)} A</p>
              </div>
              {sectionPanneaux && (
                <div>
                  <p className="text-xs text-neutral-500">Câble panneaux → MPPT</p>
                  <p className="text-lg font-bold text-neutral-900">{sectionPanneaux.section} mm²</p>
                </div>
              )}
              {sectionMPPTBat && (
                <div>
                  <p className="text-xs text-neutral-500">Câble MPPT → batterie</p>
                  <p className="text-lg font-bold text-neutral-900">{sectionMPPTBat.section} mm²</p>
                </div>
              )}
            </div>

            {alerts.length > 0 && (
              <div className="space-y-2 border-t border-brand-200 pt-4">
                {alerts.map((a, i) => (
                  <div key={i} className={`rounded-lg px-3 py-2 text-xs font-semibold ${alertClass(a.color)}`}>
                    {a.color === "red" ? "🔴" : "🟡"} {a.msg}
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-neutral-500">
              Marge sécurité 25% appliquée sur la puissance MPPT. Sections câbles calculées avec chute de tension 3%.
            </p>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
            <p className="text-center text-sm text-neutral-400">
              Renseignez la puissance, Voc et Vmp pour dimensionner votre régulateur MPPT.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Table AWG ↔ mm² ──────────────────────────────────────────────────── */
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

function CalcAWG() {
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

/* ─── Composant principal ───────────────────────────────────────────────── */

type BilanSnapshot = {
  appareils: Appareil[];
  tension: string;
  autonomie: string;
  totalWh: number;
};

export default function CalcSection() {
  const [sharedConsoWh, setSharedConsoWh] = useState(0);
  const [bilanSnapshot, setBilanSnapshot] = useState<BilanSnapshot | null>(null);

  const renderCalc = (id: string) => {
    switch (id) {
      case "section-cable": return <CalcSectionCable />;
      case "bilan-conso":   return <CalcBilanConso onConsoChange={setSharedConsoWh} onBilanSnapshot={setBilanSnapshot} />;
      case "autonomie":     return <CalcAutonomie importedConsoWh={sharedConsoWh} bilanSnapshot={bilanSnapshot} />;
      case "mppt":          return <CalcMPPT />;
      case "awg":           return <CalcAWG />;
      default:              return null;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-16">
      {OUTILS_CALCULATEURS.map((calc, i) => (
        <section key={calc.id} id={calc.id} className="scroll-mt-24">
          <div className="mb-6 flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-2xl">
              {calc.emoji}
            </span>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-neutral-400">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="text-lg font-bold text-neutral-950 sm:text-xl">{calc.title}</h2>
              </div>
              <p className="mt-1 text-sm text-neutral-600">{calc.description}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
            {renderCalc(calc.id)}
          </div>
        </section>
      ))}
    </div>
  );
}

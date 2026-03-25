"use client";

import { useState } from "react";

/* ─── Données sections de câble (norme CEI/marine) ─────────────────────── */
const SECTIONS = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50];

function calcSection(intensite: number, longueur: number, chute: number, tension: number) {
  // Résistivité cuivre 0.0175 Ω·mm²/m
  const rho = 0.0175;
  // section minimale = (2 × longueur × intensité × rho) / (chute% × tension / 100)
  const chuteV = (chute / 100) * tension;
  const sMin = (2 * longueur * intensite * rho) / chuteV;
  // Trouver la section normalisée supérieure
  const section = SECTIONS.find((s) => s >= sMin) ?? 50;
  return { sMin: sMin.toFixed(2), section };
}

function fusibleRecommande(intensite: number): string {
  const fusibles = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 125];
  const f = fusibles.find((f) => f >= intensite * 1.25);
  return f ? `${f} A` : "> 125 A — prévoir un disjoncteur";
}

/* ─── Calculateur 1 : Section de câble ─────────────────────────────────── */
function CalcSectionCable() {
  const [intensite, setIntensite] = useState("");
  const [longueur, setLongueur] = useState("");
  const [chute, setChute] = useState("3");
  const [tension, setTension] = useState("12");
  const [result, setResult] = useState<{ sMin: string; section: number; fusible: string } | null>(null);

  const calculate = () => {
    const i = parseFloat(intensite);
    const l = parseFloat(longueur);
    const c = parseFloat(chute);
    const t = parseFloat(tension);
    if (!i || !l || !c || !t || i <= 0 || l <= 0) return;
    const { sMin, section } = calcSection(i, l, c, t);
    setResult({ sMin, section, fusible: fusibleRecommande(i) });
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
              Longueur aller-retour (m)
            </label>
            <input
              type="number"
              min="0"
              placeholder="ex : 6"
              value={longueur}
              onChange={(e) => setLongueur(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
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
            <p className="mt-4 text-xs text-neutral-500">
              Calcul basé sur la résistivité du cuivre (ρ = 0,0175 Ω·mm²/m).
              Majorez d'une section si câble en conduit ou forte chaleur.
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

function CalcBilanConso() {
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
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Jours d'autonomie souhaités</label>
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

      <button
        onClick={addAppareil}
        className="text-sm font-semibold text-neutral-600 underline underline-offset-4 hover:text-neutral-900 transition-colors"
      >
        + Ajouter un appareil
      </button>

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
      <p className="text-xs text-neutral-400">
        DOD 50 % appliqué pour AGM/GEL. Pour du lithium LiFePO₄ (DOD 80 %), divisez par 1,6.
      </p>
    </div>
  );
}

/* ─── Calculateur 3 : Autonomie batterie ───────────────────────────────── */
function CalcAutonomie() {
  const [capacite, setCapacite] = useState("");
  const [etat, setEtat] = useState("100");
  const [conso, setConso] = useState("");
  const [dod, setDod] = useState("50");
  const [tension, setTension] = useState("12");

  const cap = parseFloat(capacite) || 0;
  const consoW = parseFloat(conso) || 0;
  const dodPct = parseFloat(dod) / 100;
  const etatPct = parseFloat(etat) / 100;
  const t = parseFloat(tension);

  const energieDisponibleWh = cap * t * dodPct * etatPct;
  const consoAh = consoW / t;
  const heures = consoW > 0 ? energieDisponibleWh / consoW : 0;
  const ahParHeure = consoAh;

  const formatDuree = (h: number) => {
    if (h <= 0) return "—";
    const j = Math.floor(h / 24);
    const hReste = Math.floor(h % 24);
    const m = Math.round((h - Math.floor(h)) * 60);
    if (j > 0) return `${j}j ${hReste}h`;
    if (hReste > 0) return `${hReste}h ${m > 0 ? `${m}min` : ""}`;
    return `${m} min`;
  };

  const niveau = (h: number) => {
    if (h <= 0) return null;
    if (h < 12) return { color: "text-red-600", label: "Autonomie faible" };
    if (h < 48) return { color: "text-yellow-600", label: "Autonomie correcte" };
    return { color: "text-green-600", label: "Bonne autonomie" };
  };

  const niv = niveau(heures);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Capacité batterie (Ah)</label>
            <input
              type="number"
              min="0"
              placeholder="ex : 200"
              value={capacite}
              onChange={(e) => setCapacite(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Tension (V)</label>
            <select
              value={tension}
              onChange={(e) => setTension(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            >
              <option value="12">12 V</option>
              <option value="24">24 V</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">État de charge (%)</label>
            <select
              value={etat}
              onChange={(e) => setEtat(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            >
              {[100, 90, 80, 70, 60, 50].map((n) => (
                <option key={n} value={String(n)}>{n} %</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Profondeur de décharge max</label>
            <select
              value={dod}
              onChange={(e) => setDod(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            >
              <option value="50">50 % — AGM / GEL</option>
              <option value="80">80 % — Lithium LiFePO₄</option>
              <option value="100">100 % — Lithium (max absolu)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Consommation totale (W)</label>
            <input
              type="number"
              min="0"
              placeholder="ex : 85"
              value={conso}
              onChange={(e) => setConso(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
            <p className="mt-1 text-xs text-neutral-400">Utilisez le calculateur de bilan pour trouver cette valeur.</p>
          </div>
        </div>
      </div>

      <div>
        {cap > 0 && consoW > 0 ? (
          <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>
            <div>
              <p className="text-xs text-neutral-500">Autonomie estimée</p>
              <p className="text-4xl font-bold text-neutral-950">{formatDuree(heures)}</p>
              {niv && <p className={`mt-1 text-sm font-semibold ${niv.color}`}>{niv.label}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-brand-200 pt-4">
              <div>
                <p className="text-xs text-neutral-500">Énergie disponible</p>
                <p className="text-lg font-bold text-neutral-900">{energieDisponibleWh.toFixed(0)} Wh</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Décharge</p>
                <p className="text-lg font-bold text-neutral-900">{ahParHeure.toFixed(1)} A/h</p>
              </div>
            </div>
            <p className="text-xs text-neutral-500">
              Estimation sans pertes ni recharge solaire/alternateur.
            </p>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
            <p className="text-center text-sm text-neutral-400">
              Renseignez la capacité et la consommation pour obtenir l'autonomie estimée.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Composant principal ───────────────────────────────────────────────── */
const calculateurs = [
  {
    id: "section-cable",
    emoji: "⚡",
    title: "Calculateur de section de câble",
    description: "Dimensionnez vos câbles 12V/24V selon l'intensité, la longueur et la chute de tension admissible.",
    component: <CalcSectionCable />,
  },
  {
    id: "bilan-conso",
    emoji: "🔋",
    title: "Bilan de consommation",
    description: "Listez vos appareils pour calculer la consommation journalière et la capacité batterie recommandée.",
    component: <CalcBilanConso />,
  },
  {
    id: "autonomie",
    emoji: "⏱️",
    title: "Autonomie batterie",
    description: "Estimez combien de temps votre installation tient sur batterie selon votre consommation.",
    component: <CalcAutonomie />,
  },
];

export default function CalcSection() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-16">
      {calculateurs.map((calc, i) => (
        <section
          key={calc.id}
          id={calc.id}
          className="scroll-mt-24"
        >
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
            {calc.component}
          </div>
        </section>
      ))}
    </div>
  );
}

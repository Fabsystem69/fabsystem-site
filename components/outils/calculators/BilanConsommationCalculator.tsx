"use client";

import { useState } from "react";
import { computeEnergyBudget, type EnergyBudgetChemistry, USABLE_CAPACITY_RATIO } from "@/lib/calc/energy-budget";
import { AddEnergyToProjectButton } from "@/components/outils/project-bridge/AddEnergyToProjectButton";
import { Stepper } from "@/components/outils/calc-ui/Stepper";
import { ToggleGroup } from "@/components/outils/calc-ui/ToggleGroup";
import { StatGrid } from "@/components/outils/calc-ui/StatGrid";
import { CalcSafetyNotice } from "@/components/outils/calc-ui/CalcSafetyNotice";
import { CalcGuidesLink } from "@/components/outils/calc-ui/CalcGuidesLink";

// Fusion de l'ancien bilan-consommation (liste d'appareils → Wh/j) et de
// l'ancien autonomie-batterie (capacité + conso → autonomie) — retour
// utilisateur : "autonomie batterie sera fusionner avec bilan conso...
// c'est le bon endroit". Les deux anciens outils se passaient le relais
// via un pont localStorage manuel (bouton "Utiliser ↗") ; ici la banque de
// batteries, les sources de charge et la liste d'appareils sont visibles
// ensemble, comme sur l'"Energy Budget Calculator" de Wireframe — plus le
// vrai manque identifié : DC-DC/alternateur et secteur/quai comme sources
// de recharge journalière (avant : uniquement le solaire).

type Appareil = { id: number; nom: string; puissance: string; heures: number };

const PRESETS_APPAREILS: { groupe: string; items: { nom: string; puissance: string; heures: number }[] }[] = [
  {
    groupe: "Froid",
    items: [
      { nom: "Frigo 12V compresseur (petit)", puissance: "40", heures: 12 },
      { nom: "Frigo 12V compresseur (grand)", puissance: "75", heures: 14 },
    ],
  },
  {
    groupe: "Éclairage",
    items: [
      { nom: "Éclairage LED cabine (circuit)", puissance: "25", heures: 5 },
      { nom: "Spot LED cockpit", puissance: "10", heures: 4 },
      { nom: "Feux de navigation", puissance: "10", heures: 8 },
      { nom: "Feu de mouillage", puissance: "5", heures: 10 },
    ],
  },
  {
    groupe: "Navigation & électronique",
    items: [
      { nom: "VHF fixe", puissance: "6", heures: 4 },
      { nom: "GPS / traceur de carte", puissance: "15", heures: 8 },
      { nom: "AIS récepteur", puissance: "3", heures: 24 },
      { nom: "Pilote automatique (navigation)", puissance: "20", heures: 8 },
      { nom: "Sondeur / loch", puissance: "5", heures: 8 },
    ],
  },
  {
    groupe: "Confort & divers",
    items: [
      { nom: "Pompe à eau électrique", puissance: "30", heures: 1 },
      { nom: "Chargeur téléphone / USB", puissance: "10", heures: 4 },
      { nom: "Chargeur ordinateur portable", puissance: "45", heures: 3 },
      { nom: "Radio FM / DAB+", puissance: "5", heures: 6 },
      { nom: "Convertisseur 230V (usage ponctuel)", puissance: "150", heures: 1 },
    ],
  },
  {
    groupe: "Manœuvres (usage court)",
    items: [
      { nom: "Guindeau électrique", puissance: "1200", heures: 0.1 },
      { nom: "Winch électrique", puissance: "500", heures: 0.1 },
    ],
  },
  {
    groupe: "Van / camping-car",
    items: [
      { nom: "Chauffage diesel (ventilateur)", puissance: "20", heures: 8 },
      { nom: "Pompe eau (usage)", puissance: "30", heures: 0.5 },
      { nom: "Éclairage habitacle", puissance: "20", heures: 5 },
      { nom: "Chargeur ordi / USB", puissance: "55", heures: 4 },
    ],
  },
];

let nextId = 4;

const formatDuree = (h: number) => {
  if (!Number.isFinite(h)) return "∞";
  if (h <= 0) return "—";
  const j = Math.floor(h / 24);
  const hReste = Math.floor(h % 24);
  const m = Math.round((h - Math.floor(h)) * 60);
  if (j > 0) return `${j}j ${hReste}h`;
  if (hReste > 0) return `${hReste}h${m > 0 ? ` ${m}min` : ""}`;
  return `${m} min`;
};

export default function BilanConsommationCalculator() {
  const [appareils, setAppareils] = useState<Appareil[]>([
    { id: 1, nom: "Frigo 12V", puissance: "50", heures: 12 },
    { id: 2, nom: "Éclairage LED", puissance: "20", heures: 6 },
    { id: 3, nom: "VHF / instruments", puissance: "15", heures: 4 },
  ]);
  const [showPicker, setShowPicker] = useState(false);

  const [tension, setTension] = useState<"12" | "24" | "48">("12");
  const [chemistry, setChemistry] = useState<EnergyBudgetChemistry>("lifepo4");
  const [capaciteAh, setCapaciteAh] = useState(200);

  const [solarOn, setSolarOn] = useState(false);
  const [panelsWc, setPanelsWc] = useState(200);
  const [peakSunHours, setPeakSunHours] = useState(4);

  const [dcdcOn, setDcdcOn] = useState(false);
  const [dcdcA, setDcdcA] = useState(20);
  const [drivingHours, setDrivingHours] = useState(2);

  const [shoreOn, setShoreOn] = useState(false);
  const [shoreA, setShoreA] = useState(15);
  const [shoreHours, setShoreHours] = useState(8);

  const t = parseFloat(tension);

  function updateAppareil(id: number, patch: Partial<Appareil>) {
    setAppareils((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }
  function addAppareil() {
    setAppareils((prev) => [...prev, { id: nextId++, nom: "", puissance: "", heures: 0 }]);
  }
  function addPresetAppareil(preset: { nom: string; puissance: string; heures: number }) {
    setAppareils((prev) => [...prev, { id: nextId++, ...preset }]);
  }
  function removeAppareil(id: number) {
    setAppareils((prev) => prev.filter((a) => a.id !== id));
  }

  const totalWh = appareils.reduce((sum, a) => sum + (parseFloat(a.puissance) || 0) * a.heures, 0);
  const totalAh = t > 0 ? totalWh / t : 0;

  const hasResult = totalWh > 0;
  const result = hasResult
    ? computeEnergyBudget({
        consoWh: totalWh,
        systemVoltage: t,
        capacityAh: capaciteAh,
        chemistry,
        solar: { on: solarOn, panelsWc, peakSunHours },
        dcdc: { on: dcdcOn, chargerA: dcdcA, drivingHoursPerDay: drivingHours },
        shore: { on: shoreOn, chargerA: shoreA, hoursConnectedPerDay: shoreHours },
      })
    : null;

  const anySourceOn = solarOn || dcdcOn || shoreOn;

  const labelClass = "block text-xs font-semibold text-neutral-700 mb-1.5";
  const inputClass = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20";

  function SourceToggle({
    on,
    onToggle,
    label,
    icon,
    children,
  }: {
    on: boolean;
    onToggle: () => void;
    label: string;
    icon: string;
    children: React.ReactNode;
  }) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <div
            onClick={onToggle}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-brand-400" : "bg-neutral-300"}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <span className="text-sm font-semibold text-neutral-800">
            {icon} {label}
          </span>
        </label>
        {on && <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Retour utilisateur (comparatif Wireframe côte à côte) : "le notre
          est beaucoup plus complexe et moins ergonomique, pense débutant
          junior" — l'ancienne mise en page en 2 colonnes (saisies à gauche,
          résultat figé à droite) éloignait le résultat de ce qu'on vient de
          modifier sur une page déjà longue. Tout s'enchaîne maintenant dans
          l'ordre naturel de lecture : banque → sources → appareils →
          résultat juste en dessous, comme sur l'"Energy Budget Calculator"
          de Wireframe. Lignes d'appareils simplifiées : slider brut sans
          libellé répété (le "h/j" affiché en direct suffit), nom en texte
          léger (pas un gros encadré), watts en petit champ secondaire —
          moins de boîtes à l'écran pour la même information. */}
      <div>
        <span className={labelClass}>Votre banque de batteries</span>
        <div className="grid gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-neutral-700">Chimie</span>
            <ToggleGroup
              value={chemistry}
              onChange={setChemistry}
              options={[
                { value: "lifepo4", label: "LiFePO₄" },
                { value: "agm-gel", label: "AGM / Gel" },
              ]}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-neutral-700">Tension système</span>
            <ToggleGroup
              value={tension}
              onChange={setTension}
              options={[
                { value: "12", label: "12 V" },
                { value: "24", label: "24 V" },
                { value: "48", label: "48 V" },
              ]}
            />
          </div>
          <div className="sm:col-span-2">
            <Stepper label="Capacité" value={capaciteAh} onChange={setCapaciteAh} min={0} max={800} step={10} unit="Ah" />
            {capaciteAh > 0 && (
              <p className="mt-1.5 text-xs text-neutral-500">
                {chemistry === "lifepo4" ? "LiFePO₄" : "AGM/Gel"} — capacité utile à {Math.round(USABLE_CAPACITY_RATIO[chemistry] * 100)}% DoD :{" "}
                <strong className="text-neutral-700">
                  {(capaciteAh * USABLE_CAPACITY_RATIO[chemistry]).toFixed(0)} Ah ({((capaciteAh * USABLE_CAPACITY_RATIO[chemistry] * t) / 1000).toFixed(2)} kWh)
                </strong>
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <span className={labelClass}>Vos sources de recharge</span>
        <p className="mb-2 text-xs text-neutral-400">Activez-en une ou plusieurs pour voir de combien elles réduisent votre besoin journalier.</p>
        <div className="space-y-3">
          <SourceToggle on={solarOn} onToggle={() => setSolarOn((v) => !v)} label="Solaire" icon="☀️">
            <div>
              <label className={labelClass}>Puissance panneaux (Wc)</label>
              <input type="number" min="0" value={panelsWc || ""} onChange={(e) => setPanelsWc(parseFloat(e.target.value) || 0)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ensoleillement (h/j)</label>
              <select value={peakSunHours} onChange={(e) => setPeakSunHours(parseFloat(e.target.value))} className={inputClass}>
                <option value={2.5}>2,5 h — Hiver / nord France</option>
                <option value={3.5}>3,5 h — Printemps / automne</option>
                <option value={4}>4 h — Été / façade atlantique</option>
                <option value={5}>5 h — Été / Méditerranée</option>
                <option value={6}>6 h — Été / plein soleil tropical</option>
              </select>
            </div>
          </SourceToggle>

          <SourceToggle on={dcdcOn} onToggle={() => setDcdcOn((v) => !v)} label="DC-DC / alternateur" icon="🔌">
            <div>
              <label className={labelClass}>Courant chargeur (A)</label>
              <input type="number" min="0" value={dcdcA || ""} onChange={(e) => setDcdcA(parseFloat(e.target.value) || 0)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Conduite (h/j)</label>
              <input type="number" min="0" max="24" step="0.5" value={drivingHours || ""} onChange={(e) => setDrivingHours(parseFloat(e.target.value) || 0)} className={inputClass} />
            </div>
          </SourceToggle>

          <SourceToggle on={shoreOn} onToggle={() => setShoreOn((v) => !v)} label="Secteur / quai" icon="🔋">
            <div>
              <label className={labelClass}>Courant chargeur (A)</label>
              <input type="number" min="0" value={shoreA || ""} onChange={(e) => setShoreA(parseFloat(e.target.value) || 0)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Branché (h/j)</label>
              <input type="number" min="0" max="24" step="0.5" value={shoreHours || ""} onChange={(e) => setShoreHours(parseFloat(e.target.value) || 0)} className={inputClass} />
            </div>
          </SourceToggle>
        </div>
      </div>

      <div>
        <span className={labelClass}>Vos appareils</span>
        <div className="space-y-2">
          {appareils.map((a) => {
            const wh = (parseFloat(a.puissance) || 0) * a.heures;
            return (
              <div key={a.id} className="rounded-lg border border-neutral-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Nom de l'appareil"
                    value={a.nom}
                    onChange={(e) => updateAppareil(a.id, { nom: e.target.value })}
                    className="flex-1 border-0 border-b border-transparent bg-transparent px-0 py-1 text-sm font-semibold text-neutral-900 outline-none focus:border-brand-400"
                  />
                  <span className="shrink-0 text-sm font-bold text-neutral-700">{wh > 0 ? `${wh.toFixed(0)} Wh/j` : "—"}</span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={24}
                  step={0.1}
                  value={a.heures}
                  onChange={(e) => updateAppareil(a.id, { heures: Math.round(Number(e.target.value) * 100) / 100 })}
                  className="mt-2 w-full accent-brand-500"
                />
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span>0h</span>
                  <span className="font-semibold text-neutral-600">{a.heures} h/j</span>
                  <span>24h</span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="W"
                    value={a.puissance}
                    onChange={(e) => updateAppareil(a.id, { puissance: e.target.value })}
                    className="w-16 rounded border border-neutral-300 px-1.5 py-1 text-xs outline-none focus:border-brand-400"
                  />
                  <span className="text-xs text-neutral-400">W</span>
                  <button type="button" onClick={() => removeAppareil(a.id)} className="ml-auto shrink-0 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-400 hover:text-red-600" title="Retirer">
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={addAppareil} className="rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:border-brand-400 hover:text-brand-700">
            + Ajouter un appareil manuellement
          </button>
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:border-brand-400"
          >
            {showPicker ? "Masquer" : "+"} Appareils courants
          </button>
        </div>

        {showPicker && (
          <div className="mt-3 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            {PRESETS_APPAREILS.map((cat) => (
              <div key={cat.groupe}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{cat.groupe}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {cat.items.map((item) => (
                    <button
                      key={item.nom}
                      type="button"
                      onClick={() => addPresetAppareil(item)}
                      className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-700 hover:border-brand-400 hover:text-brand-700"
                    >
                      {item.nom} <span className="text-neutral-400">{item.puissance}W · {item.heures}h/j</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Résultat ── */}
      {hasResult && result ? (
        <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-neutral-500">Consommation journalière</p>
              <p className="text-4xl font-bold text-neutral-950">{totalWh.toFixed(0)} Wh</p>
              <p className="mt-1 text-sm font-semibold text-brand-700">{totalAh.toFixed(1)} Ah à {tension} V</p>
            </div>

            {capaciteAh > 0 && (
              <div>
                {result.fullyCovered ? (
                  <>
                    <p className="text-xs text-neutral-500">Autonomie</p>
                    <p className="text-4xl font-bold text-green-700">∞</p>
                    <p className="mt-1 text-sm font-semibold text-green-600">Vos sources actives couvrent toute la consommation</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-neutral-500">Jours d&apos;autonomie {anySourceOn ? "(avec recharge)" : "(sans recharge)"}</p>
                    <p className="text-4xl font-bold text-neutral-950">{formatDuree(result.autonomyHoursWithCharging)}</p>
                    {anySourceOn && <p className="mt-1 text-xs text-neutral-500">Sans aucune recharge : {formatDuree(result.autonomyHoursNoCharging)}</p>}
                  </>
                )}
              </div>
            )}
          </div>

          {capaciteAh > 0 && (
            <div className="border-t border-brand-200 pt-4">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Utilisation de la banque / jour</span>
                <span className="font-semibold text-neutral-700">{Math.round(result.batteryUsageRatioPerDay * 100)}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                  className={`h-full rounded-full ${result.batteryUsageRatioPerDay >= 1 ? "bg-red-500" : result.batteryUsageRatioPerDay >= 0.7 ? "bg-orange-400" : "bg-brand-400"}`}
                  style={{ width: `${Math.min(100, result.batteryUsageRatioPerDay * 100)}%` }}
                />
              </div>
            </div>
          )}

          <StatGrid
            stats={[
              { label: "Énergie utile de la banque", value: `${(result.usableEnergyWh / 1000).toFixed(2)} kWh` },
              ...(solarOn ? [{ label: "Production solaire/j", value: `${result.solarProductionWh.toFixed(0)} Wh` }] : []),
              ...(dcdcOn ? [{ label: "Production DC-DC/j", value: `${result.dcdcProductionWh.toFixed(0)} Wh` }] : []),
              ...(shoreOn ? [{ label: "Production secteur/j", value: `${result.shoreProductionWh.toFixed(0)} Wh` }] : []),
            ]}
          />

          <p className="text-xs text-neutral-500">
            {chemistry === "lifepo4" ? "90% DoD LiFePO₄" : "50% DoD AGM/Gel"} appliqué sur la capacité batterie. Rendement 75% solaire, 92% DC-DC, 87% chargeur secteur.
          </p>
          <AddEnergyToProjectButton appareils={appareils.map((a) => ({ id: a.id, nom: a.nom, puissance: a.puissance, heures: String(a.heures) }))} />
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
          <p className="text-center text-sm text-neutral-400">Ajoutez au moins un appareil pour calculer votre bilan.</p>
        </div>
      )}

      <CalcGuidesLink
        examples={[
          { slug: "schema-solaire-12v-simple", title: "Schéma solaire 12V simple" },
          { slug: "schema-victron-leger-van", title: "Schéma Victron léger pour van" },
          { slug: "schema-bateau-quai-chargeur", title: "Schéma électrique bateau au quai" },
        ]}
      />

      <CalcSafetyNotice
        standards={[
          "EN 1648-2 — Installations électriques 12V des véhicules de loisir",
          "Profondeur de décharge utile par chimie (90% LiFePO₄, 50% AGM/Gel) — même convention que les autres calculateurs du site",
          "Rendements de charge appliqués par source : 75% solaire (angle/température/ombre), 92% DC-DC, 87% chargeur secteur",
        ]}
      />
    </div>
  );
}

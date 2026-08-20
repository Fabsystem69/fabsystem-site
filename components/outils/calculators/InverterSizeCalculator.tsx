"use client";

import { useState } from "react";
import { computeInverterSize, INVERTER_EFFICIENCY, type ApplianceLoad } from "@/lib/calc/inverter-size";
import { findCompatibleInverter } from "@/lib/calc/inverter-match";
import { OpenProjectLink } from "@/components/outils/project-bridge/OpenProjectLink";
import { ToggleGroup } from "@/components/outils/calc-ui/ToggleGroup";
import { CalcSlider } from "@/components/outils/calc-ui/CalcSlider";
import { StatGrid } from "@/components/outils/calc-ui/StatGrid";
import { CalcSafetyNotice } from "@/components/outils/calc-ui/CalcSafetyNotice";
import { CalcGuidesLink } from "@/components/outils/calc-ui/CalcGuidesLink";

let nextId = 1;
type Row = ApplianceLoad & { id: number };

const DEFAULT_ROWS: Row[] = [
  { id: nextId++, label: "Chargeur d'ordinateur", watts: 65, surge: false },
  { id: nextId++, label: "Réfrigérateur à compression", watts: 90, surge: true },
];

// Bibliothèque d'ajout rapide — retour utilisateur (comparatif Wireframe,
// capture "Add an appliance") : leur outil propose des appareils courants
// pré-remplis par catégorie plutôt qu'une saisie 100% manuelle. Liste
// propre à ce calculateur (appareils 230V typiques derrière un onduleur),
// distincte de CONSUMER_PRESETS (lib/electrical-components/definitions.ts)
// qui mélange volontairement 12V et 230V pour l'éditeur de schémas — les
// deux catalogues répondent à des besoins différents, fusionner aurait
// obligé à trier après coup lequel est réellement un appareil 230V.
//
// `surge: true` = appareil avec un vrai moteur/compresseur/transformateur
// dont l'appel au démarrage dépasse nettement la puissance nominale
// (compresseur de frigo/clim, moteur universel de sèche-cheveux/aspirateur/
// machine à coudre/mixeur, transformateur de magnétron du micro-ondes).
// Volontairement `false` pour les petits ventilateurs de refroidissement
// électroniques (console, vidéoprojecteur) dont l'appel est négligeable —
// retour utilisateur : réaudité en détail après un premier passage qui
// avait laissé passer le micro-ondes et le sèche-cheveux malgré un vrai
// moteur/transformateur à l'intérieur.
const PRESET_APPLIANCES: { group: string; items: { label: string; watts: number; surge: boolean }[] }[] = [
  {
    group: "Réfrigération",
    items: [
      { label: "Réfrigérateur à compression (230V)", watts: 120, surge: true },
      { label: "Congélateur à compression (230V)", watts: 150, surge: true },
      { label: "Glacière électrique à compression", watts: 60, surge: true },
    ],
  },
  {
    group: "Cuisine",
    items: [
      { label: "Plaque à induction (simple)", watts: 1800, surge: false },
      { label: "Plaque à induction (double)", watts: 3000, surge: false },
      { label: "Airfryer", watts: 1500, surge: false },
      { label: "Micro-ondes", watts: 1000, surge: true },
      { label: "Bouilloire électrique", watts: 1500, surge: false },
      { label: "Cafetière", watts: 1200, surge: false },
      { label: "Grille-pain", watts: 800, surge: false },
      { label: "Mixeur / blender", watts: 500, surge: true },
    ],
  },
  {
    group: "Confort",
    items: [
      { label: "Sèche-cheveux", watts: 1200, surge: true },
      { label: "Climatiseur portable (230V)", watts: 1200, surge: true },
      { label: "Couverture chauffante", watts: 60, surge: false },
      { label: "Radiateur d'appoint", watts: 2000, surge: false },
    ],
  },
  {
    group: "Électronique",
    items: [
      { label: "Chargeur ordinateur portable", watts: 65, surge: false },
      { label: "Écran", watts: 30, surge: false },
      { label: "Console de jeu", watts: 120, surge: false },
      { label: "Vidéoprojecteur", watts: 65, surge: false },
    ],
  },
  {
    group: "Utilitaire",
    items: [
      { label: "Mini machine à laver portable", watts: 150, surge: true },
      { label: "Aspirateur", watts: 800, surge: true },
      { label: "Chauffe-eau instantané", watts: 1500, surge: false },
      { label: "Machine à coudre", watts: 100, surge: true },
    ],
  },
];

/** Chimies supportant une décharge quasi complète sans dommage (BMS coupe
 * en bas de plage) vs plomb (AGM/Gel) où 50% reste la limite usuelle pour
 * préserver le nombre de cycles — même convention que le sous-calculateur
 * d'autonomie de charge du calculateur MPPT (lib/calc/mppt-match.ts n'est
 * pas concerné, la constante est dupliquée volontairement : les deux
 * calculateurs restent indépendants, pas de couplage pour une valeur aussi
 * simple). */
const USABLE_CAPACITY_RATIO: Record<"lifepo4" | "agm-gel", number> = {
  lifepo4: 0.9,
  "agm-gel": 0.5,
};

export default function InverterSizeCalculator() {
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS);
  const [tension, setTension] = useState<"12" | "24" | "48">("12");
  const [longueur, setLongueur] = useState(2);
  const [showPicker, setShowPicker] = useState(false);
  const [showVaConverter, setShowVaConverter] = useState(false);
  const [vaValue, setVaValue] = useState(0);
  const [powerFactor, setPowerFactor] = useState(0.8);

  const [battCapaciteAh, setBattCapaciteAh] = useState(200);
  const [battChimie, setBattChimie] = useState<"lifepo4" | "agm-gel">("lifepo4");

  const t = parseFloat(tension) as 12 | 24 | 48;
  const appliances: ApplianceLoad[] = rows.filter((r) => r.watts > 0);
  const hasResult = appliances.length > 0;
  const result = hasResult ? computeInverterSize(appliances, t, longueur || 2) : null;
  const worstSurge = [...appliances].filter((a) => a.surge).sort((a, b) => b.watts - a.watts)[0];

  // Sous-calculateur "combien de temps va durer ma batterie" — retour
  // utilisateur (comparatif Wireframe, capture "How long will my battery
  // last?") : entièrement absent de notre version précédente. Énergie
  // utile (Ah × V) × rendement onduleur ÷ charge continue = autonomie.
  const usableAh = battCapaciteAh * USABLE_CAPACITY_RATIO[battChimie];
  const usableWh = usableAh * t;
  const runtimeHours = result && result.continuousW > 0 ? (usableWh * INVERTER_EFFICIENCY) / result.continuousW : 0;
  const hasRuntimeResult = hasResult && battCapaciteAh > 0;

  // Correspondance avec le catalogue réel (retour utilisateur : le
  // calculateur recommandait un calibre normalisé théorique, jamais
  // confronté à un vrai produit du marché — même écart déjà corrigé sur le
  // calculateur MPPT). On dimensionne sur la POINTE (peakW), pas la charge
  // continue : c'est elle qui détermine si l'onduleur tient sans se
  // couper.
  const inverterMatches = result ? findCompatibleInverter(result.peakW, t) : [];
  const recommendedInverter = inverterMatches[0];
  const alsoCompatibleInverters = inverterMatches.slice(1, 4);

  const inputClass = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20";
  const labelClass = "block text-xs font-semibold text-neutral-700 mb-1.5";

  function updateRow(id: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: nextId++, label: "", watts: 0, surge: false }]);
  }

  function addPresetRow(preset: { label: string; watts: number; surge: boolean }) {
    setRows((prev) => [...prev, { id: nextId++, ...preset }]);
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Inputs ── */}
      <div className="space-y-5">
        <div>
          <span className={labelClass}>Appareils branchés sur l&apos;onduleur</span>
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg border border-neutral-200 p-2">
                {/* Retour utilisateur (capture mobile) : le nom de
                    l'appareil était écrasé à quelques pixels de large par
                    les champs voisins sur un écran étroit — illisible et
                    injustifiable, l'appareil et sa puissance doivent être
                    identifiables du premier coup d'œil, y compris sur
                    téléphone. Nom sur sa propre ligne, toujours pleine
                    largeur, quelle que soit la taille d'écran. */}
                <input
                  type="text"
                  placeholder="Nom de l'appareil"
                  value={row.label}
                  onChange={(e) => updateRow(row.id, { label: e.target.value })}
                  className={`${inputClass} mb-2`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="W"
                    value={row.watts || ""}
                    onChange={(e) => updateRow(row.id, { watts: parseFloat(e.target.value) || 0 })}
                    className={`${inputClass} w-20 shrink-0`}
                  />
                  <label className="flex shrink-0 items-center gap-1 text-[11px] text-neutral-500" title="Fort appel au démarrage (compresseur, moteur)">
                    <input type="checkbox" checked={row.surge} onChange={(e) => updateRow(row.id, { surge: e.target.checked })} />
                    Moteur
                  </label>
                  <button type="button" onClick={() => removeRow(row.id)} className="ml-auto shrink-0 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-400 hover:text-red-600" title="Retirer">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={addRow} className="rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:border-brand-400 hover:text-brand-700">
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
          <p className="mt-1.5 text-xs text-neutral-400">
            Cochez « Moteur » pour un appareil à compresseur/moteur (frigo, micro-ondes, perceuse…) — l&apos;appel au démarrage dépasse largement sa puissance nominale.
          </p>

          {showPicker && (
            <div className="mt-3 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              {PRESET_APPLIANCES.map((cat) => (
                <div key={cat.group}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{cat.group}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {cat.items.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => addPresetRow(item)}
                        className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-700 hover:border-brand-400 hover:text-brand-700"
                      >
                        {item.label} <span className="text-neutral-400">{item.watts}W</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowVaConverter((v) => !v)}
            className="mt-3 flex w-full items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 hover:border-brand-400"
          >
            <span>Vous avez une puissance en VA ? Convertissez-la en Watts</span>
            <span>{showVaConverter ? "▲" : "▼"}</span>
          </button>
          {showVaConverter && (
            <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Puissance apparente (VA)</label>
                  <input type="number" min="0" value={vaValue || ""} onChange={(e) => setVaValue(parseFloat(e.target.value) || 0)} className={inputClass} />
                </div>
                <CalcSlider label="Facteur de puissance" value={powerFactor} onChange={setPowerFactor} min={0.5} max={1} step={0.05} helpText="≈0,6-0,8 pour un moteur/électronique, 1 pour une résistance pure (chauffage, bouilloire…)" />
              </div>
              <p className="mt-2 text-sm text-neutral-700">
                {vaValue.toFixed(0)} VA × {powerFactor.toFixed(2)} = <span className="font-semibold text-neutral-950">{(vaValue * powerFactor).toFixed(0)} W</span>
              </p>
              <button
                type="button"
                onClick={() => addPresetRow({ label: "Appareil (converti VA→W)", watts: Math.round(vaValue * powerFactor), surge: false })}
                disabled={vaValue <= 0}
                className="mt-2 rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:border-brand-400 hover:text-brand-700 disabled:opacity-40"
              >
                + Ajouter cet appareil
              </button>
            </div>
          )}
        </div>

        <div>
          <span className={labelClass}>Tension système</span>
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

        <CalcSlider label="Longueur câble batterie → onduleur" value={longueur} onChange={setLongueur} min={0} max={10} step={0.5} unit="m" />
      </div>

      {/* ── Résultat ── */}
      <div>
        {hasResult && result ? (
          <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>

            <div>
              <p className="text-xs text-neutral-500">Onduleur recommandé</p>
              <p className="text-4xl font-bold text-neutral-950">{result.recommendedInverterW.toLocaleString("fr-FR")} W</p>
              <p className="mt-1 text-sm font-semibold text-brand-700">Pointe estimée : {result.peakW.toFixed(0)} W</p>
            </div>

            <p className="border-t border-brand-200 pt-4 text-sm text-neutral-700">
              {worstSurge ? (
                <>
                  {result.continuousW.toFixed(0)} W continue − {worstSurge.watts.toFixed(0)} W + {worstSurge.watts.toFixed(0)} W × 3 (démarrage{worstSurge.label ? ` ${worstSurge.label}` : ""}) ={" "}
                </>
              ) : (
                <>Aucun appareil « Moteur » coché, pas de pointe au démarrage à couvrir : </>
              )}
              <span className="font-semibold text-neutral-950">{result.peakW.toFixed(0)} W</span> de pointe estimée
            </p>

            <p className="text-sm text-neutral-700">
              {result.continuousW.toFixed(0)} W ÷ {tension} V ÷ 0,9 (rendement) ={" "}
              <span className="font-semibold text-neutral-950">{result.dcCurrentA.toFixed(1)} A</span> côté batterie DC
            </p>

            <StatGrid
              stats={[
                { label: "Charge continue", value: `${result.continuousW.toFixed(0)} W` },
                { label: "Courant DC batterie", value: `${result.dcCurrentA.toFixed(0)} A` },
                { label: "Fusible DC conseillé", value: `${result.dcFuseA !== null ? `${result.dcFuseA} A` : "> 400 A"} (${result.dcFuseFormatLabel})` },
                { label: "Câble DC conseillé", value: `${result.dcCableSectionMm2} mm²` },
              ]}
            />

            <div className="border-t border-brand-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Onduleur du catalogue</p>
              {recommendedInverter ? (
                <>
                  <p className="mt-1 text-sm font-bold text-neutral-950">
                    {recommendedInverter.brand} {recommendedInverter.model}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {recommendedInverter.powerW} W · {recommendedInverter.voltageDC} V
                    {recommendedInverter.hasCharger ? ` · chargeur intégré ${recommendedInverter.chargeAmperage} A` : ""}
                  </p>
                  {alsoCompatibleInverters.length > 0 && (
                    <p className="mt-1 text-xs text-neutral-500">
                      Aussi compatibles : {alsoCompatibleInverters.map((m) => `${m.brand} ${m.model}`).join(", ")}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-xs text-neutral-500">
                  Aucun modèle du catalogue de l&apos;éditeur ne couvre cette pointe ({result.peakW.toFixed(0)} W à {tension} V) — vérifiez la fiche technique d&apos;un onduleur plus puissant.
                </p>
              )}
            </div>

            <div className="rounded-lg bg-neutral-100 border border-neutral-200 px-3 py-2 text-xs text-neutral-600">
              ℹ️ Ce calcul suppose tous les appareils cochés en même temps. En pratique, dimensionnez surtout pour votre plus gros appareil utilisé seul plus vos charges permanentes (veille onduleur, etc.).
            </div>

            <p className="text-xs text-neutral-500">Rendement onduleur 90 % appliqué. Câble dimensionné pour une chute de tension de 3 %.</p>
            <OpenProjectLink label="Continuer dans mon projet" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
            <p className="text-center text-sm text-neutral-400">Ajoutez au moins un appareil avec sa puissance pour dimensionner l&apos;onduleur.</p>
          </div>
        )}
      </div>
      </div>

      {hasResult && (
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Combien de temps va durer ma batterie ?</p>

          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <CalcSlider label="Capacité batterie" value={battCapaciteAh} onChange={setBattCapaciteAh} min={0} max={800} step={10} unit="Ah" />

              <div>
                <span className="mb-1.5 block text-xs font-semibold text-neutral-700">Chimie batterie</span>
                <ToggleGroup
                  value={battChimie}
                  onChange={setBattChimie}
                  options={[
                    { value: "lifepo4", label: "LiFePO₄" },
                    { value: "agm-gel", label: "AGM / Gel" },
                  ]}
                />
                <p className="mt-1 text-xs text-neutral-400">
                  {Math.round(USABLE_CAPACITY_RATIO[battChimie] * 100)}% utile ({usableAh.toFixed(0)} Ah, {usableWh.toFixed(0)} Wh)
                </p>
              </div>
            </div>

            <div>
              {hasRuntimeResult ? (
                <StatGrid
                  stats={[
                    { label: "Autonomie (tous appareils cochés)", value: runtimeHours > 0 ? `${runtimeHours.toFixed(1)} h` : "—", tone: runtimeHours < 0.5 ? "warning" : "default" },
                    { label: "Énergie utile", value: `${usableWh.toFixed(0)} Wh` },
                    { label: "Charge continue", value: `${result?.continuousW.toFixed(0)} W` },
                  ]}
                />
              ) : (
                <p className="text-sm text-neutral-400">Renseignez la capacité batterie pour estimer l&apos;autonomie.</p>
              )}
              <p className="mt-4 text-xs text-neutral-500">
                Suppose tous les appareils cochés fonctionnant en même temps, à {Math.round(INVERTER_EFFICIENCY * 100)}% de rendement onduleur. En pratique, un appareil forte puissance (bouilloire, micro-ondes…) n&apos;est utilisé que quelques minutes, pas en continu — l&apos;autonomie réelle est généralement bien meilleure.
              </p>
            </div>
          </div>
        </div>
      )}

      <CalcGuidesLink
        examples={[
          { slug: "schema-victron-leger-van", title: "Schéma Victron léger pour van" },
          { slug: "schema-bateau-complet-lynx", title: "Schéma bateau complet avec bus Lynx" },
          { slug: "schema-station-electrique-van", title: "Schéma station électrique van" },
        ]}
      />

      <CalcSafetyNotice
        standards={[
          "EN 1648-2 — Installations électriques 12V des véhicules de loisir",
          "NF C 15-100 — Installations électriques basse tension (partie fixe)",
          "Rendement onduleur type 90 % — pratique standard pour un dimensionnement conservateur",
          "Profondeur de décharge utile par chimie (90% LiFePO₄, 50% AGM/Gel) — préserve le nombre de cycles, même convention que le calculateur MPPT",
        ]}
      />
    </div>
  );
}

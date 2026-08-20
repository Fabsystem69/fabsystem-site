"use client";

import { useState } from "react";
import { computeChargeSecteur, computeChargeTime, type ChargeChemistry } from "@/lib/calc/charge-secteur";
import { findCompatibleCharger } from "@/lib/calc/charge-match";
import { OpenProjectLink } from "@/components/outils/project-bridge/OpenProjectLink";
import { ToggleGroup } from "@/components/outils/calc-ui/ToggleGroup";
import { Stepper } from "@/components/outils/calc-ui/Stepper";
import { CalcSlider } from "@/components/outils/calc-ui/CalcSlider";
import { StatGrid } from "@/components/outils/calc-ui/StatGrid";
import { CalcSafetyNotice } from "@/components/outils/calc-ui/CalcSafetyNotice";
import { CalcGuidesLink } from "@/components/outils/calc-ui/CalcGuidesLink";

const BORNES = [
  { value: "6", label: "6 A" },
  { value: "10", label: "10 A" },
  { value: "16", label: "16 A" },
  { value: "32", label: "32 A" },
];

const formatDuree = (h: number) => {
  if (h <= 0) return "—";
  const hEntier = Math.floor(h);
  const m = Math.round((h - hEntier) * 60);
  return m > 0 ? `${hEntier}h${String(m).padStart(2, "0")}` : `${hEntier}h`;
};

// Retour utilisateur (comparatif Wireframe, "How Long to Charge from Shore
// Power?") : l'ancien calculateur dimensionnait un chargeur mais ne
// répondait jamais à la question posée par son propre nom — combien de
// temps pour charger. Ajouté : état de charge de départ, temps de charge
// en deux phases (bulk/absorption), et un vrai chargeur du catalogue à
// choisir plutôt qu'une simple borne disponible.
export default function ChargeSecteurCalculator() {
  const [chemistry, setChemistry] = useState<ChargeChemistry>("lithium");
  const [tension, setTension] = useState<"12" | "24">("12");
  const [capacite, setCapacite] = useState(200);
  const [startingSoc, setStartingSoc] = useState(20);
  const [borne, setBorne] = useState("16");

  const cap = capacite;
  const availableA = parseFloat(borne) || 0;
  const hasResult = cap > 0;
  const t = tension === "24" ? 24 : 12;

  const result = hasResult ? computeChargeSecteur(chemistry, t, cap, availableA) : null;
  const chargeTime = result ? computeChargeTime(result.chargeCurrentA, cap, startingSoc, chemistry) : null;

  const matches = result ? findCompatibleCharger(result.chargeCurrentA, t) : [];
  const recommendedCharger = matches[0];
  const alsoCompatibleChargers = matches.slice(1, 4);

  const labelClass = "block text-xs font-semibold text-neutral-700 mb-1.5";

  return (
    <div className="space-y-6">
      <div>
        <span className={labelClass}>Votre banque de batteries</span>
        <div className="grid gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-neutral-700">Chimie</span>
            <ToggleGroup
              value={chemistry}
              onChange={setChemistry}
              options={[
                { value: "lithium", label: "LiFePO₄" },
                { value: "agm-gel", label: "AGM / Gel" },
              ]}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-neutral-700">Tension</span>
            <ToggleGroup
              value={tension}
              onChange={setTension}
              options={[
                { value: "12", label: "12 V" },
                { value: "24", label: "24 V" },
              ]}
            />
          </div>
          <div>
            <Stepper label="Capacité" value={capacite} onChange={setCapacite} min={0} max={800} step={10} unit="Ah" />
          </div>
          <div>
            <CalcSlider label="État de charge de départ" value={startingSoc} onChange={setStartingSoc} min={0} max={100} step={5} unit="%" />
          </div>
        </div>
      </div>

      <div>
        <span className={labelClass}>Borne / prise secteur disponible</span>
        <ToggleGroup value={borne} onChange={setBorne} options={BORNES} />
        <p className="mt-1.5 text-xs text-neutral-400">Calibre du disjoncteur de la borne de camping ou de port (230 V monophasé).</p>
      </div>

      {hasResult && result && chargeTime ? (
        <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Temps de charge estimé</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-neutral-500">
                De {startingSoc}% à 100%
              </p>
              <p className="text-4xl font-bold text-neutral-950">{formatDuree(chargeTime.totalHours)}</p>
              <p className="mt-1 text-sm font-semibold text-brand-700">Courant de charge : {result.chargeCurrentA.toFixed(0)} A</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Chargeur nécessaire</p>
              <p className="text-2xl font-bold text-neutral-950">{result.dcPowerW.toFixed(0)} W ({t} V)</p>
              <p className={`mt-1 text-sm font-semibold ${result.fitsAvailable ? "text-neutral-700" : "text-red-600"}`}>
                {result.mainsCurrentA.toFixed(1)} A côté secteur {result.fitsAvailable ? "— OK sur la borne choisie" : "— dépasse la borne choisie"}
              </p>
            </div>
          </div>

          {/* Chronologie bulk/absorption — retour utilisateur (comparatif
              Wireframe, "Charge Timeline") : visualiser les deux phases au
              lieu d'un seul chiffre total. */}
          <div className="border-t border-brand-200 pt-4">
            <div className="flex h-6 w-full overflow-hidden rounded-full text-[10px] font-bold text-white">
              {chargeTime.bulkHours > 0 && (
                <div
                  className="flex items-center justify-center bg-emerald-500"
                  style={{ width: `${(chargeTime.bulkHours / chargeTime.totalHours) * 100}%` }}
                >
                  {formatDuree(chargeTime.bulkHours)}
                </div>
              )}
              {chargeTime.absorptionHours > 0 && (
                <div
                  className="flex items-center justify-center bg-orange-400"
                  style={{ width: `${(chargeTime.absorptionHours / chargeTime.totalHours) * 100}%` }}
                >
                  {formatDuree(chargeTime.absorptionHours)}
                </div>
              )}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-neutral-400">
              <span>Bulk (courant constant)</span>
              <span>Absorption (dégressif, jusqu&apos;à {chargeTime.bulkThresholdPct}% → 100%)</span>
            </div>
          </div>

          <StatGrid
            stats={[
              { label: "Fusible/disjoncteur DC", value: result.dcFuseA },
              { label: "Taux de charge", value: chemistry === "lithium" ? "0,5 C" : "0,2 C" },
              { label: "Borne choisie", value: `${availableA} A` },
            ]}
          />

          <div className="border-t border-brand-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Chargeur du catalogue</p>
            {recommendedCharger ? (
              <>
                <p className="mt-1 text-sm font-bold text-neutral-950">
                  {recommendedCharger.brand} {recommendedCharger.model}
                </p>
                <p className="text-xs text-neutral-500">{recommendedCharger.chargeAmperage} A</p>
                {alsoCompatibleChargers.length > 0 && (
                  <p className="mt-1 text-xs text-neutral-500">Aussi compatibles : {alsoCompatibleChargers.map((m) => `${m.brand} ${m.model}`).join(", ")}</p>
                )}
              </>
            ) : (
              <p className="mt-1 text-xs text-neutral-500">Aucun modèle du catalogue de l&apos;éditeur ne couvre ce calibre — vérifiez la fiche technique d&apos;un chargeur plus puissant.</p>
            )}
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
            Rendement chargeur 87% appliqué. Modèle bulk/absorption approximatif — la courbe réelle dépend du profil de charge exact du chargeur/BMS.
          </p>
          <OpenProjectLink label="Continuer dans mon projet" />
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
          <p className="text-center text-sm text-neutral-400">Renseignez la capacité du banc de batteries pour estimer le temps de charge.</p>
        </div>
      )}

      <CalcGuidesLink
        examples={[
          { slug: "schema-bateau-quai-chargeur", title: "Schéma électrique bateau au quai" },
          { slug: "schema-station-electrique-van", title: "Schéma station électrique van" },
        ]}
      />

      <CalcSafetyNotice
        standards={[
          "EN 1648-2 — Installations électriques 12V des véhicules de loisir",
          "Disjoncteur différentiel 30 mA obligatoire en tête d'installation secteur embarquée",
          "Modèle de charge bulk/absorption — seuil de transition et taux d'absorption approximatifs par chimie, à confirmer avec la fiche technique du chargeur/BMS",
        ]}
      />
    </div>
  );
}

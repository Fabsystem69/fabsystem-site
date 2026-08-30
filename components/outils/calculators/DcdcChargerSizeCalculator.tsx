"use client";

import { useState } from "react";
import { computeDcdcChargerSize, type DcdcBatteryChemistry } from "@/lib/calc/dcdc-charger-size";
import { OpenProjectLink } from "@/components/outils/project-bridge/OpenProjectLink";
import { ToggleGroup } from "@/components/outils/calc-ui/ToggleGroup";
import { CalcSlider } from "@/components/outils/calc-ui/CalcSlider";
import { StatGrid } from "@/components/outils/calc-ui/StatGrid";
import { CalcSafetyNotice } from "@/components/outils/calc-ui/CalcSafetyNotice";
import { CalcGuidesLink } from "@/components/outils/calc-ui/CalcGuidesLink";

export default function DcdcChargerSizeCalculator() {
  const [alternatorA, setAlternatorA] = useState(120);
  const [chemistry, setChemistry] = useState<DcdcBatteryChemistry>("lithium");
  const [capacite, setCapacite] = useState(0);
  const [driveHours, setDriveHours] = useState(2);

  const hasResult = alternatorA > 0 && capacite > 0;
  const result = hasResult ? computeDcdcChargerSize(alternatorA, chemistry, capacite, driveHours) : null;

  const labelClass = "block text-xs font-semibold text-neutral-700 mb-1.5";

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Inputs ── */}
      <div className="space-y-5">
        <div>
          <CalcSlider label="Courant nominal alternateur" value={alternatorA} onChange={setAlternatorA} min={0} max={250} step={5} unit="A" />
          <p className="mt-1 text-xs text-neutral-400">Indiqué sur l&apos;alternateur ou la fiche véhicule.</p>
        </div>

        <div>
          <span className={labelClass}>Chimie batterie servitude</span>
          <ToggleGroup
            value={chemistry}
            onChange={setChemistry}
            options={[
              { value: "lithium", label: "Lithium LiFePO₄" },
              { value: "agm-gel", label: "AGM / Gel (plomb)" },
            ]}
          />
        </div>

        <CalcSlider label="Capacité batterie servitude" value={capacite} onChange={setCapacite} min={0} max={800} step={10} unit="Ah" />

        <div>
          <CalcSlider label="Temps de conduite par jour" value={driveHours} onChange={setDriveHours} min={0} max={12} step={0.5} unit="h" />
          <p className="mt-1 text-xs text-neutral-400">Sert uniquement à estimer les Ah rechargés par trajet.</p>
        </div>
      </div>

      {/* ── Résultat ── */}
      <div>
        {hasResult && result ? (
          <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>

            <div>
              <p className="text-xs text-neutral-500">Chargeur DC-DC recommandé</p>
              <p className="text-4xl font-bold text-neutral-950">{result.recommendedChargerA} A</p>
              <p className="mt-1 text-sm font-semibold text-brand-700">Facteur limitant : {result.limitingFactor}</p>
            </div>

            <p className="border-t border-brand-200 pt-4 text-sm text-neutral-700">
              {alternatorA.toFixed(0)} A × 35 % (alternateur) = <span className="font-semibold text-neutral-950">{result.maxFromAlternatorA.toFixed(0)} A</span>
              <br />
              {capacite.toFixed(0)} Ah × {chemistry === "lithium" ? "0,5" : "0,2"} C (batterie) = <span className="font-semibold text-neutral-950">{result.maxFromBatteryA.toFixed(0)} A</span>
            </p>

            <StatGrid
              stats={[
                { label: "Max sûr côté alternateur", value: `${result.maxFromAlternatorA.toFixed(0)} A` },
                { label: "Max accepté par la batterie", value: `${result.maxFromBatteryA.toFixed(0)} A` },
                { label: "Fusible conseillé", value: `${result.dcFuseA !== null ? `${result.dcFuseA} A` : "> 400 A"} (${result.dcFuseFormatLabel})` },
                { label: "Recharge par trajet", value: `≈ ${result.ahPerDrive.toFixed(0)} Ah` },
              ]}
            />

            {result.limitingFactor === "alternateur" ? (
              <div className="rounded-lg bg-neutral-100 border border-neutral-200 px-3 py-2 text-xs text-neutral-600">
                ℹ️ Tirer plus de 35 % en continu sur un alternateur d&apos;origine peut l&apos;user prématurément (bobinage, diodes). C&apos;est ce qui borne le calibre ici, pas la batterie.
              </div>
            ) : (
              <div className="rounded-lg bg-neutral-100 border border-neutral-200 px-3 py-2 text-xs text-neutral-600">
                ℹ️ La batterie n&apos;accepte pas plus que ce taux de charge en toute sécurité ({chemistry === "lithium" ? "0,5 C" : "0,2 C"}) — un chargeur plus puissant ne rechargerait pas plus vite.
              </div>
            )}

            <p className="text-xs text-neutral-500">Un chargeur DC-DC (pas un simple câble direct) reste nécessaire pour un profil de charge correct et pour isoler la batterie moteur.</p>
            <OpenProjectLink label="Continuer dans mon projet" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
            <p className="text-center text-sm text-neutral-400">Renseignez l&apos;alternateur et la capacité de la batterie pour dimensionner le chargeur.</p>
          </div>
        )}
      </div>
      </div>

      <CalcGuidesLink
        examples={[
          { slug: "schema-aferiy-p280-van", title: "Schéma AFERIY P280 pour van" },
          { slug: "schema-voilier-autonome-12v-230v", title: "Schéma voilier autonome avec 12 V et 230 V" },
          { slug: "schema-vito-280ah-van", title: "Schéma van lithium 280 Ah avec solaire et 230 V" },
        ]}
      />

      <CalcSafetyNotice
        standards={[
          "EN 1648-2 — Installations électriques 12V des véhicules de loisir",
          "Règle des 35 % de charge continue max sur un alternateur d'origine — pratique standard pour préserver bobinage et diodes",
          "Taux de charge max par chimie — 0,5 C lithium LiFePO₄, 0,2 C AGM/Gel",
        ]}
      />
    </div>
  );
}

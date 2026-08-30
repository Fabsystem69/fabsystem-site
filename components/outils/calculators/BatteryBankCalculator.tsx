"use client";

import { useState } from "react";
import { computeBatteryBank, type BatteryBankChemistry } from "@/lib/calc/battery-bank";
import { findCompatibleBattery } from "@/lib/calc/battery-match";
import { getArrayConfigs } from "@/lib/calc/array-config";
import { OpenProjectLink } from "@/components/outils/project-bridge/OpenProjectLink";
import { Stepper } from "@/components/outils/calc-ui/Stepper";
import { ToggleGroup } from "@/components/outils/calc-ui/ToggleGroup";
import { StatGrid } from "@/components/outils/calc-ui/StatGrid";
import { CalcSafetyNotice } from "@/components/outils/calc-ui/CalcSafetyNotice";
import { CalcGuidesLink } from "@/components/outils/calc-ui/CalcGuidesLink";

// Retour utilisateur (comparatif Wireframe, "Battery Bank Calculator") :
// gap confirmé après audit — aucun outil du site ne dimensionnait une
// banque de plusieurs batteries. Même pivot que le calculateur MPPT : le
// nombre d'unités détermine les configurations série/parallèle possibles,
// proposées à choisir plutôt que saisies indépendamment.
export default function BatteryBankCalculator() {
  const [unitVoltage, setUnitVoltage] = useState<"12" | "24">("12");
  const [unitCapacityAh, setUnitCapacityAh] = useState(100);
  const [chemistry, setChemistry] = useState<BatteryBankChemistry>("lifepo4");
  const [nbBatteries, setNbBatteries] = useState(0);
  const [selectedSeries, setSelectedSeries] = useState(1);

  const uV = parseFloat(unitVoltage);
  const configs = getArrayConfigs(nbBatteries);
  const serie = configs.some((c) => c.series === selectedSeries) ? selectedSeries : (configs[0]?.series ?? 1);
  const parallele = nbBatteries > 0 ? nbBatteries / serie : 1;

  const hasResult = nbBatteries > 0 && unitCapacityAh > 0;
  const result = hasResult ? computeBatteryBank(uV, unitCapacityAh, serie, parallele, chemistry) : null;

  // Pour comparer "tout en parallèle" vs "tout en série" avec le même
  // nombre d'unités (retour utilisateur implicite du modèle Wireframe :
  // aide à choisir la stratégie avant d'aller chercher une config mixte).
  const allParallel = hasResult ? computeBatteryBank(uV, unitCapacityAh, 1, nbBatteries, chemistry) : null;
  const allSeries = hasResult ? computeBatteryBank(uV, unitCapacityAh, nbBatteries, 1, chemistry) : null;

  const matches = result ? findCompatibleBattery(uV, unitCapacityAh, chemistry) : [];
  const recommendedBattery = matches[0];
  const alsoCompatibleBatteries = matches.slice(1, 4);

  const labelClass = "block text-xs font-semibold text-neutral-700 mb-1.5";

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-2">
        {/* ── Inputs ── */}
        <div className="space-y-5">
          <div>
            <span className={labelClass}>Étape 1 — Votre batterie</span>
          </div>

          <div>
            <span className={labelClass}>Tension unitaire</span>
            <ToggleGroup
              value={unitVoltage}
              onChange={setUnitVoltage}
              options={[
                { value: "12", label: "12 V" },
                { value: "24", label: "24 V" },
              ]}
            />
          </div>

          <Stepper label="Capacité unitaire" value={unitCapacityAh} onChange={setUnitCapacityAh} min={0} max={400} step={10} unit="Ah" />

          <div>
            <span className={labelClass}>Chimie</span>
            <ToggleGroup
              value={chemistry}
              onChange={setChemistry}
              options={[
                { value: "lifepo4", label: "LiFePO₄ (lithium)" },
                { value: "agm-gel", label: "AGM / Gel (plomb)" },
              ]}
            />
          </div>

          <div className="border-t border-neutral-200 pt-5">
            <span className={labelClass}>Étape 2 — Configurez la banque</span>
          </div>

          <Stepper label="Nombre de batteries" value={nbBatteries} onChange={setNbBatteries} min={0} max={12} step={1} />

          {configs.length > 0 && (
            <div>
              <span className={labelClass}>Configuration du câblage</span>
              <div className="grid grid-cols-3 gap-2">
                {configs.map((c) => {
                  const isSelected = c.series === serie;
                  return (
                    <button
                      key={c.series}
                      type="button"
                      onClick={() => setSelectedSeries(c.series)}
                      className={`rounded-lg border-2 p-2 text-left text-xs transition-colors ${isSelected ? "border-brand-400 bg-brand-50" : "border-neutral-200 hover:border-neutral-300"}`}
                    >
                      <p className="font-bold text-neutral-900">
                        {c.series}S{c.parallel}P
                      </p>
                      <p className="text-neutral-500">
                        {c.series === 1 ? "tout en parallèle" : c.parallel === 1 ? "tout en série" : `${c.parallel} strings de ${c.series}`}
                      </p>
                      <p className="mt-1 font-semibold text-neutral-700">
                        {(uV * c.series).toFixed(0)}V · {(unitCapacityAh * c.parallel).toFixed(0)}Ah
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Résultat ── */}
        <div>
          {hasResult && result ? (
            <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>

              <div>
                <p className="text-xs text-neutral-500">
                  {nbBatteries}× {unitVoltage}V {unitCapacityAh}Ah {chemistry === "lifepo4" ? "LiFePO₄" : "AGM/Gel"}
                </p>
                <p className="text-4xl font-bold text-neutral-950">
                  {result.systemVoltage}V · {result.totalCapacityAh.toFixed(0)}Ah
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-700">
                  {serie}S{parallele}P → {(result.totalEnergyWh / 1000).toFixed(1)} kWh au total
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Câblage — {serie}S{parallele}P
                </p>
                <div className="space-y-1.5 overflow-x-auto">
                  {Array.from({ length: parallele }).map((_, stringIdx) => (
                    <div key={stringIdx} className="flex items-center gap-1">
                      {parallele > 1 && <span className="w-14 shrink-0 text-[10px] text-neutral-400">String {stringIdx + 1}</span>}
                      {Array.from({ length: serie }).map((_, unitIdx) => (
                        <div key={unitIdx} className="flex items-center">
                          <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded border-2 border-brand-400 bg-white text-[10px] font-semibold text-brand-700">
                            {unitVoltage}V {unitCapacityAh}Ah
                          </div>
                          {unitIdx < serie - 1 && <div className="h-0.5 w-3 shrink-0 bg-brand-400" />}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-neutral-400">
                  {serie > 1 ? `${serie} batteries en série par string (tension qui s'additionne)` : "1 batterie par string"}
                  {parallele > 1 ? `, ${parallele} strings en parallèle (capacité qui s'additionne).` : "."}
                </p>
              </div>

              <StatGrid
                stats={[
                  { label: "Énergie totale", value: `${(result.totalEnergyWh / 1000).toFixed(1)} kWh` },
                  { label: "Énergie utile", value: `${(result.usableEnergyWh / 1000).toFixed(1)} kWh (${Math.round(result.usableEnergyRatio * 100)}%)` },
                  { label: "Courant de décharge max", value: `${result.maxDischargeA.toFixed(0)} A` },
                  { label: "Courant de charge max", value: `${result.maxChargeA.toFixed(0)} A` },
                  {
                    label: "Fusible principal",
                    value: `${result.mainFuse.recommendedFuseA !== null ? `${result.mainFuse.recommendedFuseA} A` : "> 400 A"} (${result.mainFuse.formatLabel})`,
                  },
                  { label: "Câble inter-batteries", value: `${result.interBatteryCableSectionMm2} mm²` },
                  { label: "Poids estimé", value: `≈ ${result.estimatedWeightKg.toFixed(0)} kg` },
                ]}
              />

              <div className="border-t border-brand-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Batterie du catalogue</p>
                {recommendedBattery ? (
                  <>
                    <p className="mt-1 text-sm font-bold text-neutral-950">
                      {recommendedBattery.brand} {recommendedBattery.model}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {recommendedBattery.voltage}V · {recommendedBattery.capacityAh}Ah — à multiplier ×{nbBatteries} pour la banque complète
                    </p>
                    {alsoCompatibleBatteries.length > 0 && (
                      <p className="mt-1 text-xs text-neutral-500">
                        Aussi compatibles : {alsoCompatibleBatteries.map((m) => `${m.brand} ${m.model}`).join(", ")}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-xs text-neutral-500">
                    Aucun modèle du catalogue de l&apos;éditeur ne couvre cette capacité unitaire — vérifiez la fiche technique d&apos;un modèle plus grand.
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3 text-xs text-neutral-600">
                <p className="font-semibold text-neutral-700">Règles de sécurité pour une banque multi-batteries</p>
                <ul className="mt-1.5 space-y-1">
                  <li>✓ Batteries identiques — même marque, modèle, capacité, idéalement du même lot.</li>
                  <li>✓ Câbles inter-batteries de même longueur et section, pour équilibrer le courant entre strings.</li>
                  <li>✓ Fusible principal sur le pôle +, à moins de 20 cm de la borne de la banque (EN 1648-2).</li>
                  {parallele > 1 && <li>✓ Câblage en diagonale conseillé : prise + sur la 1ère batterie, prise − sur la dernière, pour équilibrer les strings.</li>}
                  <li>✓ Cosses serties (pas à la main), graisse diélectrique sur les bornes contre la corrosion.</li>
                </ul>
              </div>

              <p className="text-xs text-neutral-500">
                Poids estimé à titre indicatif (ordre de grandeur du secteur par chimie), pas une donnée constructeur exacte.
              </p>
              <OpenProjectLink label="Continuer dans mon projet" />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
              <p className="text-center text-sm text-neutral-400">
                Renseignez la capacité unitaire et le nombre de batteries pour dimensionner votre banque.
              </p>
            </div>
          )}
        </div>
      </div>

      {hasResult && allParallel && allSeries && nbBatteries > 1 && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">Comparer les stratégies de câblage</p>
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                <th className="pb-2 font-semibold">Configuration</th>
                <th className="pb-2 font-semibold">Tension</th>
                <th className="pb-2 font-semibold">Capacité</th>
                <th className="pb-2 font-semibold">Énergie</th>
                <th className="pb-2 font-semibold">Courant max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <tr className={serie === 1 ? "bg-brand-50/60" : ""}>
                <td className="py-2 font-semibold text-neutral-900">Tout en parallèle</td>
                <td className="py-2 text-neutral-600">{allParallel.systemVoltage}V</td>
                <td className="py-2 text-neutral-600">{allParallel.totalCapacityAh.toFixed(0)}Ah</td>
                <td className="py-2 text-neutral-600">{(allParallel.totalEnergyWh / 1000).toFixed(1)}kWh</td>
                <td className="py-2 text-neutral-600">{allParallel.maxDischargeA.toFixed(0)}A</td>
              </tr>
              <tr className={parallele === 1 ? "bg-brand-50/60" : ""}>
                <td className="py-2 font-semibold text-neutral-900">Tout en série</td>
                <td className="py-2 text-neutral-600">{allSeries.systemVoltage}V</td>
                <td className="py-2 text-neutral-600">{allSeries.totalCapacityAh.toFixed(0)}Ah</td>
                <td className="py-2 text-neutral-600">{(allSeries.totalEnergyWh / 1000).toFixed(1)}kWh</td>
                <td className="py-2 text-neutral-600">{allSeries.maxDischargeA.toFixed(0)}A</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-xs text-neutral-400">L&apos;énergie totale (kWh) est toujours la même quel que soit le câblage — c&apos;est la répartition tension/courant qui change.</p>
        </div>
      )}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">Repère par chimie</p>
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
              <th className="pb-2 font-semibold">Chimie</th>
              <th className="pb-2 font-semibold">Décharge utile</th>
              <th className="pb-2 font-semibold">Charge max</th>
              <th className="pb-2 font-semibold">Décharge max</th>
              <th className="pb-2 font-semibold">Poids / 100Ah (12V)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            <tr className={chemistry === "lifepo4" ? "bg-brand-50/60" : ""}>
              <td className="py-2 font-semibold text-neutral-900">LiFePO₄ (lithium)</td>
              <td className="py-2 text-neutral-600">≈ 90%</td>
              <td className="py-2 text-neutral-600">0,5C</td>
              <td className="py-2 text-neutral-600">1C</td>
              <td className="py-2 text-neutral-600">≈ 13 kg</td>
            </tr>
            <tr className={chemistry === "agm-gel" ? "bg-brand-50/60" : ""}>
              <td className="py-2 font-semibold text-neutral-900">AGM / Gel (plomb)</td>
              <td className="py-2 text-neutral-600">≈ 50%</td>
              <td className="py-2 text-neutral-600">0,2C</td>
              <td className="py-2 text-neutral-600">0,2C</td>
              <td className="py-2 text-neutral-600">≈ 30 kg</td>
            </tr>
          </tbody>
        </table>
      </div>

      <CalcGuidesLink
        examples={[
          { slug: "schema-voilier-autonome-12v-230v", title: "Schéma voilier autonome avec 12 V et 230 V" },
          { slug: "schema-vito-280ah-van", title: "Schéma van lithium 280 Ah avec solaire et 230 V" },
          { slug: "schema-camping-car-autonome-clim", title: "Schéma camping-car autonome avec climatisation 12 V" },
        ]}
      />

      <CalcSafetyNotice
        standards={[
          "EN 1648-2 — Installations électriques 12V des véhicules de loisir",
          "Profondeur de décharge utile par chimie (90% LiFePO₄, 50% AGM/Gel) — préserve le nombre de cycles",
          "Courants de charge/décharge max en C-rate — valeurs prudentes par défaut, à confirmer avec la fiche technique de votre batterie",
        ]}
      />
    </div>
  );
}

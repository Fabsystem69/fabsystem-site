"use client";

import { useState } from "react";
import { calcSection } from "@/lib/calc/section-cable";
import { computeFuseSize } from "@/lib/calc/fuse-size";
import { findCompatibleMppt } from "@/lib/calc/mppt-match";
import { getArrayConfigs } from "@/lib/calc/array-config";
import { OpenProjectLink } from "@/components/outils/project-bridge/OpenProjectLink";
import { AddSolarToProjectButton } from "@/components/outils/project-bridge/AddSolarToProjectButton";
import { Stepper } from "@/components/outils/calc-ui/Stepper";
import { ToggleGroup } from "@/components/outils/calc-ui/ToggleGroup";
import { CalcSlider } from "@/components/outils/calc-ui/CalcSlider";
import { StatGrid } from "@/components/outils/calc-ui/StatGrid";
import { CalcSafetyNotice } from "@/components/outils/calc-ui/CalcSafetyNotice";
import { CalcGuidesLink } from "@/components/outils/calc-ui/CalcGuidesLink";

/** Chimies supportant une décharge quasi complète sans dommage (BMS coupe
 * en bas de plage) vs plomb (AGM/Gel) où 50% reste la limite usuelle pour
 * préserver le nombre de cycles — même distinction lithium/plomb déjà
 * appliquée ailleurs (dcdc-charger-size.ts, charge-secteur.ts) pour le
 * C-rate max, étendue ici à la profondeur de décharge utile. */
const USABLE_CAPACITY_RATIO: Record<"lifepo4" | "agm-gel", number> = {
  lifepo4: 0.9,
  "agm-gel": 0.5,
};

/** Perte réelle moyenne (angle des panneaux, température, ombre partielle,
 * salissure) entre la puissance crête théorique et la production réelle. */
const SOLAR_DERATING = 0.75;

/** Facteur de courant de dimensionnement câble PV (Isc × 1,25 pour
 * l'irradiance forte possible × 1,25 marge circuit continu = 1,5625) —
 * convention NEC 690.8(A), reprise par les calculateurs solaires du
 * secteur. Retour utilisateur (comparatif Wireframe, "PV cable design
 * current (×1,5625)") : notre ancienne version dimensionnait le câble sur
 * l'Isc brut, sans cette marge — sous-dimensionné par rapport à la
 * pratique du métier. */
const PV_CABLE_DESIGN_FACTOR = 1.5625;

// Retour utilisateur (comparatif Wireframe, capture complète de leur page
// "Solar & MPPT Calculator") : leur pivot est le nombre de panneaux, pas
// une puissance totale libre — les configurations série/parallèle
// possibles en découlent mathématiquement (diviseurs du nombre de
// panneaux) et sont proposées à choisir, pas saisies indépendamment. Les
// caractéristiques panneau (Vmp/Imp/Voc/Isc) sont les 4 valeurs réelles de
// la fiche technique, en saisie précise (pas un slider — retour
// utilisateur explicite : "tu mets des slide bar quand y'en pas besoin").
export default function MpptCalculator() {
  const [tensionBat, setTensionBat] = useState<"12" | "24" | "48">("12");
  const [nbPanneaux, setNbPanneaux] = useState(0);
  const [wattsParPanneau, setWattsParPanneau] = useState(0);
  const [vmp, setVmp] = useState(0);
  const [imp, setImp] = useState(0);
  const [voc, setVoc] = useState(0);
  const [isc, setIsc] = useState(0);
  const [selectedSeries, setSelectedSeries] = useState(1);
  const [longueurMPPT, setLongueurMPPT] = useState(2);
  const [maxPvVoltage, setMaxPvVoltage] = useState(0);

  const [battCapaciteAh, setBattCapaciteAh] = useState(200);
  const [battChimie, setBattChimie] = useState<"lifepo4" | "agm-gel">("lifepo4");
  const [peakSunHours, setPeakSunHours] = useState(4);

  const vocN = voc;
  const vmpN = vmp;
  const impN = imp;
  const iscN = isc;
  const t = parseFloat(tensionBat);
  const maxPv = maxPvVoltage;

  const configs = getArrayConfigs(nbPanneaux);
  // Configuration choisie, avec repli automatique si elle ne correspond
  // plus au nombre de panneaux courant (ex. après modification du champ).
  const serie = configs.some((c) => c.series === selectedSeries) ? selectedSeries : (configs[Math.floor((configs.length - 1) / 2)]?.series ?? 1);
  const parallele = nbPanneaux > 0 ? nbPanneaux / serie : 1;

  const wc = nbPanneaux * wattsParPanneau;

  const vocString = vocN * serie;
  // Marge froid : la Voc réelle d'un panneau augmente quand il fait froid
  // (coefficient de température négatif) — un régulateur dimensionné pile
  // sur la Voc "fiche technique" (mesurée à 25°C) peut être détruit par une
  // matinée d'hiver. +15% est la marge standard du secteur (même valeur que
  // Wireframe).
  const vocStringCold = vocString * 1.15;
  const vmpString = vmpN * serie;
  const impArray = impN * parallele;
  const iscTotal = iscN * parallele;
  const pvDesignCurrentA = iscTotal * PV_CABLE_DESIGN_FACTOR;
  const iSortieMPPT = t > 0 ? wc / t : 0;
  const puissanceMPPT = wc * 1.25;

  const sectionPanneaux = wc > 0 && vmpString > 0 ? calcSection(pvDesignCurrentA, 3, 3, vmpString) : null;
  const sectionMPPTBat = wc > 0 ? calcSection(iSortieMPPT, longueurMPPT || 2, 3, t) : null;

  const hasResult = nbPanneaux > 0 && wattsParPanneau > 0 && vocN > 0 && vmpN > 0 && impN > 0 && iscN > 0;

  // Protection côté PV (entre les panneaux et le régulateur) — le courant
  // de dimensionnement inclut déjà sa marge (×1,5625), pas de second
  // abattement à appliquer par-dessus (continuous=false).
  const pvFuse = hasResult ? computeFuseSize(pvDesignCurrentA, false, false) : null;

  // Correspondance avec le catalogue réel (retour utilisateur : "un vrai
  // equivalent" au "Recommended MPPT: Victron SmartSolar 100/30" de
  // Wireframe, pas juste un calibre théorique).
  const mpptMatches = hasResult ? findCompatibleMppt(vocStringCold, puissanceMPPT) : [];
  const recommendedMppt = mpptMatches[0];
  const alsoCompatibleMppt = mpptMatches.slice(1, 4);

  // Sous-calculateur "temps de charge batterie" — s'appuie sur le
  // régulateur recommandé quand un modèle réel matche, sinon sur le
  // courant de sortie théorique du MPPT.
  const usableAh = battCapaciteAh * USABLE_CAPACITY_RATIO[battChimie];
  const chargeCurrentCapA = recommendedMppt ? Math.min(iSortieMPPT, recommendedMppt.amperage) : iSortieMPPT;
  const chargeCurrentA = chargeCurrentCapA * SOLAR_DERATING;
  const hoursToFull = chargeCurrentA > 0 ? usableAh / chargeCurrentA : 0;
  const ahPerDay = chargeCurrentA * peakSunHours;
  const dailyReplenishmentPct = usableAh > 0 ? (ahPerDay / usableAh) * 100 : 0;
  const hasChargeTimeResult = hasResult && battCapaciteAh > 0;

  type Alert = { color: "red" | "orange" | "yellow"; msg: string };
  const alerts: Alert[] = [];
  if (maxPv > 0) {
    if (vocStringCold > maxPv) {
      alerts.push({
        color: "red",
        msg: `Voc à froid (${vocStringCold.toFixed(1)} V, +15%) dépasse la tension max de votre régulateur (${maxPv} V) — risque de destruction du MPPT, choisissez une configuration avec moins de panneaux en série`,
      });
    } else if (vocStringCold > maxPv * 0.9) {
      alerts.push({ color: "orange", msg: `Marge faible : Voc à froid (${vocStringCold.toFixed(1)} V) proche de la limite de votre régulateur (${maxPv} V)` });
    }
  } else if (vocStringCold > 150) {
    alerts.push({ color: "red", msg: "Tension Voc à froid trop élevée pour un MPPT standard — vérifiez la fiche technique de votre régulateur" });
  } else if (vocStringCold > 100) {
    alerts.push({ color: "orange", msg: "Tension élevée à froid — vérifiez la limite Voc max de votre MPPT" });
  }
  if (iSortieMPPT > 60) alerts.push({ color: "orange", msg: "Courant de sortie élevé — envisagez deux régulateurs MPPT en parallèle" });
  if (serie > 1 && tensionBat === "12") alerts.push({ color: "orange", msg: "Panneaux en série sur batterie 12V — assurez-vous que la tension Vmp du string reste compatible avec votre MPPT" });

  const alertClass = (color: Alert["color"]) => {
    if (color === "red") return "bg-red-50 border border-red-200 text-red-700";
    return "bg-orange-50 border border-orange-200 text-orange-700";
  };

  const labelClass = "block text-xs font-semibold text-neutral-700 mb-1.5";
  const inputClass = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20";

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-2">
        {/* ── Inputs ── */}
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Stepper label="Nombre de panneaux" value={nbPanneaux} onChange={setNbPanneaux} min={0} max={20} step={1} />
            <Stepper label="Watts par panneau" value={wattsParPanneau} onChange={setWattsParPanneau} min={0} max={600} step={10} unit="W" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={labelClass}>Vmp</label>
              <input type="number" min="0" step="0.1" placeholder="20" value={vmp || ""} onChange={(e) => setVmp(parseFloat(e.target.value) || 0)} className={inputClass} />
              <p className="mt-1 text-[11px] text-neutral-400">Tension puissance max</p>
            </div>
            <div>
              <label className={labelClass}>Imp</label>
              <input type="number" min="0" step="0.1" placeholder="10" value={imp || ""} onChange={(e) => setImp(parseFloat(e.target.value) || 0)} className={inputClass} />
              <p className="mt-1 text-[11px] text-neutral-400">Courant puissance max</p>
            </div>
            <div>
              <label className={labelClass}>Voc</label>
              <input type="number" min="0" step="0.1" placeholder="24,3" value={voc || ""} onChange={(e) => setVoc(parseFloat(e.target.value) || 0)} className={inputClass} />
              <p className="mt-1 text-[11px] text-neutral-400">Tension circuit ouvert</p>
            </div>
            <div>
              <label className={labelClass}>Isc</label>
              <input type="number" min="0" step="0.1" placeholder="11,08" value={isc || ""} onChange={(e) => setIsc(parseFloat(e.target.value) || 0)} className={inputClass} />
              <p className="mt-1 text-[11px] text-neutral-400">Courant court-circuit</p>
            </div>
          </div>

          <div>
            <span className={labelClass}>Tension batterie</span>
            <ToggleGroup
              value={tensionBat}
              onChange={setTensionBat}
              options={[
                { value: "12", label: "12 V" },
                { value: "24", label: "24 V" },
                { value: "48", label: "48 V" },
              ]}
            />
          </div>

          {configs.length > 0 && (
            <div>
              <span className={labelClass}>Configuration du câblage</span>
              <div className="grid grid-cols-3 gap-2">
                {configs.map((c) => {
                  const isSelected = c.series === serie;
                  const cfgVoc = vocN * c.series;
                  const cfgAmps = impN * c.parallel;
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
                        {c.parallel} string{c.parallel > 1 ? "s" : ""} de {c.series}
                      </p>
                      {vocN > 0 && impN > 0 && (
                        <p className="mt-1 font-semibold text-neutral-700">
                          {cfgVoc.toFixed(0)}V · {cfgAmps.toFixed(1)}A
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <CalcSlider label="Longueur câble MPPT → batterie" value={longueurMPPT} onChange={setLongueurMPPT} min={0} max={10} step={0.5} unit="m" />

          <div>
            <label className={labelClass}>Tension max entrée PV du régulateur</label>
            <input type="number" min="0" step="1" placeholder="ex : 100" value={maxPvVoltage || ""} onChange={(e) => setMaxPvVoltage(parseFloat(e.target.value) || 0)} className={inputClass} />
            <p className="mt-1 text-xs text-neutral-400">Facultatif — fiche technique du régulateur (ex. 100 pour un MPPT « 100/20 »)</p>
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

              <p className="border-t border-brand-200 pt-4 text-sm text-neutral-700">
                {vocN.toFixed(1)} V × {serie} (série) = {vocString.toFixed(1)} V × 1,15 (marge froid) ={" "}
                <span
                  className={`font-semibold ${maxPv > 0 ? (vocStringCold > maxPv ? "text-red-600" : vocStringCold > maxPv * 0.9 ? "text-orange-600" : "text-neutral-950") : vocStringCold > 150 ? "text-red-600" : vocStringCold > 100 ? "text-orange-600" : "text-neutral-950"}`}
                >
                  {vocStringCold.toFixed(1)} V
                </span>{" "}
                Voc string à froid
              </p>

              <p className="text-sm text-neutral-700">
                {wc.toFixed(0)} Wc ÷ {tensionBat} V ={" "}
                <span className={`font-semibold ${iSortieMPPT > 60 ? "text-orange-600" : "text-neutral-950"}`}>{Math.ceil(iSortieMPPT)} A</span> en sortie MPPT
              </p>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Câblage — {serie}S{parallele}P
                </p>
                <div className="space-y-1.5 overflow-x-auto">
                  {Array.from({ length: parallele }).map((_, stringIdx) => (
                    <div key={stringIdx} className="flex items-center gap-1">
                      {parallele > 1 && <span className="w-14 shrink-0 text-[10px] text-neutral-400">String {stringIdx + 1}</span>}
                      {Array.from({ length: serie }).map((_, panelIdx) => (
                        <div key={panelIdx} className="flex items-center">
                          <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded border-2 border-brand-400 bg-white text-[10px] font-semibold text-brand-700">
                            {stringIdx * serie + panelIdx + 1}
                          </div>
                          {panelIdx < serie - 1 && <div className="h-0.5 w-3 shrink-0 bg-brand-400" />}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-neutral-400">
                  {serie > 1 ? `${serie} panneaux en série par string` : "1 panneau par string"}
                  {parallele > 1 ? `, ${parallele} strings en parallèle sur l'entrée du régulateur.` : "."}
                </p>
              </div>

              <StatGrid
                stats={[
                  { label: "Tension Vmp du string", value: `${vmpString.toFixed(1)} V` },
                  { label: "Courant Imp total (tous les strings)", value: `${impArray.toFixed(1)} A` },
                  { label: "Courant Isc total (strings en parallèle)", value: `${iscTotal.toFixed(1)} A` },
                  { label: "Courant de dimensionnement du câble PV", value: `${pvDesignCurrentA.toFixed(1)} A` },
                  ...(sectionPanneaux ? [{ label: "Câble panneaux → MPPT", value: `${sectionPanneaux.section} mm²` }] : []),
                  ...(sectionMPPTBat ? [{ label: "Câble MPPT → batterie", value: `${sectionMPPTBat.section} mm²` }] : []),
                  ...(pvFuse
                    ? [{ label: "Protection côté PV", value: `${pvFuse.recommendedFuseA !== null ? `${pvFuse.recommendedFuseA} A` : "> 400 A"} (${pvFuse.formatLabel})` }]
                    : []),
                  { label: "Puissance totale des panneaux", value: `${wc.toFixed(0)} W` },
                ]}
              />

              <div className="border-t border-brand-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Régulateur du catalogue</p>
                {recommendedMppt ? (
                  <>
                    <p className="mt-1 text-sm font-bold text-neutral-950">
                      {recommendedMppt.brand} {recommendedMppt.model}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {recommendedMppt.maxPvVoltage} V PV max · {recommendedMppt.amperage} A charge
                    </p>
                    {alsoCompatibleMppt.length > 0 && (
                      <p className="mt-1 text-xs text-neutral-500">
                        Aussi compatibles : {alsoCompatibleMppt.map((m) => `${m.brand} ${m.model}`).join(", ")}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-xs text-neutral-500">
                    Aucun modèle du catalogue de l&apos;éditeur ne couvre ce dimensionnement (tension ou puissance) — vérifiez la fiche technique d&apos;un régulateur plus puissant.
                  </p>
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
                Marge sécurité 25% appliquée sur la puissance MPPT, +15% sur le Voc pour le froid. Sections câbles calculées avec chute de tension 3%.
              </p>
              <OpenProjectLink label="Continuer dans mon projet" />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
              <p className="text-center text-sm text-neutral-400">
                Renseignez le nombre de panneaux et leurs caractéristiques (Vmp, Imp, Voc, Isc) pour dimensionner votre régulateur MPPT.
              </p>
            </div>
          )}
        </div>
      </div>

      {hasResult && (
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Combien de temps pour charger ma batterie ?</p>

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
                  {battCapaciteAh > 0
                    ? `${Math.round(USABLE_CAPACITY_RATIO[battChimie] * 100)}% utile (${usableAh.toFixed(0)} Ah)`
                    : `${Math.round(USABLE_CAPACITY_RATIO[battChimie] * 100)}% utile pour préserver le nombre de cycles`}
                </p>
              </div>

              <CalcSlider label="Heures de soleil utile / jour" value={peakSunHours} onChange={setPeakSunHours} min={1} max={8} step={0.5} unit="h" />
            </div>

            <div>
              {hasChargeTimeResult ? (
                <StatGrid
                  stats={[
                    { label: "Courant de charge réel", value: `${chargeCurrentA.toFixed(1)} A` },
                    { label: "Vide → plein (au soleil)", value: chargeCurrentA > 0 ? `${hoursToFull.toFixed(1)} h` : "—" },
                    { label: `Par jour (${peakSunHours} h de soleil)`, value: `${ahPerDay.toFixed(0)} Ah` },
                    { label: "Recharge quotidienne", value: `${dailyReplenishmentPct.toFixed(0)} %`, tone: dailyReplenishmentPct >= 100 ? "success" : dailyReplenishmentPct < 50 ? "warning" : "default" },
                  ]}
                />
              ) : (
                <p className="text-sm text-neutral-400">Renseignez la capacité batterie pour estimer le temps de charge.</p>
              )}
              <p className="mt-4 text-xs text-neutral-500">
                Basé sur {recommendedMppt ? `le régulateur ${recommendedMppt.brand} ${recommendedMppt.model} recommandé ci-dessus` : "le courant de sortie MPPT calculé ci-dessus"}, avec un abattement de {Math.round((1 - SOLAR_DERATING) * 100)}% (angle des panneaux, température, ombre partielle). Résultat réel variable selon localisation, saison et météo.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <AddSolarToProjectButton form={{ nbPanneaux, wattsParPanneau, peakSunHours }} />
          </div>
        </div>
      )}

      <CalcGuidesLink
        examples={[
          { slug: "schema-solaire-12v-simple", title: "Schéma solaire 12V simple" },
          { slug: "schema-vito-280ah-van", title: "Schéma van lithium 280 Ah avec solaire et 230 V" },
          { slug: "schema-voilier-autonome-12v-230v", title: "Schéma voilier autonome avec 12 V et 230 V" },
        ]}
      />

      <CalcSafetyNotice
        standards={[
          "EN 1648-2 — Installations électriques 12V des véhicules de loisir",
          "Marge de +15% sur le Voc à froid — coefficient de température des panneaux, pratique standard du secteur",
          "Courant de dimensionnement câble/protection PV ×1,5625 (Isc × 1,25 irradiance × 1,25 continu) — convention NEC 690.8(A)",
          "Marge de +25% sur le calibre du régulateur MPPT — même convention que le reste du site",
          "Abattement de 25% sur la production solaire réelle (angle, température, ombre) et profondeur de décharge utile par chimie — estimations de terrain, pas des specs constructeur",
        ]}
      />
    </div>
  );
}

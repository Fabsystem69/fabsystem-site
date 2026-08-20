// Moteur pur du calculateur public "Chargeur DC-DC / alternateur" — même
// principe que les autres moteurs de lib/calc/. Retour utilisateur :
// "créer les outils manquant" (gap identifié vs le concurrent Wireframe).
//
// Deux limites indépendantes bornent le calibre du chargeur : ce que
// l'alternateur peut fournir en continu sans s'user prématurément, et ce
// que la batterie peut accepter en charge — le chargeur ne doit dépasser
// aucune des deux.

import { computeFuseSize } from "@/lib/calc/fuse-size";

export type DcdcBatteryChemistry = "lithium" | "agm-gel";

/** Part du courant nominal de l'alternateur qu'on peut tirer en continu
 * sans usure prématurée (bobinage, diodes) — règle usuelle en l'absence de
 * spécification constructeur précise. */
export const MAX_ALTERNATOR_CONTINUOUS_RATIO = 0.35;

/** Taux de charge (C-rate) max par chimie — mêmes valeurs prudentes que
 * charge-secteur.ts pour rester cohérent dans tout le site. */
const MAX_CHARGE_C_RATE: Record<DcdcBatteryChemistry, number> = {
  lithium: 0.5,
  "agm-gel": 0.2,
};

/** Calibres réellement disponibles dans le catalogue de l'éditeur
 * (lib/electrical-components/brand-models.ts, gamme Victron Orion) —
 * recommander une valeur qu'on peut vraiment acheter, pas un chiffre
 * théorique introuvable. */
const STANDARD_DCDC_SIZES_A = [9, 18, 20, 30, 40, 50];

export type DcdcChargerSizeResult = {
  /** Limite côté alternateur, en A. */
  maxFromAlternatorA: number;
  /** Limite côté batterie, en A. */
  maxFromBatteryA: number;
  /** Le facteur qui borne réellement le choix. */
  limitingFactor: "alternateur" | "batterie";
  /** Calibre normalisé recommandé, en A. */
  recommendedChargerA: number;
  /** Ah rechargés pour la durée de conduite renseignée. */
  ahPerDrive: number;
  dcFuseA: number | null;
  dcFuseFormatLabel: string;
};

export function computeDcdcChargerSize(
  alternatorA: number,
  chemistry: DcdcBatteryChemistry,
  capacityAh: number,
  driveHoursPerDay: number,
): DcdcChargerSizeResult {
  const maxFromAlternatorA = alternatorA * MAX_ALTERNATOR_CONTINUOUS_RATIO;
  const maxFromBatteryA = capacityAh * MAX_CHARGE_C_RATE[chemistry];
  const limitingFactor: DcdcChargerSizeResult["limitingFactor"] = maxFromAlternatorA <= maxFromBatteryA ? "alternateur" : "batterie";
  const idealA = Math.min(maxFromAlternatorA, maxFromBatteryA);

  const recommendedChargerA = [...STANDARD_DCDC_SIZES_A].reverse().find((s) => s <= idealA) ?? STANDARD_DCDC_SIZES_A[0];
  const ahPerDrive = recommendedChargerA * driveHoursPerDay;
  const fuse = computeFuseSize(recommendedChargerA, true, false);

  return {
    maxFromAlternatorA,
    maxFromBatteryA,
    limitingFactor,
    recommendedChargerA,
    ahPerDrive,
    dcFuseA: fuse.recommendedFuseA,
    dcFuseFormatLabel: fuse.formatLabel,
  };
}

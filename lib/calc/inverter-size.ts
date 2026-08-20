// Moteur pur du calculateur public "Dimensionnement onduleur" — même
// principe que les autres moteurs de lib/calc/. Retour utilisateur :
// "créer les outils manquant" (gap identifié vs le concurrent Wireframe).

import { calcSection } from "@/lib/calc/section-cable";
import { computeFuseSize } from "@/lib/calc/fuse-size";

export type ApplianceLoad = {
  label: string;
  watts: number;
  /** Fort appel au démarrage (compresseur, moteur — frigo, micro-ondes,
   * perceuse…) : la pointe réelle au démarrage dépasse largement la
   * puissance nominale. */
  surge: boolean;
};

/** Rendement moyen d'un onduleur à onde sinusoïdale pure correctement
 * dimensionné (même principe que CHARGER_EFFICIENCY dans
 * charge-secteur.ts, valeur différente : sens de conversion opposé). */
export const INVERTER_EFFICIENCY = 0.9;

/** Facteur de pointe au démarrage pour un appareil à fort appel — valeur
 * usuelle prudente en l'absence de fiche technique précise (certains
 * compresseurs dépassent largement ×3, mais c'est déjà un bon repère par
 * défaut). */
const SURGE_MULTIPLIER = 3;

const STANDARD_INVERTER_SIZES_W = [500, 800, 1000, 1500, 2000, 2500, 3000, 4000, 5000];

export type InverterSizeResult = {
  /** Somme des puissances nominales, en W. */
  continuousW: number;
  /** Charge de pointe estimée (continu + appel de démarrage du plus gros
   * appareil à fort appel), en W. */
  peakW: number;
  /** Taille d'onduleur normalisée recommandée, en W. */
  recommendedInverterW: number;
  /** Courant DC appelé côté batterie, en A. */
  dcCurrentA: number;
  dcFuseA: number | null;
  dcFuseFormatLabel: string;
  /** Section de câble DC recommandée (aller simple, chute 3%), en mm². */
  dcCableSectionMm2: number;
};

export function computeInverterSize(
  appliances: ApplianceLoad[],
  systemVoltage: 12 | 24 | 48,
  dcCableLengthM: number,
): InverterSizeResult {
  const continuousW = appliances.reduce((sum, a) => sum + a.watts, 0);

  // Hypothèse : un seul appareil à fort appel démarre à la fois (pas tous
  // simultanément, sans quoi la pointe serait irréaliste) — celui qui pèse
  // le plus lourd au démarrage est le cas le plus défavorable à couvrir.
  const surgeAppliances = appliances.filter((a) => a.surge).sort((a, b) => b.watts - a.watts);
  const worstSurge = surgeAppliances[0];
  const peakW = worstSurge ? continuousW - worstSurge.watts + worstSurge.watts * SURGE_MULTIPLIER : continuousW;

  const recommendedInverterW = STANDARD_INVERTER_SIZES_W.find((s) => s >= peakW) ?? Math.ceil(peakW / 1000) * 1000;

  const dcCurrentA = continuousW / systemVoltage / INVERTER_EFFICIENCY;
  const fuse = computeFuseSize(dcCurrentA, true, true);
  const { section } = calcSection(dcCurrentA, dcCableLengthM, 3, systemVoltage);

  return {
    continuousW,
    peakW,
    recommendedInverterW,
    dcCurrentA,
    dcFuseA: fuse.recommendedFuseA,
    dcFuseFormatLabel: fuse.formatLabel,
    dcCableSectionMm2: section,
  };
}

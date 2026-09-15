// Moteur pur du calculateur public "Section de câble" (extrait de
// components/CalcSection.tsx en UI-7 pour séparer logique de calcul et
// UI React — docs/refonte-site-public/Outils/02-PAGES-CALCULATEURS.md
// §18). Comportement strictement identique à l'ancien code inline :
// aucune formule, valeur ou arrondi n'a été modifié.
//
// Cette formule duplique intentionnellement (sans le réutiliser) le calcul
// du moteur backend lib/engines/cable-engine.ts (SaaS Projet, dimensionne
// des circuits via EngineContext) : minimumSectionMm2 = (2 × longueur × I
// × résistivité) / (chute% × tension / 100) — même formule, même
// constante cuivre 0,0175 Ω·mm²/m. Les deux moteurs ne sont pas encore
// unifiés : voir docs/audits/UI-7-OUTILS.md § "Convergence moteurs" pour
// la justification de ne pas les fusionner dans cette phase.
//
// Correctif sécurité (retour client : incohérences dangereuses relevées
// sur des sections de câble, notamment DC-DC et MultiPlus) : `calcSection`
// seule ne vérifie QUE la chute de tension, jamais l'ampacité (le courant
// maximal qu'un câble supporte sans surchauffer) — un câble court à fort
// courant (onduleur, MPPT, banque de batteries) peut satisfaire la chute
// de tension avec une section dangereusement insuffisante pour le courant
// réel. `calcSectionSafe` ci-dessous corrige ça en gardant systématiquement
// la plus grande des deux exigences ; TOUT nouveau code qui recommande une
// section à partir d'un courant/longueur/tension doit l'utiliser, jamais
// `calcSection` seule.
import { WIRE_TABLE, getDeratedAmpacity } from "@/lib/calc/wire-ampacity";

/** Résistivité du cuivre, en Ω·mm²/m. */
export const COPPER_RESISTIVITY_OHM_MM2_PER_M = 0.0175;

/** Catalogue des sections de câble normalisées disponibles, en mm². Va
 * jusqu'à 120 mm² (au lieu de 50 mm² auparavant) : un onduleur/MultiPlus de
 * forte puissance (3000 VA et plus) tire couramment plus de 200 A côté
 * batterie, ce qu'aucune section ≤ 50 mm² ne supporte en toute sécurité —
 * voir lib/electrical-components/auto-size.ts, vérification d'ampacité. */
export const AVAILABLE_SECTIONS_MM2 = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];

/**
 * Catalogue de référence utilisé par les suggestions. Les paliers courants
 * restent de 5 A en 5 A, avec 2 A conservé pour les très petits circuits.
 */
export const AVAILABLE_FUSES_A = [2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125];

export type SectionCableResult = {
  /** Section minimale calculée (mm²), non normalisée — valeur brute. */
  sMin: string;
  /** Section normalisée à utiliser (mm²) — première du catalogue ≥ sMin. */
  section: number;
};

/**
 * Calcule la section de câble minimale (aller-retour, courant continu)
 * pour une chute de tension admissible donnée, puis propose la section
 * normalisée immédiatement supérieure.
 *
 * @param intensiteA Courant du circuit, en ampères.
 * @param longueurM Longueur simple (aller) entre la source et le
 *   consommateur, en mètres — le facteur ×2 (aller-retour) est appliqué
 *   automatiquement.
 * @param chutePct Chute de tension maximale admissible, en pourcentage de
 *   la tension du circuit (ex. 3 pour 3 %).
 * @param tensionV Tension du circuit, en volts.
 */
export function calcSection(
  intensiteA: number,
  longueurM: number,
  chutePct: number,
  tensionV: number
): SectionCableResult {
  const chuteV = (chutePct / 100) * tensionV;
  const sMin = (2 * longueurM * intensiteA * COPPER_RESISTIVITY_OHM_MM2_PER_M) / chuteV;
  // Repli sur la plus grande section du catalogue (jamais une valeur figée
  // "50" — celle-ci datait d'avant l'extension du catalogue à 120 mm² et
  // sous-recommandait silencieusement au-delà) : reste insuffisant si sMin
  // dépasse même 120 mm², mais au moins la meilleure section disponible.
  const section = AVAILABLE_SECTIONS_MM2.find((s) => s >= sMin) ?? AVAILABLE_SECTIONS_MM2[AVAILABLE_SECTIONS_MM2.length - 1];
  return { sMin: sMin.toFixed(2), section };
}

/** Marge réglementaire sur un circuit continu ≥3h (ISO 10133,
 * continuousLoadFactor) — un circuit embarqué (batterie, onduleur, MPPT,
 * DC-DC) est traité comme continu par défaut, jamais comme un cas
 * favorable non démontré ("on joue toujours sécurité"). */
export const CONTINUOUS_LOAD_MARGIN = 1.25;

/** Section minimale (mm²) dont l'ampacité dérated couvre `designCurrentA`,
 * en conditions prudentes par défaut (PVC/70°C, 30°C ambiant, câble seul).
 * Limité à mm² ≥ 0.5 pour rester dans le catalogue (AVAILABLE_SECTIONS_MM2). */
export function pickSectionForAmpacity(designCurrentA: number): number {
  const row = WIRE_TABLE.find((r) => r.mm2 >= 0.5 && getDeratedAmpacity(r, "pvc", 30, "single") >= designCurrentA);
  return row ? row.mm2 : WIRE_TABLE[WIRE_TABLE.length - 1].mm2;
}

/**
 * Version sûre de `calcSection` : garde systématiquement la plus grande
 * section entre l'exigence d'ampacité (courant continu, marge 25 %) et la
 * chute de tension — jamais la chute de tension seule. Voir le correctif
 * sécurité en tête de fichier ; à utiliser à la place de `calcSection` par
 * tout code qui recommande une section à un utilisateur ou l'applique à un
 * schéma.
 */
export function calcSectionSafe(
  intensiteA: number,
  longueurM: number,
  chutePct: number,
  tensionV: number
): SectionCableResult {
  const dropResult = calcSection(intensiteA, longueurM, chutePct, tensionV);
  const ampacityFloorMm2 = pickSectionForAmpacity(intensiteA * CONTINUOUS_LOAD_MARGIN);
  return {
    sMin: Math.max(parseFloat(dropResult.sMin), ampacityFloorMm2).toFixed(2),
    section: Math.max(dropResult.section, ampacityFloorMm2),
  };
}

/**
 * Propose un calibre de fusible normalisé pour protéger un circuit
 * parcouru par `intensiteA`, avec une marge de 25 %.
 */
export function fusibleRecommande(intensiteA: number): string {
  const f = AVAILABLE_FUSES_A.find((fuse) => fuse >= intensiteA * 1.25);
  return f ? `${f} A` : "> 125 A — prévoir un disjoncteur";
}

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

/** Résistivité du cuivre, en Ω·mm²/m. */
export const COPPER_RESISTIVITY_OHM_MM2_PER_M = 0.0175;

/** Catalogue des sections de câble normalisées disponibles, en mm². */
export const AVAILABLE_SECTIONS_MM2 = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50];

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
  const section = AVAILABLE_SECTIONS_MM2.find((s) => s >= sMin) ?? 50;
  return { sMin: sMin.toFixed(2), section };
}

/**
 * Propose un calibre de fusible normalisé pour protéger un circuit
 * parcouru par `intensiteA`, avec une marge de 25 %.
 */
export function fusibleRecommande(intensiteA: number): string {
  const f = AVAILABLE_FUSES_A.find((fuse) => fuse >= intensiteA * 1.25);
  return f ? `${f} A` : "> 125 A — prévoir un disjoncteur";
}

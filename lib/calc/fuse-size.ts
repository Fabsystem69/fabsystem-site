// Moteur pur du calculateur public "Calibre de fusible" — même principe que
// lib/calc/section-cable.ts et lib/calc/charge-secteur.ts. Retour
// utilisateur : "créer les outils manquant" (audit concurrentiel Wireframe,
// gap identifié : pas d'outil dédié au choix du format physique + calibre
// d'un fusible, seulement des suggestions ponctuelles ailleurs dans le
// site). Règle 125% pour un circuit continu (≥3h) : convention standard
// (déjà appliquée ailleurs dans le projet, ex. fusibleRecommande).

import { AVAILABLE_FUSES_A } from "@/lib/calc/section-cable";

export type FuseFormat = "lame" | "midi" | "mega" | "anl" | "classe-t";

export const FUSE_FORMAT_LABELS: Record<FuseFormat, string> = {
  lame: "Lame (ATO/ATC)",
  midi: "MIDI",
  mega: "MEGA",
  anl: "ANL",
  "classe-t": "Classe T",
};

// Calibres réels au-delà du catalogue "petits circuits" de section-cable.ts
// (MEGA/ANL/Classe T courent jusqu'à 400A+ sur un circuit batterie
// principale/onduleur).
const HIGH_CURRENT_FUSES_A = [150, 175, 200, 225, 250, 300, 350, 400];
const ALL_FUSE_STEPS_A = [...AVAILABLE_FUSES_A, ...HIGH_CURRENT_FUSES_A];

export type FuseSizeResult = {
  /** Courant réel du circuit, en A. */
  loadCurrentA: number;
  /** Courant de dimensionnement (×1,25 si circuit continu), en A. */
  designCurrentA: number;
  /** Calibre normalisé recommandé, en A — `null` si ça dépasse 400A. */
  recommendedFuseA: number | null;
  recommendedFormat: FuseFormat;
  formatLabel: string;
};

/**
 * @param loadCurrentA Courant réel de l'appareil/du câble, en A.
 * @param continuous Circuit qui tourne en continu ≥3h (solaire, frigo,
 *   chargeur…) — applique la marge de 25% standard. Un appel ponctuel
 *   (guindeau, démarreur) n'en a pas besoin.
 * @param mainCircuit Circuit batterie principale ou entrée/sortie
 *   onduleur — au-delà de 100A, on recommande systématiquement la Classe T
 *   pour son pouvoir de coupure supérieur, un ANL/MEGA n'étant pas conçu
 *   pour interrompre un court-circuit aussi violent directement sur une
 *   grosse banque de batteries.
 */
export function computeFuseSize(loadCurrentA: number, continuous: boolean, mainCircuit: boolean): FuseSizeResult {
  const designCurrentA = continuous ? loadCurrentA * 1.25 : loadCurrentA;
  const recommendedFuseA = ALL_FUSE_STEPS_A.find((f) => f >= designCurrentA) ?? null;

  let recommendedFormat: FuseFormat;
  if (mainCircuit && designCurrentA >= 100) {
    recommendedFormat = "classe-t";
  } else if (designCurrentA <= 30) {
    recommendedFormat = "lame";
  } else if (designCurrentA <= 100) {
    recommendedFormat = "midi";
  } else if (designCurrentA <= 300) {
    recommendedFormat = "anl";
  } else {
    recommendedFormat = "classe-t";
  }

  return {
    loadCurrentA,
    designCurrentA,
    recommendedFuseA,
    recommendedFormat,
    formatLabel: FUSE_FORMAT_LABELS[recommendedFormat],
  };
}

// Table d'ampacité (courant admissible) et correspondance AWG — retour
// utilisateur (comparatif Wireframe, "Wire Size Calculator") : notre ancien
// calculateur de section ne vérifiait QUE la chute de tension, jamais
// l'ampacité (courant maximal que le câble peut porter sans surchauffer) —
// exactement le risque que Wireframe met en avant en premier point de son
// intro ("Undersized cables overheat and can cause fires"). Table reprise
// telle quelle de l'ancien AwgCalculator.tsx (déjà utilisée et vérifiée
// ailleurs sur le site) plutôt qu'une seconde source de données à
// maintenir — fusion des deux calculateurs en un seul, retour utilisateur :
// "je pense qu'on peux fusionner mm awg aussi avec [section de câble]".

export type WireRow = { awg: string; mm2: number; ampacityA: number; usage: string };

export const WIRE_TABLE: WireRow[] = [
  { awg: "28", mm2: 0.08, ampacityA: 0.5, usage: "Signaux, bus NMEA" },
  { awg: "26", mm2: 0.14, ampacityA: 1, usage: "Signaux, capteurs" },
  { awg: "24", mm2: 0.2, ampacityA: 2, usage: "Signaux, télécommandes" },
  { awg: "22", mm2: 0.35, ampacityA: 3, usage: "Signaux, LED" },
  { awg: "20", mm2: 0.5, ampacityA: 5, usage: "LED, signaux" },
  { awg: "18", mm2: 0.75, ampacityA: 7, usage: "LED, instruments, VHF" },
  // 1mm² : taille du catalogue AVAILABLE_SECTIONS_MM2 (section-cable.ts)
  // absente de la table AWG d'origine — interpolée entre 0,75mm²(7A) et
  // 1,5mm²(13A), cohérente avec la progression du reste de la table.
  { awg: "17", mm2: 1, ampacityA: 10, usage: "LED, petits circuits" },
  { awg: "16", mm2: 1.5, ampacityA: 13, usage: "Éclairage, pompe cale, frigo" },
  { awg: "14", mm2: 2.5, ampacityA: 17, usage: "Frigo, VHF, pompe cale" },
  { awg: "12", mm2: 4, ampacityA: 23, usage: "Frigo compresseur, pilote" },
  { awg: "10", mm2: 6, ampacityA: 33, usage: "Pilote auto, chargeur MPPT" },
  { awg: "8", mm2: 10, ampacityA: 46, usage: "Moteur trim, treuil léger" },
  { awg: "6", mm2: 16, ampacityA: 62, usage: "Guindeau léger, onduleur, MPPT" },
  { awg: "4", mm2: 25, ampacityA: 84, usage: "Guindeau, moteur élec." },
  { awg: "2", mm2: 35, ampacityA: 108, usage: "Guindeau lourd, démarreur" },
  { awg: "1/0", mm2: 50, ampacityA: 140, usage: "Moteur principal, banc batteries" },
  { awg: "2/0", mm2: 70, ampacityA: 165, usage: "Banc batteries, liaison principale" },
  { awg: "3/0", mm2: 95, ampacityA: 195, usage: "Câble de masse, grosse liaison" },
  { awg: "4/0", mm2: 120, ampacityA: 230, usage: "Masse principale, démarreur diesel" },
];

export type InsulationRating = "pvc" | "xlpe" | "silicone";

/** Facteur d'isolant — une isolation qui supporte une température de
 * fonctionnement plus haute (XLPE, silicone) autorise un courant plus
 * élevé pour la même section. Facteurs prudents et arrondis, pas une table
 * de correction IEC précise (à confirmer avec la fiche technique du câble
 * choisi). */
export const INSULATION_FACTOR: Record<InsulationRating, number> = {
  pvc: 1,
  xlpe: 1.3,
  silicone: 1.5,
};

export type AmbientTemp = 25 | 30 | 35 | 40 | 45 | 50 | 55 | 60;

/** Dérating température ambiante — un câble chauffe plus vite dans un
 * compartiment moteur ou en plein soleil : moins de marge avant la limite
 * de l'isolant. Approximation par palier, pas une formule de résistivité
 * exacte. */
export const AMBIENT_TEMP_FACTOR: Record<AmbientTemp, number> = {
  25: 1.05,
  30: 1,
  35: 0.91,
  40: 0.82,
  45: 0.71,
  50: 0.58,
  55: 0.41,
  60: 0,
};

export type CableBundling = "single" | "small" | "large";

/** Dérating regroupement — des câbles serrés ensemble se réchauffent
 * mutuellement, chacun évacue moins bien sa chaleur. */
export const BUNDLING_FACTOR: Record<CableBundling, number> = {
  single: 1,
  small: 0.8,
  large: 0.7,
};

/** Trouve la ligne du plus petit câble dont l'ampacité dérated couvre le courant demandé. */
export function findMinimumSectionForAmpacity(
  designCurrentA: number,
  insulation: InsulationRating,
  ambient: AmbientTemp,
  bundling: CableBundling,
): WireRow | null {
  const factor = INSULATION_FACTOR[insulation] * AMBIENT_TEMP_FACTOR[ambient] * BUNDLING_FACTOR[bundling];
  if (factor <= 0) return null;
  return WIRE_TABLE.find((row) => row.ampacityA * factor >= designCurrentA) ?? null;
}

export function getDeratedAmpacity(row: WireRow, insulation: InsulationRating, ambient: AmbientTemp, bundling: CableBundling): number {
  return row.ampacityA * INSULATION_FACTOR[insulation] * AMBIENT_TEMP_FACTOR[ambient] * BUNDLING_FACTOR[bundling];
}

export function findWireRowByMm2(mm2: number): WireRow | undefined {
  return WIRE_TABLE.find((r) => r.mm2 === mm2);
}

export function mm2ToAwg(mm2: number): string | null {
  const row = WIRE_TABLE.find((r) => r.mm2 >= mm2);
  return row ? row.awg : null;
}

export function awgToMm2(awg: string): number | null {
  const row = WIRE_TABLE.find((r) => r.awg === awg.trim());
  return row ? row.mm2 : null;
}

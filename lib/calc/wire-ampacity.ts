// Table d'ampacité (courant admissible) et correspondance AWG.
//
// Correctif sécurité (retour client : un fusible ANL 150A sur du 50mm²
// [1/0 AWG] — combinaison standard vendue en kit dans le nautisme —
// déclenchait une alerte "ampacité dépassée" ; à l'inverse, certaines
// sections recommandées semblaient trop généreuses). Cause : les valeurs
// `ampacityA` d'origine (reprises telles quelles d'un ancien
// AwgCalculator.tsx, jamais vérifiées contre une norme) étaient
// significativement sous-évaluées pour du câble de puissance — un simple
// multiplicateur "isolant" (×1,3 / ×1,5) appliqué à une base déjà trop
// basse ne pouvait pas corriger l'écart.
//
// Remplacées ici par les valeurs officielles ISO 13297, Table A1
// ("European Ampacity Rating Table for Bundles up to 3 Conductors"),
// reproduites avec l'autorisation de l'éditeur par BoatHowTo
// (https://boathowto.com/wiresize/wiresize_tables_iso.pdf, "Courtesy ISO
// 13297, Table A1. Used with permission.") — trois colonnes réelles par
// température d'isolant plutôt qu'un multiplicateur approximatif sur une
// base unique. Toujours pour un câble seul ou en faisceau de 3 conducteurs
// maximum, hors compartiment moteur (voir BUNDLING_FACTOR ci-dessous pour
// les faisceaux plus importants — ISO 13297, Table A2).
//
// Sections < 0,75 mm² (hors périmètre ISO 13297, câblage signal/LED) :
// valeurs indicatives d'origine conservées à l'identique sur les trois
// colonnes, non critiques pour la sécurité (jamais du câblage de
// puissance).

export type WireRow = {
  awg: string;
  mm2: number;
  /** Ampacité (A), isolant PVC ~70°C — ISO 13297 Table A1, colonne "70°C". */
  ampacity70C: number;
  /** Ampacité (A), isolant XLPE/EPR ~85-90°C — ISO 13297 Table A1, colonne "85 to 90°C". */
  ampacity90C: number;
  /** Ampacité (A), isolant silicone ~105°C — ISO 13297 Table A1, colonne "105°C". */
  ampacity105C: number;
  usage: string;
};

export const WIRE_TABLE: WireRow[] = [
  { awg: "28", mm2: 0.08, ampacity70C: 0.5, ampacity90C: 0.5, ampacity105C: 0.5, usage: "Signaux, bus NMEA" },
  { awg: "26", mm2: 0.14, ampacity70C: 1, ampacity90C: 1, ampacity105C: 1, usage: "Signaux, capteurs" },
  { awg: "24", mm2: 0.2, ampacity70C: 2, ampacity90C: 2, ampacity105C: 2, usage: "Signaux, télécommandes" },
  { awg: "22", mm2: 0.35, ampacity70C: 3, ampacity90C: 3, ampacity105C: 3, usage: "Signaux, LED" },
  { awg: "20", mm2: 0.5, ampacity70C: 5, ampacity90C: 5, ampacity105C: 5, usage: "LED, signaux" },
  { awg: "18", mm2: 0.75, ampacity70C: 10, ampacity90C: 12, ampacity105C: 16, usage: "LED, instruments, VHF" },
  // 1mm² : taille du catalogue AVAILABLE_SECTIONS_MM2 (section-cable.ts)
  // absente de la table AWG d'origine — interpolée entre 0,75mm² et
  // 1,5mm² de la table ISO, cohérente avec sa progression.
  { awg: "17", mm2: 1, ampacity70C: 14, ampacity90C: 18, ampacity105C: 20, usage: "LED, petits circuits" },
  { awg: "16", mm2: 1.5, ampacity70C: 18, ampacity90C: 21, ampacity105C: 25, usage: "Éclairage, pompe cale, frigo" },
  { awg: "14", mm2: 2.5, ampacity70C: 25, ampacity90C: 30, ampacity105C: 35, usage: "Frigo, VHF, pompe cale" },
  { awg: "12", mm2: 4, ampacity70C: 35, ampacity90C: 40, ampacity105C: 45, usage: "Frigo compresseur, pilote" },
  { awg: "10", mm2: 6, ampacity70C: 45, ampacity90C: 50, ampacity105C: 60, usage: "Pilote auto, chargeur MPPT" },
  { awg: "8", mm2: 10, ampacity70C: 65, ampacity90C: 70, ampacity105C: 90, usage: "Moteur trim, treuil léger" },
  { awg: "6", mm2: 16, ampacity70C: 90, ampacity90C: 100, ampacity105C: 130, usage: "Guindeau léger, onduleur, MPPT" },
  { awg: "4", mm2: 25, ampacity70C: 120, ampacity90C: 140, ampacity105C: 170, usage: "Guindeau, moteur élec." },
  { awg: "2", mm2: 35, ampacity70C: 160, ampacity90C: 185, ampacity105C: 210, usage: "Guindeau lourd, démarreur" },
  { awg: "1/0", mm2: 50, ampacity70C: 210, ampacity90C: 230, ampacity105C: 270, usage: "Moteur principal, banc batteries" },
  { awg: "2/0", mm2: 70, ampacity70C: 265, ampacity90C: 285, ampacity105C: 330, usage: "Banc batteries, liaison principale" },
  { awg: "3/0", mm2: 95, ampacity70C: 310, ampacity90C: 330, ampacity105C: 390, usage: "Câble de masse, grosse liaison" },
  { awg: "4/0", mm2: 120, ampacity70C: 360, ampacity90C: 400, ampacity105C: 450, usage: "Masse principale, démarreur diesel" },
];

export type InsulationRating = "pvc" | "xlpe" | "silicone";

/** Sélectionne la colonne d'ampacité réelle (ISO 13297 Table A1) selon
 * l'isolant — remplace l'ancien multiplicateur approximatif unique par
 * les trois valeurs officielles, qui ne sont pas dans un rapport constant
 * d'une section à l'autre. */
export function baseAmpacityForInsulation(row: WireRow, insulation: InsulationRating): number {
  switch (insulation) {
    case "pvc":
      return row.ampacity70C;
    case "xlpe":
      return row.ampacity90C;
    case "silicone":
      return row.ampacity105C;
  }
}

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

/** Dérating regroupement — ISO 13297, Table A2 ("Derating Factors for
 * Bundles"). La table A1 ci-dessus est elle-même déjà valable jusqu'à 3
 * conducteurs groupés (aucun dérating supplémentaire dans cette plage) ;
 * Table A2 donne 0,7 pour 4 à 6 conducteurs, 0,6 pour 7 à 24, 0,5 pour 25
 * et plus. "small" (interface : "petit faisceau 2-4") reprend la valeur
 * 4-6 par prudence sur son haut de plage ; "large" ("5+") reprend la
 * valeur 7-24, plus rarement pertinente en van/bateau (25+ conducteurs
 * groupés du même type est un cas extrême non couvert ici). */
export const BUNDLING_FACTOR: Record<CableBundling, number> = {
  single: 1,
  small: 0.7,
  large: 0.6,
};

/**
 * Norme de référence affichée à l'utilisateur — pas un moteur de calcul
 * séparé (la table WIRE_TABLE et les facteurs ci-dessus restent la seule
 * source de vérité, déjà validés ailleurs sur le site). Ajout suite à
 * l'audit du concurrent Wireframe (US/UK, citations ABYC E-11 / BS 7671) :
 * même principe de traçabilité, adapté au public France/UE de ce site.
 * Aucune norme "camping-car CC" dédiée n'existe en France — pratique
 * courante = ISO 10133 (petits navires) pour le circuit CC véhicule/bateau,
 * NF C 15-100 pour la partie secteur 230V (chargeur, prises). Valeurs
 * volontairement limitées aux conventions larges et bien établies (seuils
 * de chute de tension, marge circuit continu) plutôt qu'une reproduction
 * chiffrée exacte d'une table de norme payante non vérifiable ici.
 */
export type CableStandardId = "iso10133" | "nfc15100";

export type CableStandard = {
  id: CableStandardId;
  label: string;
  shortLabel: string;
  region: string;
  description: string;
  /** Chute de tension max recommandée, circuit critique (navigation, sécurité, pompe de cale). */
  voltageDropCriticalPct: number;
  /** Chute de tension max recommandée, circuit non critique (éclairage confort, USB...). */
  voltageDropNonCriticalPct: number;
  /** Marge appliquée au courant de dimensionnement d'un circuit continu (≥3h). */
  continuousLoadFactor: number;
  citation: string;
};

export const CABLE_STANDARDS: Record<CableStandardId, CableStandard> = {
  iso10133: {
    id: "iso10133",
    label: "ISO 10133 — petits navires, installations CC très basse tension",
    shortLabel: "ISO 10133",
    region: "Europe / international — circuit CC (batterie, solaire, 12/24/48V)",
    description:
      "Norme internationale de référence pour le câblage continu très basse tension à bord des petits navires. En l'absence de norme française dédiée au camping-car/van aménagé, c'est la référence la plus proche et la plus largement utilisée par les fabricants de matériel vendus en France (Victron, Renogy...) pour le circuit CC.",
    voltageDropCriticalPct: 3,
    voltageDropNonCriticalPct: 10,
    continuousLoadFactor: 1.25,
    citation: "ISO 10133 — Small craft — Electrical systems — Extra-low-voltage d.c. installations",
  },
  nfc15100: {
    id: "nfc15100",
    label: "NF C 15-100 — installations basse tension (secteur 230V)",
    shortLabel: "NF C 15-100",
    region: "France — circuit secteur (chargeur, prises 230V)",
    description:
      "Norme française d'installation électrique basse tension (transposition de la norme européenne CENELEC HD 60364 / IEC 60364). Pertinente pour la partie 230V d'une installation (raccordement secteur, chargeur), pas pour le circuit CC véhicule/bateau.",
    voltageDropCriticalPct: 3,
    voltageDropNonCriticalPct: 5,
    continuousLoadFactor: 1,
    citation: "NF C 15-100 §512.1.1 / §525 — chute de tension ; IEC 60364-5-52",
  },
};

/** Trouve la ligne du plus petit câble dont l'ampacité dérated couvre le courant demandé. */
export function findMinimumSectionForAmpacity(
  designCurrentA: number,
  insulation: InsulationRating,
  ambient: AmbientTemp,
  bundling: CableBundling,
): WireRow | null {
  const factor = AMBIENT_TEMP_FACTOR[ambient] * BUNDLING_FACTOR[bundling];
  if (factor <= 0) return null;
  return WIRE_TABLE.find((row) => baseAmpacityForInsulation(row, insulation) * factor >= designCurrentA) ?? null;
}

export function getDeratedAmpacity(row: WireRow, insulation: InsulationRating, ambient: AmbientTemp, bundling: CableBundling): number {
  return baseAmpacityForInsulation(row, insulation) * AMBIENT_TEMP_FACTOR[ambient] * BUNDLING_FACTOR[bundling];
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

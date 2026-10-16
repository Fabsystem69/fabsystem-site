// Préconisations d'installation constructeur, par modèle de marque (voir
// brand-models.ts, même `id`). Retour utilisateur (10/2026) : "tout rentrer
// comme indication dans l'éditeur et aussi dans les moteurs de vérification"
// à partir des manuels Victron officiels — section de câble batterie par
// longueur, fusible, capacité batterie, section max. de borne.
//
// Règles de saisie :
// - uniquement des valeurs lues dans un manuel constructeur officiel (source
//   + URL sur chaque entrée) ; un modèle sans manuel vérifié n'a pas d'entrée
//   (ex. MultiPlus 12/1600, gamme Compact 230 V, BlueSolar) ;
// - 12 V uniquement pour l'instant (décision produit) ;
// - sections "par borne + et −" : `conductors: 2` = deux câbles + et deux − ;
// - longueur = longueur aller du câble (même convention que `edge.data.length`).
//
// Données publiques des manuels : affichées en gratuit dans l'éditeur
// (décision produit), contrairement au calcul automatique (Éditeur Plus).

export interface CableBand {
  /** Longueur aller maximale couverte par cette tranche, en mètres. */
  maxLengthM: number;
  /** Section par conducteur en mm² ; `null` = longueur déconseillée par le constructeur. */
  sectionMm2: number | null;
  /** Nombre de conducteurs en parallèle par polarité (défaut 1). */
  conductors?: number;
}

export interface ManufacturerSpec {
  source: string;
  sourceUrl: string;
  /** Câble batterie (côté DC), tranches triées par longueur croissante. */
  batteryCable?: CableBand[];
  /** Calibre de fusible externe préconisé. */
  recommendedFuseA?: number;
  /** Plage de calibre imposée (régulateurs MPPT, Orion XS). */
  fuseRangeA?: { min: number; max: number };
  /** Fusible interne de l'appareil (texte affiché tel quel). */
  internalFuse?: string;
  /** Au-delà de cette longueur de câble, un fusible externe près de la batterie devient obligatoire. */
  externalFuseRequiredBeyondM?: number;
  /** Capacité batterie conseillée (Ah, 12 V). */
  batteryAh?: { min: number; max?: number };
  /** Section maximale acceptée par la borne batterie, en mm². */
  maxTerminalMm2?: number;
  /** Fusible à prévoir des deux côtés (entrée et sortie) — chargeurs DC-DC. */
  fuseBothSides?: boolean;
  notes?: string[];
}

const PHOENIX_VEDIRECT = {
  source: "Manuel Victron Phoenix Inverter VE.Direct (matériel HW15)",
  sourceUrl: "https://www.victronenergy.com/media/pg/Inverter_VE.Direct_230V_-_HW15/en/installation.html",
};
const INVERTER_SMART = {
  source: "Manuel Victron Inverter Smart (rev 02, 03/2024)",
  sourceUrl: "https://www.victronenergy.com/upload/documents/Inverter_Smart/106668-Inverter_VE_Direct__Smart_and_SUN-pdf-en.pdf",
};
const MULTIPLUS_500_1200 = {
  source: "Manuel Victron MultiPlus 500 VA – 1200 VA",
  sourceUrl: "https://www.victronenergy.com/upload/documents/Manual-MultiPlus-500VA-1200VA-EN-NL-FR-DE-ES-IT.pdf",
};
const MPPT_75_100_20 = {
  source: "Manuel Victron SmartSolar MPPT 75/10 à 100/20",
  sourceUrl: "https://www.victronenergy.com/media/pg/Manual_SmartSolar_MPPT_75-10_up_to_100-20/en/installation.html",
};
const MPPT_100_30_50 = {
  source: "Manuel Victron SmartSolar MPPT 100/30 & 100/50",
  sourceUrl: "https://www.victronenergy.com/upload/documents/Manual_SmartSolar_MPPT_100-30__100-50/29694-MPPT_solar_charger_manual-pdf-en.pdf",
};
const MPPT_150_35_45 = {
  source: "Manuel Victron SmartSolar MPPT 150/35 & 150/45",
  sourceUrl: "https://www.victronenergy.com/upload/documents/Manual_SmartSolar_MPPT_150-35__150-45/29694-MPPT_solar_charger_manual-pdf-en.pdf",
};
const ORION_TR_SMART_ISOLATED = {
  source: "Manuel Victron Orion-Tr Smart DC-DC (isolé)",
  sourceUrl: "https://www.victronenergy.com/media/pg/Orion-Tr_Smart_DC-DC_Charger_-_Isolated/en/index-en.html",
};
const ORION_TR_SMART_NON_ISOLATED = {
  source: "Manuel Victron Orion-Tr Smart DC-DC (non isolé)",
  sourceUrl: "https://www.victronenergy.com/media/pg/Orion-Tr_Smart_DC-DC_Charger_-_Non-Isolated/en/index-en.html",
};

const PHOENIX_VEDIRECT_EXTERNAL_FUSE_NOTE = "Fusible interne : au-delà de 1,5 m de câble, ajouter un fusible ou disjoncteur près de la batterie.";
const MPPT_FUSE_NOTE = "Fusible batterie obligatoire, même si le régulateur en a déjà un. Câble cuivre souple multibrins, chute de tension ≤ 2,5 %.";
const ORION_TR_SMART_CABLE: CableBand[] = [
  { maxLengthM: 0.5, sectionMm2: 6 },
  { maxLengthM: 2, sectionMm2: 10 },
  { maxLengthM: 10, sectionMm2: 16 },
];
const ORION_FUSE_NOTE = "Un fusible de chaque côté : batterie moteur (entrée) et batterie de service (sortie).";

const MANUFACTURER_SPECS: Record<string, ManufacturerSpec> = {
  // ─── Phoenix Inverter VE.Direct ───────────────────────────────────────
  "victron-phoenix-250": {
    ...PHOENIX_VEDIRECT,
    batteryCable: [{ maxLengthM: 1.5, sectionMm2: 4 }, { maxLengthM: 3, sectionMm2: 6 }],
    internalFuse: "2 × 30 A (non remplaçable)",
    externalFuseRequiredBeyondM: 1.5,
    maxTerminalMm2: 10,
    notes: [PHOENIX_VEDIRECT_EXTERNAL_FUSE_NOTE],
  },
  "victron-phoenix-375": {
    ...PHOENIX_VEDIRECT,
    batteryCable: [{ maxLengthM: 1.5, sectionMm2: 6 }, { maxLengthM: 3, sectionMm2: 10 }],
    internalFuse: "2 × 40 A (non remplaçable)",
    externalFuseRequiredBeyondM: 1.5,
    maxTerminalMm2: 10,
    notes: [PHOENIX_VEDIRECT_EXTERNAL_FUSE_NOTE],
  },
  "victron-phoenix-500": {
    ...PHOENIX_VEDIRECT,
    batteryCable: [{ maxLengthM: 1.5, sectionMm2: 6 }, { maxLengthM: 3, sectionMm2: 10 }],
    internalFuse: "3 × 35 A (non remplaçable)",
    externalFuseRequiredBeyondM: 1.5,
    maxTerminalMm2: 10,
    notes: [PHOENIX_VEDIRECT_EXTERNAL_FUSE_NOTE],
  },
  "victron-phoenix-800": {
    ...PHOENIX_VEDIRECT,
    batteryCable: [{ maxLengthM: 1.5, sectionMm2: 16 }, { maxLengthM: 3, sectionMm2: 25 }],
    internalFuse: "150 A MIDI (remplaçable)",
    externalFuseRequiredBeyondM: 1.5,
    maxTerminalMm2: 25,
    notes: [PHOENIX_VEDIRECT_EXTERNAL_FUSE_NOTE],
  },
  "victron-phoenix-1200": {
    ...PHOENIX_VEDIRECT,
    batteryCable: [{ maxLengthM: 1.5, sectionMm2: 25 }, { maxLengthM: 3, sectionMm2: 35 }],
    internalFuse: "200 A MIDI (remplaçable)",
    externalFuseRequiredBeyondM: 1.5,
    maxTerminalMm2: 35,
    notes: [PHOENIX_VEDIRECT_EXTERNAL_FUSE_NOTE],
  },
  "victron-phoenix-1600": {
    ...PHOENIX_VEDIRECT,
    batteryCable: [{ maxLengthM: 1.5, sectionMm2: 35 }, { maxLengthM: 3, sectionMm2: 50 }],
    internalFuse: "250 A MEGA (remplaçable)",
    externalFuseRequiredBeyondM: 1.5,
    maxTerminalMm2: 50,
    notes: [PHOENIX_VEDIRECT_EXTERNAL_FUSE_NOTE],
  },

  // ─── Inverter Smart (aucun fusible interne) ───────────────────────────
  "victron-inverter-smart-1600": {
    ...INVERTER_SMART,
    batteryCable: [{ maxLengthM: 5, sectionMm2: 70 }, { maxLengthM: 10, sectionMm2: null }],
    recommendedFuseA: 250,
    batteryAh: { min: 300, max: 800 },
    notes: ["Aucun fusible interne : fusible externe obligatoire.", "Câbles batterie hors gaine fermée."],
  },
  "victron-inverter-smart-2000": {
    ...INVERTER_SMART,
    batteryCable: [{ maxLengthM: 5, sectionMm2: 70 }, { maxLengthM: 10, sectionMm2: null }],
    recommendedFuseA: 300,
    batteryAh: { min: 350, max: 1000 },
    notes: ["Aucun fusible interne : fusible externe obligatoire.", "Câbles batterie hors gaine fermée."],
  },
  "victron-inverter-smart-3000": {
    ...INVERTER_SMART,
    batteryCable: [{ maxLengthM: 5, sectionMm2: 90 }, { maxLengthM: 10, sectionMm2: 70, conductors: 2 }],
    recommendedFuseA: 400,
    batteryAh: { min: 400, max: 1200 },
    notes: [
      "Aucun fusible interne : fusible externe obligatoire.",
      "90 mm² n'est pas une section du commerce : prendre 95 mm².",
      "En câbles doublés, chaque câble doit supporter seul le calibre du fusible.",
    ],
  },

  // ─── MultiPlus ────────────────────────────────────────────────────────
  // Le manuel ne donne qu'une tranche 1,5–5 m ; appliquée aussi en dessous
  // de 1,5 m (une section plus courte n'en demande jamais moins).
  "victron-multiplus-500-20": {
    ...MULTIPLUS_500_1200,
    batteryCable: [{ maxLengthM: 5, sectionMm2: 16 }],
    internalFuse: "125 A MIDI ou BF1",
    batteryAh: { min: 60, max: 300 },
  },
  "victron-multiplus-800-35": {
    ...MULTIPLUS_500_1200,
    batteryCable: [{ maxLengthM: 5, sectionMm2: 25 }],
    internalFuse: "150 A MIDI ou BF1",
    batteryAh: { min: 100, max: 400 },
  },
  "victron-multiplus-1200-50": {
    ...MULTIPLUS_500_1200,
    batteryCable: [{ maxLengthM: 5, sectionMm2: 35 }],
    internalFuse: "200 A MIDI ou BF1",
    batteryAh: { min: 150, max: 700 },
  },
  "victron-multiplus-12-2000-80": {
    source: "Manuel Victron MultiPlus 2 kVA 230 V",
    sourceUrl: "https://www.victronenergy.com/media/pg/MultiPlus_2kVA_230V/en/installation.html",
    batteryCable: [{ maxLengthM: 5, sectionMm2: 70 }, { maxLengthM: 10, sectionMm2: 95 }],
    recommendedFuseA: 300,
    batteryAh: { min: 350, max: 1000 },
    notes: ["Couple de serrage : 12 Nm (écrou M8)."],
  },
  "victron-multiplus-3000-120": {
    source: "Manuel Victron MultiPlus 3k 230 V",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Manual-MultiPlus-3k-230V-16A-50A-(firmware-xxxx4xx)-EN-NL-FR-DE-ES-SE.pdf",
    batteryCable: [{ maxLengthM: 5, sectionMm2: 50, conductors: 2 }, { maxLengthM: 10, sectionMm2: 70, conductors: 2 }],
    recommendedFuseA: 400,
    batteryAh: { min: 400, max: 1200 },
    notes: ["Couple de serrage max. : 12 Nm.", "Câbles batterie hors gaine fermée."],
  },
  "victron-multiplus-ii-12-3000-120": {
    source: "Manuel Victron MultiPlus-II 230 V",
    sourceUrl: "https://www.victronenergy.com/upload/documents/MultiPlus-II_230V/32424-MultiPlus-II___Quattro-II-pdf-en.pdf",
    batteryCable: [{ maxLengthM: 5, sectionMm2: 50, conductors: 2 }, { maxLengthM: 10, sectionMm2: 70, conductors: 2 }],
    recommendedFuseA: 400,
    batteryAh: { min: 400, max: 1200 },
    notes: ["Câble cuivre isolé 90 °C.", "Couple de serrage : 12 Nm (écrou M8).", "Câbles batterie hors gaine fermée."],
  },

  // ─── SmartSolar MPPT (aucune section imposée : fusible min–max) ────────
  "victron-smartsolar-75-10": { ...MPPT_75_100_20, fuseRangeA: { min: 15, max: 20 }, maxTerminalMm2: 6, notes: [MPPT_FUSE_NOTE] },
  "victron-smartsolar-75-15": { ...MPPT_75_100_20, fuseRangeA: { min: 20, max: 25 }, maxTerminalMm2: 6, notes: [MPPT_FUSE_NOTE] },
  "victron-smartsolar-100-15": { ...MPPT_75_100_20, fuseRangeA: { min: 20, max: 25 }, maxTerminalMm2: 6, notes: [MPPT_FUSE_NOTE] },
  "victron-smartsolar-100-20": { ...MPPT_75_100_20, fuseRangeA: { min: 25, max: 30 }, maxTerminalMm2: 6, notes: [MPPT_FUSE_NOTE] },
  "victron-smartsolar-100-30": { ...MPPT_100_30_50, fuseRangeA: { min: 35, max: 40 }, maxTerminalMm2: 16, notes: [MPPT_FUSE_NOTE] },
  "victron-smartsolar-100-50": { ...MPPT_100_30_50, fuseRangeA: { min: 55, max: 70 }, maxTerminalMm2: 16, notes: [MPPT_FUSE_NOTE] },
  "victron-smartsolar-150-35": { ...MPPT_150_35_45, fuseRangeA: { min: 40, max: 45 }, maxTerminalMm2: 16, notes: [MPPT_FUSE_NOTE] },
  "victron-smartsolar-150-45": { ...MPPT_150_35_45, fuseRangeA: { min: 50, max: 63 }, maxTerminalMm2: 16, notes: [MPPT_FUSE_NOTE] },

  // ─── Orion DC-DC ──────────────────────────────────────────────────────
  "victron-orion-tr-18a": { ...ORION_TR_SMART_ISOLATED, batteryCable: ORION_TR_SMART_CABLE, recommendedFuseA: 60, fuseBothSides: true, notes: [ORION_FUSE_NOTE] },
  "victron-orion-tr-30a": { ...ORION_TR_SMART_ISOLATED, batteryCable: ORION_TR_SMART_CABLE, recommendedFuseA: 60, fuseBothSides: true, notes: [ORION_FUSE_NOTE] },
  "victron-orion-tr-smart-30a-non-isolated": {
    ...ORION_TR_SMART_NON_ISOLATED,
    batteryCable: ORION_TR_SMART_CABLE,
    recommendedFuseA: 60,
    fuseBothSides: true,
    notes: [ORION_FUSE_NOTE],
  },
  "victron-orion-xs-12-12-50": {
    source: "Manuel Victron Orion XS 12/12-50A",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Orion_XS_12-12-50A_DC-DC_battery_charger/124067-Orion_XS_DC-DC_battery_charger-pdf-en.pdf",
    batteryCable: [{ maxLengthM: 5, sectionMm2: 16 }, { maxLengthM: 10, sectionMm2: 25 }],
    fuseRangeA: { min: 60, max: 70 },
    maxTerminalMm2: 25,
    fuseBothSides: true,
    notes: [ORION_FUSE_NOTE, "5 à 10 m : 4 AWG (21 mm²), soit 25 mm² en section métrique."],
  },
  "victron-orion-xs-12-12-70": {
    source: "Manuel Victron Orion XS 12/12-70A",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Orion_XS_12-12-70A_DC-DC_Battery_Charger/124067-Orion_XS_DC-DC_battery_charger-pdf-en.pdf",
    batteryCable: [{ maxLengthM: 10, sectionMm2: 25 }],
    fuseRangeA: { min: 80, max: 100 },
    maxTerminalMm2: 25,
    fuseBothSides: true,
    notes: [ORION_FUSE_NOTE],
  },
};

export function getManufacturerSpec(brandModelId: unknown): ManufacturerSpec | null {
  return typeof brandModelId === "string" ? (MANUFACTURER_SPECS[brandModelId] ?? null) : null;
}

/** Tranche de câble applicable à une longueur ; `null` si la longueur dépasse toutes les tranches. */
export function findCableBand(spec: ManufacturerSpec, lengthM: number): CableBand | null {
  return spec.batteryCable?.find((band) => lengthM <= band.maxLengthM) ?? null;
}

/** Section totale cuivre préconisée (mm², tous conducteurs d'une polarité) pour cette tranche. */
export function bandTotalSectionMm2(band: CableBand): number | null {
  return band.sectionMm2 === null ? null : band.sectionMm2 * (band.conductors ?? 1);
}

export function formatCableBand(band: CableBand): string {
  if (band.sectionMm2 === null) return "déconseillé";
  const conductors = band.conductors ?? 1;
  return conductors > 1 ? `${conductors} × ${band.sectionMm2} mm²` : `${band.sectionMm2} mm²`;
}

/** Calibre plancher à proposer pour le fusible de cet appareil (0 si aucun). */
export function getManufacturerFuseFloorA(spec: ManufacturerSpec | null): number {
  if (!spec) return 0;
  return spec.recommendedFuseA ?? spec.fuseRangeA?.min ?? 0;
}

/** Calibre au-delà duquel un fusible n'est plus conforme au constructeur (0 si aucun). */
export function getManufacturerFuseCeilingA(spec: ManufacturerSpec | null): number {
  if (!spec) return 0;
  return spec.fuseRangeA?.max ?? spec.recommendedFuseA ?? 0;
}

/** Bornes DC côté batterie par type de composant : la première est la borne +. */
export const BATTERY_SIDE_HANDLES: Record<string, string[][]> = {
  inverter: [["dc-positive", "dc-negative"]],
  "inverter-charger": [["dc-positive", "dc-negative"]],
  mppt: [["bat-positive", "bat-negative"]],
  // DC-DC : le constructeur donne la même section et le même fusible en
  // entrée (batterie moteur) et en sortie (batterie de service).
  dcdc: [["out-positive", "out-negative"], ["in-positive", "in-negative"]],
};

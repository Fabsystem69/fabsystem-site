import { CABLE_SECTIONS } from "@/types/schema";

// Diamètre de vis/goujon indicatif par section de câble, pour la ligne
// "cosses" du récapitulatif matériel (retour utilisateur : "un moteur pour
// calculer les consommables cosses... avec les diamètres de vis et la
// section"). Choix explicite et assumé (retour utilisateur) : déduit
// uniquement de la section, sans tenir compte de la borne réelle de chaque
// composant — en pratique, une même section se vend couramment avec
// plusieurs diamètres de trou différents (ex. une cosse 16 mm² existe en
// M5, M6, M8 ET M10 chez la plupart des fournisseurs), donc cette valeur
// reste indicative, pas une règle absolue. Le disclaimer déjà affiché avec
// l'export matériel s'applique aussi à cette ligne.
const CABLE_SECTION_TO_LUG_STUD: Partial<Record<(typeof CABLE_SECTIONS)[number], string>> = {
  "0,5 mm²": "M4",
  "0,75 mm²": "M4",
  "1 mm²": "M4",
  "1,5 mm²": "M4",
  "3G1,5 mm²": "M4",
  "2,5 mm²": "M5",
  "3G2,5 mm²": "M5",
  "4 mm²": "M5",
  "6 mm²": "M5",
  "10 mm²": "M6",
  "16 mm²": "M6",
  "25 mm²": "M8",
  "35 mm²": "M8",
  "50 mm²": "M10",
  "70 mm²": "M10",
};

export function getRecommendedLugStudDiameter(section: string): string | null {
  return CABLE_SECTION_TO_LUG_STUD[section as (typeof CABLE_SECTIONS)[number]] ?? null;
}

// Ordre d'affichage : celui de CABLE_SECTIONS (croissant), jamais un tri
// alphabétique qui casserait l'ordre numérique ("16 mm²" avant "6 mm²").
export function compareBySectionOrder(a: string, b: string): number {
  const indexA = CABLE_SECTIONS.indexOf(a as (typeof CABLE_SECTIONS)[number]);
  const indexB = CABLE_SECTIONS.indexOf(b as (typeof CABLE_SECTIONS)[number]);
  if (indexA === -1 || indexB === -1) return a.localeCompare(b);
  return indexA - indexB;
}

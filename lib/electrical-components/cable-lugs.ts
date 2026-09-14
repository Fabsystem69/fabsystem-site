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

// Bornes à vis/cage (retour utilisateur, photo à l'appui : une cosse
// tubulaire coudée à languette pour rentrer un câble dans un régulateur
// MPPT/PWM, un DC-DC ou un disjoncteur modulaire DC) — une cosse à œillet
// ne s'y visse ni ne s'y boulonne, il faut soit un simple embout de câble
// (petites sections), soit une cosse tubulaire coudée (grosses sections,
// parfois vendue sous le nom "cosse C45" chez certains revendeurs — terme
// de recherche courant, pas une norme officielle vérifiée, donc jamais
// utilisé seul comme LE nom dans le récap, uniquement en synonyme entre
// parenthèses pour retrouver la même référence en boutique).
// Liste volontairement restreinte aux composants dont ce type de borne est
// la norme du marché pour ce type d'appareil ; tout le reste (fusible sur
// porte-fusible boulonné, busbar, batterie, Lynx...) garde la cosse à
// œillet par défaut — un appareil réel précis peut toujours différer.
export const SCREW_TERMINAL_COMPONENT_TYPES = new Set(["mppt", "pwm", "dcdc", "circuit-breaker"]);

export function isScrewTerminalComponentType(componentType: string | undefined): boolean {
  return typeof componentType === "string" && SCREW_TERMINAL_COMPONENT_TYPES.has(componentType);
}

// Seuil retenu (retour utilisateur) : embout de câble jusqu'à 6 mm² inclus,
// cosse tubulaire coudée au-delà — même logique indicative que le diamètre
// de vis ci-dessus, à vérifier selon la borne réelle de l'appareil.
const FERRULE_MAX_SECTION_INDEX = CABLE_SECTIONS.indexOf("6 mm²");

export function getScrewTerminalConnectorLabel(section: string): string | null {
  const index = CABLE_SECTIONS.indexOf(section as (typeof CABLE_SECTIONS)[number]);
  if (index === -1) return null;
  return index <= FERRULE_MAX_SECTION_INDEX ? "Embout de câble" : "Cosse tubulaire coudée (dite \"cosse C45\")";
}

// Ordre d'affichage : celui de CABLE_SECTIONS (croissant), jamais un tri
// alphabétique qui casserait l'ordre numérique ("16 mm²" avant "6 mm²").
export function compareBySectionOrder(a: string, b: string): number {
  const indexA = CABLE_SECTIONS.indexOf(a as (typeof CABLE_SECTIONS)[number]);
  const indexB = CABLE_SECTIONS.indexOf(b as (typeof CABLE_SECTIONS)[number]);
  if (indexA === -1 || indexB === -1) return a.localeCompare(b);
  return indexA - indexB;
}

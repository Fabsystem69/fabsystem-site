// Longueurs moyennes plausibles par section (retour utilisateur : "des
// longueurs moyennes automatiquement quand on rajoute quelque chose, pour
// éviter qu'un débutant ait à le faire") — préremplit le champ Longueur dès
// qu'une section est choisie, sans écraser une valeur déjà saisie. Plus la
// section est grosse, plus le tronçon type est court (câbles batterie/busbar
// courts et épais vs branches consommateurs fines et plus longues jusqu'au
// poste) — juste une estimation de départ, à ajuster par l'utilisateur.
export const AVERAGE_CABLE_LENGTH_BY_SECTION_M: Record<string, number> = {
  "0,5 mm²": 2,
  "0,75 mm²": 2.5,
  "1 mm²": 2.5,
  "1,5 mm²": 3,
  "2,5 mm²": 2,
  "3G2,5 mm²": 2,
  "4 mm²": 1.5,
  "6 mm²": 1.5,
  "10 mm²": 1.5,
  "16 mm²": 1,
  "25 mm²": 1,
  "35 mm²": 1,
  "50 mm²": 0.5,
  "70 mm²": 0.5,
};

export function getAverageCableLength(section: string): number | undefined {
  return AVERAGE_CABLE_LENGTH_BY_SECTION_M[section];
}

export const DEFAULT_BATTERY_TRUNK_SECTION = "25 mm²";

type PowerCableType = "power-positive" | "power-negative";

// Câblage "cœur" batterie ↔ protection ↔ distribution (retour utilisateur :
// "prend en compte une moyenne de câble de 1,5 ou 2m pour les liaisons
// batterie/coupe-circuit/busbar") — ces tronçons sont physiquement courts
// (composants montés côte à côte près de la batterie), contrairement aux
// branches vers un consommateur qui courent jusqu'au poste concerné : la
// table par section ci-dessus reste une bonne estimation pour ces
// dernières, mais sous-estime rarement assez court pour ces liaisons-là.
const CORE_WIRING_TYPES = new Set([
  "battery",
  "fuse",
  "circuit-breaker",
  "battery-switch",
  "fuse-block",
  "distribution-panel",
  "busbar",
  "battery-isolator",
  "battery-combiner",
]);

// Tronc batterie principal (retour utilisateur : "créer un câble batterie +
// et - de 25mm² typiquement avec des longueurs de 1m pour toute jonction
// entre la batterie et un composant de protection / distribution et shunt")
// — ce n'est pas un dimensionnement imposé, juste un préremplissage très
// plausible pour les grosses liaisons de tête de parc.
const BATTERY_TRUNK_COMPONENT_TYPES = new Set([
  "battery",
  "fuse",
  "circuit-breaker",
  "battery-switch",
  "fuse-block",
  "distribution-panel",
  "busbar",
  "shunt",
]);

function isPowerCableType(value: string | undefined): value is PowerCableType {
  return value === "power-positive" || value === "power-negative";
}

function isBatteryTrunkEdge(
  sourceComponentType: string | undefined,
  targetComponentType: string | undefined,
  cableType: string | undefined,
): boolean {
  return Boolean(
    sourceComponentType &&
      targetComponentType &&
      isPowerCableType(cableType) &&
      BATTERY_TRUNK_COMPONENT_TYPES.has(sourceComponentType) &&
      BATTERY_TRUNK_COMPONENT_TYPES.has(targetComponentType),
  );
}

export function getEdgeDefaultSection(
  sourceComponentType: string | undefined,
  targetComponentType: string | undefined,
  cableType: string | undefined,
): string | undefined {
  return isBatteryTrunkEdge(sourceComponentType, targetComponentType, cableType) ? DEFAULT_BATTERY_TRUNK_SECTION : undefined;
}

/** Longueur moyenne suggérée pour CE câble précis — 1,5 m si les deux bouts
 * sont des composants "cœur" (batterie/protection/distribution), sinon la
 * même estimation par section qu'avant. */
export function getEdgeDefaultLength(
  sourceComponentType: string | undefined,
  targetComponentType: string | undefined,
  section: string,
  cableType?: string,
): number | undefined {
  if (isBatteryTrunkEdge(sourceComponentType, targetComponentType, cableType)) return 1;
  if (sourceComponentType && targetComponentType && CORE_WIRING_TYPES.has(sourceComponentType) && CORE_WIRING_TYPES.has(targetComponentType)) {
    return 1.5;
  }
  return getAverageCableLength(section);
}

export function getEdgeDefaultPreset(
  sourceComponentType: string | undefined,
  targetComponentType: string | undefined,
  cableType: string | undefined,
): { section?: string; length?: number } {
  const section = getEdgeDefaultSection(sourceComponentType, targetComponentType, cableType);
  const length = getEdgeDefaultLength(sourceComponentType, targetComponentType, section ?? "", cableType);
  return {
    ...(section ? { section } : {}),
    ...(length !== undefined ? { length } : {}),
  };
}

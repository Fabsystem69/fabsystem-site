import { compareBySectionOrder } from "./cable-lugs";

// Suggestion d'achat (retour utilisateur : "optimiser sans rogner sur la
// sécurité... passer en 1,5 pour les sections de dessous... car les bobines
// sont généralement en 50-100m") — jamais une modification du schéma réel,
// seulement une note dans la liste de matériel. Une section dont le total
// réel est faible ne justifie pas l'achat d'une bobine dédiée (50-100m) :
// autant utiliser la section supérieure la plus proche, presque toujours
// déjà achetée pour d'autres circuits du même schéma. Toujours vers le
// HAUT (jamais l'inverse) : une section plus grosse reste sûre pour un
// courant plus faible, l'inverse ne l'est pas.
export const CABLE_HARMONIZATION_TARGETS: Partial<Record<string, string>> = {
  "0,5 mm²": "1,5 mm²",
  "0,75 mm²": "1,5 mm²",
  "1 mm²": "1,5 mm²",
  "4 mm²": "6 mm²",
  "10 mm²": "16 mm²",
};

// 10 m = 20% d'une bobine de 50m (la plus petite taille courante) — en
// dessous, la grande majorité de la bobine resterait inutilisée.
export const CABLE_HARMONIZATION_THRESHOLD_M = 10;

// Bug corrigé (retour utilisateur : "1mm² 18m mais en fait ça fait une
// bobine de rouge et une noire, la suggestion doit faire attention à la
// couleur pas juste la section") — une bobine s'achète PAR COULEUR : un
// total de 18m qui est en réalité 9m rouge + 9m noir a besoin de DEUX
// petites bobines, pas d'une seule "assez grande". Le seuil s'applique donc
// par (section, couleur), jamais sur le total toutes couleurs confondues.
export interface CableHarmonizationTotal {
  section: string;
  cableTypeLabel: string;
  totalLengthM: number;
}

export interface CableHarmonizationSuggestion {
  section: string;
  cableTypeLabel: string;
  targetSection: string;
  totalLengthM: number;
}

export function getCableHarmonizationSuggestions(
  totals: Map<string, CableHarmonizationTotal>
): CableHarmonizationSuggestion[] {
  const suggestions: CableHarmonizationSuggestion[] = [];
  for (const { section, cableTypeLabel, totalLengthM } of totals.values()) {
    const targetSection = CABLE_HARMONIZATION_TARGETS[section];
    if (!targetSection) continue;
    if (totalLengthM <= 0 || totalLengthM >= CABLE_HARMONIZATION_THRESHOLD_M) continue;
    suggestions.push({ section, cableTypeLabel, targetSection, totalLengthM });
  }
  return suggestions.sort(
    (a, b) => compareBySectionOrder(a.section, b.section) || a.cableTypeLabel.localeCompare(b.cableTypeLabel)
  );
}

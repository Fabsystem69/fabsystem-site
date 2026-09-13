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

export interface CableHarmonizationSuggestion {
  section: string;
  targetSection: string;
  totalLengthM: number;
}

export function getCableHarmonizationSuggestions(
  totalLengthBySection: Map<string, number>
): CableHarmonizationSuggestion[] {
  const suggestions: CableHarmonizationSuggestion[] = [];
  for (const [section, targetSection] of Object.entries(CABLE_HARMONIZATION_TARGETS)) {
    const totalLengthM = totalLengthBySection.get(section);
    if (totalLengthM === undefined || totalLengthM <= 0 || totalLengthM >= CABLE_HARMONIZATION_THRESHOLD_M) continue;
    suggestions.push({ section, targetSection: targetSection!, totalLengthM });
  }
  return suggestions;
}

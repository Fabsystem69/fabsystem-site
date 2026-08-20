// Utilitaire partagé — extrait de MpptCalculator.tsx pour être réutilisé
// tel quel par le calculateur de banque de batteries (même logique : le
// nombre d'unités pilote les configurations de câblage possibles, pas
// l'inverse — voir la justification complète dans MpptCalculator.tsx).

export type ArrayConfig = { series: number; parallel: number };

/** Toutes les paires (série, parallèle) dont le produit vaut `n`. */
export function getArrayConfigs(n: number): ArrayConfig[] {
  if (n <= 0) return [];
  const configs: ArrayConfig[] = [];
  for (let d = 1; d <= n; d++) {
    if (n % d === 0) configs.push({ series: d, parallel: n / d });
  }
  return configs;
}

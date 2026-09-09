// Correspondance composant -> produit Solaris Store (partenariat signé
// 09/2026, retour utilisateur : "un export simple du materiel avec leur
// appellation et si reference, ainsi que le nombre"). Vide pour l'instant —
// à compléter une fois leur liste de produits reçue (nom commercial exact,
// référence interne, caractéristiques, prix — export CSV demandé, voir
// discussion). Clé = componentType (lib/electrical-components/definitions.ts),
// volontairement large tant qu'on n'a pas leurs références précises par
// variante (puissance/capacité/tension) : un composant sans correspondance
// retombe simplement sur son nom générique dans la liste de matériel.
export type SolarisProductMatch = {
  solarisName: string;
  solarisRef?: string;
};

const SOLARIS_CATALOG: Partial<Record<string, SolarisProductMatch>> = {
  // "solar-panel": { solarisName: "Panneau solaire monocristallin 100W", solarisRef: "SOL-XXXX" },
};

export function lookupSolarisProduct(componentType: string): SolarisProductMatch | null {
  return SOLARIS_CATALOG[componentType] ?? null;
}

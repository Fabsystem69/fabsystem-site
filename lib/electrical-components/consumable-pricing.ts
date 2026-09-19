// Prix des consommables (cosses, câbles au mètre, fusibles) par fournisseur
// partenaire — jusqu'ici aucune donnée de prix n'existait pour ces lignes du
// récapitulatif matériel (bom.ts ne calcule que des quantités/métrages),
// contrairement aux composants de bibliothèque (brand-models.ts, champ
// `supplier`). Clé par spécification technique (section, type de
// connecteur, calibre/type de fusible) plutôt que par référence produit
// exacte : contrairement à une batterie ou un MPPT, l'utilisateur ne choisit
// jamais "quelle marque de cosse" dans l'éditeur — le prix doit donc se
// déduire automatiquement de ce qui est déjà calculé (section, type), pas
// d'une sélection manuelle (retour utilisateur : "sortir un devis complet
// du schéma").
//
// Tables volontairement vides pour l'instant : les prix déjà relevés chez
// Vancore ne correspondent pas toujours exactement au diamètre de vis que
// CABLE_SECTION_TO_LUG_STUD (cable-lugs.ts) recommande pour la même section
// (ex. Vancore vend du 16 mm²/M5 ET M6 ET M8, cet éditeur n'en recommande
// qu'un seul par section) — à peupler après vérification précise de la
// correspondance section ↔ diamètre réellement utilisé, pas en devinant.

export interface ConsumablePrice {
  supplierName: string;
  priceCents: number;
  url: string;
  ref?: string;
}

// Cosses/embouts — clé = `${section}__${connectorLabel}`, exactement la
// même paire que BomLugRow.section/connectorLabel (bom.ts) pour un lookup
// direct sans reparser la logique de sélection du connecteur.
export const LUG_PRICES: Record<string, ConsumablePrice[]> = {};

// Câbles au mètre — clé = `${section}__${cableTypeLabel}` (même paire que
// BomCableRow), prix AU MÈTRE (pas au câble) car la quantité réellement
// achetée dépend du métrage total, pas du nombre de tronçons dessinés.
export const CABLE_PRICES_PER_METER: Record<string, ConsumablePrice[]> = {};

// Fusibles — clé = `${fuseType}__${amperage}` (mêmes valeurs que les champs
// `fuseType`/`amperage` du composant "fuse", definitions.ts) : un fusible
// EST un composant du schéma (contrairement aux cosses, jamais dessinées),
// donc sa ligne existe déjà dans bom.componentGroups — cette table sert
// uniquement de repli automatique quand ce nœud n'a pas de brandModelId
// (un modèle de marque explicitement choisi passe toujours avant, voir
// bom.ts).
export const FUSE_PRICES: Record<string, ConsumablePrice[]> = {};

// Retour utilisateur : "avoir les deux liens car dans tous les cas pour
// avoir une remise fabsystem négocié avec les partenaire" — quand plusieurs
// fournisseurs couvrent la même référence, on les montre TOUS (triés du
// moins cher au plus cher), jamais une seule "meilleure" ligne qui cacherait
// les autres options au client.
function sortedBySupplier(options: ConsumablePrice[] | undefined): ConsumablePrice[] {
  if (!options || options.length === 0) return [];
  return [...options].sort((a, b) => a.priceCents - b.priceCents || a.supplierName.localeCompare(b.supplierName));
}

export function getLugPrices(section: string, connectorLabel: string): ConsumablePrice[] {
  return sortedBySupplier(LUG_PRICES[`${section}__${connectorLabel}`]);
}

export function getCablePricesPerMeter(section: string, cableTypeLabel: string): ConsumablePrice[] {
  return sortedBySupplier(CABLE_PRICES_PER_METER[`${section}__${cableTypeLabel}`]);
}

export function getFusePrices(fuseType: string, amperage: number): ConsumablePrice[] {
  return sortedBySupplier(FUSE_PRICES[`${fuseType}__${amperage}`]);
}

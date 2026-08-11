// Source unique pour le catalogue des packs d'accompagnement à distance
// (Amarrage / Cap / Passerelle / Grand Large × Van / Camping-car / Bateau).
// Module pur (pas de "server-only", pas d'import Prisma) : importable aussi
// bien depuis un composant client (page /prestations) que depuis les
// services serveur (seed catalogue, checkout, webhook, email).

export type PrestationsPalier = "amarrage" | "cap" | "passerelle" | "grand-large";
export type PrestationsCategorie = "van" | "camping-car" | "bateau";

export type PrestationsPackDefinition = {
  slug: string;
  palier: PrestationsPalier;
  categorie: PrestationsCategorie;
  name: string;
  priceCents: number;
  // Slug du produit ebook a octroyer automatiquement a la commande payee,
  // ou null si ce pack/categorie ne donne jamais acces a un ebook (Amarrage,
  // quelle que soit la categorie ; et camping-car, quel que soit le palier).
  grantsEbookSlug: string | null;
};

export const PRESTATIONS_PACK_SLUG_PREFIX = "pack-";

export const PRESTATIONS_PALIERS: readonly PrestationsPalier[] = [
  "amarrage",
  "cap",
  "passerelle",
  "grand-large",
];

export const PRESTATIONS_CATEGORIES: readonly PrestationsCategorie[] = [
  "van",
  "camping-car",
  "bateau",
];

// Libellés commerciaux visibles, conformes à MASTER-08-ACCOMPAGNEMENT.md §5
// (source de vérité) : le nom affiché dépend à la fois du niveau
// fonctionnel (palier — identifiant technique stable, jamais modifié ici)
// ET de l'univers. `palier` reste l'identifiant technique utilisé pour les
// slugs produit (buildPrestationsPackSlug) et la logique d'éligibilité
// ebook : ces libellés ne sont qu'un affichage dérivé, jamais une clé.
const PALIER_LABELS_BY_CATEGORIE: Record<PrestationsCategorie, Record<PrestationsPalier, string>> = {
  bateau: { amarrage: "Amarrage", cap: "Cap", passerelle: "Passerelle", "grand-large": "Grand Large" },
  van: { amarrage: "Départ", cap: "Itinéraire", passerelle: "Copilote", "grand-large": "Roadbook" },
  "camping-car": {
    amarrage: "Étape",
    cap: "Feuille de route",
    passerelle: "Relais",
    "grand-large": "Carnet de route",
  },
};

const CATEGORIE_LABELS: Record<PrestationsCategorie, string> = {
  van: "Van aménagé",
  "camping-car": "Camping-car",
  bateau: "Bateau",
};

const PRICES_CENTS: Record<PrestationsCategorie, Record<PrestationsPalier, number>> = {
  van: { amarrage: 8900, cap: 19900, passerelle: 49900, "grand-large": 74900 },
  "camping-car": { amarrage: 10900, cap: 27900, passerelle: 59900, "grand-large": 89900 },
  bateau: { amarrage: 12900, cap: 34900, passerelle: 74900, "grand-large": 109900 },
};

// Ebook lie par categorie. "ebook-electricite-van" existe deja et est vendu
// en boutique. "ebook-electricite-bateau" est une convention de nommage
// anticipant un futur produit : s'il n'existe pas encore dans le catalogue,
// l'octroi est simplement ignore sans erreur (voir seed + createDownloadGrantsForOrder,
// qui ne cree un grant que pour les assets reellement lies au produit achete).
const EBOOK_SLUG_BY_CATEGORIE: Record<PrestationsCategorie, string | null> = {
  van: "ebook-electricite-van",
  bateau: "ebook-electricite-bateau",
  "camping-car": null,
};

// Le libellé commercial dépend de l'univers (MASTER-08 §5) : `categorie`
// est donc requis, jamais déduit ou supposé. Ne jamais utiliser ce libellé
// comme identifiant fonctionnel — `palier` (paramètre) reste la seule clé
// stable.
export function getPalierLabel(categorie: PrestationsCategorie, palier: PrestationsPalier) {
  return PALIER_LABELS_BY_CATEGORIE[categorie][palier];
}

export function getCategorieLabel(categorie: PrestationsCategorie) {
  return CATEGORIE_LABELS[categorie];
}

export function getPrestationsPackPriceCents(
  categorie: PrestationsCategorie,
  palier: PrestationsPalier
) {
  return PRICES_CENTS[categorie][palier];
}

export function buildPrestationsPackSlug(
  palier: PrestationsPalier,
  categorie: PrestationsCategorie
) {
  return `${PRESTATIONS_PACK_SLUG_PREFIX}${palier}-${categorie}`;
}

export function isPrestationsPackSlug(slug: string) {
  return slug.startsWith(PRESTATIONS_PACK_SLUG_PREFIX);
}

// Regle stricte (Mission 3) : Amarrage ne donne jamais acces a un ebook ;
// Cap/Passerelle/Grand Large donnent acces a l'ebook de leur categorie
// s'il existe (van, bateau), jamais pour camping-car.
function resolveGrantsEbookSlug(
  palier: PrestationsPalier,
  categorie: PrestationsCategorie
): string | null {
  if (palier === "amarrage") {
    return null;
  }

  return EBOOK_SLUG_BY_CATEGORIE[categorie];
}

export function listPrestationsPackDefinitions(): PrestationsPackDefinition[] {
  const definitions: PrestationsPackDefinition[] = [];

  for (const categorie of PRESTATIONS_CATEGORIES) {
    for (const palier of PRESTATIONS_PALIERS) {
      definitions.push({
        slug: buildPrestationsPackSlug(palier, categorie),
        palier,
        categorie,
        name: `${getPalierLabel(categorie, palier)} — ${getCategorieLabel(categorie)}`,
        priceCents: getPrestationsPackPriceCents(categorie, palier),
        grantsEbookSlug: resolveGrantsEbookSlug(palier, categorie),
      });
    }
  }

  return definitions;
}

export function getPrestationsPackDefinitionBySlug(
  slug: string
): PrestationsPackDefinition | null {
  if (!isPrestationsPackSlug(slug)) {
    return null;
  }

  return listPrestationsPackDefinitions().find((def) => def.slug === slug) ?? null;
}

// Sens inverse : quels packs incluent tel ebook (utilise par la fiche
// boutique de l'ebook pour afficher "déjà inclus si tu prends...").
export function findPrestationsPackIncludingEbook(
  ebookSlug: string
): PrestationsPackDefinition | undefined {
  return listPrestationsPackDefinitions().find(
    (definition) => definition.grantsEbookSlug === ebookSlug
  );
}

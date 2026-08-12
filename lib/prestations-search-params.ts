import { PRESTATIONS_CATEGORIES, type PrestationsCategorie } from "@/lib/prestations-packs";

// UI-10 — extrait pour être réutilisé par les 3 pages /prestations,
// /prestations/accompagnement et /prestations/intervention (mission §16 :
// éviter la duplication) : résout un paramètre `?univers=` en catégorie
// réelle, jamais une valeur inventée.
export function resolvePrestationsCategorie(
  value: string | string[] | undefined
): PrestationsCategorie | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return PRESTATIONS_CATEGORIES.find((category) => category === raw);
}

export function prestationsUniversQuery(category: PrestationsCategorie | undefined) {
  return category ? `?univers=${category}` : "";
}

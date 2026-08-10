// Couche 4.0 (MASTER-11) : comparaison structurelle d'une valeur retenue,
// utilisée exclusivement par EngineRunner pour détecter si une proposition
// change réellement la donnée métier avant de propager une obsolescence
// (MASTER-06 §28-30). Ne compare jamais les métadonnées (horodatages,
// statut, source) — uniquement le contenu de `value`.

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Égalité structurelle récursive (objets, tableaux, primitives). */
export function isStructurallyEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }

    return a.every((item, index) => isStructurallyEqual(item, b[index]));
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    return keysA.every(
      (key) => Object.prototype.hasOwnProperty.call(b, key) && isStructurallyEqual(a[key], b[key])
    );
  }

  return false;
}

/** true si `next` diffère structurellement de `previous` (la valeur
 * métier a réellement changé, pas seulement un horodatage). */
export function hasValueChanged(previous: unknown, next: unknown): boolean {
  return !isStructurallyEqual(previous, next);
}

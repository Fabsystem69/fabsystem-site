// UI-12/UI-13 — statut d'un module moteur dérivé des valeurs retenues
// réelles du Project (namespace de la clé = namespace de l'id moteur).
// Utilisé à l'identique par la page serveur (calcul de "prochaine
// action"), le Mode Avancé et le Mode Guidé — extrait ici après UI-13
// pour éviter une 3e copie de la même fonction pure (aucune règle
// métier : uniquement une lecture des statuts déjà persistés par
// EngineRunner).
export type RetainedValueStatusLike = { key: string; status: string };

function namespaceOf(idOrKey: string) {
  return idOrKey.split(".")[0];
}

export function moduleStatus(engineId: string, retainedValues: RetainedValueStatusLike[]) {
  const ns = namespaceOf(engineId);
  const related = retainedValues.filter((rv) => namespaceOf(rv.key) === ns);
  if (related.length === 0) return "À compléter";
  if (related.some((rv) => rv.status === "OBSOLETE")) return "À recalculer";
  return "Retenu";
}

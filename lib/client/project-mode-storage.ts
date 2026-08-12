// UI-13 — persistance locale (navigateur uniquement) du mode d'affichage
// choisi pour un Project (Guidé / Avancé). Arbitrage explicite : pas de
// nouveau champ Prisma sur Project pour ça — c'est une préférence
// d'affichage, pas une donnée technique, et "même Project, mêmes
// données" (mission §2) reste garanti puisque rien n'est dupliqué côté
// serveur. Même pattern déjà utilisé dans ce dépôt pour le quiz Les Bases
// (components/QuizFormations.tsx) et le bilan de consommation
// (lib/calc/bilan-storage.ts). Clé par projectId : chaque Project garde
// son propre choix.
export type ProjectMode = "guided" | "advanced";

function storageKey(projectId: string) {
  return `fabsystem:project-mode:${projectId}`;
}

export function readProjectMode(projectId: string): ProjectMode | null {
  try {
    const raw = window.localStorage.getItem(storageKey(projectId));
    return raw === "guided" || raw === "advanced" ? raw : null;
  } catch {
    return null;
  }
}

export function writeProjectMode(projectId: string, mode: ProjectMode) {
  try {
    window.localStorage.setItem(storageKey(projectId), mode);
  } catch {
    // Stockage indisponible (navigation privée stricte, quota...) : le
    // choix ne persistera pas d'une visite à l'autre, mais l'UI reste
    // fonctionnelle (retombe sur l'écran de choix à la prochaine visite).
  }
}

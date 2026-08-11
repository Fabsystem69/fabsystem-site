// Persistance locale (navigateur uniquement) du dernier bilan de
// consommation calculé, pour que le calculateur "Autonomie batterie"
// puisse réutiliser ce résultat lorsqu'il est ouvert depuis sa propre
// page — UI-7.1 : avant cette mission, les deux calculateurs étaient
// montés simultanément sur la même page et communiquaient en mémoire
// (props). Avec une route dédiée par outil, ce lien direct n'existe plus ;
// localStorage assure la même continuité sans compte, sans serveur, sans
// Project (docs/masters/MASTER-05-OUTILS-PUBLICS.md §16 : "Le schéma
// public peut être sauvegardé automatiquement dans le navigateur... ne
// nécessite aucun compte ; n'est pas une sauvegarde serveur" — même
// principe appliqué ici au bilan). Même pattern déjà utilisé dans ce
// dépôt pour le quiz Les Bases (components/QuizFormations.tsx).
export type Appareil = { id: number; nom: string; puissance: string; heures: string };

export type BilanSnapshot = {
  appareils: Appareil[];
  tension: string;
  autonomie: string;
  totalWh: number;
};

const BILAN_STORAGE_KEY = "fabsystem-outils-bilan-conso";

export function readBilanSnapshot(): BilanSnapshot | null {
  try {
    const raw = window.localStorage.getItem(BILAN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BilanSnapshot;
    if (typeof parsed.totalWh !== "number" || !Array.isArray(parsed.appareils)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeBilanSnapshot(snapshot: BilanSnapshot) {
  try {
    window.localStorage.setItem(BILAN_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Stockage indisponible (navigation privée, quota…) : le calculateur
    // Bilan reste utilisable, seule la réutilisation depuis Autonomie
    // est perdue.
  }
}

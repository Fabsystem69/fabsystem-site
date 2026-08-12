// UI-13 §15 — visiteur non connecté qui clique "Sauvegarder dans un
// projet" depuis un outil public : l'outil reste gratuit et sans compte,
// on ne bloque rien. On garde le résultat du calcul le temps qu'il se
// connecte, puis on le lui propose à nouveau une fois connecté — sans le
// forcer à ressaisir. Purement navigateur (comme lib/calc/bilan-storage.ts
// et lib/client/guided-flow-storage.ts) : aucune donnée n'est envoyée au
// serveur tant que l'utilisateur n'a pas explicitement validé l'import
// (mission §16, le flux d'import reste identique une fois connecté).
export type PendingImportPayload = {
  kind: "energy" | "cable";
  sourceTool: string;
  createdAt: string;
  // Payload déjà traduit dans le vocabulaire du moteur cible (jamais les
  // champs bruts de l'outil) — voir lib/services/outils-project-bridge.ts.
  data: unknown;
};

const STORAGE_KEY = "fabsystem:pending-import";

export function readPendingImport(): PendingImportPayload | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingImportPayload>;
    if (
      (parsed.kind !== "energy" && parsed.kind !== "cable") ||
      typeof parsed.sourceTool !== "string" ||
      typeof parsed.createdAt !== "string"
    ) {
      return null;
    }
    return parsed as PendingImportPayload;
  } catch {
    return null;
  }
}

export function writePendingImport(payload: Omit<PendingImportPayload, "createdAt">) {
  try {
    const full: PendingImportPayload = { ...payload, createdAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch {
    // Si le stockage échoue, l'utilisateur devra simplement relancer le
    // calcul après connexion — dégradation silencieuse, jamais bloquante.
  }
}

export function clearPendingImport() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

// UI-13 — état du parcours guidé (mission §12 : "sauvegarde progressive",
// "le client doit pouvoir quitter/revenir/reprendre"). Le Project reste la
// source de vérité pour toute donnée technique (valeurs retenues,
// dépendances) — ce fichier ne stocke QUE de l'état d'interface propre au
// parcours guidé (étape courante, réponses de branchement), jamais une
// donnée métier dupliquée. Séparé de project-mode-storage.ts pour rester
// "minimal et clairement séparé des données techniques" (mission §12).
export type RechargeMethod = "alternator" | "solar" | "charger";

export type GuidedFlowState = {
  stepId: string;
  hasExistingBattery: "yes" | "no" | "unknown" | null;
  rechargeMethods: RechargeMethod[];
  rechargeUnknown: boolean;
};

const DEFAULT_STATE: GuidedFlowState = {
  stepId: "installation",
  hasExistingBattery: null,
  rechargeMethods: [],
  rechargeUnknown: false,
};

function storageKey(projectId: string) {
  return `fabsystem:guided-flow:${projectId}`;
}

export function readGuidedFlowState(projectId: string): GuidedFlowState {
  try {
    const raw = window.localStorage.getItem(storageKey(projectId));
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<GuidedFlowState>;
    return {
      stepId: typeof parsed.stepId === "string" ? parsed.stepId : DEFAULT_STATE.stepId,
      hasExistingBattery:
        parsed.hasExistingBattery === "yes" ||
        parsed.hasExistingBattery === "no" ||
        parsed.hasExistingBattery === "unknown"
          ? parsed.hasExistingBattery
          : null,
      rechargeMethods: Array.isArray(parsed.rechargeMethods) ? parsed.rechargeMethods : [],
      rechargeUnknown: Boolean(parsed.rechargeUnknown),
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function writeGuidedFlowState(projectId: string, state: GuidedFlowState) {
  try {
    window.localStorage.setItem(storageKey(projectId), JSON.stringify(state));
  } catch {
    // Navigation privée stricte / quota dépassé : l'état ne persiste pas
    // d'une visite à l'autre, le parcours reste utilisable dans la
    // session en cours.
  }
}

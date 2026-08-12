"use client";

import { writeProjectMode, type ProjectMode } from "@/lib/client/project-mode-storage";

// UI-13 §3 — "Le choix doit être réversible depuis le Project." Petit
// interrupteur à deux positions visible dans l'en-tête du Project, dans
// les deux modes. `onSwitch` est optionnel : quand il est fourni (rendu
// depuis ProjectModeGate, qui contrôle l'état), l'affichage change
// immédiatement sans recharger la page.
export function ModeSwitch({
  projectId,
  current,
  onSwitch,
}: {
  projectId: string;
  current: ProjectMode;
  onSwitch?: (mode: ProjectMode) => void;
}) {
  function switchTo(mode: ProjectMode) {
    if (mode === current) return;
    writeProjectMode(projectId, mode);
    onSwitch?.(mode);
  }

  return (
    <div
      role="group"
      aria-label="Mode d'affichage du projet"
      className="inline-flex shrink-0 rounded-full border border-neutral-200 bg-neutral-50 p-0.5 text-xs font-semibold"
    >
      <button
        type="button"
        onClick={() => switchTo("guided")}
        aria-pressed={current === "guided"}
        className={`rounded-full px-3 py-1.5 transition-colors ${
          current === "guided" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
        }`}
      >
        Guidé
      </button>
      <button
        type="button"
        onClick={() => switchTo("advanced")}
        aria-pressed={current === "advanced"}
        className={`rounded-full px-3 py-1.5 transition-colors ${
          current === "advanced" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
        }`}
      >
        Avancé
      </button>
    </div>
  );
}

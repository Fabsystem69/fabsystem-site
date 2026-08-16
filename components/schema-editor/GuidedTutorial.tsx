"use client";

import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { useGuidedStep, useGuidedAutoAdvance, useGuidedMismatch } from "@/lib/schema-editor/useGuidedStep";
import { VoltaAvatar } from "@/components/volta/VoltaAvatar";

// Bandeau flottant du mode guidé (retour utilisateur : "mode guidé étape
// par étape", puis "explique les fonctions principales en même temps, un
// vrai tutorial") — volontairement non bloquant (pas de fond assombri
// plein écran comme SizingPopup/ModelPickerModal) : le canvas et la
// bibliothèque restent utilisables normalement pendant le tutoriel, Volta
// reste secondaire par rapport à l'information (docs/masters/
// MASTER-07-VOLTA-SUIVI.md §46).
export function GuidedTutorial() {
  const darkMode = useSchemaStore((s) => s.darkMode);
  const exitGuidedMode = useSchemaStore((s) => s.exitGuidedMode);
  const advanceGuidedStep = useSchemaStore((s) => s.advanceGuidedStep);
  const retreatGuidedStep = useSchemaStore((s) => s.retreatGuidedStep);
  const info = useGuidedStep();
  useGuidedAutoAdvance();
  const mismatch = useGuidedMismatch();

  if (!info.active) return null;
  const { step, index, total, isLast } = info;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div
        className={`pointer-events-auto flex w-full max-w-lg items-start gap-3 rounded-xl border p-3.5 shadow-lg ${
          darkMode ? "border-neutral-700 bg-neutral-900" : "border-neutral-200 bg-white"
        }`}
      >
        <VoltaAvatar pose={mismatch ? "perplexe" : (step.pose ?? "neutre")} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {index > 0 ? (
                <button
                  type="button"
                  onClick={retreatGuidedStep}
                  title="Étape précédente"
                  className={`text-[11px] ${darkMode ? "text-neutral-500 hover:text-neutral-300" : "text-neutral-400 hover:text-neutral-600"}`}
                >
                  ← Précédente
                </button>
              ) : null}
              {step.type === "task" && !isLast ? (
                <button
                  type="button"
                  onClick={advanceGuidedStep}
                  title="Passer à l'étape suivante sans attendre"
                  className={`text-[11px] ${darkMode ? "text-neutral-500 hover:text-neutral-300" : "text-neutral-400 hover:text-neutral-600"}`}
                >
                  Suivante →
                </button>
              ) : null}
              <p className={`text-[11px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                Mode guidé — étape {index + 1}/{total}
              </p>
            </div>
            <button
              type="button"
              onClick={exitGuidedMode}
              className={`shrink-0 text-[11px] underline-offset-2 hover:underline ${darkMode ? "text-neutral-500 hover:text-neutral-300" : "text-neutral-400 hover:text-neutral-600"}`}
            >
              Quitter le mode guidé
            </button>
          </div>
          <p className={`mt-1 text-sm leading-relaxed ${darkMode ? "text-neutral-100" : "text-neutral-800"}`}>{step.instruction}</p>
          {mismatch ? (
            <p className={`mt-1.5 rounded-md px-2 py-1.5 text-sm leading-relaxed ${darkMode ? "bg-amber-950/40 text-amber-200" : "bg-amber-50 text-amber-800"}`}>
              {mismatch}
            </p>
          ) : null}
          {step.type === "explain" ? (
            <button
              type="button"
              onClick={isLast ? exitGuidedMode : advanceGuidedStep}
              className={`mt-2.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-base ${
                darkMode ? "bg-emerald-500 text-neutral-950 hover:bg-emerald-400" : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {step.cta}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

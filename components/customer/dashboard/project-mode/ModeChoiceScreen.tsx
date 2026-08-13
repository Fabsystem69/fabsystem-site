"use client";

import { Card } from "@/components/ui/Card";
import type { ProjectMode } from "@/lib/client/project-mode-storage";

// UI-13 §3 — écran affiché au premier accès à un Project (aucun choix
// encore mémorisé). Le mode guidé est visuellement recommandé (bordure
// jaune, badge), sans jamais enfermer l'utilisateur : les deux options
// restent réversibles depuis le Project (ModeSwitch).
export function ModeChoiceScreen({ onChoose }: { onChoose: (mode: ProjectMode) => void }) {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
        Comment souhaitez-vous avancer ?
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Vous pourrez changer d&apos;avis à tout moment depuis votre projet.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChoose("guided")}
          className="relative flex flex-col items-start rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 text-left shadow-card transition-colors hover:bg-brand-100"
        >
          <span className="absolute -top-3 left-5 rounded-full bg-brand-400 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-900">
            Recommandé
          </span>
          <h2 className="mt-1 text-lg font-bold text-neutral-950">Être guidé</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            FabSystem me pose les bonnes questions étape par étape.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-neutral-900">
            Commencer <span aria-hidden="true">→</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChoose("advanced")}
          className="flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-6 text-left shadow-card transition-colors hover:border-neutral-400"
        >
          <h2 className="text-lg font-bold text-neutral-950">Mode avancé</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            Je préfère accéder directement aux données techniques.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-neutral-900">
            Ouvrir le mode avancé <span aria-hidden="true">→</span>
          </span>
        </button>
      </div>

      <Card className="mt-6 p-4">
        <p className="text-xs text-neutral-500">
          Les deux modes travaillent sur le même projet, avec les mêmes données. Rien n&apos;est
          dupliqué ni perdu en changeant de mode.
        </p>
      </Card>
    </div>
  );
}

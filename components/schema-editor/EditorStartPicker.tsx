"use client";

import { useEffect, useState } from "react";
import type { DraftEnvelope } from "@/features/schemas/storage/localDraftStorage";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";
import { TemplatePickerDialog } from "./TemplatePickerDialog";
import { InlineSignupForm } from "./InlineSignupForm";

type GuestSelection = { kind: "structured" | "blank" | "template"; templateId?: string };

// Retour utilisateur : "je veux une invite explicite de création de compte
// même en gratuit... enfin on pousse principalement à l'inscription" —
// avant, un visiteur anonyme passait directement en mode invité avec une
// simple phrase discrète en bas de la popup (qui, en plus, chevauchait le
// bouton Annuler sur petit écran). Le clic sur le choix principal ouvre
// maintenant ce popup d'inscription ; "Continuer sans compte" (volontairement
// discret, en petit texte) reste le seul moyen d'atteindre encore le mode
// invité — jamais supprimé, juste plus difficile à rater que l'inscription.
function AccountPromptModal({
  darkMode,
  onSignupSuccess,
  onContinueAsGuest,
  onClose,
}: {
  darkMode: boolean;
  onSignupSuccess: () => void;
  onContinueAsGuest: () => void;
  onClose: () => void;
}) {
  useEscapeToClose(onClose);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${darkMode ? "border-neutral-800 bg-neutral-950 text-neutral-100" : "border-neutral-200 bg-white text-neutral-900"}`}
      >
        <h2 className="text-lg font-bold">Créez votre compte gratuit</h2>
        <p className={`mt-1.5 text-sm leading-relaxed ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>
          Retrouvez votre schéma plus tard, sur n&apos;importe quel appareil. Gratuit, aucune carte requise.
        </p>
        <div className="mt-4">
          <InlineSignupForm darkMode={darkMode} onSuccess={onSignupSuccess} />
        </div>
        <button
          type="button"
          onClick={onContinueAsGuest}
          className={`mt-4 block w-full text-center text-xs underline-offset-2 hover:underline ${darkMode ? "text-neutral-600" : "text-neutral-400"}`}
        >
          Continuer sans compte
        </button>
      </div>
    </div>
  );
}

// L'ouverture de l'éditeur et le sélecteur de modèles partagent exactement
// la même expérience : catégories à gauche, aperçu central et détail du
// modèle à droite. Le visiteur peut regarder et ouvrir une découverte, mais
// elle n'est pas enregistrée sans compte.
export function EditorStartPicker({
  draft,
  darkMode,
  isLoggedIn,
  onChooseContinue,
  onChooseTemplate,
  onChooseBlank,
  onGuestPreview,
  onSignupSuccess,
}: {
  draft: DraftEnvelope | null;
  darkMode: boolean;
  isLoggedIn: boolean;
  onChooseContinue: () => void;
  onChooseTemplate: (id: string) => void;
  onChooseBlank: () => void;
  onChooseGuided: () => void;
  onGuestPreview: (selection: GuestSelection) => void;
  onSignupSuccess: () => void;
}) {
  const [pendingSelection, setPendingSelection] = useState<GuestSelection | null>(null);
  useEscapeToClose(draft ? onChooseContinue : onChooseBlank);

  // Se déclenche une fois l'inscription confirmée (isLoggedIn passe à true
  // via le parent) : reprend exactement la sélection que le visiteur avait
  // choisie avant qu'on lui propose de créer un compte.
  useEffect(() => {
    if (!isLoggedIn || !pendingSelection) return;
    if (pendingSelection.kind === "template" && pendingSelection.templateId) {
      onChooseTemplate(pendingSelection.templateId);
    } else {
      onChooseBlank();
    }
    setPendingSelection(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  return (
    <>
      <TemplatePickerDialog
        onClose={draft ? onChooseContinue : onChooseBlank}
        startOptions={{
          draft,
          isLoggedIn,
          onChooseContinue,
          onChooseTemplate: (templateId) => {
            if (isLoggedIn) onChooseTemplate(templateId);
            else setPendingSelection({ kind: "template", templateId });
          },
          onChooseStructured: () => {
            if (isLoggedIn) onChooseBlank();
            else setPendingSelection({ kind: "structured" });
          },
          onChooseBlank: () => {
            if (isLoggedIn) onChooseBlank();
            else setPendingSelection({ kind: "blank" });
          },
        }}
      />
      {pendingSelection ? (
        <AccountPromptModal
          darkMode={darkMode}
          onSignupSuccess={onSignupSuccess}
          onContinueAsGuest={() => {
            onGuestPreview(pendingSelection);
            setPendingSelection(null);
          }}
          onClose={() => setPendingSelection(null)}
        />
      ) : null}
    </>
  );
}

"use client";

import type { DraftEnvelope } from "@/features/schemas/storage/localDraftStorage";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";
import { TemplatePickerDialog } from "./TemplatePickerDialog";

// L'ouverture de l'éditeur et le sélecteur de modèles partagent exactement
// la même expérience : catégories à gauche, aperçu central et détail du
// modèle à droite. Le visiteur peut regarder et ouvrir une découverte, mais
// elle n'est pas enregistrée sans compte.
export function EditorStartPicker({
  draft,
  isLoggedIn,
  onChooseContinue,
  onChooseTemplate,
  onChooseBlank,
  onGuestPreview,
}: {
  draft: DraftEnvelope | null;
  darkMode: boolean;
  isLoggedIn: boolean;
  onChooseContinue: () => void;
  onChooseTemplate: (id: string) => void;
  onChooseBlank: () => void;
  onChooseGuided: () => void;
  onGuestPreview: (selection: { kind: "structured" | "blank" | "template"; templateId?: string }) => void;
  onSignupSuccess: () => void;
}) {
  useEscapeToClose(draft ? onChooseContinue : onChooseBlank);

  return (
    <TemplatePickerDialog
      onClose={draft ? onChooseContinue : onChooseBlank}
      startOptions={{
        draft,
        isLoggedIn,
        onChooseContinue,
        onChooseTemplate: (templateId) => {
          if (isLoggedIn) onChooseTemplate(templateId);
          else onGuestPreview({ kind: "template", templateId });
        },
        onChooseStructured: () => {
          if (isLoggedIn) onChooseBlank();
          else onGuestPreview({ kind: "structured" });
        },
        onChooseBlank: () => {
          if (isLoggedIn) onChooseBlank();
          else onGuestPreview({ kind: "blank" });
        },
      }}
    />
  );
}

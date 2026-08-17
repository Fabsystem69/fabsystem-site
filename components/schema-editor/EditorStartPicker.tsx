"use client";

import { SCHEMA_TEMPLATES } from "@/features/schemas/templates";
import type { DraftEnvelope } from "@/features/schemas/storage/localDraftStorage";
import { VoltaAvatar } from "@/components/volta/VoltaAvatar";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";

// Écran de démarrage guidé (V2, retour utilisateur : "le choix des
// gabarits n'est pas ergonomique, il faut être guidé à l'ouverture") —
// avant, l'éditeur reprenait silencieusement le brouillon local sans
// prévenir, et les gabarits n'étaient découvrables qu'en ouvrant le menu
// Fichier. Ici, trois chemins explicites au démarrage : continuer le
// brouillon existant (si présent), partir d'un gabarit, ou page blanche —
// inspiré du "Get started" de Wireframe, adapté sans questionnaire guidé
// (pas demandé, pas nécessaire pour 5 gabarits).
export function EditorStartPicker({
  draft,
  darkMode,
  onChooseContinue,
  onChooseTemplate,
  onChooseBlank,
  onChooseGuided,
}: {
  draft: DraftEnvelope | null;
  darkMode: boolean;
  onChooseContinue: () => void;
  onChooseTemplate: (id: string) => void;
  onChooseBlank: () => void;
  onChooseGuided: () => void;
}) {
  // Retour utilisateur : "le premier popup d'ouverture toujours pas
  // fermable avec échap" — pas de croix ni de clic sur le fond ici
  // (contrairement aux autres popups) car il n'y a rien "derrière" à
  // reprendre sans choix explicite : Échap revient donc au choix le moins
  // destructif — reprendre le brouillon existant s'il y en a un, sinon
  // partir d'une page blanche.
  useEscapeToClose(draft ? onChooseContinue : onChooseBlank);

  // Pas de h-full ici : les cartes de gabarits (dans une grille) s'étirent
  // déjà à hauteur égale via le comportement par défaut de CSS Grid — un
  // h-full aurait aussi affecté la carte « Reprendre », hors grille, qui se
  // serait alors étirée sur toute la hauteur de l'écran (bug constaté).
  const cardClass = `flex flex-col rounded-xl border p-4 text-left transition-base ${
    darkMode
      ? "border-neutral-700 bg-neutral-900 hover:border-neutral-500 hover:bg-neutral-800"
      : "border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50"
  }`;

  return (
    // V2, retour utilisateur : popup par-dessus l'éditeur (qui reste visible
    // en fond, canvas vide) plutôt qu'un écran qui remplace toute la page —
    // même esprit qu'une boîte de dialogue de démarrage, l'éditeur "derrière"
    // rend la transition vers le choix fait moins abrupte.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className={`flex max-h-[85vh] w-full max-w-3xl flex-col overflow-y-auto rounded-2xl border p-6 shadow-2xl sm:p-8 ${
          darkMode ? "border-neutral-800 bg-neutral-950" : "border-neutral-200 bg-white"
        }`}
      >
        <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>Schéma électrique</p>
        <h1 className={`mt-1 text-2xl font-bold ${darkMode ? "text-neutral-50" : "text-neutral-950"}`}>Comment voulez-vous commencer ?</h1>

        {draft ? (
          <button type="button" onClick={onChooseContinue} className={`mt-6 w-full ${cardClass}`}>
            <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-brand-400" : "text-brand-600"}`}>Reprendre</span>
            <span className={`mt-1 text-lg font-bold ${darkMode ? "text-neutral-50" : "text-neutral-950"}`}>{draft.projectName || "Mon schéma"}</span>
            <span className={`mt-1 text-sm ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
              {draft.nodes.length} composant{draft.nodes.length > 1 ? "s" : ""} · modifié le {new Date(draft.updatedAt).toLocaleDateString("fr-FR")}
            </span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={onChooseGuided}
          className={`mt-6 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-base ${
            darkMode
              ? "border-emerald-800 bg-emerald-950/30 hover:border-emerald-600 hover:bg-emerald-950/50"
              : "border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100/70"
          }`}
        >
          <VoltaAvatar pose="confiante" size={44} />
          <span className="min-w-0">
            <span className={`block text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>
              Recommandé pour débuter
            </span>
            <span className={`block text-base font-bold ${darkMode ? "text-neutral-50" : "text-neutral-950"}`}>Mode guidé, pas à pas avec Volta</span>
            <span className={`block text-sm ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>
              Construis un premier schéma simple (batterie, coupe-circuit, distributeur, éclairage, prise USB) en étant guidé à chaque étape.
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onChooseBlank}
          className={`mt-3 w-full rounded-xl border border-dashed px-4 py-4 text-center text-sm font-semibold transition-base ${
            darkMode
              ? "border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
              : "border-neutral-300 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
          }`}
        >
          Page blanche — je construis tout moi-même
        </button>

        <p className={`mb-3 mt-8 text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
          Partir d&apos;un gabarit
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SCHEMA_TEMPLATES.map((template) => (
            <button key={template.id} type="button" onClick={() => onChooseTemplate(template.id)} className={cardClass}>
              <span className={`text-base font-bold ${darkMode ? "text-neutral-50" : "text-neutral-950"}`}>{template.label}</span>
              <span className={`mt-1 flex-1 text-sm leading-relaxed ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>{template.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

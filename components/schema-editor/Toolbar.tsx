"use client";

import Link from "next/link";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { ExportMenu } from "./ExportMenu";
import { FeedbackMenu } from "./FeedbackMenu";
import { CategoryFilterMenu } from "./CategoryFilterMenu";

// Barre supérieure (CDC §6) : nom projet éditable, Nouveau, Annuler/Rétablir,
// indicateur d'enregistrement discret (pas de notification intrusive, §35).
export function Toolbar() {
  const projectName = useSchemaStore((s) => s.projectName);
  const setProjectName = useSchemaStore((s) => s.setProjectName);
  const nodesCount = useSchemaStore((s) => s.nodes.length);
  const past = useSchemaStore((s) => s.past);
  const future = useSchemaStore((s) => s.future);
  const undo = useSchemaStore((s) => s.undo);
  const redo = useSchemaStore((s) => s.redo);
  const newProject = useSchemaStore((s) => s.newProject);
  const loadExample = useSchemaStore((s) => s.loadExample);
  const autoLayout = useSchemaStore((s) => s.autoLayout);
  const saveStatus = useSchemaStore((s) => s.saveStatus);
  const iconStyle = useSchemaStore((s) => s.iconStyle);
  const setIconStyle = useSchemaStore((s) => s.setIconStyle);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const setDarkMode = useSchemaStore((s) => s.setDarkMode);

  function handleNewProject() {
    if (nodesCount > 0 && !window.confirm("Repartir d'un schéma vierge ? Le schéma actuel restera sauvegardé jusqu'à la prochaine modification.")) {
      return;
    }
    newProject();
  }

  function handleLoadExample() {
    if (nodesCount > 0 && !window.confirm("Charger l'exemple à la place du schéma actuel ? Le schéma actuel restera sauvegardé jusqu'à la prochaine modification.")) {
      return;
    }
    loadExample();
  }

  return (
    <header
      className={`flex h-14 shrink-0 items-center gap-3 border-b px-4 ${
        darkMode ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white"
      }`}
    >
      <Link
        href="/outils"
        className={`text-sm font-medium transition-base ${darkMode ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-neutral-900"}`}
      >
        ← Outils
      </Link>
      <span className={darkMode ? "text-neutral-700" : "text-neutral-300"}>|</span>
      <span className={`text-sm font-semibold ${darkMode ? "text-white" : "text-neutral-900"}`}>FabSystem Schéma</span>

      <input
        type="text"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className={`ml-2 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium focus:outline-none ${
          darkMode
            ? "text-neutral-100 hover:border-neutral-700 focus:border-neutral-400"
            : "text-neutral-800 hover:border-neutral-200 focus:border-neutral-900"
        }`}
        aria-label="Nom du schéma"
      />

      <div className="ml-auto flex items-center gap-1.5">
        <div
          className={`flex rounded-md border p-0.5 text-xs font-medium ${darkMode ? "border-neutral-700" : "border-neutral-300"}`}
          role="group"
          aria-label="Style des icônes"
          title="Symboles : pictogrammes électriques épurés. Illustrations : rendus réalistes des composants."
        >
          <button
            type="button"
            onClick={() => setIconStyle("simple")}
            className={`rounded px-2.5 py-1 transition-base ${
              iconStyle === "simple"
                ? darkMode
                  ? "bg-white text-neutral-900"
                  : "bg-neutral-900 text-white"
                : darkMode
                  ? "text-neutral-400 hover:bg-neutral-800"
                  : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Symboles
          </button>
          <button
            type="button"
            onClick={() => setIconStyle("pro")}
            className={`rounded px-2.5 py-1 transition-base ${
              iconStyle === "pro"
                ? darkMode
                  ? "bg-white text-neutral-900"
                  : "bg-neutral-900 text-white"
                : darkMode
                  ? "text-neutral-400 hover:bg-neutral-800"
                  : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Illustrations
          </button>
        </div>

        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? "Passer en vue jour" : "Passer en vue nuit"}
          className={`rounded-md border px-2.5 py-1.5 text-sm transition-base ${
            darkMode ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800" : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          {darkMode ? "☀︎" : "☾"}
        </button>

        <ToolbarButton darkMode={darkMode} onClick={handleNewProject}>
          Nouveau
        </ToolbarButton>
        <ToolbarButton darkMode={darkMode} onClick={handleLoadExample} title="Charger un exemple de schéma pour s'en inspirer">
          Exemple
        </ToolbarButton>
        <ToolbarButton
          darkMode={darkMode}
          onClick={autoLayout}
          disabled={nodesCount === 0}
          title="Réorganise automatiquement les composants en un bloc compact, sans toucher aux connexions"
        >
          Organiser
        </ToolbarButton>
        <ToolbarButton darkMode={darkMode} onClick={undo} disabled={past.length === 0} title="Annuler (Ctrl/Cmd+Z)">
          ↶
        </ToolbarButton>
        <ToolbarButton darkMode={darkMode} onClick={redo} disabled={future.length === 0} title="Rétablir (Ctrl/Cmd+Shift+Z)">
          ↷
        </ToolbarButton>

        <CategoryFilterMenu darkMode={darkMode} />
        <ExportMenu darkMode={darkMode} />
        <FeedbackMenu darkMode={darkMode} />

        <span className={`ml-2 min-w-[6.5rem] text-right text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
          {saveStatus === "saving" ? "Enregistrement…" : "Enregistré"}
        </span>
      </div>
    </header>
  );
}

function ToolbarButton({
  darkMode,
  onClick,
  disabled,
  title,
  children,
}: {
  darkMode: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-base disabled:cursor-not-allowed disabled:opacity-40 ${
        darkMode ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800" : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      {children}
    </button>
  );
}

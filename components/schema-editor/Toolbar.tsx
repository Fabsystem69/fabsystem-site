"use client";

import Link from "next/link";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { ExportMenu } from "./ExportMenu";
import { FeedbackMenu } from "./FeedbackMenu";
import { FileMenu } from "./FileMenu";
import { DarkModeToggle } from "./DisplayMenu";

// Barre supérieure (CDC §6) : nom projet éditable, Nouveau, Annuler/Rétablir,
// indicateur d'enregistrement discret (pas de notification intrusive, §35).
export function Toolbar() {
  const projectName = useSchemaStore((s) => s.projectName);
  const setProjectName = useSchemaStore((s) => s.setProjectName);
  const past = useSchemaStore((s) => s.past);
  const future = useSchemaStore((s) => s.future);
  const undo = useSchemaStore((s) => s.undo);
  const redo = useSchemaStore((s) => s.redo);
  const saveStatus = useSchemaStore((s) => s.saveStatus);
  const saveMessage = useSchemaStore((s) => s.saveMessage);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const autoLayout = useSchemaStore((s) => s.autoLayout);
  const nodeCount = useSchemaStore((s) => s.nodes.filter((n) => n.type !== "zone").length);

  const saveToneClass =
    saveStatus === "error"
      ? darkMode
        ? "text-amber-300"
        : "text-amber-700"
      : saveStatus === "saving"
        ? darkMode
          ? "text-sky-300"
          : "text-sky-700"
        : darkMode
          ? "text-emerald-300"
          : "text-emerald-700";

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
        <DarkModeToggle darkMode={darkMode} />

        <FileMenu darkMode={darkMode} />
        <ToolbarButton darkMode={darkMode} onClick={undo} disabled={past.length === 0} title="Annuler (Ctrl/Cmd+Z)">
          ↶
        </ToolbarButton>
        <ToolbarButton darkMode={darkMode} onClick={redo} disabled={future.length === 0} title="Rétablir (Ctrl/Cmd+Shift+Z)">
          ↷
        </ToolbarButton>

        <ToolbarButton
          darkMode={darkMode}
          onClick={autoLayout}
          disabled={nodeCount === 0}
          title="Réorganise automatiquement les composants : les espace proprement dans chaque zone et entre les zones (Ctrl/Cmd+Z pour annuler)"
        >
          ▦ Organiser
        </ToolbarButton>

        <ExportMenu darkMode={darkMode} />
        <FeedbackMenu darkMode={darkMode} />

        <span className={`ml-2 max-w-[13rem] text-right text-xs ${saveToneClass}`} title={saveMessage}>
          {saveMessage}
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

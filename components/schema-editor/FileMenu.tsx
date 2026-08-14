"use client";

import { useEffect, useRef, useState } from "react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";

// Regroupe Nouveau / Exemple / Organiser (retour utilisateur : "il commence
// à avoir beaucoup d'onglets sur le panneau principal") — trois actions
// ponctuelles sur le schéma entier, peu utilisées d'affilée, qui n'ont pas
// besoin de rester visibles en permanence contrairement à Filtrer/Exporter.
export function FileMenu({ darkMode }: { darkMode: boolean }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesCount = useSchemaStore((s) => s.nodes.length);
  const newProject = useSchemaStore((s) => s.newProject);
  const loadExample = useSchemaStore((s) => s.loadExample);
  const autoLayout = useSchemaStore((s) => s.autoLayout);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleNewProject() {
    if (nodesCount > 0 && !window.confirm("Repartir d'un schéma vierge ? Le schéma actuel restera sauvegardé jusqu'à la prochaine modification.")) {
      return;
    }
    newProject();
    setOpen(false);
  }

  function handleLoadExample() {
    if (nodesCount > 0 && !window.confirm("Charger l'exemple à la place du schéma actuel ? Le schéma actuel restera sauvegardé jusqu'à la prochaine modification.")) {
      return;
    }
    loadExample();
    setOpen(false);
  }

  function handleAutoLayout() {
    autoLayout();
    setOpen(false);
  }

  const itemClass = `block w-full px-3 py-1.5 text-left text-sm transition-base disabled:cursor-not-allowed disabled:opacity-40 ${
    darkMode ? "text-neutral-200 hover:bg-neutral-800" : "text-neutral-700 hover:bg-neutral-100"
  }`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-base ${
          darkMode ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800" : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
        }`}
      >
        Fichier
      </button>
      {open ? (
        <div
          className={`absolute right-0 top-full z-10 mt-1 w-56 rounded-md border py-1 shadow-lg ${
            darkMode ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-white"
          }`}
        >
          <button type="button" onClick={handleNewProject} className={itemClass}>
            Nouveau
          </button>
          <button type="button" onClick={handleLoadExample} className={itemClass} title="Charger un exemple de schéma pour s'en inspirer">
            Exemple
          </button>
          <div className={`my-1 border-t ${darkMode ? "border-neutral-700" : "border-neutral-100"}`} />
          <button
            type="button"
            onClick={handleAutoLayout}
            disabled={nodesCount === 0}
            className={itemClass}
            title="Réorganise automatiquement les composants en un bloc compact, sans toucher aux connexions"
          >
            Organiser
          </button>
        </div>
      ) : null}
    </div>
  );
}

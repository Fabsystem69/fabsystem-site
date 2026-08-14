"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { getComponentDefinition, CATEGORY_LABELS } from "@/lib/electrical-components/definitions";

// Isolement par catégorie (retour utilisateur : "isoler le circuit MPPT ou
// consommateur pour éviter d'avoir toujours tout le schéma") — masque des
// catégories entières du canvas, ce qui restreint aussi les exports (PNG,
// PDF, liste de matériel) à ce qui reste visible, puisqu'ils lisent l'état
// React Flow affiché (voir Canvas.tsx). Pas un vrai isolement par
// sous-réseau électrique connecté : plus simple à comprendre et à utiliser
// pour un débutant, quitte à être moins précis.
export function CategoryFilterMenu({ darkMode }: { darkMode: boolean }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodes = useSchemaStore((s) => s.nodes);
  const hiddenCategories = useSchemaStore((s) => s.hiddenCategories);
  const toggleCategoryVisibility = useSchemaStore((s) => s.toggleCategoryVisibility);
  const showAllCategories = useSchemaStore((s) => s.showAllCategories);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Seulement les catégories présentes dans le schéma actuel, avec leur
  // nombre de composants — inutile de proposer de filtrer une catégorie
  // vide.
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const node of nodes) {
      const def = getComponentDefinition(node.data.componentType);
      if (!def) continue;
      counts.set(def.category, (counts.get(def.category) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count, label: CATEGORY_LABELS[category] ?? category }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [nodes]);

  const isFiltered = hiddenCategories.length > 0;

  if (categoryCounts.length === 0) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Afficher seulement certaines catégories de composants — restreint aussi les exports"
        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-base ${
          isFiltered
            ? darkMode
              ? "border-amber-500/60 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              : "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100"
            : darkMode
              ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
              : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
        }`}
      >
        Filtrer{isFiltered ? ` (${categoryCounts.length - hiddenCategories.length}/${categoryCounts.length})` : ""}
      </button>
      {open ? (
        <div
          className={`absolute right-0 top-full z-10 mt-1 w-64 rounded-md border py-1 shadow-lg ${
            darkMode ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-white"
          }`}
        >
          <div className={`flex items-center justify-between px-3 py-1.5 text-xs ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
            <span>Catégories affichées</span>
            {isFiltered ? (
              <button type="button" onClick={showAllCategories} className={darkMode ? "text-amber-300 hover:underline" : "text-amber-700 hover:underline"}>
                Tout afficher
              </button>
            ) : null}
          </div>
          <div className={`my-1 border-t ${darkMode ? "border-neutral-700" : "border-neutral-100"}`} />
          {categoryCounts.map(({ category, count, label }) => {
            const hidden = hiddenCategories.includes(category);
            return (
              <label
                key={category}
                className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-sm transition-base ${
                  darkMode ? "text-neutral-200 hover:bg-neutral-700/50" : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!hidden}
                    onChange={() => toggleCategoryVisibility(category)}
                    className="rounded border-neutral-300"
                  />
                  {label}
                </span>
                <span className={`text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{count}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

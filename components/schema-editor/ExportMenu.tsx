"use client";

import { useEffect, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { captureSchemaPng, downloadDataUrl, openPrintablePdf, openPrintableBom, slugify } from "@/features/schemas/export";
import { computeBom } from "@/lib/electrical-components/bom";

// Export PNG / PDF / liste de matériel (CDC §36-40) : capture uniquement le
// canvas, jamais une capture d'écran de l'éditeur avec ses boutons.
export function ExportMenu({ darkMode }: { darkMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { getNodes, getEdges } = useReactFlow();
  const projectName = useSchemaStore((s) => s.projectName);
  const nodesCount = useSchemaStore((s) => s.nodes.length);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleExport(kind: "png" | "pdf") {
    setBusy(true);
    try {
      const dataUrl = await captureSchemaPng(getNodes(), projectName, showGrid);
      if (!dataUrl) return;
      if (kind === "png") downloadDataUrl(dataUrl, `${slugify(projectName)}.png`);
      else openPrintablePdf(dataUrl, projectName);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  function handleExportBom() {
    setOpen(false);
    const bom = computeBom(getNodes(), getEdges());
    openPrintableBom(bom, projectName);
  }

  const itemClass = `block w-full px-3 py-1.5 text-left text-sm transition-base ${
    darkMode ? "text-neutral-200 hover:bg-neutral-800" : "text-neutral-700 hover:bg-neutral-100"
  }`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={nodesCount === 0 || busy}
        title={nodesCount === 0 ? "Ajoutez au moins un composant pour exporter" : undefined}
        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-base disabled:cursor-not-allowed disabled:opacity-40 ${
          darkMode ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800" : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
        }`}
      >
        {busy ? "Export…" : "Exporter"}
      </button>
      {open ? (
        <div
          className={`absolute right-0 top-full z-10 mt-1 w-56 rounded-md border py-1 shadow-lg ${
            darkMode ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-white"
          }`}
        >
          <label className={`flex items-center gap-2 px-3 py-1.5 text-xs ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="rounded border-neutral-300" />
            Inclure la grille
          </label>
          <div className={`my-1 border-t ${darkMode ? "border-neutral-700" : "border-neutral-100"}`} />
          <button type="button" onClick={() => handleExport("png")} className={itemClass}>
            Image PNG
          </button>
          <button type="button" onClick={() => handleExport("pdf")} className={itemClass}>
            PDF
          </button>
          <div className={`my-1 border-t ${darkMode ? "border-neutral-700" : "border-neutral-100"}`} />
          <button type="button" onClick={handleExportBom} className={itemClass}>
            Liste de matériel
          </button>
        </div>
      ) : null}
    </div>
  );
}

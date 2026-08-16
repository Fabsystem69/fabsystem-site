"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useReactFlow } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { useGuidedStep } from "@/lib/schema-editor/useGuidedStep";
import {
  captureSchemaPng,
  captureSchemaSvg,
  captureSchemaCarousel,
  downloadDataUrl,
  downloadCarouselZip,
  openPrintablePdf,
  openPrintableBom,
  slugify,
} from "@/features/schemas/export";
import { computeBom } from "@/lib/electrical-components/bom";

// Export PNG / PDF / liste de matériel (CDC §36-40) : capture uniquement le
// canvas, jamais une capture d'écran de l'éditeur avec ses boutons.
export function ExportMenu({ darkMode }: { darkMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  // Isolement par zone (retour utilisateur : "isoler uniquement la zone pour
  // les imprimer, beaucoup plus intelligent que par famille") — `null` =
  // tout le schéma, comportement inchangé.
  const [zoneId, setZoneId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { getNodes, getEdges } = useReactFlow();
  const projectName = useSchemaStore((s) => s.projectName);
  const nodesCount = useSchemaStore((s) => s.nodes.length);
  const setExportIsolatedZoneId = useSchemaStore((s) => s.setExportIsolatedZoneId);
  // Mode guidé (retour utilisateur : "montre à la fin le mode jour nuit et
  // le pdf") — mis en avant à la toute dernière étape.
  const guided = useGuidedStep();
  const spotlight = guided.active && guided.step.id === "outro";

  // Recalculé à l'ouverture du menu plutôt qu'en continu : la liste des
  // zones disponibles ne doit pas bouger sous les pieds de l'utilisateur
  // pendant qu'il choisit dans le menu déjà ouvert.
  const zoneOptions = open ? getNodes().filter((n) => n.type === "zone") : [];

  // Bascule Canvas.tsx sur le rendu filtré par zone le temps de la capture
  // (retour utilisateur : "isoler uniquement la zone pour les imprimer") —
  // indispensable car les fonctions de capture lisent le DOM réel du canvas
  // (`.react-flow__viewport`), pas seulement les tableaux nodes/edges : sans
  // ce filtre appliqué AU RENDU, les composants voisins de la zone
  // resteraient visibles dans l'image même en leur passant des tableaux
  // filtrés en paramètre. `flushSync` force React à terminer ce re-rendu
  // avant de lancer la capture (sinon la capture partirait sur l'ancien DOM,
  // la mise à jour du store étant normalement asynchrone).
  async function withZoneIsolation<T>(fn: () => Promise<T>): Promise<T> {
    if (!zoneId) return fn();
    flushSync(() => setExportIsolatedZoneId(zoneId));
    try {
      return await fn();
    } finally {
      flushSync(() => setExportIsolatedZoneId(null));
    }
  }

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
      await withZoneIsolation(async () => {
        const capture = await captureSchemaPng(getNodes(), getEdges(), projectName, showGrid);
        if (!capture) return;
        if (kind === "png") downloadDataUrl(capture.dataUrl, `${slugify(projectName)}.png`);
        else openPrintablePdf(capture, projectName);
      });
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  async function handleExportSvg() {
    setBusy(true);
    try {
      await withZoneIsolation(async () => {
        const capture = await captureSchemaSvg(getNodes());
        if (!capture) return;
        downloadDataUrl(capture.dataUrl, `${slugify(projectName)}.svg`);
      });
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  async function handleExportBom() {
    setOpen(false);
    await withZoneIsolation(async () => {
      const bom = computeBom(getNodes(), getEdges());
      openPrintableBom(bom, projectName);
    });
  }

  // Carrousel (retour utilisateur : un schéma dense posté en une seule image
  // de fil d'actualité reste illisible même en haute résolution) — 1 vue
  // d'ensemble + 3 zooms par tiers, regroupés dans une seule archive zip
  // (retour utilisateur : plus simple qu'un téléchargement par image).
  async function handleExportCarousel() {
    setBusy(true);
    try {
      await withZoneIsolation(async () => {
        const parts = await captureSchemaCarousel(getNodes(), getEdges(), projectName, showGrid);
        if (!parts) return;
        await downloadCarouselZip(parts, projectName);
      });
    } finally {
      setBusy(false);
      setOpen(false);
    }
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
          darkMode ? "border-sky-500/50 text-sky-300 hover:bg-sky-500/10" : "border-sky-200 text-sky-700 hover:bg-sky-50"
        } ${spotlight ? "ring-2 ring-emerald-400 ring-offset-1" : ""}`}
      >
        {busy ? "Export…" : "🖨︎ Imprimer / Exporter"}
      </button>
      {open ? (
        <div
          className={`absolute right-0 top-full z-10 mt-1 w-56 rounded-md border py-1 shadow-lg ${
            darkMode ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-white"
          }`}
        >
          {zoneOptions.length > 0 ? (
            <>
              <label className={`block px-3 py-1.5 text-xs ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>
                <span className="mb-1 block">Périmètre</span>
                <select
                  value={zoneId ?? ""}
                  onChange={(e) => setZoneId(e.target.value || null)}
                  onClick={(e) => e.stopPropagation()}
                  title="Isoler l'export au contenu d'une zone — plus précis qu'un filtre par famille, basé sur ce qui est visuellement dedans"
                  className={`w-full rounded-md border px-2 py-1 text-sm focus:outline-none ${
                    darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-100" : "border-neutral-300 bg-white text-neutral-800"
                  }`}
                >
                  <option value="">Tout le schéma</option>
                  {zoneOptions.map((z) => (
                    <option key={z.id} value={z.id}>
                      {String(z.data.label ?? "Zone")}
                    </option>
                  ))}
                </select>
              </label>
              <div className={`my-1 border-t ${darkMode ? "border-neutral-700" : "border-neutral-100"}`} />
            </>
          ) : null}
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
          <button
            type="button"
            onClick={handleExportSvg}
            className={itemClass}
            title="Sans filigrane ni cartouche — s'ouvre correctement dans un navigateur ; le support est variable dans les logiciels vectoriels (le contenu est encapsulé, pas de tracés éditables un par un)"
          >
            Image SVG
          </button>
          <button
            type="button"
            onClick={handleExportCarousel}
            className={itemClass}
            title="1 vue d'ensemble + 3 zooms par tiers — pour un post en carrousel (réseaux sociaux) ou une impression détaillée"
          >
            Carrousel (4 images)
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

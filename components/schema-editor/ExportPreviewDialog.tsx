"use client";

import { useEffect, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import {
  captureSchemaPng,
  downloadDataUrl,
  filterEdgesForNodes,
  filterNodesByZone,
  openPrintablePdf,
  slugify,
  downloadCarouselZip,
  type SchemaCapture,
} from "@/features/schemas/export";
import { captureSchemaForSocial, captureSocialCarousel } from "@/features/schemas/social-export";
import { computeSocialFrame, type SocialReadability } from "@/lib/schema-editor/social-frame";
import type { PrintFormat } from "@/lib/schema-editor/print-layout";

type ExportKind = "png" | "pdf" | "social";
type SocialMode = "single" | "carousel";

const KIND_LABELS: Record<ExportKind, string> = { png: "PNG", pdf: "PDF", social: "Facebook" };

const READABILITY_MESSAGES: Record<SocialReadability, { tone: "ok" | "warn"; text: string }> = {
  good: { tone: "ok", text: "Lisibilité bonne : le texte reste net sur téléphone." },
  fair: { tone: "warn", text: "Lisibilité moyenne : pensez à la série carrousel ou à exporter une zone." },
  poor: { tone: "warn", text: "Schéma trop grand pour une seule image : choisissez la série carrousel ou exportez une zone." },
};
type ExportQuality = "standard" | "haute" | "maximum";

const QUALITY_PIXEL_RATIO: Record<ExportQuality, number> = {
  standard: 2,
  haute: 3,
  maximum: 4,
};

/**
 * L'export est précédé d'un aperçu: on évite ainsi de télécharger un fichier
 * sans avoir confirmé le cadrage, la zone et la grille voulus.
 */
export function ExportPreviewDialog({
  initialKind,
  initialShowGrid,
  onClose,
}: {
  initialKind: ExportKind;
  initialShowGrid: boolean;
  onClose: () => void;
}) {
  const darkMode = useSchemaStore((s) => s.darkMode);
  const projectName = useSchemaStore((s) => s.projectName);
  const storeNodes = useSchemaStore((s) => s.nodes);
  const setSaveStatus = useSchemaStore((s) => s.setSaveStatus);
  const hasUnlimitedConsumers = useSchemaStore((s) => s.hasUnlimitedConsumers);
  const { getNodes, getEdges } = useReactFlow();
  const [kind, setKind] = useState<ExportKind>(initialKind);
  const [scopeId, setScopeId] = useState<string>("all");
  const [includeGrid, setIncludeGrid] = useState(initialShowGrid);
  const [quality, setQuality] = useState<ExportQuality>("haute");
  const [printFormat, setPrintFormat] = useState<PrintFormat>("A4");
  const [socialMode, setSocialMode] = useState<SocialMode>("single");
  const [preview, setPreview] = useState<SchemaCapture | null>(null);
  const [previewing, setPreviewing] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const zones = storeNodes.filter((node) => node.type === "zone");

  function getScope() {
    const allNodes = getNodes();
    const scopedNodes = filterNodesByZone(allNodes, scopeId === "all" ? null : scopeId);
    return { nodes: scopedNodes, edges: filterEdgesForNodes(getEdges(), scopedNodes) };
  }

  useEffect(() => {
    let cancelled = false;
    async function makePreview() {
      setPreviewing(true);
      setError(null);
      try {
        const scope = getScope();
        if (scope.nodes.length === 0) {
          if (!cancelled) setError("Cette zone ne contient aucun élément à exporter.");
          return;
        }
        // L'aperçu reste léger; la qualité choisie est appliquée uniquement
        // au fichier final pour que les réglages restent instantanés.
        const capture = await captureSchemaPng(scope.nodes, scope.edges, projectName, includeGrid, { pixelRatio: 1, watermark: !hasUnlimitedConsumers });
        if (!cancelled) setPreview(capture);
      } catch {
        if (!cancelled) setError("Impossible de générer l’aperçu pour le moment.");
      } finally {
        if (!cancelled) setPreviewing(false);
      }
    }
    void makePreview();
    return () => {
      cancelled = true;
    };
    // getNodes/getEdges are provided by React Flow and remain stable during a dialog session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeId, includeGrid, projectName]);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    setError(null);
    try {
      const scope = getScope();
      const watermark = !hasUnlimitedConsumers;
      if (kind === "social") {
        await exportForSocial(scope.nodes, scope.edges, watermark);
        onClose();
        return;
      }
      const capture = await captureSchemaPng(scope.nodes, scope.edges, projectName, includeGrid, {
        pixelRatio: QUALITY_PIXEL_RATIO[quality],
        watermark,
      });
      if (!capture) throw new Error("Capture unavailable");

      if (kind === "png") {
        downloadDataUrl(capture.dataUrl, `${slugify(projectName)}.png`);
        setSaveStatus("saved", { scope: "local", message: "Image PNG téléchargée" });
      } else {
        openPrintablePdf(capture, projectName, printFormat);
        setSaveStatus("saved", { scope: "local", message: "Planche PDF prête à imprimer" });
      }
      onClose();
    } catch {
      setError("L’export n’a pas pu être généré. Réessayez après quelques secondes.");
    } finally {
      setExporting(false);
    }
  }

  async function exportForSocial(nodes: ReturnType<typeof getScope>["nodes"], edges: ReturnType<typeof getScope>["edges"], watermark: boolean) {
    if (socialMode === "carousel") {
      const parts = await captureSocialCarousel(nodes, edges, projectName, includeGrid, watermark);
      if (!parts) throw new Error("Capture unavailable");
      await downloadCarouselZip(parts, projectName);
      setSaveStatus("saved", { scope: "local", message: "Série Facebook téléchargée" });
      return;
    }
    const image = await captureSchemaForSocial(nodes, edges, projectName, includeGrid, watermark);
    if (!image) throw new Error("Capture unavailable");
    downloadDataUrl(image.dataUrl, `${slugify(projectName)}_facebook.${image.extension}`);
    setSaveStatus("saved", { scope: "local", message: "Image Facebook téléchargée" });
  }

  const socialFrame = preview ? computeSocialFrame(preview) : null;
  const readability = socialFrame ? READABILITY_MESSAGES[socialFrame.readability] : null;
  const panelClass = darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-100" : "border-slate-200 bg-white text-slate-900";
  const mutedClass = darkMode ? "text-neutral-400" : "text-slate-500";
  const controlClass = darkMode ? "border-neutral-700 bg-neutral-950 text-neutral-100" : "border-slate-300 bg-white text-slate-800";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="export-preview-title">
      <div className={`flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${panelClass}`}>
        <header className={`flex items-start justify-between gap-4 border-b px-5 py-4 ${darkMode ? "border-neutral-800" : "border-slate-200"}`}>
          <div>
            <h2 id="export-preview-title" className="text-lg font-semibold">Prévisualiser l’export</h2>
            <p className={`mt-0.5 text-sm ${mutedClass}`}>Vérifiez le cadrage avant de télécharger ou d’imprimer.</p>
          </div>
          <button type="button" onClick={onClose} className={`rounded-lg px-2 py-1 text-xl leading-none ${darkMode ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`} aria-label="Fermer">×</button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className={`space-y-5 border-b p-5 lg:border-b-0 lg:border-r ${darkMode ? "border-neutral-800" : "border-slate-200"}`}>
            <fieldset>
              <legend className={`mb-2 text-xs font-semibold uppercase tracking-wide ${mutedClass}`}>Format</legend>
              <div className="grid grid-cols-3 gap-2">
                {(["png", "pdf", "social"] as ExportKind[]).map((option) => (
                  <button key={option} type="button" onClick={() => setKind(option)} aria-pressed={kind === option} className={`rounded-lg border px-2 py-2 text-sm font-semibold transition-base ${kind === option ? "border-brand-500 bg-brand-500 text-white" : controlClass}`}>
                    {KIND_LABELS[option]}
                  </button>
                ))}
              </div>
            </fieldset>

            {kind === "pdf" ? (
              <label className="block">
                <span className={`mb-2 block text-xs font-semibold uppercase tracking-wide ${mutedClass}`}>Papier</span>
                <select value={printFormat} onChange={(event) => setPrintFormat(event.target.value as PrintFormat)} className={`w-full rounded-lg border px-3 py-2 text-sm ${controlClass}`}>
                  <option value="A4">A4 (imprimante courante)</option>
                  <option value="A3">A3</option>
                </select>
                <p className={`mt-1.5 text-xs ${mutedClass}`}>Une seule page, orientation choisie automatiquement.</p>
              </label>
            ) : null}

            {kind === "social" ? (
              <fieldset>
                <legend className={`mb-2 text-xs font-semibold uppercase tracking-wide ${mutedClass}`}>Publication</legend>
                <div className="grid gap-2">
                  {([
                    ["single", "Image unique", "2048 px, prête à publier"],
                    ["carousel", "Série carrousel", "Vue d’ensemble + 3 zooms (zip)"],
                  ] as [SocialMode, string, string][]).map(([mode, label, hint]) => (
                    <button key={mode} type="button" onClick={() => setSocialMode(mode)} aria-pressed={socialMode === mode} className={`rounded-lg border px-3 py-2 text-left transition-base ${socialMode === mode ? "border-brand-500 ring-1 ring-brand-500" : ""} ${controlClass}`}>
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className={`block text-xs ${mutedClass}`}>{hint}</span>
                    </button>
                  ))}
                </div>
                {readability && socialMode === "single" ? (
                  <p className={`mt-2 text-xs ${readability.tone === "ok" ? (darkMode ? "text-emerald-300" : "text-emerald-700") : darkMode ? "text-amber-300" : "text-amber-700"}`}>{readability.text}</p>
                ) : null}
              </fieldset>
            ) : null}

            <label className="block">
              <span className={`mb-2 block text-xs font-semibold uppercase tracking-wide ${mutedClass}`}>Contenu</span>
              <select value={scopeId} onChange={(event) => setScopeId(event.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${controlClass}`}>
                <option value="all">Schéma complet</option>
                {zones.map((zone) => <option key={zone.id} value={zone.id}>{String(zone.data.label ?? "Zone sans nom")}</option>)}
              </select>
            </label>

            <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${controlClass}`}>
              <span>
                <span className="block text-sm font-medium">Inclure la grille</span>
                <span className={`block text-xs ${mutedClass}`}>Fond technique à l’export</span>
              </span>
              <input type="checkbox" checked={includeGrid} onChange={(event) => setIncludeGrid(event.target.checked)} className="h-4 w-4 accent-brand-500" />
            </label>

            <label className={kind === "social" ? "hidden" : "block"}>
              <span className={`mb-2 block text-xs font-semibold uppercase tracking-wide ${mutedClass}`}>Qualité finale</span>
              <select value={quality} onChange={(event) => setQuality(event.target.value as ExportQuality)} className={`w-full rounded-lg border px-3 py-2 text-sm ${controlClass}`}>
                <option value="standard">Standard</option>
                <option value="haute">Haute définition</option>
                <option value="maximum">Maximum</option>
              </select>
              <p className={`mt-1.5 text-xs ${mutedClass}`}>La qualité est appliquée au fichier téléchargé, pas à l’aperçu.</p>
            </label>
          </aside>

          <main className={`min-h-0 overflow-auto p-5 ${darkMode ? "bg-neutral-950" : "bg-slate-100"}`}>
            <div className={`flex min-h-[22rem] items-center justify-center rounded-xl border p-3 ${darkMode ? "border-neutral-800 bg-neutral-900" : "border-slate-200 bg-white"}`}>
              {previewing ? <p className={`text-sm ${mutedClass}`}>Génération de l’aperçu…</p> : null}
              {!previewing && preview && kind === "social" && socialMode === "single" && socialFrame ? (
                <div className="flex max-h-[62vh] w-full max-w-2xl items-center justify-center bg-white shadow-sm" style={{ aspectRatio: `${socialFrame.canvasWidth} / ${socialFrame.canvasHeight}` }}>
                  <img src={preview.dataUrl} alt={`Aperçu Facebook de ${projectName}`} className="max-h-full max-w-full object-contain" />
                </div>
              ) : null}
              {!previewing && preview && !(kind === "social" && socialMode === "single") ? <img src={preview.dataUrl} alt={`Aperçu de ${projectName}`} className="max-h-[62vh] max-w-full object-contain shadow-sm" /> : null}
              {!previewing && error ? <p className="max-w-sm text-center text-sm text-red-600">{error}</p> : null}
            </div>
          </main>
        </div>

        <footer className={`flex items-center justify-end gap-3 border-t px-5 py-4 ${darkMode ? "border-neutral-800" : "border-slate-200"}`}>
          <button type="button" onClick={onClose} disabled={exporting} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${controlClass}`}>Annuler</button>
          <button type="button" onClick={() => void handleExport()} disabled={previewing || Boolean(error) || exporting} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-base hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
            {exporting ? "Export en cours…" : kind === "png" ? "Télécharger le PNG" : kind === "pdf" ? "Ouvrir le PDF" : socialMode === "carousel" ? "Télécharger la série" : "Télécharger l’image Facebook"}
          </button>
        </footer>
      </div>
    </div>
  );
}

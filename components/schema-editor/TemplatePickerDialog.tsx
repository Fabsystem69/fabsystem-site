"use client";

import { useMemo, useState } from "react";
import { getSchemaTemplate, getSchemaTemplatesByVehicleGroup } from "@/features/schemas/templates";
import { getComponentDefinition, getNodeIcon } from "@/lib/electrical-components/definitions";
import { buildStructuredCanvas } from "@/lib/schema-editor/guided-plan";
import { useSchemaStore, type SchemaEdge, type SchemaNode } from "@/features/schemas/store/useSchemaStore";

function TemplateDiagramPreview({ nodes, edges, darkMode }: { nodes: SchemaNode[]; edges: SchemaEdge[]; darkMode: boolean }) {
  const drawableNodes = nodes.filter((node) => node.type !== "zone");
  const xs = nodes.map((node) => node.position.x);
  const ys = nodes.map((node) => node.position.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...nodes.map((node) => node.position.x + (node.measured?.width ?? node.width ?? 120)));
  const maxY = Math.max(...nodes.map((node) => node.position.y + (node.measured?.height ?? node.height ?? 80)));
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const toX = (value: number) => ((value - minX) / width) * 100;
  const toY = (value: number) => ((value - minY) / height) * 100;
  const nodeById = new Map(drawableNodes.map((node) => [node.id, node]));

  return (
    <div className={`relative h-72 overflow-hidden rounded-xl border ${darkMode ? "border-neutral-700 bg-neutral-950" : "border-slate-200 bg-slate-50"}`} aria-label="Aperçu du schéma sélectionné">
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_1px_1px,rgba(100,116,139,0.32)_1px,transparent_0)] [background-size:16px_16px]" />
      {nodes.filter((node) => node.type === "zone").map((zone) => {
        const zoneWidth = zone.measured?.width ?? zone.width ?? 0;
        const zoneHeight = zone.measured?.height ?? zone.height ?? 0;
        return <div key={zone.id} className="absolute rounded-md border" style={{ left: `${toX(zone.position.x)}%`, top: `${toY(zone.position.y)}%`, width: `${(zoneWidth / width) * 100}%`, height: `${(zoneHeight / height) * 100}%`, borderColor: String(zone.data.color ?? "#94a3b8"), backgroundColor: `${String(zone.data.color ?? "#94a3b8")}12` }} />;
      })}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        {edges.map((edge) => {
          const source = nodeById.get(edge.source);
          const target = nodeById.get(edge.target);
          if (!source || !target) return null;
          const sourceWidth = source.measured?.width ?? source.width ?? 120;
          const sourceHeight = source.measured?.height ?? source.height ?? 80;
          const targetWidth = target.measured?.width ?? target.width ?? 120;
          const targetHeight = target.measured?.height ?? target.height ?? 80;
          return <line key={edge.id} x1={`${toX(source.position.x + sourceWidth / 2)}%`} y1={`${toY(source.position.y + sourceHeight / 2)}%`} x2={`${toX(target.position.x + targetWidth / 2)}%`} y2={`${toY(target.position.y + targetHeight / 2)}%`} stroke={String(edge.data?.color ?? "#64748b")} strokeWidth="1.5" opacity="0.75" />;
        })}
      </svg>
      {drawableNodes.slice(0, 48).map((node) => {
        const def = getComponentDefinition(node.data.componentType);
        const icon = def ? getNodeIcon(def, node.data, "pro") : undefined;
        const nodeWidth = node.measured?.width ?? node.width ?? 120;
        const nodeHeight = node.measured?.height ?? node.height ?? 80;
        return <div key={node.id} title={String(node.data.label ?? "Composant")} className={`absolute flex items-center justify-center rounded border shadow-sm ${darkMode ? "border-neutral-600 bg-neutral-900" : "border-white bg-white"}`} style={{ left: `${toX(node.position.x)}%`, top: `${toY(node.position.y)}%`, width: `${Math.max(3.5, (nodeWidth / width) * 100)}%`, height: `${Math.max(3.5, (nodeHeight / height) * 100)}%` }}>{icon ? <img src={icon} alt="" className="h-full w-full object-contain p-0.5" /> : <span className="text-[8px]">{String(node.data.label ?? "?").slice(0, 2)}</span>}</div>;
      })}
      <span className={`absolute bottom-3 left-3 rounded-md px-2 py-1 text-xs ${darkMode ? "bg-neutral-800 text-neutral-400" : "bg-white text-slate-500 shadow-sm"}`}>Aperçu du câblage du modèle</span>
    </div>
  );
}

/** Sélection d'un point de départ: le choix est confirmé après aperçu, jamais au clic sur la liste. */
export function TemplatePickerDialog({ onClose }: { onClose: () => void }) {
  const darkMode = useSchemaStore((s) => s.darkMode);
  const nodes = useSchemaStore((s) => s.nodes);
  const loadTemplate = useSchemaStore((s) => s.loadTemplate);
  const newProject = useSchemaStore((s) => s.newProject);
  const groups = getSchemaTemplatesByVehicleGroup();
  // Le canevas structuré donne un repère immédiatement, tout en laissant un
  // choix explicitement vierge pour les schémas entièrement libres.
  const [selectedId, setSelectedId] = useState("structured");
  const [activeGroup, setActiveGroup] = useState<"all" | (typeof groups)[number]["id"]>("all");
  const [showHelp, setShowHelp] = useState(false);
  const selectedTemplate = selectedId === "blank" || selectedId === "structured" ? undefined : getSchemaTemplate(selectedId);
  const snapshot = useMemo(() => selectedId === "structured" ? buildStructuredCanvas() : selectedTemplate?.build(), [selectedId, selectedTemplate]);
  const zones = snapshot?.nodes.filter((node) => node.type === "zone").map((node) => String(node.data.label ?? "Zone")) ?? [];
  const componentLabels = snapshot?.nodes.filter((node) => node.type !== "zone").slice(0, 6).map((node) => String(node.data.label ?? "Composant")) ?? [];
  const hasComponents = nodes.some((node) => node.type !== "zone");
  const visibleGroups = activeGroup === "all" ? groups : groups.filter((group) => group.id === activeGroup);
  const visibleTemplates = visibleGroups.flatMap((group) => group.templates);

  function handleUseSelection() {
    if (selectedTemplate) {
      if (hasComponents && !window.confirm(`Charger « ${selectedTemplate.label} » à la place du schéma actuel ?`)) return;
      loadTemplate(selectedTemplate.id);
    } else {
      const withZones = selectedId === "structured";
      if (hasComponents && !window.confirm(withZones ? "Repartir avec le canevas structuré ?" : "Repartir d'un schéma vierge ?")) return;
      newProject({ withZones });
    }
    onClose();
  }

  const panelClass = darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-100" : "border-slate-200 bg-white text-slate-900";
  const mutedClass = darkMode ? "text-neutral-400" : "text-slate-500";
  const controlClass = darkMode ? "border-neutral-700 bg-neutral-950 text-neutral-100" : "border-slate-300 bg-white text-slate-800";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="template-picker-title">
      <div className={`flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${panelClass}`}>
        <header className={`flex items-start justify-between gap-4 border-b px-5 py-4 ${darkMode ? "border-neutral-800" : "border-slate-200"}`}>
          <div>
            <h2 id="template-picker-title" className="text-xl font-semibold">Démarrer un schéma électrique</h2>
            <p className={`mt-0.5 text-sm ${mutedClass}`}>Choisissez un point de départ, vérifiez-le, puis chargez-le dans l’éditeur.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSelectedId("structured")} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${selectedId === "structured" ? "border-brand-500 bg-brand-50 text-brand-700" : controlClass}`}>Canevas structuré</button>
            <button type="button" onClick={() => setSelectedId("blank")} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${selectedId === "blank" ? "border-brand-500 bg-brand-50 text-brand-700" : controlClass}`}>Canevas vierge</button>
            <button type="button" onClick={() => setShowHelp((value) => !value)} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600">M’aider à choisir</button>
            <button type="button" onClick={onClose} className={`rounded-lg px-2 py-1 text-xl leading-none ${darkMode ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`} aria-label="Fermer">×</button>
          </div>
        </header>

        {showHelp ? <div className={`border-b px-5 py-3 text-sm ${darkMode ? "border-neutral-800 bg-amber-400/10 text-amber-100" : "border-amber-100 bg-amber-50 text-amber-900"}`}>Pour un véhicule aménagé, commencez par <strong>Vans & camping-cars</strong>; pour un circuit de bord, choisissez <strong>Bateaux</strong>. Vous pourrez modifier chaque composant après chargement.</div> : null}

        <div className="grid min-h-0 flex-1 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <aside className={`min-h-0 border-b lg:border-b-0 lg:border-r ${darkMode ? "border-neutral-800" : "border-slate-200"}`}>
            <div className={`flex flex-wrap gap-1 border-b p-3 ${darkMode ? "border-neutral-800" : "border-slate-200"}`}>
              <button type="button" onClick={() => setActiveGroup("all")} className={`rounded-md px-2 py-1.5 text-xs font-semibold ${activeGroup === "all" ? "bg-brand-500 text-white" : controlClass}`}>Tous</button>
              {groups.map((group) => <button key={group.id} type="button" onClick={() => setActiveGroup(group.id)} className={`rounded-md px-2 py-1.5 text-xs font-semibold ${activeGroup === group.id ? "bg-brand-500 text-white" : controlClass}`}>{group.label}</button>)}
            </div>
            <div className="max-h-[55vh] space-y-2 overflow-y-auto p-3">
              {visibleTemplates.map((template) => {
                const selected = template.id === selectedId;
                return <button key={template.id} type="button" onClick={() => setSelectedId(template.id)} className={`w-full rounded-xl border p-3 text-left transition-base ${selected ? "border-amber-500 ring-2 ring-amber-400/40" : darkMode ? "border-neutral-700 bg-neutral-950 hover:border-neutral-500" : "border-slate-200 hover:border-slate-400"}`}>
                  <span className="block text-sm font-semibold">{template.label}</span>
                  <span className={`mt-1 line-clamp-2 block text-xs leading-relaxed ${mutedClass}`}>{template.description}</span>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${darkMode ? "bg-neutral-800 text-neutral-400" : "bg-slate-100 text-slate-500"}`}>{groups.find((group) => group.templates.some((item) => item.id === template.id))?.label}</span>
                </button>;
              })}
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto p-5">
            {snapshot ? (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_16rem]">
                <section>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className={`text-xs font-semibold uppercase tracking-wide ${mutedClass}`}>{selectedTemplate ? "Aperçu du modèle" : "Point de départ"}</p><h3 className="mt-1 text-xl font-semibold">{selectedTemplate?.label ?? "Canevas structuré"}</h3></div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${darkMode ? "border-neutral-700 text-neutral-300" : "border-slate-200 text-slate-600"}`}>{snapshot.nodes.filter((node) => node.type !== "zone").length} composants · {snapshot.edges.length} liaisons</span>
                  </div>
                  <p className={`mt-3 max-w-2xl text-sm leading-relaxed ${mutedClass}`}>{selectedTemplate?.description ?? "Les zones techniques structurent la lecture du schéma sans ajouter de composant ni de câble."}</p>
                  <div className="mt-5"><TemplateDiagramPreview nodes={snapshot.nodes} edges={snapshot.edges} darkMode={darkMode} /></div>
                </section>
                <aside className={`rounded-xl border p-4 ${darkMode ? "border-neutral-700 bg-neutral-950" : "border-slate-200 bg-slate-50"}`}>
                  <h4 className="text-sm font-semibold">Ce que contient ce modèle</h4>
                  <p className={`mt-3 text-xs font-semibold uppercase tracking-wide ${mutedClass}`}>Zones</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{zones.length > 0 ? zones.slice(0, 8).map((zone) => <span key={zone} className={`rounded-md px-2 py-1 text-xs ${darkMode ? "bg-neutral-800 text-neutral-300" : "bg-white text-slate-600 shadow-sm"}`}>{zone}</span>) : <span className={`text-xs ${mutedClass}`}>Organisation libre</span>}</div>
                  <p className={`mt-4 text-xs font-semibold uppercase tracking-wide ${mutedClass}`}>Équipements principaux</p>
                  <ul className={`mt-2 space-y-1.5 text-xs ${mutedClass}`}>{componentLabels.map((label) => <li key={label}>• {label}</li>)}</ul>
                </aside>
              </div>
            ) : (
              <div className={`flex min-h-[26rem] flex-col items-center justify-center rounded-xl border border-dashed text-center ${darkMode ? "border-neutral-700 bg-neutral-950" : "border-slate-300 bg-slate-50"}`}>
                <span className="text-5xl">✎</span><h3 className="mt-4 text-xl font-semibold">Schéma vierge</h3><p className={`mt-2 max-w-sm text-sm leading-relaxed ${mutedClass}`}>Un canevas vide pour construire votre installation à votre rythme, avec l’assistant et le catalogue de composants.</p>
              </div>
            )}
          </main>
        </div>

        <footer className={`flex items-center justify-end gap-3 border-t px-5 py-4 ${darkMode ? "border-neutral-800" : "border-slate-200"}`}>
          <button type="button" onClick={onClose} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${controlClass}`}>Annuler</button>
          <button type="button" onClick={handleUseSelection} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-base hover:bg-brand-600">{selectedTemplate ? "Utiliser ce modèle" : selectedId === "structured" ? "Créer avec les zones" : "Créer un schéma vierge"}</button>
        </footer>
      </div>
    </div>
  );
}

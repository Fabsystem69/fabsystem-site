"use client";

import { useEffect, useRef, useState } from "react";
import { useSchemaStore, ZONE_COLORS } from "@/features/schemas/store/useSchemaStore";
import { getComponentDefinition, getEffectiveHandles } from "@/lib/electrical-components/definitions";
import { FuseBlockOutputs, useBrandModelSelector, useNodeFieldChange } from "./ItemPropertiesPopup";
import type { ComponentHandleDef, HandleKind } from "@/types/schema";
import { CABLE_SECTIONS } from "@/types/schema";
import { CABLE_TYPES, getCableType } from "@/lib/electrical-components/cable-types";

type PanelTab = "properties" | "ports" | "protection" | "fuses" | "display";
type PortSide = ComponentHandleDef["side"];

const PORT_KINDS: { value: HandleKind; label: string; color: string }[] = [
  { value: "positive", label: "DC+", color: "#dc2626" },
  { value: "negative", label: "DC−", color: "#1f2937" },
  { value: "neutral", label: "Neutre / signal", color: "#2563eb" },
  { value: "earth", label: "Terre / masse", color: "#16a34a" },
];
const PROTECTION_RATINGS = [2, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 100, 125, 150, 175, 200, 250, 300, 400, 500];

const inputClass = (darkMode: boolean) => `w-full rounded-lg border px-2.5 py-1.5 text-[13px] outline-none transition-base ${
  darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-100 focus:border-amber-400" : "border-slate-300 bg-slate-50 text-slate-900 shadow-inner shadow-slate-200/60 focus:border-amber-500 focus:bg-white"
}`;

function useScrollHint() {
  const ref = useRef<HTMLDivElement>(null);
  const [hasMoreContent, setHasMoreContent] = useState(false);
  const updateScrollHint = () => {
    const element = ref.current;
    if (element) setHasMoreContent(element.scrollHeight - element.scrollTop - element.clientHeight > 6);
  };

  useEffect(() => {
    updateScrollHint();
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(updateScrollHint);
    observer.observe(element);
    return () => observer.disconnect();
  });

  return { ref, hasMoreContent, updateScrollHint };
}

function ScrollHint({ visible, darkMode }: { visible: boolean; darkMode: boolean }) {
  if (!visible) return null;
  return <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-end justify-center bg-gradient-to-t pb-1 text-base ${darkMode ? "from-neutral-950 via-neutral-950/90 to-transparent text-neutral-400" : "from-white via-white/90 to-transparent text-slate-400"}`}>⌄</div>;
}

function WirePropertiesSidebar({ edge, darkMode }: { edge: NonNullable<ReturnType<typeof useSchemaStore.getState>["edges"][number]>; darkMode: boolean }) {
  const nodes = useSchemaStore((s) => s.nodes);
  const updateEdgeData = useSchemaStore((s) => s.updateEdgeData);
  const deleteSelected = useSchemaStore((s) => s.deleteSelected);
  const sourceLabel = nodes.find((node) => node.id === edge.source)?.data.label ?? "Source";
  const targetLabel = nodes.find((node) => node.id === edge.target)?.data.label ?? "Destination";
  const sectionClass = `border-b pb-5 ${darkMode ? "border-neutral-800" : "border-slate-200"}`;
  const headingClass = `mb-4 text-xs font-bold uppercase tracking-[0.22em] ${darkMode ? "text-neutral-400" : "text-slate-500"}`;
  const { ref: scrollRef, hasMoreContent, updateScrollHint } = useScrollHint();

  return <aside className={`absolute right-0 z-20 mt-6 mr-5 flex max-h-[calc(100dvh-7rem)] w-[20rem] flex-col overflow-hidden rounded-3xl border shadow-[0_16px_36px_rgba(15,23,42,0.14)] ${darkMode ? "border-neutral-800 bg-neutral-950 text-neutral-100" : "border-slate-200 bg-white text-slate-900"}`} aria-label="Propriétés du câble">
    <div className={`border-b px-5 py-4 ${darkMode ? "border-neutral-800" : "border-slate-200"}`}><p className={`text-xs font-bold uppercase tracking-[0.24em] ${darkMode ? "text-neutral-400" : "text-slate-500"}`}>Propriétés</p></div>
    <div ref={scrollRef} onScroll={updateScrollHint} className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
      <section className={sectionClass}><h2 className="text-xl font-semibold">Câble</h2><p className={`mt-1 text-sm ${darkMode ? "text-neutral-400" : "text-slate-500"}`}>Spécifications et dimensionnement</p></section>
      <section className={sectionClass}><h3 className={headingClass}>Spécifications du câble</h3><label className="block"><span className="mb-1.5 block text-sm">Type de câble</span><select value={String(edge.data?.cableType ?? "other")} onChange={(event) => { const cable = getCableType(event.target.value); updateEdgeData(edge.id, { cableType: event.target.value, color: cable?.color }); }} className={inputClass(darkMode)}>{CABLE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label><div className="mt-4 grid grid-cols-[1fr_6.5rem] gap-3"><label><span className="mb-1.5 block text-sm">Section</span><select value={String(edge.data?.section ?? "")} onChange={(event) => updateEdgeData(edge.id, { section: event.target.value })} className={inputClass(darkMode)}><option value="">Auto / non définie</option>{CABLE_SECTIONS.map((section) => <option key={section} value={section}>{section}</option>)}</select></label><label><span className="mb-1.5 block text-sm">Conducteurs</span><input className={inputClass(darkMode)} type="number" min={1} value={Number(edge.data?.parallelRuns ?? 1)} onChange={(event) => updateEdgeData(edge.id, { parallelRuns: Math.max(1, Number(event.target.value)) })} /></label></div><button type="button" className="mt-3 text-sm font-medium text-amber-600 hover:underline">▦ M’aider à dimensionner ce câble</button></section>
      <section className={sectionClass}><h3 className={headingClass}>Longueur du cheminement</h3><p className={`mb-3 rounded-lg px-3 py-2 text-sm ${darkMode ? "bg-neutral-900 text-neutral-300" : "bg-slate-50 text-slate-600"}`}>→ {sourceLabel} → {targetLabel}</p><div className="grid grid-cols-[1fr_5.5rem] gap-3"><label><span className="mb-1.5 block text-sm">Longueur aller</span><input className={inputClass(darkMode)} type="number" min={0} step={0.1} value={edge.data?.length ?? ""} placeholder="ex. 2,5" onChange={(event) => updateEdgeData(edge.id, { length: event.target.value === "" ? undefined : Number(event.target.value) })} /></label><label><span className="mb-1.5 block text-sm">Unité</span><select className={inputClass(darkMode)} defaultValue="m"><option value="m">m</option><option value="cm">cm</option></select></label></div></section>
      <section className={sectionClass}><h3 className={headingClass}>Paramètres de calcul</h3><label className="block"><span className="mb-1.5 block text-sm">Chute de tension maximale</span><select value={String(edge.data?.voltageDropLimit ?? 3)} onChange={(event) => updateEdgeData(edge.id, { voltageDropLimit: Number(event.target.value) })} className={inputClass(darkMode)}><option value="3">3% (recommandé)</option><option value="5">5%</option><option value="10">10%</option></select></label><label className="mt-4 block"><span className="mb-1.5 block text-sm">Température ambiante</span><select value={String(edge.data?.ambientTemperature ?? 30)} onChange={(event) => updateEdgeData(edge.id, { ambientTemperature: Number(event.target.value) })} className={inputClass(darkMode)}><option value="20">20 °C</option><option value="30">30 °C (par défaut)</option><option value="40">40 °C</option><option value="50">50 °C</option></select></label></section>
      <section className={sectionClass}><h3 className={headingClass}>Apparence</h3><label className="block"><span className="mb-1.5 block text-sm">Libellé</span><input className={inputClass(darkMode)} value={String(edge.data?.label ?? "")} placeholder="ex. Alimentation principale" onChange={(event) => updateEdgeData(edge.id, { label: event.target.value })} /></label><label className="mt-4 flex items-center justify-between"><span className="text-sm">Couleur</span><input type="color" value={String(edge.data?.color ?? "#6b7280")} onChange={(event) => updateEdgeData(edge.id, { color: event.target.value })} className="h-9 w-12 rounded border border-slate-300 p-1" /></label></section>
      <section><h3 className={headingClass}>Actions</h3><button type="button" onClick={() => updateEdgeData(edge.id, { bendPoints: [] })} className={`mb-3 w-full rounded-lg border px-4 py-2.5 text-sm font-semibold ${darkMode ? "border-neutral-700 hover:bg-neutral-900" : "border-slate-300 hover:bg-slate-50"}`}>↻ Réinitialiser les coudes</button><button type="button" onClick={deleteSelected} className="w-full rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600">⌫ Supprimer le câble</button></section>
    </div>
    <ScrollHint visible={hasMoreContent} darkMode={darkMode} />
  </aside>;
}

/** Panneau contextuel: tous les réglages d'un élément sélectionné restent à droite du canevas. */
export function PropertiesSidebar() {
  const darkMode = useSchemaStore((s) => s.darkMode);
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const selectedNodeId = useSchemaStore((s) => s.selectedNodeId);
  const selectedEdgeId = useSchemaStore((s) => s.selectedEdgeId);
  const updateNodeData = useSchemaStore((s) => s.updateNodeData);
  const updateEdgeData = useSchemaStore((s) => s.updateEdgeData);
  const rotateNode = useSchemaStore((s) => s.rotateNode);
  const duplicateNode = useSchemaStore((s) => s.duplicateNode);
  const deleteSelected = useSchemaStore((s) => s.deleteSelected);
  const recalculateAllFuseRatings = useSchemaStore((s) => s.recalculateAllFuseRatings);
  const [tab, setTab] = useState<PanelTab>("properties");
  const [labelMenuOpen, setLabelMenuOpen] = useState(false);
  const { ref: scrollRef, hasMoreContent, updateScrollHint } = useScrollHint();

  const node = selectedNodeId ? nodes.find((item) => item.id === selectedNodeId) : undefined;
  const edge = selectedEdgeId ? edges.find((item) => item.id === selectedEdgeId) : undefined;
  const isZone = node?.data.componentType === "zone";
  const definition = node && !isZone ? getComponentDefinition(node.data.componentType) : undefined;
  const { brandModels, brandModelsByBrand, handleBrandModelChange } = useBrandModelSelector(node);
  const handleFieldChange = useNodeFieldChange(node);

  if (!node && !edge) return null;

  if (edge) return <WirePropertiesSidebar edge={edge} darkMode={darkMode} />;

  const title = isZone ? "Zone" : definition?.label ?? "Composant";
  const subtitle = definition?.subtitle ?? (isZone ? "Organisation du schéma" : "Composant");
  const handles = node && definition ? getEffectiveHandles(definition, node.data) : [];
  const actionClass = `flex h-8 w-8 items-center justify-center rounded-lg text-base transition-base ${darkMode ? "hover:bg-neutral-800" : "hover:bg-slate-100"}`;
  const isIndividualProtection = node?.data.componentType === "fuse" || node?.data.componentType === "circuit-breaker";
  const hasProtectionOutputs = Boolean(node && (node.data.componentType === "fuse-block" || (node.data.componentType === "distribution-panel" && node.data.layout === "with-fuses")));
  const tabs: { id: PanelTab; label: string; icon: string }[] = [
    { id: "properties", label: "Propriétés", icon: "⚙" },
    { id: "ports", label: "Bornes", icon: "⌁" },
    ...(isIndividualProtection ? [{ id: "protection" as const, label: node?.data.componentType === "circuit-breaker" ? "Disjoncteur" : "Fusible", icon: "▣" }] : []),
    ...(hasProtectionOutputs ? [{ id: "fuses" as const, label: node?.data.componentType === "distribution-panel" ? "Disjoncteurs" : "Fusibles", icon: "▣" }] : []),
    { id: "display", label: "Affichage", icon: "◉" },
  ];
  const customHandles = node && Array.isArray(node.data.customHandles)
    ? node.data.customHandles.filter((handle): handle is ComponentHandleDef => Boolean(handle && typeof handle === "object" && typeof (handle as ComponentHandleDef).id === "string"))
    : [];
  const customHandleIds = new Set(customHandles.map((handle) => handle.id));

  function updateCustomHandles(nextHandles: ComponentHandleDef[]) {
    if (node) updateNodeData(node.id, { customHandles: nextHandles });
  }

  function addCustomHandle(side: PortSide) {
    const id = `custom-${side}-${Date.now()}`;
    updateCustomHandles([...customHandles, { id, label: "", kind: "positive", side }]);
  }

  function patchCustomHandle(id: string, patch: Partial<ComponentHandleDef>) {
    updateCustomHandles(customHandles.map((handle) => handle.id === id ? { ...handle, ...patch } : handle));
  }

  return (
    <aside className={`absolute right-0 z-20 mt-6 mr-5 flex max-h-[calc(100dvh-7rem)] w-[20rem] flex-col overflow-hidden rounded-3xl border shadow-[0_16px_36px_rgba(15,23,42,0.14)] ${darkMode ? "border-neutral-800 bg-neutral-950 text-neutral-100" : "border-slate-200 bg-white text-slate-900"}`} aria-label="Propriétés de l'élément sélectionné">
      <div className={`border-b px-5 py-4 ${darkMode ? "border-neutral-800" : "border-slate-200"}`}>
        <p className={`text-xs font-bold uppercase tracking-[0.24em] ${darkMode ? "text-neutral-400" : "text-slate-500"}`}>Propriétés</p>
      </div>
      <div ref={scrollRef} onScroll={updateScrollHint} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="text-xl font-semibold leading-tight">{title}</h2><p className={`mt-1 text-sm ${darkMode ? "text-neutral-400" : "text-slate-500"}`}>{subtitle}</p></div>
          <button type="button" onClick={deleteSelected} className="rounded-lg p-2 text-xl text-red-500 hover:bg-red-50" title="Supprimer" aria-label="Supprimer">⌫</button>
        </div>

        {node && !isZone && brandModels.length > 0 ? (
          <label className="mt-5 block"><span className={`mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] ${darkMode ? "text-amber-300" : "text-amber-600"}`}>Modèle</span><select value={String(node.data.brandModelId ?? "")} onChange={(event) => handleBrandModelChange(event.target.value)} className={`${inputClass(darkMode)} border-dashed ${darkMode ? "border-amber-600/70" : "border-amber-300"}`}><option value="">Choisir un modèle…</option>{Array.from(brandModelsByBrand.entries()).sort(([a], [b]) => a.localeCompare(b, "fr")).map(([brand, models]) => <optgroup key={brand} label={brand}>{models.map((model) => <option key={model.id} value={model.id}>{model.model}</option>)}</optgroup>)}</select></label>
        ) : null}

        {node ? <div className={`relative mt-5 flex items-center gap-2 border-y py-3 ${darkMode ? "border-neutral-800" : "border-slate-200"}`}><div className="relative"><button type="button" className={`${actionClass} ${labelMenuOpen ? "bg-amber-500 text-white" : ""}`} onClick={() => setLabelMenuOpen((open) => !open)} title="Position du libellé">⌑</button>{labelMenuOpen ? <div className={`absolute left-0 top-11 z-30 w-56 rounded-xl border p-3 shadow-xl ${darkMode ? "border-neutral-700 bg-neutral-900" : "border-slate-200 bg-white"}`}><p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${darkMode ? "text-neutral-400" : "text-slate-500"}`}>Position du libellé</p><select value={String(node.data.labelPosition ?? "auto")} onChange={(event) => updateNodeData(node.id, { labelPosition: event.target.value })} className={`${inputClass(darkMode)} mt-2`}><option value="auto">Automatique</option><option value="top">Au-dessus</option><option value="bottom">En dessous</option></select><p className={`mt-3 text-[10px] font-bold uppercase tracking-[0.16em] ${darkMode ? "text-neutral-400" : "text-slate-500"}`}>Angle</p><div className="mt-2 grid grid-cols-3 gap-1">{[0, 90, 270].map((angle) => <button key={angle} type="button" onClick={() => updateNodeData(node.id, { labelAngle: angle })} className={`rounded-md px-2 py-1.5 text-xs font-semibold ${Number(node.data.labelAngle) === angle ? "bg-amber-100 text-amber-700" : darkMode ? "hover:bg-neutral-800" : "hover:bg-slate-100"}`}>{angle}°</button>)}</div></div> : null}</div><button type="button" className={actionClass} onClick={() => duplicateNode(node.id)} title="Dupliquer">⧉</button>{!isZone ? <><button type="button" className={actionClass} onClick={() => rotateNode(node.id)} title="Pivoter">↻</button><button type="button" className={actionClass} onClick={() => updateNodeData(node.id, { mirrored: !node.data.mirrored })} title="Miroir">⇋</button></> : null}</div> : null}

        {node && !isZone ? <div className="mt-4"><div className="flex items-center justify-between text-xs"><span className={darkMode ? "text-neutral-400" : "text-slate-500"}>Taille d’affichage</span><span>{Math.round((Number(node.data.displayScale) || 1) * 100)}%</span></div><input className="mt-2 w-full accent-amber-500" type="range" min={1} max={5} step={1} value={Number(node.data.displayScale) || 1} onChange={(event) => updateNodeData(node.id, { displayScale: Number(event.target.value) })} /></div> : null}

        <div className={`mt-5 grid border-b ${darkMode ? "border-neutral-800" : "border-slate-200"}`} style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>{tabs.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`border-b-2 px-1 py-3 text-xs font-semibold transition-base ${tab === item.id ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}><span className="mb-1 block text-base">{item.icon}</span>{item.label}</button>)}</div>

        {tab === "properties" ? <div className="space-y-4 pt-5">
          {node ? <label className="block"><span className={`mb-1.5 block text-sm ${darkMode ? "text-neutral-300" : "text-slate-600"}`}>Libellé</span><input className={inputClass(darkMode)} value={String(node.data.label ?? "")} onChange={(event) => updateNodeData(node.id, { label: event.target.value })} /></label> : null}
          {node && !isZone && definition?.fields.filter((field) => field.key !== "label").map((field) => <label key={field.key} className="grid grid-cols-[minmax(0,1fr)_9.5rem] items-center gap-3"><span className={`min-w-0 truncate text-sm ${darkMode ? "text-neutral-300" : "text-slate-600"}`} title={field.label}>{field.label}{field.type === "number" && field.unit ? ` (${field.unit})` : ""}</span>{field.type === "select" ? <select className={inputClass(darkMode)} value={String(node.data[field.key] ?? "")} onChange={(event) => handleFieldChange(field.key, event.target.value)}>{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "number" ? <input className={inputClass(darkMode)} type="number" min={field.min} max={field.max} step={field.step} value={Number(node.data[field.key] ?? 0)} onChange={(event) => handleFieldChange(field.key, Number(event.target.value))} /> : <input className={inputClass(darkMode)} value={String(node.data[field.key] ?? "")} onChange={(event) => handleFieldChange(field.key, event.target.value)} />}</label>)}
          {isZone && node ? <div><span className={`mb-2 block text-sm ${darkMode ? "text-neutral-300" : "text-slate-600"}`}>Couleur</span><div className="flex gap-2">{ZONE_COLORS.map((color) => <button key={color} type="button" onClick={() => updateNodeData(node.id, { color })} className="h-7 w-7 rounded-full border-2" style={{ backgroundColor: color, borderColor: color === node.data.color ? "#f59e0b" : "transparent" }} />)}</div></div> : null}
        </div> : null}

        {tab === "ports" ? <div className="space-y-5 pt-5">{(["left", "right", "top", "bottom"] as PortSide[]).map((side) => { const sideHandles = handles.filter((handle) => handle.side === side); return <section key={side}><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold capitalize">{{ left: "Gauche", right: "Droite", top: "Haut", bottom: "Bas" }[side]}</h3><button type="button" onClick={() => addCustomHandle(side)} className="rounded p-1 text-xl leading-none text-amber-600 hover:bg-amber-50" title={`Ajouter une borne à ${side}`}>+</button></div>{sideHandles.length ? <div className="space-y-2">{sideHandles.map((handle) => { const editable = customHandleIds.has(handle.id); const color = PORT_KINDS.find((kind) => kind.value === handle.kind)?.color ?? "#64748b"; return <div key={handle.id} className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 ${editable ? (darkMode ? "border-amber-700/60 bg-neutral-900" : "border-amber-300 bg-amber-50/30") : darkMode ? "border-neutral-800 bg-neutral-900" : "border-slate-200 bg-slate-50"}`}><span className="text-slate-400">⠿</span>{editable ? <select value={handle.kind} onChange={(event) => patchCustomHandle(handle.id, { kind: event.target.value as HandleKind })} className={`min-w-0 flex-1 border-0 bg-transparent text-xs outline-none ${darkMode ? "text-neutral-100" : "text-slate-800"}`}>{PORT_KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select> : <span className="min-w-0 flex-1 text-xs"><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{handle.label || "Borne constructeur"}</span>}{editable ? <input value={handle.label} onChange={(event) => patchCustomHandle(handle.id, { label: event.target.value })} placeholder="Libellé" className={`w-20 rounded border border-dashed bg-transparent px-1.5 py-1 text-xs outline-none ${darkMode ? "border-neutral-700 text-neutral-100" : "border-slate-300 text-slate-700"}`} /> : null}{editable ? <button type="button" onClick={() => updateCustomHandles(customHandles.filter((item) => item.id !== handle.id))} className="px-1 text-lg leading-none text-slate-400 hover:text-red-500" title="Supprimer cette borne">−</button> : null}</div>; })}</div> : <p className={`text-xs italic ${darkMode ? "text-neutral-500" : "text-slate-400"}`}>Aucune borne.</p>}</section>; })}</div> : null}
        {tab === "protection" && node ? <div className="space-y-5 pt-5"><p className={`text-sm leading-relaxed ${darkMode ? "text-neutral-400" : "text-slate-500"}`}>Le calibre doit protéger le câble. Le moteur vérifie automatiquement qu’il reste cohérent avec la section et le courant du circuit.</p><label className="block"><span className={`mb-1.5 block text-sm font-medium ${darkMode ? "text-neutral-200" : "text-slate-700"}`}>Courant nominal</span><div className="flex gap-2"><select value={String(Number(node.data.amperage) || "")} onChange={(event) => updateNodeData(node.id, { amperage: Number(event.target.value) })} className={inputClass(darkMode)}><option value="">Choisir un calibre</option>{PROTECTION_RATINGS.map((rating) => <option key={rating} value={rating}>{rating} A</option>)}</select><span className={`flex items-center ${darkMode ? "text-neutral-400" : "text-slate-500"}`}>A</span></div></label><div className={`rounded-lg border p-3 text-sm ${darkMode ? "border-emerald-900 bg-emerald-950/30 text-emerald-200" : "border-emerald-100 bg-emerald-50 text-emerald-800"}`}>Calibre renseigné: <strong>{Number(node.data.amperage) || "—"} A</strong></div><button type="button" onClick={recalculateAllFuseRatings} className={`w-full rounded-lg border px-4 py-2.5 text-sm font-semibold ${darkMode ? "border-amber-600 text-amber-300 hover:bg-amber-950" : "border-amber-300 text-amber-700 hover:bg-amber-50"}`}>↻ Recalculer les protections</button></div> : null}
        {tab === "fuses" && node ? <div className="space-y-4 pt-5"><p className={`text-sm leading-relaxed ${darkMode ? "text-neutral-400" : "text-slate-500"}`}>Réglez le calibre de chaque {node.data.componentType === "distribution-panel" ? "disjoncteur" : "fusible"}. Les contrôles de protection utilisent ces valeurs.</p><FuseBlockOutputs node={node} onChange={updateNodeData} darkMode={darkMode} /></div> : null}
        {tab === "display" ? <div className="space-y-4 pt-5">{node ? <><label className="block"><span className={`mb-1.5 block text-sm ${darkMode ? "text-neutral-300" : "text-slate-600"}`}>Sous-titre</span><input className={inputClass(darkMode)} value={String(node.data.subtitle ?? "")} placeholder="Ajouter un sous-titre" onChange={(event) => updateNodeData(node.id, { subtitle: event.target.value })} /></label><label className="block"><span className={`mb-1.5 block text-sm ${darkMode ? "text-neutral-300" : "text-slate-600"}`}>Marque</span><input className={inputClass(darkMode)} value={String(node.data.brand ?? "")} placeholder="Générique" onChange={(event) => updateNodeData(node.id, { brand: event.target.value })} /></label></> : <p className={`py-8 text-center text-sm ${darkMode ? "text-neutral-500" : "text-slate-400"}`}>Les options d’affichage sont disponibles pour les composants.</p>}</div> : null}
      </div>
      <ScrollHint visible={hasMoreContent} darkMode={darkMode} />
    </aside>
  );
}

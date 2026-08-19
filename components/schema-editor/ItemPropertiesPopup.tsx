"use client";

import { useEffect, useState } from "react";
import { useSchemaStore, ZONE_COLORS } from "@/features/schemas/store/useSchemaStore";
import { getComponentDefinition, getConsumerPreset } from "@/lib/electrical-components/definitions";
import { getBrandModelsForType, getBrandModel } from "@/lib/electrical-components/brand-models";
import { CABLE_TYPES, getCableType } from "@/lib/electrical-components/cable-types";
import { calcSection, fusibleRecommande } from "@/lib/calc/section-cable";
import { estimateConnectedAmps, estimateEdgeAmps, evaluateEdgeSection, findBatteryVoltage } from "@/lib/electrical-components/auto-size";
import { CABLE_SECTIONS } from "@/types/schema";
import { getEdgeDefaultLength } from "@/lib/electrical-components/cable-lengths";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";
import { VoltaAvatar } from "@/components/volta/VoltaAvatar";
import type { SchemaNode, SchemaEdge } from "@/features/schemas/store/useSchemaStore";

// v2.1, retour utilisateur : "supprimer le bandeau de droite car si celui
// est réduit on ne sait même pas qu'on peut modifier, on refait un montage
// avec un nouvel item" — remplace l'ancien bandeau permanent PropertiesPanel
// par un popup ouvert explicitement au double-clic sur un composant/câble
// (voir Canvas.tsx onNodeDoubleClick/onEdgeDoubleClick), jamais discret.
export function ItemPropertiesPopup() {
  const open = useSchemaStore((s) => s.itemPropertiesPopupOpen);
  const close = useSchemaStore((s) => s.closeItemPropertiesPopup);
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const selectedNodeId = useSchemaStore((s) => s.selectedNodeId);
  const selectedEdgeId = useSchemaStore((s) => s.selectedEdgeId);
  const darkMode = useSchemaStore((s) => s.darkMode);
  useEscapeToClose(close);

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : undefined;
  const selectedEdge = selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) : undefined;

  if (!open || (!selectedNode && !selectedEdge)) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 p-4" onClick={close}>
      <div onClick={(e) => e.stopPropagation()} className="h-full max-h-[calc(100vh-2rem)] w-full max-w-sm">
        {selectedNode && selectedNode.data.componentType === "zone" ? (
          <ZonePropertiesCard node={selectedNode} darkMode={darkMode} onClose={close} />
        ) : selectedNode ? (
          <NodePropertiesCard node={selectedNode} nodes={nodes} edges={edges} darkMode={darkMode} onClose={close} />
        ) : selectedEdge ? (
          <EdgePropertiesCard edge={selectedEdge} nodes={nodes} edges={edges} darkMode={darkMode} onClose={close} />
        ) : null}
      </div>
    </div>
  );
}

function CardShell({
  title,
  subtitle,
  darkMode,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  darkMode: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-2xl border shadow-2xl ${darkMode ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white"}`}>
      <div className={`flex items-start justify-between gap-2 border-b px-4 py-3 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
        <div>
          <h2 className={`text-[11px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{title}</h2>
          <p className={`text-sm ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Fermer"
          className={`shrink-0 rounded-md border p-1.5 text-xs transition-base ${darkMode ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800" : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"}`}
        >
          ✕
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">{children}</div>
      {footer ? <div className={`border-t px-4 py-3 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>{footer}</div> : null}
    </div>
  );
}

function NodePropertiesCard({
  node,
  nodes,
  edges,
  darkMode,
  onClose,
}: {
  node: SchemaNode;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  darkMode: boolean;
  onClose: () => void;
}) {
  const updateNodeData = useSchemaStore((s) => s.updateNodeData);
  const setOutputCount = useSchemaStore((s) => s.setOutputCount);
  const deleteSelected = useSchemaStore((s) => s.deleteSelected);
  const duplicateNode = useSchemaStore((s) => s.duplicateNode);
  const rotateNode = useSchemaStore((s) => s.rotateNode);
  const customCatalogItems = useSchemaStore((s) => s.customCatalogItems);

  const def = getComponentDefinition(node.data.componentType);
  if (!def) return null;

  function handleFieldChange(key: string, value: string | number) {
    // Cas spécial : le type d'appareil d'un consommateur préremplit nom +
    // puissance typique (retour utilisateur : liste déroulante de
    // consommateurs basiques) — reste modifiable ensuite comme un champ
    // normal.
    if (key === "presetType" && node.data.componentType === "consumer") {
      const preset = getConsumerPreset(String(value));
      updateNodeData(node.id, {
        presetType: value,
        label: preset?.label ?? String(value),
        powerW: preset?.typicalPowerW ?? 0,
      });
      return;
    }
    // Cas spécial : changer le nombre de sorties d'un busbar / tableau de
    // distribution / platine de fusibles doit aussi retirer les câbles
    // reliés aux sorties supprimées (voir setOutputCount).
    if (key === "outputCount") {
      setOutputCount(node.id, Number(value));
      return;
    }
    updateNodeData(node.id, { [key]: value });
  }

  // Marque/modèle (V2) : le composant reste générique dans la bibliothèque
  // — choisir un modèle ici ne fait que pré-remplir les champs déjà
  // existants avec les valeurs réelles du datasheet. Reste modifiable
  // ensuite comme n'importe quel champ. Les items personnalisés du compte
  // (préfixe "custom:", retour utilisateur : widget de création d'item) se
  // mélangent à la liste sans jamais toucher au catalogue officiel — la
  // photo se pose directement sur le node (`customItemIconDataUrl`, voir
  // getNodeIcon dans definitions.ts), pas dans BRAND_MODELS.
  function handleBrandModelChange(value: string) {
    if (!value) {
      updateNodeData(node.id, { brandModelId: "", brand: "", model: "", customItemIconDataUrl: undefined });
      return;
    }
    if (value.startsWith("custom:")) {
      const item = customCatalogItems.find((i) => `custom:${i.id}` === value);
      if (!item) return;
      updateNodeData(node.id, {
        brandModelId: value,
        brand: item.brand,
        model: item.model,
        customItemIconDataUrl: item.imageDataUrl,
        ...item.defaults,
      });
      return;
    }
    const brandModel = getBrandModel(value);
    if (!brandModel) return;
    updateNodeData(node.id, {
      brandModelId: brandModel.id,
      brand: brandModel.brand,
      model: brandModel.model,
      customItemIconDataUrl: undefined,
      ...brandModel.defaults,
    });
  }

  const officialBrandModels = getBrandModelsForType(node.data.componentType);
  const ownCustomItems = customCatalogItems.filter((i) => i.componentType === node.data.componentType);
  const brandModels = [
    ...officialBrandModels,
    ...ownCustomItems.map((i) => ({ id: `custom:${i.id}`, brand: `${i.brand} (perso)`, model: i.model })),
  ];
  const brandModelsByBrand = new Map<string, typeof brandModels>();
  for (const m of brandModels) {
    const list = brandModelsByBrand.get(m.brand) ?? [];
    list.push(m);
    brandModelsByBrand.set(m.brand, list);
  }

  const inputClass = `w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none ${
    darkMode ? "border-neutral-700 bg-neutral-800 text-neutral-100 focus:border-neutral-400" : "border-neutral-300 focus:border-neutral-900"
  }`;
  const buttonClass = `rounded-md border px-2.5 py-1.5 text-sm font-medium transition-base ${
    darkMode ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800" : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
  }`;

  return (
    <CardShell
      title={def.label}
      subtitle="Propriétés du composant"
      darkMode={darkMode}
      onClose={onClose}
      footer={
        <div className="space-y-2">
          <button type="button" onClick={() => rotateNode(node.id)} title="Pivoter (raccourci : R)" className={`w-full ${buttonClass}`}>
            ↻ Pivoter 90°
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={() => duplicateNode(node.id)} className={`flex-1 ${buttonClass}`}>
              Dupliquer
            </button>
            <button
              type="button"
              onClick={() => {
                deleteSelected();
                onClose();
              }}
              className={`flex-1 rounded-md border px-2.5 py-1.5 text-sm font-medium transition-base ${
                darkMode ? "border-red-900 text-red-400 hover:bg-red-950" : "border-red-200 text-red-600 hover:bg-red-50"
              }`}
            >
              Supprimer
            </button>
          </div>
        </div>
      }
    >
      {def.description ? (
        <p className={`rounded-md px-2.5 py-2 text-xs leading-snug ${darkMode ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100 text-neutral-600"}`}>
          {def.description}
        </p>
      ) : null}
      <label className="block">
        <span className={`mb-1 flex items-center justify-between text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>
          <span>Taille d'affichage</span>
          <span>×{Number(node.data.displayScale) || 1}</span>
        </span>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={Number(node.data.displayScale) || 1}
          onChange={(e) => updateNodeData(node.id, { displayScale: Number(e.target.value) })}
          className="w-full"
        />
        <span className={`mt-1 block text-[11px] leading-snug ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
          Agrandit uniquement cette vignette sur le schéma, pour la mettre en valeur.
        </span>
      </label>
      {brandModels.length > 0 ? (
        <label className="block">
          <span className={`mb-1 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>Marque / modèle</span>
          <select value={String(node.data.brandModelId ?? "")} onChange={(e) => handleBrandModelChange(e.target.value)} className={inputClass}>
            <option value="">Générique</option>
            {Array.from(brandModelsByBrand.entries())
              .sort(([a], [b]) => a.localeCompare(b, "fr"))
              .map(([brand, models]) => (
              <optgroup key={brand} label={brand}>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.model}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <span className={`mt-1 block text-[11px] leading-snug ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
            Pré-remplit les champs ci-dessous avec les valeurs du modèle — reste modifiable ensuite.
          </span>
        </label>
      ) : null}
      {def.fields.map((field) => (
        <label key={field.key} className="block">
          <span className={`mb-1 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>{field.label}</span>
          {field.type === "select" ? (
            <select value={String(node.data[field.key] ?? "")} onChange={(e) => handleFieldChange(field.key, e.target.value)} className={inputClass}>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === "number" ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={Number(node.data[field.key] ?? 0)}
                onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
                min={field.min}
                max={field.max}
                step={field.step}
                className={inputClass}
              />
              {field.unit ? <span className={`text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{field.unit}</span> : null}
            </div>
          ) : (
            <input type="text" value={String(node.data[field.key] ?? "")} onChange={(e) => handleFieldChange(field.key, e.target.value)} className={inputClass} />
          )}
          {field.help ? (
            <span className={`mt-1 block text-[11px] leading-snug ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{field.help}</span>
          ) : null}
        </label>
      ))}

      {def.type === "fuse" ? <FuseSuggestion nodeId={node.id} nodes={nodes} edges={edges} darkMode={darkMode} /> : null}
      {def.type === "fuse-block" ? <FuseBlockOutputs node={node} onChange={updateNodeData} darkMode={darkMode} /> : null}
    </CardShell>
  );
}

function EdgePropertiesCard({
  edge,
  nodes,
  edges,
  darkMode,
  onClose,
}: {
  edge: SchemaEdge;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  darkMode: boolean;
  onClose: () => void;
}) {
  const updateEdgeData = useSchemaStore((s) => s.updateEdgeData);
  const deleteSelected = useSchemaStore((s) => s.deleteSelected);

  const inputClass = `w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none ${
    darkMode ? "border-neutral-700 bg-neutral-800 text-neutral-100 focus:border-neutral-400" : "border-neutral-300 focus:border-neutral-900"
  }`;

  // Préremplit la longueur avec une moyenne plausible dès qu'une section est
  // choisie, sans écraser une longueur déjà saisie (retour utilisateur :
  // éviter à un débutant d'avoir à la renseigner lui-même).
  function applySection(section: string) {
    const patch: Record<string, unknown> = { section };
    if (edge.data?.length === undefined) {
      const sourceType = nodes.find((n) => n.id === edge.source)?.data.componentType;
      const targetType = nodes.find((n) => n.id === edge.target)?.data.componentType;
      const avg = getEdgeDefaultLength(sourceType, targetType, section, edge.data?.cableType);
      if (avg !== undefined) patch.length = avg;
    }
    updateEdgeData(edge.id, patch);
  }

  return (
    <CardShell
      title="Câble"
      subtitle="Propriétés de la connexion"
      darkMode={darkMode}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={() => {
            deleteSelected();
            onClose();
          }}
          className={`w-full rounded-md border px-2.5 py-1.5 text-sm font-medium transition-base ${
            darkMode ? "border-red-900 text-red-400 hover:bg-red-950" : "border-red-200 text-red-600 hover:bg-red-50"
          }`}
        >
          Supprimer le câble
        </button>
      }
    >
      <label className="block">
        <span className={`mb-1 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>Nom (facultatif)</span>
        <input
          type="text"
          value={String(edge.data?.label ?? "")}
          onChange={(e) => updateEdgeData(edge.id, { label: e.target.value })}
          placeholder="ex : VE.Direct, NMEA2000…"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className={`mb-1 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>Type de câble</span>
        <select
          value={String(edge.data?.cableType ?? "other")}
          onChange={(e) => {
            const type = getCableType(e.target.value);
            updateEdgeData(edge.id, { cableType: e.target.value, color: type?.color });
          }}
          className={inputClass}
        >
          {CABLE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <span className={`mt-1 block text-[11px] leading-snug ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
          Un câble de commande ou de bus (VE.Direct, NMEA2000…) peut avoir sa propre couleur.
        </span>
      </label>

      <label className="block">
        <span className={`mb-1 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>Section</span>
        <select value={String(edge.data?.section ?? "")} onChange={(e) => applySection(e.target.value)} className={inputClass}>
          <option value="">—</option>
          {CABLE_SECTIONS.map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
        </select>
      </label>

      <SectionSuggestion edge={edge} nodes={nodes} edges={edges} onApply={applySection} darkMode={darkMode} />

      <label className="block">
        <span className={`mb-1 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>Longueur (facultatif)</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step={0.5}
            value={edge.data?.length ?? ""}
            onChange={(e) => updateEdgeData(edge.id, { length: e.target.value === "" ? undefined : Number(e.target.value) })}
            className={inputClass}
          />
          <span className={`text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>m</span>
        </div>
        <span className={`mt-1 block text-[11px] leading-snug ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
          Sert à calculer les métrages du récapitulatif matériel.
        </span>
      </label>

      <label className="block">
        <span className={`mb-1 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>Couleur</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={String(edge.data?.color ?? "#6b7280")}
            onChange={(e) => updateEdgeData(edge.id, { color: e.target.value })}
            className={`h-8 w-10 cursor-pointer rounded border ${darkMode ? "border-neutral-700" : "border-neutral-300"}`}
          />
          <span className={`text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>Modifiable librement, sans contrainte normative</span>
        </div>
      </label>
    </CardShell>
  );
}

// Un champ de calibre par sortie (retour utilisateur : "possibilité de
// modifier l'intensité de chaque sortie") — générés dynamiquement selon
// `outputCount` plutôt qu'une liste statique dans la définition du
// composant, puisque le nombre de sorties varie par instance.
function FuseBlockOutputs({
  node,
  onChange,
  darkMode,
}: {
  node: SchemaNode;
  onChange: (id: string, patch: Record<string, unknown>) => void;
  darkMode: boolean;
}) {
  const outputCount = Math.max(1, Number(node.data.outputCount) || 1);
  const outputs = Array.from({ length: outputCount }, (_, i) => i + 1);

  return (
    <div className={`rounded-md border p-3 ${darkMode ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-neutral-50"}`}>
      <p className={`text-xs font-semibold ${darkMode ? "text-neutral-200" : "text-neutral-700"}`}>Calibre par sortie</p>
      <p className={`mt-0.5 text-[11px] leading-snug ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
        Chaque fusible de la platine peut avoir son propre calibre.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {outputs.map((i) => (
          <label key={i} className="block">
            <span className={`mb-1 block text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>Sortie {i}</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                value={Number(node.data[`outAmp${i}`] ?? 0)}
                onChange={(e) => onChange(node.id, { [`outAmp${i}`]: Number(e.target.value) })}
                className={`w-full rounded-md border px-2 py-1 text-sm focus:outline-none ${
                  darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-100 focus:border-neutral-400" : "border-neutral-300 focus:border-neutral-900"
                }`}
              />
              <span className={`text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>A</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// Indication automatique pour débutant (retour utilisateur : "pour les
// débutants le calcul automatique en indication") : dès qu'un consommateur
// est relié directement au fusible, son calibre conseillé s'affiche tout
// seul, sans bouton ni saisie — juste une suggestion, jamais appliquée
// automatiquement à la place de l'utilisateur.
function FuseSuggestion({ nodeId, nodes, edges, darkMode }: { nodeId: string; nodes: SchemaNode[]; edges: SchemaEdge[]; darkMode: boolean }) {
  const amps = estimateConnectedAmps(nodeId, nodes, edges);
  if (amps === null) return null;
  return (
    <div
      className={`flex items-start gap-2 rounded-md border p-2.5 ${
        darkMode ? "border-brand-800 bg-brand-950" : "border-brand-200 bg-brand-50"
      }`}
    >
      <VoltaAvatar pose="action" size={32} />
      <p className={`text-[11px] leading-snug ${darkMode ? "text-neutral-300" : "text-neutral-700"}`}>
        Le consommateur relié appelle environ <strong>{amps.toFixed(1)} A</strong> — je te conseille un calibre{" "}
        <strong>{fusibleRecommande(amps)}</strong> (marge de 25 %).
      </p>
    </div>
  );
}

// Assistant de section, sous forme de conseil parlé par Volta plutôt qu'un
// calculateur à remplir (retour utilisateur : "on peut faire parler Volta ?")
// — dès qu'un courant est estimable (même moteur que le recalcul en masse,
// voir evaluateEdgeSection), la section conseillée est calculée et affichée
// directement, sans bouton "Calculer" à cliquer. Repli sur les champs
// manuels seulement quand rien n'est estimable (aucun consommateur en aval
// connu) — l'utilisateur reste toujours libre de choisir une autre section
// dans le menu au-dessus, ceci n'est qu'une suggestion.
function SectionSuggestion({
  edge,
  nodes,
  edges,
  onApply,
  darkMode,
}: {
  edge: SchemaEdge;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  onApply: (section: string) => void;
  darkMode: boolean;
}) {
  const [amps, setAmps] = useState("");
  const [length, setLength] = useState("4");
  const [tension, setTension] = useState("12");
  const [autoEstimated, setAutoEstimated] = useState(false);

  useEffect(() => {
    const v = findBatteryVoltage(nodes);
    setTension(String(v));
    // Somme des consommateurs en aval (retour utilisateur : "il ne calcule
    // pas la section des câbles les plus importants, ceux de la batterie
    // au coupe-circuit ou à la platine de distribution") — pas seulement un
    // consommateur directement raccordé aux deux bouts. Si un fusible
    // principal est plus dimensionnant, on l'utilise comme référence.
    const diagnostic = evaluateEdgeSection(edge, nodes, edges);
    const estimated = diagnostic?.amps ?? estimateEdgeAmps(edge, nodes, edges);
    setAmps(estimated !== null ? String(Math.round(estimated * 10) / 10) : "");
    setAutoEstimated(estimated !== null);
    const sourceType = nodes.find((n) => n.id === edge.source)?.data.componentType;
    const targetType = nodes.find((n) => n.id === edge.target)?.data.componentType;
    setLength(String(edge.data?.length ?? getEdgeDefaultLength(sourceType, targetType, edge.data?.section ?? "", edge.data?.cableType) ?? 4));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edge.id]);

  const i = parseFloat(amps);
  const l = parseFloat(length);
  const t = parseFloat(tension);
  const result = i > 0 && l > 0 && t > 0 ? calcSection(i, l, 3, t) : null;

  const inputClass = `w-full rounded-md border px-2 py-1 text-sm focus:outline-none ${
    darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-100 focus:border-neutral-400" : "border-neutral-300 focus:border-neutral-900"
  }`;

  return (
    <div className={`rounded-md border p-3 ${darkMode ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-neutral-50"}`}>
      <div className="flex items-start gap-2">
        <VoltaAvatar pose={result ? "action" : "perplexe"} size={32} />
        <div className="flex-1">
          {result ? (
            <p className={`text-[11px] leading-snug ${darkMode ? "text-neutral-300" : "text-neutral-700"}`}>
              {autoEstimated ? (
                <>D&apos;après le consommateur relié (≈{amps} A), je te conseille</>
              ) : (
                <>Avec les valeurs ci-dessous, je te conseille</>
              )}{" "}
              une section de <strong>{result.section} mm²</strong> (mini {result.sMin} mm²) — fusible conseillé{" "}
              <strong>{fusibleRecommande(i)}</strong>.
            </p>
          ) : (
            <p className={`text-[11px] leading-snug ${darkMode ? "text-neutral-300" : "text-neutral-700"}`}>
              Je n&apos;ai pas assez d&apos;infos pour te conseiller une section — indique le courant estimé si tu le
              connais.
            </p>
          )}
        </div>
      </div>

      <details className="mt-2">
        <summary className={`cursor-pointer text-[11px] font-medium ${darkMode ? "text-neutral-400 hover:text-neutral-200" : "text-neutral-500 hover:text-neutral-700"}`}>
          {autoEstimated ? "Ajuster les hypothèses" : "Renseigner le courant"}
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="block">
            <span className={`mb-1 block text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>Courant (A)</span>
            <input type="number" value={amps} onChange={(e) => setAmps(e.target.value)} placeholder="ex : 10" className={inputClass} />
          </label>
          <label className="block">
            <span className={`mb-1 block text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>Longueur aller (m)</span>
            <input type="number" value={length} onChange={(e) => setLength(e.target.value)} className={inputClass} />
          </label>
        </div>
        <label className="mt-2 block">
          <span className={`mb-1 block text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>Tension (V)</span>
          <select value={tension} onChange={(e) => setTension(e.target.value)} className={inputClass}>
            <option value="12">12 V</option>
            <option value="24">24 V</option>
            <option value="48">48 V</option>
          </select>
        </label>
        <p className={`mt-1.5 text-[10px] leading-snug ${darkMode ? "text-neutral-600" : "text-neutral-400"}`}>
          Hypothèse par défaut : 4 m aller (8 m aller-retour), fourchette haute usuelle.
        </p>
      </details>

      {result ? (
        <button
          type="button"
          onClick={() => onApply(`${String(result.section).replace(".", ",")} mm²`)}
          className={`mt-2 w-full rounded-md px-2.5 py-1.5 text-xs font-semibold transition-base ${
            darkMode ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
          }`}
        >
          Appliquer cette section
        </button>
      ) : null}
    </div>
  );
}

// Panneau dédié à une zone colorée (retour utilisateur : "créer des carrés
// de couleur pour créer des zones de schéma") — pas de `ComponentDefinition`
// pour ce type, donc un panneau à part plutôt que de forcer l'écran
// générique des composants électriques (champs/marque-modèle n'ont aucun
// sens ici).
function ZonePropertiesCard({ node, darkMode, onClose }: { node: SchemaNode; darkMode: boolean; onClose: () => void }) {
  const updateNodeData = useSchemaStore((s) => s.updateNodeData);
  const deleteSelected = useSchemaStore((s) => s.deleteSelected);
  const color = String(node.data.color ?? ZONE_COLORS[0]);

  const inputClass = `w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none ${
    darkMode ? "border-neutral-700 bg-neutral-800 text-neutral-100 focus:border-neutral-400" : "border-neutral-300 focus:border-neutral-900"
  }`;

  return (
    <CardShell
      title="Zone"
      subtitle="Regroupement visuel"
      darkMode={darkMode}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={() => {
            deleteSelected();
            onClose();
          }}
          className={`w-full rounded-md border px-2.5 py-1.5 text-sm font-medium transition-base ${
            darkMode ? "border-red-900 text-red-400 hover:bg-red-950" : "border-red-200 text-red-600 hover:bg-red-50"
          }`}
        >
          Supprimer la zone
        </button>
      }
    >
      <label className="block">
        <span className={`mb-1 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>Nom</span>
        <input
          type="text"
          value={String(node.data.label ?? "")}
          onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
          className={inputClass}
        />
      </label>

      <div>
        <span className={`mb-1.5 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>Couleur</span>
        <div className="flex flex-wrap gap-2">
          {ZONE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => updateNodeData(node.id, { color: c })}
              title={c}
              className="h-7 w-7 rounded-full border-2 transition-base"
              style={{ backgroundColor: c, borderColor: c === color ? (darkMode ? "#fff" : "#111827") : "transparent" }}
            />
          ))}
        </div>
      </div>

      <p className={`text-[11px] leading-snug ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
        Glisse des composants à l&apos;intérieur pour les regrouper visuellement — aucun lien n&apos;est créé automatiquement, la zone sert
        uniquement de repère. Redimensionnable par les poignées quand elle est sélectionnée.
      </p>
    </CardShell>
  );
}

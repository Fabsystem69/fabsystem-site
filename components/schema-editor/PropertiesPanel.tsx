"use client";

import { useEffect, useState } from "react";
import { useSchemaStore, ZONE_COLORS } from "@/features/schemas/store/useSchemaStore";
import { getComponentDefinition, getConsumerPreset } from "@/lib/electrical-components/definitions";
import { getBrandModelsForType, getBrandModel } from "@/lib/electrical-components/brand-models";
import { CABLE_TYPES, getCableType } from "@/lib/electrical-components/cable-types";
import { calcSection, fusibleRecommande } from "@/lib/calc/section-cable";
import { computeSchemaIssues, type SchemaIssueAction } from "@/lib/electrical-components/checks";
import { estimateConnectedAmps, estimateEdgeAmps, evaluateEdgeSection, findBatteryVoltage } from "@/lib/electrical-components/auto-size";
import { CABLE_SECTIONS } from "@/types/schema";
import { getEdgeDefaultLength } from "@/lib/electrical-components/cable-lengths";
import type { SchemaNode, SchemaEdge } from "@/features/schemas/store/useSchemaStore";

// Colonne droite desktop (CDC §24-25) : propriétés de l'élément sélectionné,
// ou informations du projet si rien n'est sélectionné. Toute modification met
// à jour le schéma immédiatement (data liée en direct au node/edge).
export function PropertiesPanel() {
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const selectedNodeId = useSchemaStore((s) => s.selectedNodeId);
  const selectedEdgeId = useSchemaStore((s) => s.selectedEdgeId);
  const updateNodeData = useSchemaStore((s) => s.updateNodeData);
  const updateEdgeData = useSchemaStore((s) => s.updateEdgeData);
  const setOutputCount = useSchemaStore((s) => s.setOutputCount);
  const deleteSelected = useSchemaStore((s) => s.deleteSelected);
  const duplicateNode = useSchemaStore((s) => s.duplicateNode);
  const rotateNode = useSchemaStore((s) => s.rotateNode);
  const projectName = useSchemaStore((s) => s.projectName);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const hiddenCategories = useSchemaStore((s) => s.hiddenCategories);
  const collapsed = useSchemaStore((s) => s.rightPanelCollapsed);
  const toggleRightPanel = useSchemaStore((s) => s.toggleRightPanel);

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : undefined;
  const selectedEdge = selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) : undefined;

  if (collapsed) {
    return (
      <aside
        className={`flex h-full w-9 shrink-0 flex-col items-center border-l pt-3 ${
          darkMode ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white"
        }`}
      >
        <button
          type="button"
          onClick={toggleRightPanel}
          title="Afficher les propriétés"
          className={`rounded-md border p-1.5 text-xs transition-base ${
            darkMode ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800" : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          ‹
        </button>
      </aside>
    );
  }

  if (selectedNode && selectedNode.data.componentType === "zone") {
    return <ZonePropertiesPanel node={selectedNode} darkMode={darkMode} onCollapse={toggleRightPanel} />;
  }

  if (selectedNode) {
    const def = getComponentDefinition(selectedNode.data.componentType);
    if (!def) return null;

    function handleFieldChange(key: string, value: string | number) {
      if (!selectedNode) return;
      // Cas spécial : le type d'appareil d'un consommateur préremplit nom +
      // puissance typique (retour utilisateur : liste déroulante de
      // consommateurs basiques) — reste modifiable ensuite comme un champ
      // normal.
      if (key === "presetType" && selectedNode.data.componentType === "consumer") {
        const preset = getConsumerPreset(String(value));
        updateNodeData(selectedNode.id, {
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
        setOutputCount(selectedNode.id, Number(value));
        return;
      }
      updateNodeData(selectedNode.id, { [key]: value });
    }

    // Marque/modèle (V2) : le composant reste générique dans la
    // bibliothèque — choisir un modèle ici ne fait que pré-remplir les
    // champs déjà existants avec les valeurs réelles du datasheet. Reste
    // modifiable ensuite comme n'importe quel champ (retour utilisateur
    // implicite du CDC : jamais un second moteur de données qui prendrait
    // le pas sur les champs).
    function handleBrandModelChange(value: string) {
      if (!selectedNode) return;
      if (!value) {
        updateNodeData(selectedNode.id, { brandModelId: "", brand: "", model: "" });
        return;
      }
      const brandModel = getBrandModel(value);
      if (!brandModel) return;
      updateNodeData(selectedNode.id, {
        brandModelId: brandModel.id,
        brand: brandModel.brand,
        model: brandModel.model,
        ...brandModel.defaults,
      });
    }

    const brandModels = getBrandModelsForType(selectedNode.data.componentType);
    const brandModelsByBrand = new Map<string, typeof brandModels>();
    for (const m of brandModels) {
      const list = brandModelsByBrand.get(m.brand) ?? [];
      list.push(m);
      brandModelsByBrand.set(m.brand, list);
    }

    const inputClass = `w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none ${
      darkMode
        ? "border-neutral-700 bg-neutral-800 text-neutral-100 focus:border-neutral-400"
        : "border-neutral-300 focus:border-neutral-900"
    }`;
    const buttonClass = `rounded-md border px-2.5 py-1.5 text-sm font-medium transition-base ${
      darkMode ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800" : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
    }`;

    return (
      <aside className={`flex h-full w-72 shrink-0 flex-col border-l ${darkMode ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white"}`}>
        <div className={`flex items-start justify-between gap-2 border-b px-4 py-3 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
          <div>
            <h2 className={`text-[11px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{def.label}</h2>
            <p className={`text-sm ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>Propriétés du composant</p>
          </div>
          <PanelCollapseButton darkMode={darkMode} onClick={toggleRightPanel} />
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {brandModels.length > 0 ? (
            <label className="block">
              <span className={`mb-1 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>Marque / modèle</span>
              <select
                value={String(selectedNode.data.brandModelId ?? "")}
                onChange={(e) => handleBrandModelChange(e.target.value)}
                className={inputClass}
              >
                <option value="">Générique</option>
                {Array.from(brandModelsByBrand.entries()).map(([brand, models]) => (
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
                <select
                  value={String(selectedNode.data[field.key] ?? "")}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className={inputClass}
                >
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
                    value={Number(selectedNode.data[field.key] ?? 0)}
                    onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    className={inputClass}
                  />
                  {field.unit ? <span className={`text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{field.unit}</span> : null}
                </div>
              ) : (
                <input
                  type="text"
                  value={String(selectedNode.data[field.key] ?? "")}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className={inputClass}
                />
              )}
              {field.help ? (
                <span className={`mt-1 block text-[11px] leading-snug ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{field.help}</span>
              ) : null}
            </label>
          ))}

          {def.type === "fuse" ? <FuseSuggestion nodeId={selectedNode.id} nodes={nodes} edges={edges} darkMode={darkMode} /> : null}
          {def.type === "fuse-block" ? <FuseBlockOutputs node={selectedNode} onChange={updateNodeData} darkMode={darkMode} /> : null}
        </div>

        <div className={`space-y-2 border-t px-4 py-3 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
          <button type="button" onClick={() => rotateNode(selectedNode.id)} title="Pivoter (raccourci : R)" className={`w-full ${buttonClass}`}>
            ↻ Pivoter 90°
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={() => duplicateNode(selectedNode.id)} className={`flex-1 ${buttonClass}`}>
              Dupliquer
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              className={`flex-1 rounded-md border px-2.5 py-1.5 text-sm font-medium transition-base ${
                darkMode ? "border-red-900 text-red-400 hover:bg-red-950" : "border-red-200 text-red-600 hover:bg-red-50"
              }`}
            >
              Supprimer
            </button>
          </div>
        </div>
      </aside>
    );
  }

  if (selectedEdge) {
    const inputClass = `w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none ${
      darkMode
        ? "border-neutral-700 bg-neutral-800 text-neutral-100 focus:border-neutral-400"
        : "border-neutral-300 focus:border-neutral-900"
    }`;

    // Préremplit la longueur avec une moyenne plausible dès qu'une section
    // est choisie, sans écraser une longueur déjà saisie (retour
    // utilisateur : éviter à un débutant d'avoir à la renseigner lui-même).
    function applySection(section: string) {
      if (!selectedEdge) return;
      const patch: Record<string, unknown> = { section };
      if (selectedEdge.data?.length === undefined) {
        const sourceType = nodes.find((n) => n.id === selectedEdge.source)?.data.componentType;
        const targetType = nodes.find((n) => n.id === selectedEdge.target)?.data.componentType;
        const avg = getEdgeDefaultLength(sourceType, targetType, section, selectedEdge.data?.cableType);
        if (avg !== undefined) patch.length = avg;
      }
      updateEdgeData(selectedEdge.id, patch);
    }

    return (
      <aside className={`flex h-full w-72 shrink-0 flex-col border-l ${darkMode ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white"}`}>
        <div className={`flex items-start justify-between gap-2 border-b px-4 py-3 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
          <div>
            <h2 className={`text-[11px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>Câble</h2>
            <p className={`text-sm ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>Propriétés de la connexion</p>
          </div>
          <PanelCollapseButton darkMode={darkMode} onClick={toggleRightPanel} />
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <label className="block">
            <span className={`mb-1 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>Nom (facultatif)</span>
            <input
              type="text"
              value={String(selectedEdge.data?.label ?? "")}
              onChange={(e) => updateEdgeData(selectedEdge.id, { label: e.target.value })}
              placeholder="ex : VE.Direct, NMEA2000…"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={`mb-1 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>Type de câble</span>
            <select
              value={String(selectedEdge.data?.cableType ?? "other")}
              onChange={(e) => {
                const type = getCableType(e.target.value);
                updateEdgeData(selectedEdge.id, { cableType: e.target.value, color: type?.color });
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
            <select
              value={String(selectedEdge.data?.section ?? "")}
              onChange={(e) => applySection(e.target.value)}
              className={inputClass}
            >
              <option value="">—</option>
              {CABLE_SECTIONS.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </label>

          <SectionSuggestion edge={selectedEdge} nodes={nodes} edges={edges} onApply={applySection} darkMode={darkMode} />

          <label className="block">
            <span className={`mb-1 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>Longueur (facultatif)</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={0.5}
                value={selectedEdge.data?.length ?? ""}
                onChange={(e) => updateEdgeData(selectedEdge.id, { length: e.target.value === "" ? undefined : Number(e.target.value) })}
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
                value={String(selectedEdge.data?.color ?? "#6b7280")}
                onChange={(e) => updateEdgeData(selectedEdge.id, { color: e.target.value })}
                className={`h-8 w-10 cursor-pointer rounded border ${darkMode ? "border-neutral-700" : "border-neutral-300"}`}
              />
              <span className={`text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>Modifiable librement, sans contrainte normative</span>
            </div>
          </label>
        </div>

        <div className={`border-t px-4 py-3 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
          <button
            type="button"
            onClick={deleteSelected}
            className={`w-full rounded-md border px-2.5 py-1.5 text-sm font-medium transition-base ${
              darkMode ? "border-red-900 text-red-400 hover:bg-red-950" : "border-red-200 text-red-600 hover:bg-red-50"
            }`}
          >
            Supprimer le câble
          </button>
        </div>
      </aside>
    );
  }

  // Panneau au repos (rien sélectionné) : réduit à une bande étroite pour
  // laisser le plus de place possible au canvas (retour utilisateur :
  // "réduire le bandeau automatiquement... surtout si aucun élément
  // sélectionné") — les panneaux composant/câble ci-dessus restent larges
  // (w-72) puisqu'ils contiennent des formulaires à remplir.
  return (
    <aside className={`flex h-full w-52 shrink-0 flex-col border-l ${darkMode ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white"}`}>
      <div className={`flex items-start justify-between gap-2 border-b px-3 py-3 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
        <div>
          <h2 className={`text-[11px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>Projet</h2>
          <p className={`text-sm ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>Aucun élément sélectionné</p>
        </div>
        <PanelCollapseButton darkMode={darkMode} onClick={toggleRightPanel} />
      </div>
      <div className={`space-y-2 px-3 py-4 text-sm ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>
        <p>
          <span className={`font-medium ${darkMode ? "text-neutral-100" : "text-neutral-900"}`}>{projectName}</span>
        </p>
        {(() => {
          const visibleNodes =
            hiddenCategories.length === 0
              ? nodes
              : nodes.filter((n) => {
                  const def = getComponentDefinition(n.data.componentType);
                  return !def || !hiddenCategories.includes(def.category);
                });
          const isFiltered = visibleNodes.length !== nodes.length;
          const visibleEdges = isFiltered
            ? (() => {
                const visibleIds = new Set(visibleNodes.map((n) => n.id));
                return edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target));
              })()
            : edges;
          return (
            <>
              <p>
                {isFiltered ? `${visibleNodes.length}/${nodes.length}` : nodes.length} composant{nodes.length > 1 ? "s" : ""}
                {isFiltered ? " affichés" : ""}
              </p>
              <p>
                {isFiltered ? `${visibleEdges.length}/${edges.length}` : edges.length} câble{edges.length > 1 ? "s" : ""}
                {isFiltered ? " affichés" : ""}
              </p>
              {isFiltered ? (
                <p className={`text-xs ${darkMode ? "text-amber-400" : "text-amber-600"}`}>Filtre actif — l&apos;export ne prendra que ce qui est affiché.</p>
              ) : null}
            </>
          );
        })()}
      </div>
      <SchemaIssuesPanel nodes={nodes} edges={edges} darkMode={darkMode} />
      <p className={`mt-auto border-t px-3 py-3 text-[10px] leading-snug ${darkMode ? "border-neutral-800 text-neutral-500" : "border-neutral-100 text-neutral-400"}`}>
        Schéma à titre indicatif — à faire vérifier par un professionnel qualifié avant réalisation.
      </p>
    </aside>
  );
}

// Panneau "À vérifier" (CDC §31) : rappels structurels et électriques
// ciblés, jamais une validation réglementaire complète — chaque entrée mène
// au nœud ou au câble concerné. Rien à afficher tant qu'aucun problème n'est
// détecté (pas de message de succès/score, retour utilisateur implicite via
// CDC : pas de gamification).
function SchemaIssuesPanel({ nodes, edges, darkMode }: { nodes: SchemaNode[]; edges: SchemaEdge[]; darkMode: boolean }) {
  const select = useSchemaStore((s) => s.select);
  const recalculateAllCableSections = useSchemaStore((s) => s.recalculateAllCableSections);
  const issues = computeSchemaIssues(nodes, edges);
  if (issues.length === 0) return null;

  function handleIssueAction(action: SchemaIssueAction) {
    if (action === "recalculate-all-cable-sections") recalculateAllCableSections();
  }

  function getIssueActionLabel(action: SchemaIssueAction): string {
    if (action === "recalculate-all-cable-sections") return "Recalculer les sections";
    return "Appliquer";
  }

  return (
    <div className={`border-t px-3 py-4 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
      <h3 className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
        À vérifier ({issues.length})
      </h3>
      <div className="space-y-1.5">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className={`block w-full rounded-md border px-2.5 py-1.5 text-left text-xs transition-base ${
              darkMode
                ? "border-amber-900 bg-amber-950 text-amber-400"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <button
              type="button"
              onClick={() => select(issue.targetKind, issue.targetId)}
              className={`block w-full text-left ${
                darkMode ? "hover:text-amber-300" : "hover:text-amber-900"
              }`}
            >
              {issue.message}
            </button>
            {issue.action ? (
              <button
                type="button"
                onClick={() => handleIssueAction(issue.action!)}
                className={`mt-2 rounded-md border px-2 py-1 text-[11px] font-semibold transition-base ${
                  darkMode
                    ? "border-amber-700 text-amber-200 hover:bg-amber-900"
                    : "border-amber-300 text-amber-900 hover:bg-amber-100"
                }`}
              >
                {getIssueActionLabel(issue.action)}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
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
      className={`rounded-md border p-2.5 text-[11px] leading-snug ${
        darkMode ? "border-brand-800 bg-brand-950 text-neutral-300" : "border-brand-200 bg-brand-50 text-neutral-700"
      }`}
    >
      Suggestion débutant : le consommateur relié appelle environ <strong>{amps.toFixed(1)} A</strong> → calibre
      conseillé <strong>{fusibleRecommande(amps)}</strong> (marge de 25 %).
    </div>
  );
}

// Assistant de section (retour utilisateur : "calcul de section moyen pour
// des allers-retours de 6-8m, fourchette haute"). Réutilise le même moteur
// que le calculateur public /outils/section-cable (lib/calc/section-cable.ts)
// — juste une suggestion facultative, jamais imposée : l'utilisateur choisit
// toujours la section manuellement dans le menu au-dessus.
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
  const [result, setResult] = useState<{ sMin: string; section: number; fusible: string } | null>(null);

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
    const sourceType = nodes.find((n) => n.id === edge.source)?.data.componentType;
    const targetType = nodes.find((n) => n.id === edge.target)?.data.componentType;
    setLength(String(edge.data?.length ?? getEdgeDefaultLength(sourceType, targetType, edge.data?.section ?? "", edge.data?.cableType) ?? 4));
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edge.id]);

  function calculate() {
    const i = parseFloat(amps);
    const l = parseFloat(length);
    const t = parseFloat(tension);
    if (!i || !l || !t || i <= 0 || l <= 0) return;
    const { sMin, section } = calcSection(i, l, 3, t);
    setResult({ sMin, section, fusible: fusibleRecommande(i) });
  }

  const inputClass = `w-full rounded-md border px-2 py-1 text-sm focus:outline-none ${
    darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-100 focus:border-neutral-400" : "border-neutral-300 focus:border-neutral-900"
  }`;

  return (
    <div className={`rounded-md border p-3 ${darkMode ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-neutral-50"}`}>
      <p className={`text-xs font-semibold ${darkMode ? "text-neutral-200" : "text-neutral-700"}`}>Suggérer une section</p>
      <p className={`mt-0.5 text-[11px] leading-snug ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
        Hypothèse par défaut : 4 m aller (8 m aller-retour), fourchette haute usuelle.
      </p>
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

      <button
        type="button"
        onClick={calculate}
        className={`mt-2 w-full rounded-md px-2.5 py-1.5 text-xs font-semibold transition-base ${
          darkMode ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
        }`}
      >
        Calculer
      </button>

      {result ? (
        <div className={`mt-2 rounded-md border p-2 ${darkMode ? "border-brand-800 bg-brand-950" : "border-brand-300 bg-brand-50"}`}>
          <p className={`text-[11px] ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
            Section mini : {result.sMin} mm² · Fusible conseillé : {result.fusible}
          </p>
          <p className={`mt-0.5 text-sm font-bold ${darkMode ? "text-neutral-100" : "text-neutral-900"}`}>{result.section} mm² recommandé</p>
          <button
            type="button"
            onClick={() => onApply(`${String(result.section).replace(".", ",")} mm²`)}
            className={`mt-1.5 w-full rounded-md border px-2 py-1 text-[11px] font-semibold transition-base ${
              darkMode
                ? "border-neutral-100 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-900"
                : "border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white"
            }`}
          >
            Appliquer cette section
          </button>
        </div>
      ) : null}
    </div>
  );
}

// Panneau dédié à une zone colorée (retour utilisateur : "créer des carrés
// de couleur pour créer des zones de schéma") — pas de `ComponentDefinition`
// pour ce type, donc un panneau à part plutôt que de forcer l'écran
// générique des composants électriques (champs/marque-modèle n'ont aucun
// sens ici).
function ZonePropertiesPanel({ node, darkMode, onCollapse }: { node: SchemaNode; darkMode: boolean; onCollapse: () => void }) {
  const updateNodeData = useSchemaStore((s) => s.updateNodeData);
  const deleteSelected = useSchemaStore((s) => s.deleteSelected);
  const color = String(node.data.color ?? ZONE_COLORS[0]);

  const inputClass = `w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none ${
    darkMode ? "border-neutral-700 bg-neutral-800 text-neutral-100 focus:border-neutral-400" : "border-neutral-300 focus:border-neutral-900"
  }`;

  return (
    <aside className={`flex h-full w-72 shrink-0 flex-col border-l ${darkMode ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white"}`}>
      <div className={`flex items-start justify-between gap-2 border-b px-4 py-3 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
        <div>
          <h2 className={`text-[11px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>Zone</h2>
          <p className={`text-sm ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>Regroupement visuel</p>
        </div>
        <PanelCollapseButton darkMode={darkMode} onClick={onCollapse} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
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
      </div>

      <div className={`border-t px-4 py-3 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
        <button
          type="button"
          onClick={deleteSelected}
          className={`w-full rounded-md border px-2.5 py-1.5 text-sm font-medium transition-base ${
            darkMode ? "border-red-900 text-red-400 hover:bg-red-950" : "border-red-200 text-red-600 hover:bg-red-50"
          }`}
        >
          Supprimer la zone
        </button>
      </div>
    </aside>
  );
}

function PanelCollapseButton({ darkMode, onClick }: { darkMode: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Réduire le panneau propriétés"
      className={`shrink-0 rounded-md border p-1.5 text-xs transition-base ${
        darkMode ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800" : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
      }`}
    >
      ›
    </button>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import { NodePropertiesCard, EdgePropertiesCard, ZonePropertiesCard, useBrandModelSelector } from "./ItemPropertiesPopup";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";
import { getEdgeDefaultLength } from "@/lib/electrical-components/cable-lengths";
import { CABLE_SECTIONS } from "@/types/schema";
import { RibbonButton, RibbonDivider } from "./RibbonControls";

// Onglet contextuel "Propriétés" (retour utilisateur : "intègre le bandeau
// droit propriété avec les mêmes fonctions mais dans le bandeau supérieur,
// toujours même principe, c'est pour l'autre reste réduit") — n'existe dans
// la barre d'onglets QUE quand un élément est sélectionné (voir Ribbon.tsx,
// qui bascule aussi dessus automatiquement à la sélection), sur le modèle
// des onglets contextuels "Format" de Word/Excel qui n'apparaissent que
// pour une image/un tableau sélectionné.
//
// Retour utilisateur : "réfléchis à comment intégrer les informations du
// bouton Modifier dans la barre supérieure, au moins le principal" — le nom
// (tous types) et le champ le plus significatif (le champ affiché en
// pastille sur la vignette pour un composant, la section pour un câble)
// sont maintenant des champs directs dans la rangée, pas seulement
// accessibles via le panneau déroulant. Le reste (tous les autres champs,
// trop nombreux et variés par type pour tenir dans 56px) reste dans ce
// panneau, renommé "Spécificité" (retour utilisateur) — voir
// ItemPropertiesPopup.tsx, logique métier inchangée.
const inlineInputClass = (darkMode: boolean) =>
  `rounded border px-1.5 py-1 text-xs focus:outline-none ${
    darkMode ? "border-neutral-700 bg-neutral-800 text-neutral-100 focus:border-neutral-400" : "border-neutral-300 bg-white focus:border-neutral-900"
  }`;

export function PropertiesTab({ darkMode }: { darkMode: boolean }) {
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const selectedNodeId = useSchemaStore((s) => s.selectedNodeId);
  const selectedEdgeId = useSchemaStore((s) => s.selectedEdgeId);
  const rotateNode = useSchemaStore((s) => s.rotateNode);
  const duplicateNode = useSchemaStore((s) => s.duplicateNode);
  const deleteSelected = useSchemaStore((s) => s.deleteSelected);
  const updateNodeData = useSchemaStore((s) => s.updateNodeData);
  const updateEdgeData = useSchemaStore((s) => s.updateEdgeData);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEscapeToClose(() => setDetailsOpen(false));

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : undefined;
  const selectedEdge = selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) : undefined;
  // Retour utilisateur : "rajoute marque modèle juste après le nom" —
  // appelé sans condition (règle des Hooks), no-op tant qu'il n'y a pas de
  // composant sélectionné (voir la signature `node | undefined` du Hook).
  const { brandModels, brandModelsByBrand, handleBrandModelChange } = useBrandModelSelector(selectedNode);

  // Pas besoin de refermer "Spécificité" au changement de sélection : le
  // panneau est dérivé de selectedNode/selectedEdge au rendu, il affiche
  // donc déjà les champs du nouvel élément sans action supplémentaire.
  useEffect(() => {
    if (!detailsOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setDetailsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [detailsOpen]);

  if (!selectedNode && !selectedEdge) return null;

  const isZone = selectedNode?.data.componentType === "zone";
  const def = selectedNode && !isZone ? getComponentDefinition(selectedNode.data.componentType) : undefined;
  const title = isZone ? "Zone" : def ? def.label : selectedEdge ? "Câble" : "";
  const mirrored = selectedNode ? Boolean(selectedNode.data.mirrored) : false;

  // Champ principal d'un composant : celui affiché en pastille sur la
  // vignette (def.badge.field), le repère le plus utile pour dimensionner
  // sans ouvrir "Spécificité" (ampérage d'un fusible, puissance d'un
  // panneau…). Absent pour les composants sans pastille (busbar…).
  const badgeField = def?.badge ? def.fields.find((f) => f.key === def.badge!.field && f.type === "number") : undefined;

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
    <div className="flex items-center gap-1" ref={containerRef}>
      <div className="flex w-20 shrink-0 flex-col items-center gap-0.5 px-1.5 py-1.5 text-center">
        <span className="text-lg leading-none">{isZone ? "▭" : selectedEdge ? "⏤" : "🔧"}</span>
        <span className={`truncate text-[10px] font-medium leading-tight ${darkMode ? "text-neutral-300" : "text-neutral-600"}`} title={title}>
          {title}
        </span>
      </div>

      <RibbonDivider darkMode={darkMode} />

      {/* Retour utilisateur : "pareil pour nom et capacité, pense à
          vraiment aérer" — chaque champ dans son propre groupe séparé par
          une mini-barre, plutôt qu'un seul bloc tassé (gap-1.5 seul,
          version précédente). */}
      {selectedNode ? (
        <label className="flex flex-col gap-0.5 px-2">
          <span className={`text-[9px] font-medium uppercase tracking-wide ${darkMode ? "text-neutral-600" : "text-neutral-400"}`}>Nom</span>
          <input
            type="text"
            value={String(selectedNode.data.label ?? "")}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
            className={`${inlineInputClass(darkMode)} w-28`}
          />
        </label>
      ) : selectedEdge ? (
        <label className="flex flex-col gap-0.5 px-2">
          <span className={`text-[9px] font-medium uppercase tracking-wide ${darkMode ? "text-neutral-600" : "text-neutral-400"}`}>Nom</span>
          <input
            type="text"
            value={String(selectedEdge.data?.label ?? "")}
            onChange={(e) => updateEdgeData(selectedEdge.id, { label: e.target.value })}
            placeholder="Facultatif"
            className={`${inlineInputClass(darkMode)} w-28`}
          />
        </label>
      ) : null}

      {/* Retour utilisateur : "rajoute marque modèle juste après le nom" —
          même sélecteur que dans "Spécificité" (voir useBrandModelSelector),
          absent pour les composants sans modèle catalogué (busbar…) ou pour
          une zone. */}
      {selectedNode && !isZone && brandModels.length > 0 ? (
        <>
          <RibbonDivider darkMode={darkMode} />
          <label className="flex flex-col gap-0.5 px-2">
            <span className={`text-[9px] font-medium uppercase tracking-wide ${darkMode ? "text-neutral-600" : "text-neutral-400"}`}>Marque / modèle</span>
            <select
              value={String(selectedNode.data.brandModelId ?? "")}
              onChange={(e) => handleBrandModelChange(e.target.value)}
              className={`${inlineInputClass(darkMode)} w-40`}
            >
              <option value="">Générique</option>
              {Array.from(brandModelsByBrand.entries()).map(([brand, models]) => (
                <optgroup key={brand} label={brand}>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.model}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </>
      ) : null}

      {selectedNode && badgeField ? (
        <>
          <RibbonDivider darkMode={darkMode} />
          <label className="flex flex-col gap-0.5 px-2">
            <span className={`text-[9px] font-medium uppercase tracking-wide ${darkMode ? "text-neutral-600" : "text-neutral-400"}`}>{badgeField.label}</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={Number(selectedNode.data[badgeField.key] ?? 0)}
                onChange={(e) => updateNodeData(selectedNode.id, { [badgeField.key]: Number(e.target.value) })}
                min={badgeField.type === "number" ? badgeField.min : undefined}
                max={badgeField.type === "number" ? badgeField.max : undefined}
                step={badgeField.type === "number" ? badgeField.step : undefined}
                className={`${inlineInputClass(darkMode)} w-16`}
              />
              {badgeField.type === "number" && badgeField.unit ? (
                <span className={`text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{badgeField.unit}</span>
              ) : null}
            </div>
          </label>
        </>
      ) : null}

      {selectedEdge ? (
        <>
          <RibbonDivider darkMode={darkMode} />
          <label className="flex flex-col gap-0.5 px-2">
            <span className={`text-[9px] font-medium uppercase tracking-wide ${darkMode ? "text-neutral-600" : "text-neutral-400"}`}>Section</span>
            <select value={String(selectedEdge.data?.section ?? "")} onChange={(e) => applySection(e.target.value)} className={`${inlineInputClass(darkMode)} w-24`}>
              <option value="">—</option>
              {CABLE_SECTIONS.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : null}

      {/* Retour utilisateur : "intègre le zoom aussi" puis "sépare avec
          mini barre et zoom renomme en taille" — "Taille d'affichage"
          (agrandit uniquement cette vignette, ×1 à ×5), jusqu'ici
          accessible seulement via "Spécificité". */}
      {selectedNode && !isZone ? (
        <>
          <RibbonDivider darkMode={darkMode} />
          <label className="flex flex-col gap-0.5 px-2">
            <span className={`flex items-center justify-between gap-2 text-[9px] font-medium uppercase tracking-wide ${darkMode ? "text-neutral-600" : "text-neutral-400"}`}>
              <span>Taille</span>
              <span>×{Number(selectedNode.data.displayScale) || 1}</span>
            </span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={Number(selectedNode.data.displayScale) || 1}
              onChange={(e) => updateNodeData(selectedNode.id, { displayScale: Number(e.target.value) })}
              title="Taille d'affichage de cette vignette"
              className="w-20"
            />
          </label>
        </>
      ) : null}

      <RibbonDivider darkMode={darkMode} />

      {selectedNode && !isZone ? (
        <>
          <RibbonButton darkMode={darkMode} onClick={() => rotateNode(selectedNode.id)} icon="↻" label="Pivoter" title="Pivoter 90° (raccourci : R)" />
          {/* Retour utilisateur : "il manque le bouton miroir également" —
              existait déjà en accès rapide flottant sur la vignette
              sélectionnée (ElectricalNode.tsx), mais pas ici dans le ruban. */}
          <RibbonButton
            darkMode={darkMode}
            onClick={() => updateNodeData(selectedNode.id, { mirrored: !mirrored })}
            active={mirrored}
            icon="⇋"
            label="Miroir"
            title="Miroir horizontal (inverse gauche/droite des bornes)"
          />
        </>
      ) : null}
      {selectedNode ? (
        <RibbonButton darkMode={darkMode} onClick={() => duplicateNode(selectedNode.id)} icon="⧉" label="Dupliquer" title="Dupliquer" />
      ) : null}
      <RibbonButton
        darkMode={darkMode}
        onClick={deleteSelected}
        icon="🗑️"
        label="Supprimer"
        title={selectedEdge ? "Supprimer le câble" : isZone ? "Supprimer la zone" : "Supprimer"}
      />

      <RibbonDivider darkMode={darkMode} />

      <div className="relative">
        <RibbonButton darkMode={darkMode} onClick={() => setDetailsOpen((v) => !v)} active={detailsOpen} icon="⚙️" label="Spécificité" title="Tous les champs de cet élément" />
        {detailsOpen ? (
          <div className="absolute left-0 top-full z-10 mt-1 w-96">
            {isZone && selectedNode ? (
              <ZonePropertiesCard node={selectedNode} darkMode={darkMode} onClose={() => setDetailsOpen(false)} />
            ) : selectedNode ? (
              <NodePropertiesCard node={selectedNode} nodes={nodes} edges={edges} darkMode={darkMode} onClose={() => setDetailsOpen(false)} />
            ) : selectedEdge ? (
              <EdgePropertiesCard edge={selectedEdge} nodes={nodes} edges={edges} darkMode={darkMode} onClose={() => setDetailsOpen(false)} />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import { NodePropertiesCard, EdgePropertiesCard, ZonePropertiesCard } from "./ItemPropertiesPopup";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";
import { RibbonButton, RibbonDivider } from "./RibbonControls";

// Onglet contextuel "Propriétés" (retour utilisateur : "intègre le bandeau
// droit propriété avec les mêmes fonctions mais dans le bandeau supérieur,
// toujours même principe, c'est pour l'autre reste réduit") — n'existe dans
// la barre d'onglets QUE quand un élément est sélectionné (voir Ribbon.tsx,
// qui bascule aussi dessus automatiquement à la sélection), sur le modèle
// des onglets contextuels "Format" de Word/Excel qui n'apparaissent que
// pour une image/un tableau sélectionné. Les actions les plus fréquentes
// (Dupliquer/Pivoter/Supprimer) sont directement dans la rangée ; le
// formulaire complet (tous les champs par type de composant, inchangé —
// voir ItemPropertiesPopup.tsx) reste dans un panneau déroulant "Modifier",
// les champs étant trop nombreux et trop variés par type pour tenir dans
// une seule rangée de 56px.
export function PropertiesTab({ darkMode }: { darkMode: boolean }) {
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const selectedNodeId = useSchemaStore((s) => s.selectedNodeId);
  const selectedEdgeId = useSchemaStore((s) => s.selectedEdgeId);
  const rotateNode = useSchemaStore((s) => s.rotateNode);
  const duplicateNode = useSchemaStore((s) => s.duplicateNode);
  const deleteSelected = useSchemaStore((s) => s.deleteSelected);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEscapeToClose(() => setDetailsOpen(false));

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : undefined;
  const selectedEdge = selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) : undefined;

  // Pas besoin de refermer "Modifier" au changement de sélection : le
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

  return (
    <div className="flex items-center gap-1" ref={containerRef}>
      <div className="flex w-20 shrink-0 flex-col items-center gap-0.5 px-1.5 py-1.5 text-center">
        <span className="text-lg leading-none">{isZone ? "▭" : selectedEdge ? "⏤" : "🔧"}</span>
        <span className={`truncate text-[10px] font-medium leading-tight ${darkMode ? "text-neutral-300" : "text-neutral-600"}`} title={title}>
          {title}
        </span>
      </div>

      <RibbonDivider darkMode={darkMode} />

      {selectedNode && !isZone ? (
        <RibbonButton darkMode={darkMode} onClick={() => rotateNode(selectedNode.id)} icon="↻" label="Pivoter" title="Pivoter 90° (raccourci : R)" />
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
        <RibbonButton darkMode={darkMode} onClick={() => setDetailsOpen((v) => !v)} active={detailsOpen} icon="⚙️" label="Modifier" title="Tous les champs de cet élément" />
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

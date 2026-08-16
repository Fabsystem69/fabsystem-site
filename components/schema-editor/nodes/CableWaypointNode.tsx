"use client";

import { type NodeProps } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";

// Point de coude d'un câble déplacé, matérialisé en vrai nœud React Flow
// (retour utilisateur : "la vignette câble devrait avoir les mêmes
// propriétés qu'une vignette item, car celle-ci sont bien déplaçables et
// les câbles les suivent parfaitement") — se déplace avec le même
// mécanisme natif que n'importe quel composant du schéma (pointer capture,
// z-index, gestion multi-glisser… tout ça vient gratuitement de React Flow
// au lieu d'une réimplémentation maison, qui a montré ses limites sur les
// glissers répétés). N'est jamais ajouté aux nœuds persistés du schéma —
// voir Canvas.tsx, qui le construit à la volée depuis `edge.data.bendPoint`
// et intercepte son déplacement pour le réécrire là, pas dans un nœud.
export function CableWaypointNode({ data }: NodeProps) {
  const darkMode = useSchemaStore((s) => s.darkMode);
  const updateEdgeData = useSchemaStore((s) => s.updateEdgeData);
  const edgeId = data.edgeId as string;
  const label = data.label as string;

  return (
    <div
      onDoubleClick={(event) => {
        event.stopPropagation();
        updateEdgeData(edgeId, { bendPoint: undefined });
      }}
      title="Glisser pour réorganiser ce câble · double-clic pour revenir au tracé automatique"
      className={`cursor-grab whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-medium shadow-sm active:cursor-grabbing ${
        darkMode ? "border-neutral-700 bg-neutral-800 text-neutral-300" : "border-neutral-200 bg-white text-neutral-600"
      }`}
    >
      {label}
    </div>
  );
}

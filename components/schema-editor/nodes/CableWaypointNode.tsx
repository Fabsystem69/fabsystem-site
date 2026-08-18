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
// voir Canvas.tsx, qui le construit à la volée depuis
// `edge.data.bendPoints[index]` et intercepte son déplacement pour le
// réécrire là, pas dans un nœud.
//
// Un câble peut porter plusieurs points (retour utilisateur : "poignées/
// points intermédiaires sur les câbles… pour dévier proprement") : chaque
// point porte son propre bouton "+" (ajouter le suivant) et "×" (retirer
// seulement celui-ci) — nodrag/nopan (convention React Flow) pour que ces
// petits boutons ne déclenchent pas le glisser du point lui-même.
export function CableWaypointNode({ data }: NodeProps) {
  const darkMode = useSchemaStore((s) => s.darkMode);
  const addEdgeWaypointAfter = useSchemaStore((s) => s.addEdgeWaypointAfter);
  const removeEdgeWaypoint = useSchemaStore((s) => s.removeEdgeWaypoint);
  const edgeId = data.edgeId as string;
  const index = data.index as number;
  const label = data.label as string | undefined;

  const miniButtonClass = `nodrag nopan flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold leading-none transition-base ${
    darkMode ? "text-neutral-400 hover:bg-neutral-700 hover:text-neutral-100" : "text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"
  }`;

  return (
    <div
      title={label ? "Glisser pour réorganiser ce câble" : "Glisser pour dévier le câble à cet endroit"}
      className={`flex cursor-grab items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-medium shadow-sm active:cursor-grabbing ${
        darkMode ? "border-neutral-700 bg-neutral-800 text-neutral-300" : "border-neutral-200 bg-white text-neutral-600"
      }`}
    >
      {label ? <span>{label}</span> : <span className={`h-1.5 w-1.5 rounded-full ${darkMode ? "bg-neutral-500" : "bg-neutral-400"}`} />}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          addEdgeWaypointAfter(edgeId, index);
        }}
        title="Ajouter un point de coude ici"
        className={miniButtonClass}
      >
        +
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          removeEdgeWaypoint(edgeId, index);
        }}
        title="Retirer ce point"
        className={miniButtonClass}
      >
        ×
      </button>
    </div>
  );
}

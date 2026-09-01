"use client";

import { type NodeProps } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { useCableLabelCollision } from "../edges/useCableLabelCollision";

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
  const showCableLabels = useSchemaStore((s) => s.showCableLabels);
  const addEdgeWaypointAfter = useSchemaStore((s) => s.addEdgeWaypointAfter);
  const removeEdgeWaypoint = useSchemaStore((s) => s.removeEdgeWaypoint);
  const selectedEdgeId = useSchemaStore((s) => s.selectedEdgeId);
  const select = useSchemaStore((s) => s.select);
  const edgeId = data.edgeId as string;
  const index = data.index as number;
  const label = data.label as string | undefined;
  const expanded = selectedEdgeId === edgeId;
  const visible = expanded || showCableLabels;
  const labelRef = useCableLabelCollision(`${edgeId}::${index}`, visible ? String(data.labelLayoutKey ?? "") : "closed");

  const miniButtonClass = `nodrag nopan flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold leading-none transition-base ${
    darkMode ? "text-neutral-400 hover:bg-neutral-700 hover:text-neutral-100" : "text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"
  }`;

  return (
    <div
      ref={labelRef}
      data-schema-cable-label={`${edgeId}::${index}`}
      title={expanded ? "Glisser pour réorganiser ce câble" : "Cliquer pour afficher ce câble"}
      style={{ transform: "translate(var(--cable-label-offset-x, 0px), var(--cable-label-offset-y, 0px))" }}
      onClick={(event) => {
        event.stopPropagation();
        select("edge", edgeId);
      }}
      className={`flex ${visible ? "cursor-pointer gap-1 px-1.5 py-0.5" : "h-3 w-3 cursor-pointer p-0"} ${expanded ? "active:cursor-grabbing" : ""} items-center whitespace-nowrap rounded border text-[10px] font-medium shadow-sm ${
        darkMode ? "border-neutral-700 bg-neutral-800 text-neutral-300" : "border-neutral-200 bg-white text-neutral-600"
      }`}
    >
      {visible && label ? <span>{label}</span> : <span className={`m-auto h-1.5 w-1.5 rounded-full ${darkMode ? "bg-neutral-500" : "bg-neutral-400"}`} />}
      {expanded ? <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          addEdgeWaypointAfter(edgeId, index);
        }}
        title="Ajouter un point de coude ici"
        className={miniButtonClass}
      >
        +
      </button> : null}
      {expanded ? <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          removeEdgeWaypoint(edgeId, index);
        }}
        title="Retirer ce point"
        className={miniButtonClass}
      >
        ×
      </button> : null}
    </div>
  );
}

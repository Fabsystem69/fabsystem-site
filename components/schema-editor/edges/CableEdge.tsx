"use client";

import { useCallback, useRef } from "react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow, type EdgeProps, type Edge } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import type { CableEdgeData } from "@/types/schema";

// Repère la borne React Flow sous un point écran donné (même technique que
// edgeIdAtPoint dans Canvas.tsx, mais pour une "handle" de nœud plutôt
// qu'une edge) — les attributs data-nodeid/data-handleid sont posés par la
// librairie sur chaque élément Handle.
function handleAtPoint(clientX: number, clientY: number): { nodeId: string; handleId: string | null } | null {
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const el of stack) {
    const match = el.closest<HTMLElement>(".react-flow__handle");
    if (match) {
      const nodeId = match.getAttribute("data-nodeid");
      if (!nodeId) continue;
      return { nodeId, handleId: match.getAttribute("data-handleid") };
    }
  }
  return null;
}

// En mode nuit, un câble noir (polarité négative) devient quasiment invisible
// sur le fond sombre du canvas — retour utilisateur : "les fils noirs
// doivent passer en bleu en mode nuit". Purement un ajustement d'affichage :
// la couleur réellement stockée dans les données du câble ne change pas.
const DARK_MODE_COLOR_OVERRIDE: Record<string, string> = {
  "#111827": "#60a5fa",
  "#000000": "#60a5fa",
};

// Câble = objet à part entière, pas un simple trait (CDC §20-21) : couleur
// logique portée par les données de l'edge, étiquette optionnelle (section).
export function CableEdge({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<Edge<CableEdgeData>>) {
  const darkMode = useSchemaStore((s) => s.darkMode);
  const reconnectEdgeAction = useSchemaStore((s) => s.reconnectEdge);
  const { screenToFlowPosition } = useReactFlow();
  const draggingEnd = useRef<"source" | "target" | null>(null);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const rawColor = data?.color ?? "#6b7280";
  const color = darkMode ? (DARK_MODE_COLOR_OVERRIDE[rawColor.toLowerCase()] ?? rawColor) : rawColor;
  // La longueur affichée sur le câble lui-même (retour utilisateur : sans
  // elle, un schéma partagé "n'a aucun sens" pour qui n'a pas accès au
  // panneau de propriétés) — pas seulement dans le récapitulatif matériel.
  const lengthLabel = typeof data?.length === "number" ? `${String(data.length).replace(".", ",")} m` : undefined;
  const captionParts = [data?.label, data?.section, lengthLabel].filter(Boolean);

  // Poignées de reconnexion maison (retour utilisateur : "la possibilité de
  // déplacer les câbles librement" ne marchait pas de façon fiable) — le
  // mécanisme natif de React Flow place sa zone de reconnexion exactement
  // sous la borne du nœud, qui est peinte par-dessus et capte le clic en
  // premier : glisser depuis le centre visuel d'une borne démarrait toujours
  // un nouveau câble au lieu de déplacer l'existant. Ici on gère nous-mêmes
  // le geste (pointer capture + recherche de la borne sous le curseur au
  // relâchement) avec un z-index qui passe devant les nœuds.
  const handlePointerDown = useCallback(
    (end: "source" | "target") => (event: React.PointerEvent) => {
      event.stopPropagation();
      event.preventDefault();
      draggingEnd.current = end;
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    },
    [],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      const end = draggingEnd.current;
      draggingEnd.current = null;
      if (!end) return;
      const dropped = handleAtPoint(event.clientX, event.clientY);
      if (!dropped) return;
      const newConnection =
        end === "target"
          ? { source, sourceHandle: sourceHandleId ?? null, target: dropped.nodeId, targetHandle: dropped.handleId }
          : { source: dropped.nodeId, sourceHandle: dropped.handleId, target, targetHandle: targetHandleId ?? null };
      reconnectEdgeAction(
        { id, source, target, sourceHandle: sourceHandleId ?? null, targetHandle: targetHandleId ?? null, type: "cable", data },
        newConnection,
      );
    },
    [id, source, target, sourceHandleId, targetHandleId, data, reconnectEdgeAction],
  );

  return (
    <>
      <BaseEdge id={id} path={edgePath} interactionWidth={24} style={{ stroke: color, strokeWidth: selected ? 3 : 2 }} />
      <EdgeLabelRenderer>
        {captionParts.length > 0 ? (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
            }}
            className={`rounded border px-1.5 py-0.5 text-[10px] font-medium shadow-sm ${
              darkMode ? "border-neutral-700 bg-neutral-800 text-neutral-300" : "border-neutral-200 bg-white text-neutral-600"
            }`}
          >
            {captionParts.join(" · ")}
          </div>
        ) : null}

        {([
          ["source", sourceX, sourceY],
          ["target", targetX, targetY],
        ] as const).map(([end, x, y]) => (
          <div
            key={end}
            onPointerDown={handlePointerDown(end)}
            onPointerUp={handlePointerUp}
            title="Glisser pour reconnecter ce câble"
            style={{
              position: "absolute",
              zIndex: 1001,
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
              width: 16,
              height: 16,
              borderRadius: "50%",
              cursor: "grab",
              pointerEvents: "all",
              background: "transparent",
            }}
          />
        ))}
      </EdgeLabelRenderer>
    </>
  );
}

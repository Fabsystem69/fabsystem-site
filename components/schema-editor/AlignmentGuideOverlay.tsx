"use client";

import { ViewportPortal } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";

// Repère visuel du guide d'alignement magnétique (voir Canvas.tsx
// `snapToConnectedNeighbors`) — une ligne en pointillé, assez longue pour
// couvrir n'importe quel niveau de zoom/pan sans avoir à connaître les
// bornes réelles du viewport. Purement décoratif, jamais interactif.
const GUIDE_EXTENT = 20000;

export function AlignmentGuideOverlay() {
  const guides = useSchemaStore((s) => s.alignmentGuides);
  const darkMode = useSchemaStore((s) => s.darkMode);

  if (guides.x === null && guides.y === null) return null;

  const color = darkMode ? "#f59e0b" : "#d97706";

  return (
    <ViewportPortal>
      <svg style={{ overflow: "visible", pointerEvents: "none" }}>
        {guides.x !== null ? (
          <line x1={guides.x} y1={-GUIDE_EXTENT} x2={guides.x} y2={GUIDE_EXTENT} stroke={color} strokeWidth={1} strokeDasharray="4,4" />
        ) : null}
        {guides.y !== null ? (
          <line x1={-GUIDE_EXTENT} y1={guides.y} x2={GUIDE_EXTENT} y2={guides.y} stroke={color} strokeWidth={1} strokeDasharray="4,4" />
        ) : null}
      </svg>
    </ViewportPortal>
  );
}

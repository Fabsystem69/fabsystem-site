import type { XYPosition } from "@xyflow/react";

/** Centre en coordonnées écran de la zone React Flow réellement visible. */
export function getVisibleCanvasCenter(): XYPosition {
  const canvas = document.querySelector(".react-flow");
  if (canvas instanceof HTMLElement) {
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  // Repli uniquement pendant un montage incomplet du canvas.
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

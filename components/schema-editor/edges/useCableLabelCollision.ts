"use client";

import { useLayoutEffect, useRef } from "react";

const OFFSETS: readonly [number, number][] = [
  [0, 0], [0, -22], [0, 22], [-26, 0], [26, 0],
  [-26, -22], [26, -22], [-26, 22], [26, 22],
  [0, -44], [0, 44],
];

function intersects(a: DOMRect, b: DOMRect) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

// Les étiquettes sont des éléments HTML dans le ViewportPortal React Flow,
// donc elles ne bénéficient pas du routage SVG. Cette petite règle évite que
// deux sections/longueurs se superposent tout en gardant la vignette près de
// son câble. L'ordre par id rend le résultat stable à chaque rendu.
export function useCableLabelCollision(labelId: string, layoutKey: string) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const earlierLabels = Array.from(document.querySelectorAll<HTMLElement>("[data-schema-cable-label]"))
      .filter((candidate) => candidate !== element && (candidate.dataset.schemaCableLabel ?? "") < labelId);

    for (const [x, y] of OFFSETS) {
      element.style.setProperty("--cable-label-offset-x", `${x}px`);
      element.style.setProperty("--cable-label-offset-y", `${y}px`);
      const rect = element.getBoundingClientRect();
      if (!earlierLabels.some((candidate) => intersects(rect, candidate.getBoundingClientRect()))) return;
    }
  }, [labelId, layoutKey]);

  return ref;
}

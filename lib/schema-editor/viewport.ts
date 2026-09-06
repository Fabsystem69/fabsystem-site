import { useEffect, useState } from "react";
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

// Même seuil que Canvas.tsx/ComponentLibrary.tsx (max-width: 767px) — un seul
// endroit pour cette limite, réutilisé partout où l'éditeur a besoin de
// rendre une version mobile et une version bureau réellement séparées (deux
// arbres de rendu distincts), plutôt qu'une seule mise en page hybride à
// coups de classes responsive. Retour utilisateur : un mélange responsive ne
// donne jamais un résultat aussi soigné qu'une version dédiée à chaque cas.
export function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewport = () => setIsMobile(mediaQuery.matches);
    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  return isMobile;
}

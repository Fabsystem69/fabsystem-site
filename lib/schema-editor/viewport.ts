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

// Position en cascade pour l'ajout au clic (bibliothèque, menu mobile) —
// jamais par glisser-déposer, où l'utilisateur choisit lui-même l'endroit.
// Retour utilisateur : "le composant apparaît toujours en dehors de l'écran
// quand on est zoomé" — une tentative précédente (décalage fixe divisé par
// le zoom) restait une approximation : elle suppose que la zone visible est
// assez grande pour ce décalage, ce qui casse sur une fenêtre étroite ou
// après beaucoup d'ajouts (la cascade grandit sans borne). Ici, le nombre de
// colonnes/lignes est calculé à partir de la zone RÉELLEMENT visible
// (rectangle du canvas, coins convertis en coordonnées schéma via
// screenToFlowPosition) : chaque position générée retombe forcément dans ce
// rectangle, quels que soient le zoom, la taille de fenêtre ou le nombre de
// composants déjà posés.
export function computeCascadePosition(
  screenToFlowPosition: (position: XYPosition) => XYPosition,
  index: number,
  spacing: { width: number; height: number } = { width: 220, height: 160 }
): XYPosition {
  const canvas = document.querySelector(".react-flow");
  const rect =
    canvas instanceof HTMLElement
      ? canvas.getBoundingClientRect()
      : ({ left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight } as DOMRect);

  // Marge pour ne jamais coller un composant pile au bord visible (sa
  // vignette et son libellé dépassent légèrement de son point d'ancrage).
  const margin = 60;
  const topLeft = screenToFlowPosition({ x: rect.left + margin, y: rect.top + margin });
  const bottomRight = screenToFlowPosition({ x: rect.right - margin, y: rect.bottom - margin });

  const usableWidth = Math.max(bottomRight.x - topLeft.x, spacing.width);
  const usableHeight = Math.max(bottomRight.y - topLeft.y, spacing.height);

  // Autant de colonnes/lignes que la zone visible peut réellement en
  // contenir avec l'espacement voulu (arrondi au moins 1) — jamais une
  // grille fixe qui suppose une certaine taille d'écran.
  const columns = Math.max(1, Math.floor(usableWidth / spacing.width));
  const rows = Math.max(1, Math.floor(usableHeight / spacing.height));
  const col = index % columns;
  const row = Math.floor(index / columns) % rows;

  return {
    x: topLeft.x + col * (usableWidth / columns),
    y: topLeft.y + row * (usableHeight / rows),
  };
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

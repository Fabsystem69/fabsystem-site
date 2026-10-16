// Cadrage "réseaux sociaux" (retour utilisateur : "quand je partage le png
// sur facebook la résolution est mauvaise car l'image est trop grande") —
// Facebook redimensionne toute image au-delà de 2048 px sur le grand côté
// puis la recompresse fortement : on livre directement 2048 px, dans un
// ratio que le fil d'actualité affiche sans recadrer (entre 4:5 portrait et
// 1.91:1 paysage), le schéma centré sur fond blanc.
export const SOCIAL_LONG_EDGE_PX = 2048;
const MIN_ASPECT = 0.8; // 4:5 portrait
const MAX_ASPECT = 1.91; // paysage lien/photo
const GOOD_SCALE = 0.5;
const FAIR_SCALE = 0.33;

export type SocialReadability = "good" | "fair" | "poor";

export interface SocialFrame {
  canvasWidth: number;
  canvasHeight: number;
  drawWidth: number;
  drawHeight: number;
  offsetX: number;
  offsetY: number;
  // Rapport pixels finaux / pixels du schéma : en dessous de ~0,33 le texte
  // des composants devient trop petit pour être lu sur un téléphone.
  scale: number;
  readability: SocialReadability;
}

export function computeSocialFrame(source: { width: number; height: number }): SocialFrame {
  const sourceAspect = source.width / source.height;
  const aspect = Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, sourceAspect));
  const canvasWidth = aspect >= 1 ? SOCIAL_LONG_EDGE_PX : Math.round(SOCIAL_LONG_EDGE_PX * aspect);
  const canvasHeight = aspect >= 1 ? Math.round(SOCIAL_LONG_EDGE_PX / aspect) : SOCIAL_LONG_EDGE_PX;
  const scale = Math.min(canvasWidth / source.width, canvasHeight / source.height);
  const drawWidth = Math.round(source.width * scale);
  const drawHeight = Math.round(source.height * scale);
  const readability: SocialReadability = scale >= GOOD_SCALE ? "good" : scale >= FAIR_SCALE ? "fair" : "poor";

  return {
    canvasWidth,
    canvasHeight,
    drawWidth,
    drawHeight,
    offsetX: Math.round((canvasWidth - drawWidth) / 2),
    offsetY: Math.round((canvasHeight - drawHeight) / 2),
    scale,
    readability,
  };
}

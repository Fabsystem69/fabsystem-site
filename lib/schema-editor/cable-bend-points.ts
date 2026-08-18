import type { CableEdgeData } from "@/types/schema";

// Lit les points de coude d'un câble, `bendPoints` (nouveau, plusieurs
// points) ou `bendPoint` (ancien format, un seul point — schémas
// sauvegardés avant ce changement) : seul endroit du code qui doit encore
// connaître l'ancien champ. Module neutre (ni composant, ni store) pour
// que CableEdge.tsx, Canvas.tsx et useSchemaStore.ts puissent tous
// l'importer sans dépendance circulaire.
export function getBendPoints(data: CableEdgeData | undefined): { x: number; y: number }[] {
  if (data?.bendPoints && data.bendPoints.length > 0) return data.bendPoints;
  if (data?.bendPoint) return [data.bendPoint];
  return [];
}

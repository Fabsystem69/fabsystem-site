"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { ViewportPortal } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { DARK_MODE_COLOR_OVERRIDE, THREE_CONDUCTOR_SECTIONS, parseSectionMm2, strokeWidthForSection } from "@/components/schema-editor/edges/CableEdge";

// Retour utilisateur : "si un câble différent se croise, je veux qu'il y
// ait un petit sursaut pour faire comprendre que ce n'est pas une épissure"
// — deux câbles qui se croisent sans être électriquement reliés (aucun
// nœud commun) doivent se distinguer visuellement d'une vraie jonction.
//
// Approche : plutôt que de recalculer nous-mêmes la géométrie de chaque
// tracé (dupliquer la logique de coudes de CableEdge, avec ses arrondis et
// son point de coude optionnel), on lit directement les <path> déjà rendus
// par React Flow dans le DOM et on les échantillonne avec
// `getPointAtLength` — toujours pixel-exact avec ce qui est réellement
// affiché, tracé automatique ou point de coude manuel confondus.
const MASK_RADIUS = 8;
const LEG = 11;
const BUMP_HEIGHT = 6;
// Retour utilisateur : "si câble croise d'autre câble tu fais le sursaut
// plus grand" — uniquement pour un câble simple (le rendu 3G/3-conducteurs
// est décoratif, voir isThreeConductor dans CableEdge : un sursaut plus
// large s'y désolidariserait visiblement des 3 traits parallèles réels).
const BUMP_HEIGHT_LARGE = 10;
const SAMPLE_STEP = 8;
// Un sursaut doit rester lisible et ne jamais sembler sortir d'une borne.
// Ces distances sont mesurées à l'écran : le résultat reste cohérent quel
// que soit le niveau de zoom du canvas.
const NODE_CLEARANCE_PX = 30;
const MIN_BUMP_SEPARATION_PX = 44;
// Retour utilisateur : "empêche-les dans les courbes, le fil donne
// l'impression d'être coupé" — le sursaut suppose une portion de câble
// localement DROITE de chaque côté du croisement (une jambe rectiligne
// puis une bosse) ; sur l'arrondi d'un coude (voir `getBend` dans
// CableEdge.tsx), la vraie tangente tourne sur quelques échantillons, donc
// la jambe redessinée en ligne droite décroche visiblement du tracé courbe
// réel. Un croisement détecté trop près d'un virage est donc ignoré plutôt
// qu'affiché de travers.
const MAX_BEND_ANGLE_DEG = 10;

interface Point {
  x: number;
  y: number;
}

interface Crossing {
  key: string;
  point: Point;
  straight: { tangent: Point; color: string; strokeWidth: number; dasharray?: string };
  jumper: { tangent: Point; color: string; strokeWidth: number; dasharray?: string; bumpHeight: number };
  maskColor: string;
}

function samplePath(pathEl: SVGPathElement): Point[] {
  const len = pathEl.getTotalLength();
  if (!len) return [];
  const n = Math.max(2, Math.min(120, Math.ceil(len / SAMPLE_STEP)));
  const pts: Point[] = [];
  for (let i = 0; i <= n; i++) {
    const p = pathEl.getPointAtLength((i / n) * len);
    pts.push({ x: p.x, y: p.y });
  }
  return pts;
}

// Intersection de deux segments (pas de simples droites infinies) : ne
// retourne un point que si le croisement tombe réellement à l'intérieur
// des deux segments — exclut les cas parallèles et les simples contacts en
// bout de segment.
function segmentIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
  const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;
  if (t <= 0 || t >= 1 || u <= 0 || u >= 1) return null;
  return { x: p1.x + t * d1x, y: p1.y + t * d1y };
}

// Angle (degrés) entre la direction juste avant et juste après `index` —
// proche de 0 sur une portion droite, nettement plus grand sur l'arrondi
// d'un coude.
function localTurnAngleDeg(pts: Point[], index: number): number {
  const a = pts[Math.max(0, index - 1)];
  const b = pts[index];
  const c = pts[Math.min(pts.length - 1, index + 2)];
  const v1 = { x: b.x - a.x, y: b.y - a.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const len1 = Math.hypot(v1.x, v1.y) || 1;
  const len2 = Math.hypot(v2.x, v2.y) || 1;
  const cos = (v1.x * v2.x + v1.y * v2.y) / (len1 * len2);
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

function normalize(v: Point): Point {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

function bumpPath(point: Point, tangent: Point, bumpHeight: number): string {
  const u = normalize(tangent);
  const perp = { x: -u.y, y: u.x };
  const start = { x: point.x - u.x * LEG, y: point.y - u.y * LEG };
  const end = { x: point.x + u.x * LEG, y: point.y + u.y * LEG };
  const control = { x: point.x + perp.x * bumpHeight * 2, y: point.y + perp.y * bumpHeight * 2 };
  return `M${start.x} ${start.y}Q${control.x} ${control.y} ${end.x} ${end.y}`;
}

function straightLegPath(point: Point, tangent: Point): string {
  const u = normalize(tangent);
  const start = { x: point.x - u.x * LEG, y: point.y - u.y * LEG };
  const end = { x: point.x + u.x * LEG, y: point.y + u.y * LEG };
  return `M${start.x} ${start.y}L${end.x} ${end.y}`;
}

function distanceToRect(point: Point, rect: DOMRect): number {
  const dx = Math.max(rect.left - point.x, 0, point.x - rect.right);
  const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
  return Math.hypot(dx, dy);
}

function pointOnScreen(path: SVGPathElement, point: Point): Point | null {
  const matrix = path.ownerSVGElement?.getScreenCTM();
  if (!matrix) return null;
  const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(matrix);
  return { x: screenPoint.x, y: screenPoint.y };
}

export function CableCrossingOverlay({ suspended = false }: { suspended?: boolean }) {
  const currentEdges = useSchemaStore((s) => s.edges);
  const currentNodes = useSchemaStore((s) => s.nodes);
  const darkMode = useSchemaStore((s) => s.darkMode);
  // Le déplacement reste prioritaire. Les rebonds se mettent à jour dès que
  // le navigateur a un moment libre, puis après un court silence ci-dessous.
  const edges = useDeferredValue(currentEdges);
  const nodes = useDeferredValue(currentNodes);
  const [crossings, setCrossings] = useState<Crossing[]>([]);

  useEffect(() => {
    // La détection compare chaque câble aux autres et échantillonne leurs
    // tracés dans le DOM. Elle n'a aucune valeur pendant un glisser : le
    // résultat serait périmé dès l'image suivante. On la reprend au dépôt.
    if (suspended) {
      setCrossings([]);
      return;
    }

    // Un léger différé (après paint + un court silence) plutôt qu'un
    // recalcul à chaque frame de glisser : cette détection lit le DOM déjà
    // rendu, donc doit attendre le prochain paint, et un débounce évite de
    // relancer O(E²) comparaisons de segments à chaque pixel de déplacement
    // pendant un glisser de nœud.
    const timeout = setTimeout(() => {
      const edgeEls = new Map<string, SVGPathElement>();
      document.querySelectorAll<HTMLElement>(".react-flow__edge[data-id]").forEach((g) => {
        const edgeId = g.getAttribute("data-id");
        const path = g.querySelector<SVGPathElement>("path.react-flow__edge-path");
        if (edgeId && path) edgeEls.set(edgeId, path);
      });

      const relevant = edges.filter((e) => edgeEls.has(e.id));
      const found: Crossing[] = [];
      const acceptedScreenPoints: Point[] = [];
      const nodeRects = Array.from(document.querySelectorAll<HTMLElement>(".react-flow__node:not(.react-flow__node-cableWaypoint)"))
        .map((node) => node.getBoundingClientRect());

      for (let i = 0; i < relevant.length; i++) {
        const a = relevant[i];
        const pathA = edgeEls.get(a.id)!;
        const ptsA = samplePath(pathA);
        if (ptsA.length < 2) continue;

        for (let j = i + 1; j < relevant.length; j++) {
          const b = relevant[j];
          // Deux câbles reliés au même nœud (même via des bornes
          // différentes, ex. plusieurs sorties d'un busbar) se rejoignent
          // légitimement près de ce nœud — pas un vrai croisement.
          if (a.source === b.source || a.source === b.target || a.target === b.source || a.target === b.target) continue;

          const pathB = edgeEls.get(b.id)!;
          const ptsB = samplePath(pathB);
          if (ptsB.length < 2) continue;

          let hit: { point: Point; tangentA: Point; tangentB: Point } | null = null;
          for (let ia = 0; ia < ptsA.length - 1 && !hit; ia++) {
            for (let ib = 0; ib < ptsB.length - 1; ib++) {
              const point = segmentIntersection(ptsA[ia], ptsA[ia + 1], ptsB[ib], ptsB[ib + 1]);
              if (!point) continue;
              if (localTurnAngleDeg(ptsA, ia) > MAX_BEND_ANGLE_DEG || localTurnAngleDeg(ptsB, ib) > MAX_BEND_ANGLE_DEG) {
                // Croisement réel mais dans un virage — cherche un autre
                // point de croisement plus loin plutôt que d'afficher un
                // sursaut décroché du tracé.
                continue;
              }
              hit = {
                point,
                tangentA: { x: ptsA[ia + 1].x - ptsA[ia].x, y: ptsA[ia + 1].y - ptsA[ia].y },
                tangentB: { x: ptsB[ib + 1].x - ptsB[ib].x, y: ptsB[ib + 1].y - ptsB[ib].y },
              };
              break;
            }
          }
          if (!hit) continue;

          const screenPoint = pointOnScreen(pathA, hit.point);
          if (!screenPoint) continue;
          // Pas de rebond à proximité d'une vignette : il serait confondu
          // avec une borne ou un câble qui entre dans le composant.
          if (nodeRects.some((rect) => distanceToRect(screenPoint, rect) < NODE_CLEARANCE_PX)) continue;
          // Deux rebonds voisins forment visuellement une boucle parasite.
          if (acceptedScreenPoints.some((point) => Math.hypot(point.x - screenPoint.x, point.y - screenPoint.y) < MIN_BUMP_SEPARATION_PX)) continue;

          // Règle stable (déterministe, sans signification électrique) pour
          // décider lequel des deux câbles fait le sursaut : celui dont
          // l'id est le plus grand — reste cohérent d'un rendu à l'autre.
          const jumperIsA = a.id > b.id;
          const jumperEdge = jumperIsA ? a : b;
          const straightEdge = jumperIsA ? b : a;
          const jumperTangent = jumperIsA ? hit.tangentA : hit.tangentB;
          const straightTangent = jumperIsA ? hit.tangentB : hit.tangentA;

          const colorFor = (color: string | undefined) => {
            const raw = color ?? "#6b7280";
            return darkMode ? (DARK_MODE_COLOR_OVERRIDE[raw.toLowerCase()] ?? raw) : raw;
          };
          const widthFor = (section: string | undefined) => strokeWidthForSection(parseSectionMm2(section));
          const dasharrayFor = (cableType: string | undefined) =>
            cableType === "data-bus" ? "6,4" : cableType === "ac-230v" ? "12,5" : undefined;

          found.push({
            key: `${a.id}::${b.id}`,
            point: hit.point,
            straight: {
              tangent: straightTangent,
              color: colorFor(straightEdge.data?.color),
              strokeWidth: widthFor(straightEdge.data?.section),
              dasharray: dasharrayFor(straightEdge.data?.cableType),
            },
            jumper: {
              tangent: jumperTangent,
              color: colorFor(jumperEdge.data?.color),
              strokeWidth: widthFor(jumperEdge.data?.section),
              dasharray: dasharrayFor(jumperEdge.data?.cableType),
              bumpHeight: THREE_CONDUCTOR_SECTIONS.has(jumperEdge.data?.section ?? "") ? BUMP_HEIGHT : BUMP_HEIGHT_LARGE,
            },
            maskColor: darkMode ? "#0a0a0a" : "#ffffff",
          });
          acceptedScreenPoints.push(screenPoint);
        }
      }

      setCrossings(found);
    }, 300);

    return () => clearTimeout(timeout);
  }, [nodes, edges, darkMode, suspended]);

  if (crossings.length === 0) return null;

  return (
    <ViewportPortal>
      <svg style={{ overflow: "visible", pointerEvents: "none" }}>
        {crossings.map((c) => (
          <g key={c.key}>
            <circle cx={c.point.x} cy={c.point.y} r={MASK_RADIUS} fill={c.maskColor} />
            <path
              d={straightLegPath(c.point, c.straight.tangent)}
              fill="none"
              stroke={c.straight.color}
              strokeWidth={c.straight.strokeWidth}
              strokeDasharray={c.straight.dasharray}
              strokeLinecap="round"
            />
            <path
              d={bumpPath(c.point, c.jumper.tangent, c.jumper.bumpHeight)}
              fill="none"
              stroke={c.jumper.color}
              strokeWidth={c.jumper.strokeWidth}
              strokeDasharray={c.jumper.dasharray}
              strokeLinecap="round"
            />
          </g>
        ))}
      </svg>
    </ViewportPortal>
  );
}

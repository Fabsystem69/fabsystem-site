"use client";

import { useCallback, useRef, useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow, Position, type EdgeProps, type Edge } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { resolveHandleKindForNode } from "@/lib/electrical-components/checks";
import { getBendPoints } from "@/lib/schema-editor/cable-bend-points";
import type { CableEdgeData } from "@/types/schema";

// Rouge d'avertissement franc, choisi pour ne jamais pouvoir être confondu
// avec une couleur de câble normale (positif/négatif/neutre/terre).
const POLARITY_MISMATCH_COLOR = "#dc2626";

// Arrondi de coin identique à celui que `getSmoothStepPath` utilise en
// interne pour le tracé automatique (fonction `getBend` de @xyflow/system,
// non exportée par la librairie — reprise ici à l'identique) : un arc à
// rayon fixe, pas un simple `strokeLinejoin: round` (qui ne produit qu'un
// arrondi minuscule proportionnel à l'épaisseur du trait). Sans ça, un
// câble déplacé avait des coins visiblement différents du reste du schéma.
function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function getBend(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, size: number): string {
  const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size);
  const { x, y } = b;
  if ((a.x === x && x === c.x) || (a.y === y && y === c.y)) return `L${x} ${y}`;
  if (a.y === y) {
    const xDir = a.x < c.x ? -1 : 1;
    const yDir = a.y < c.y ? 1 : -1;
    return `L ${x + bendSize * xDir},${y}Q ${x},${y} ${x},${y + bendSize * yDir}`;
  }
  const xDir = a.x < c.x ? 1 : -1;
  const yDir = a.y < c.y ? -1 : 1;
  return `L ${x},${y + bendSize * yDir}Q ${x},${y} ${x + bendSize * xDir},${y}`;
}

// Tracé à coudes passant par un point donné (retour utilisateur : "au
// déplacement des câblages il ne garde plus leur courbage et sont
// rectiligne, pas joli"). Essayé avec `getSmoothStepPath({ centerX,
// centerY })` — la même fonction que le tracé automatique — pour rester
// cohérent avec le reste du schéma (retour utilisateur explicite), mais
// abandonné : sur certaines orientations de bornes cette fonction n'honore
// qu'un seul des deux axes passés (l'autre est recalculé de force), donc le
// câble devenait non-déplaçable ou limité à un seul axe selon les cas. Ici
// le point de coude est un vrai sommet du chemin, donc la vignette —
// positionnée exactement sur ce sommet — reste toujours sur le câble, quelle
// que soit l'orientation des bornes ; et les coins sont arrondis avec le
// même `getBend` que le tracé automatique pour un style pixel-identique.
// Généralisation à N points de coude (retour utilisateur : "poignées/points
// intermédiaires sur les câbles" — un seul coude ne suffisait pas à dévier
// proprement un tracé qui doit contourner plusieurs composants). Se réduit
// exactement au comportement d'origine quand `waypoints` n'a qu'un élément :
// l'élbow d'entrée suit toujours l'orientation de la borne source, celui de
// sortie l'orientation de la borne cible ; entre deux points intermédiaires
// consécutifs, l'orientation alterne (tracé "en escalier"), un choix
// arbitraire mais stable qui évite un zigzag imprévisible.
function orthogonalWaypointPath(
  sourceX: number,
  sourceY: number,
  sourcePosition: Position,
  waypoints: { x: number; y: number }[],
  targetX: number,
  targetY: number,
  targetPosition: Position,
  borderRadius: number,
): string {
  const sourceHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right;
  const targetHorizontal = targetPosition === Position.Left || targetPosition === Position.Right;

  const rawPoints: { x: number; y: number }[] = [{ x: sourceX, y: sourceY }];
  let lastElbowHorizontal = sourceHorizontal;
  waypoints.forEach((wp, i) => {
    const prev = rawPoints[rawPoints.length - 1];
    const useHorizontal = i === 0 ? sourceHorizontal : !lastElbowHorizontal;
    const elbow = useHorizontal ? { x: wp.x, y: prev.y } : { x: prev.x, y: wp.y };
    rawPoints.push(elbow, wp);
    lastElbowHorizontal = useHorizontal;
  });
  const lastPoint = rawPoints[rawPoints.length - 1];
  const elbow2 = targetHorizontal ? { x: targetX, y: lastPoint.y } : { x: lastPoint.x, y: targetY };
  rawPoints.push(elbow2, { x: targetX, y: targetY });

  // Dédoublonne les points consécutifs identiques (ex. un élbow confondu
  // avec le point de coude quand celui-ci est déjà aligné avec la borne) —
  // sinon `getBend` reçoit un triplet dégénéré (distance nulle).
  const points = rawPoints.filter((p, i) => i === 0 || p.x !== rawPoints[i - 1].x || p.y !== rawPoints[i - 1].y);
  let path = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    path += getBend(points[i - 1], points[i], points[i + 1], borderRadius);
  }
  path += `L${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return path;
}


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
export const DARK_MODE_COLOR_OVERRIDE: Record<string, string> = {
  "#111827": "#60a5fa",
  "#000000": "#60a5fa",
};

// Épaisseur du trait selon la section (V2, retour utilisateur) — purement
// indicatif/visuel, aucune section n'est stockée en dehors du champ
// existant. Extrait le premier nombre trouvé dans le libellé de section
// ("6 mm²", "1,5 mm²", "3G2,5 mm²"…), virgule française acceptée.
export function parseSectionMm2(section?: string): number | null {
  if (!section) return null;
  const match = section.match(/([\d,.]+)\s*mm/i);
  if (!match) return null;
  const num = parseFloat(match[1].replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

// Réutilisé par Canvas.tsx pour légender le premier nœud de coude natif une
// fois `data.bendPoints` posé (voir CableWaypointNode) — même texte que la
// vignette du tracé automatique, une seule source de vérité.
export function cableCaption(data: CableEdgeData | undefined): string {
  const lengthLabel = typeof data?.length === "number" ? `${String(data.length).replace(".", ",")} m` : undefined;
  return [data?.label, data?.section, lengthLabel].filter(Boolean).join(" · ");
}

export function strokeWidthForSection(mm2: number | null): number {
  if (mm2 === null) return 2;
  if (mm2 <= 1) return 1.5;
  if (mm2 <= 2.5) return 2;
  if (mm2 <= 6) return 2.5;
  if (mm2 <= 10) return 3;
  if (mm2 <= 16) return 3.5;
  if (mm2 <= 25) return 4;
  return 4.5;
}

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
  const updateEdgeData = useSchemaStore((s) => s.updateEdgeData);
  const select = useSchemaStore((s) => s.select);
  const openItemPropertiesPopup = useSchemaStore((s) => s.openItemPropertiesPopup);
  // Selecteurs cibles (pas `s.nodes` en entier) : le retour est une simple
  // chaine ("positive"/"negative"/...), Zustand ne redeclenche donc un
  // rendu que si la polarite resolue change reellement, pas a chaque
  // deplacement de n'importe quel noeud du schema.
  const sourceKind = useSchemaStore((s) => resolveHandleKindForNode(s.nodes.find((n) => n.id === source), sourceHandleId));
  const targetKind = useSchemaStore((s) => resolveHandleKindForNode(s.nodes.find((n) => n.id === target), targetHandleId));
  const isPolarityMismatch =
    (sourceKind === "positive" && targetKind === "negative") ||
    (sourceKind === "negative" && targetKind === "positive");
  // Retour utilisateur : "insertion fluide de composants inline sur câble"
  // — mis en évidence pendant qu'un composant compatible est glissé
  // au-dessus, avant même de lâcher (voir Canvas.tsx handleDragOver).
  const isSpliceTarget = useSchemaStore((s) => s.spliceHoverEdgeId === id);
  const { screenToFlowPosition } = useReactFlow();
  const draggingEnd = useRef<"source" | "target" | null>(null);
  const draggingLabel = useRef(false);
  // Retour visuel pendant le tout premier glisser (avant que le point de
  // coude existe) — voir plus bas : une fois `data.bendPoints[0]` défini, ce
  // n'est plus ce composant mais un vrai nœud React Flow (CableWaypointNode,
  // ajouté par Canvas.tsx) qui gère le glisser, donc cet état ne sert plus
  // qu'à ce tout premier geste.
  const [draggingPoint, setDraggingPoint] = useState<{ x: number; y: number } | null>(null);

  const [autoPath, autoX, autoY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  // Points de coude choisis à la main, en coordonnées absolues (retour
  // utilisateur : "la vignette câble devrait avoir les mêmes propriétés
  // qu'une vignette item… les câbles les suivent parfaitement", puis
  // "poignées/points intermédiaires sur les câbles" pour en avoir plusieurs)
  // — une fois posés, ils se comportent exactement comme un composant du
  // schéma : ils ne recalculent plus leur position par rapport au tracé
  // auto (voir le commentaire sur `bendPoints` dans types/schema.ts pour
  // l'historique des approches "relatives" essayées avant, abandonnées).
  // `draggingPoint` ne sert qu'à l'aperçu du tout premier glisser (avant
  // qu'aucun point n'existe) — une fois `bendPoints[0]` posé, c'est
  // CableWaypointNode qui gère chaque point individuellement.
  const savedBendPoints = getBendPoints(data);
  const bendPoints = draggingPoint ? [draggingPoint] : savedBendPoints;

  let edgePath: string;
  let labelX: number;
  let labelY: number;
  if (bendPoints.length > 0) {
    edgePath = orthogonalWaypointPath(sourceX, sourceY, sourcePosition, bendPoints, targetX, targetY, targetPosition, 8);
    labelX = bendPoints[0].x;
    labelY = bendPoints[0].y;
  } else {
    edgePath = autoPath;
    labelX = autoX;
    labelY = autoY;
  }

  const rawColor = data?.color ?? "#6b7280";
  // Retour utilisateur : "avertissement clair si l'utilisateur tente un
  // branchement incohérent, par exemple un + sur un -" — prime sur la
  // couleur de polarité normale, jamais discret.
  const color = isPolarityMismatch
    ? POLARITY_MISMATCH_COLOR
    : darkMode
      ? (DARK_MODE_COLOR_OVERRIDE[rawColor.toLowerCase()] ?? rawColor)
      : rawColor;
  const strokeWidth = strokeWidthForSection(parseSectionMm2(data?.section)) + (selected ? 1 : 0) + (isPolarityMismatch ? 1 : 0);
  // Bus de données (VE.Direct, NMEA2000, CAN…) en pointillé (retour
  // utilisateur) — les distingue au premier coup d'œil des câbles de
  // puissance, même quand la couleur seule seule ne suffit pas (impression
  // N&B, daltonisme).
  // Style de trait par type logique (retour utilisateur) — se distingue au
  // premier coup d'œil même sans la couleur (impression N&B, daltonisme) :
  // pointillé fin pour les bus de données, tirets longs pour le secteur
  // 230V (rythme différent du bus de données pour ne pas les confondre).
  const strokeDasharray = isPolarityMismatch
    ? "3,3"
    : data?.cableType === "data-bus"
      ? "6,4"
      : data?.cableType === "ac-230v"
        ? "12,5"
        : undefined;

  // La longueur affichée sur le câble lui-même (retour utilisateur : sans
  // elle, un schéma partagé "n'a aucun sens" pour qui n'a pas accès au
  // panneau de propriétés) — pas seulement dans le récapitulatif matériel.
  const caption = cableCaption(data);

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

  const handleLabelPointerDown = useCallback((event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    draggingLabel.current = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }, []);

  const handleLabelPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!draggingLabel.current) return;
      setDraggingPoint(screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [screenToFlowPosition],
  );

  const handleLabelPointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (!draggingLabel.current) return;
      draggingLabel.current = false;
      const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setDraggingPoint(null);
      updateEdgeData(id, { bendPoints: [pos] });
    },
    [id, screenToFlowPosition, updateEdgeData],
  );

  return (
    <>
      {isSpliceTarget ? (
        <path
          d={edgePath}
          fill="none"
          stroke="#22c55e"
          strokeWidth={strokeWidth + 10}
          strokeOpacity={0.35}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      <BaseEdge
        id={id}
        path={edgePath}
        interactionWidth={24}
        style={{ stroke: color, strokeWidth, strokeDasharray, strokeLinejoin: "round", strokeLinecap: "round" }}
      />
      <EdgeLabelRenderer>
        {/* Une fois `data.bendPoints[0]` posé, c'est CableWaypointNode (un
            vrai nœud React Flow ajouté par Canvas.tsx, un par point) qui
            affiche cette légende et gère le déplacement — plus cette div,
            qui ne sert que pour le tracé 100% automatique et pour le tout
            premier glisser (celui qui crée le premier point de coude). */}
        {/* Condition sur `savedBendPoints` (persisté), jamais sur
            `bendPoints` (qui inclut l'aperçu local `draggingPoint`) : ce
            dernier devient non-vide dès le premier pointermove du glisser,
            donc démonterait cette div EN PLEIN GESTE si elle servait ici —
            perdant du même coup la capture du pointeur, plus aucun
            pointerup ne serait jamais reçu (bug réel rencontré : le premier
            glisser ne validait plus jamais rien). */}
        {caption && savedBendPoints.length === 0 ? (
          <div
            onPointerDown={handleLabelPointerDown}
            onPointerMove={handleLabelPointerMove}
            onPointerUp={handleLabelPointerUp}
            title="Glisser pour réorganiser ce câble"
            style={{
              position: "absolute",
              zIndex: 1001,
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              whiteSpace: "nowrap",
              cursor: draggingPoint ? "grabbing" : "grab",
            }}
            className={`rounded border px-1.5 py-0.5 text-[10px] font-medium shadow-sm ${
              darkMode ? "border-neutral-700 bg-neutral-800 text-neutral-300" : "border-neutral-200 bg-white text-neutral-600"
            }`}
          >
            {caption}
          </div>
        ) : null}

        {/* Actives seulement quand le câble est sélectionné (retour
            utilisateur : "il n'y a plus de popup de dimensionnement quand on
            relie un item") — sinon ces poignées, invisibles mais toujours
            au-dessus (zIndex 1001) pour capter le glisser de reconnexion,
            recouvrent en permanence CHAQUE borne déjà câblée et empêchaient
            tout clic dessus, y compris pour démarrer un NOUVEAU câble
            (connexion par clic ou glisser) — exactement le même compromis
            que Figma/Miro : il faut d'abord sélectionner un connecteur pour
            pouvoir en tirer l'extrémité. */}
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
              pointerEvents: selected ? "all" : "none",
              background: "transparent",
            }}
          />
        ))}

        {/* Retour utilisateur : "il manque le menu vu qu'il n'y a plus de
            bandeau à droite" — le double-clic (onEdgeDoubleClick, voir
            Canvas.tsx) ouvre toujours la popup de propriétés, mais reste
            invisible tant qu'on ne le devine pas ; ce bouton lui donne une
            affordance visible, même traitement que les composants et les
            zones. Décalé de la position de la légende/du point de coude
            (pas superposé dessus) pour ne jamais gêner leur glisser. */}
        {selected ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              select("edge", id);
              openItemPropertiesPopup();
            }}
            title="Voir les propriétés du câble"
            style={{
              position: "absolute",
              zIndex: 1001,
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 22}px)`,
              pointerEvents: "all",
            }}
            className={`flex h-6 w-6 items-center justify-center rounded-md border text-xs shadow-sm transition-base ${
              darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            ⓘ
          </button>
        ) : null}
      </EdgeLabelRenderer>
    </>
  );
}

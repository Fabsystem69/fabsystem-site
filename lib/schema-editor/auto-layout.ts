import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";

// Auto-organisation du schéma (retour utilisateur : "widget qui calcule le
// placement le plus optimisé, le moins de câbles qui se chevauchent, les
// plus courts possible, bien aéré dans chaque zone et entre les zones").
//
// Approche en deux temps plutôt qu'un seul algorithme global :
// 1. Chaque zone (regroupement visuel existant, voir `buildZone` dans
//    features/schemas/templates.ts) est mise en page indépendamment avec
//    dagre (layout en couches, l'algorithme standard pour minimiser les
//    croisements et la longueur des câbles sur un graphe orienté) — les
//    nœuds sans zone forment un groupe "libre" traité de la même façon.
// 2. Les blocs obtenus (un par zone) sont ensuite rangés côte à côte avec un
//    espacement généreux, dans leur ordre d'origine (lecture gauche→droite,
//    haut→bas) pour ne pas perdre le sens de lecture voulu par l'auteur du
//    schéma (sources à gauche, consommateurs à droite, etc.).
//
// Ne recalcule jamais les points de coude manuels des câbles (bendPoints) :
// un repositionnement automatique des nœuds les rendrait de toute façon
// obsolètes, donc on les efface plutôt que de laisser un câble qui part
// dans le vide.

type SchemaNode = Node<ElectricalNodeData>;
type SchemaEdge = Edge<CableEdgeData>;

const NODE_WIDTH = 110;
const NODE_HEIGHT = 90;
const NODE_SEP = 70;
const RANK_SEP = 140;
const ZONE_PADDING = 60;
const ZONE_GAP = 140;
const ZONE_LABEL_HEIGHT = 40;
const MAX_ROW_WIDTH = 3400;
const UNZONED_LABEL = "__unzoned__";

interface ZoneBox {
  id: string | typeof UNZONED_LABEL;
  x: number;
  y: number;
  width: number;
  height: number;
}

function findZoneForNode(node: SchemaNode, zones: SchemaNode[]): string | typeof UNZONED_LABEL {
  const cx = node.position.x;
  const cy = node.position.y;
  for (const zone of zones) {
    const w = zone.width ?? 0;
    const h = zone.height ?? 0;
    if (cx >= zone.position.x && cx <= zone.position.x + w && cy >= zone.position.y && cy <= zone.position.y + h) {
      return zone.id;
    }
  }
  return UNZONED_LABEL;
}

// Layout en couches d'un sous-graphe (une zone, ou le groupe "libre") —
// retourne les positions locales (top-left, coordonnées React Flow) de
// chaque nœud, prêtes à être décalées par l'origine du bloc.
function layoutGroup(groupNodes: SchemaNode[], edges: SchemaEdge[]): { positions: Map<string, { x: number; y: number }>; width: number; height: number } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: NODE_SEP, ranksep: RANK_SEP, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  const idsInGroup = new Set(groupNodes.map((n) => n.id));
  for (const node of groupNodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    if (idsInGroup.has(edge.source) && idsInGroup.has(edge.target) && edge.source !== edge.target) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  let maxX = 0;
  let maxY = 0;
  for (const node of groupNodes) {
    const p = g.node(node.id);
    // dagre positionne le CENTRE du nœud ; React Flow attend le coin
    // haut-gauche.
    const x = p.x - NODE_WIDTH / 2;
    const y = p.y - NODE_HEIGHT / 2;
    positions.set(node.id, { x, y });
    maxX = Math.max(maxX, x + NODE_WIDTH);
    maxY = Math.max(maxY, y + NODE_HEIGHT);
  }

  return { positions, width: maxX, height: maxY };
}

export function computeAutoLayout(nodes: SchemaNode[], edges: SchemaEdge[]): { nodes: SchemaNode[]; edges: SchemaEdge[] } {
  const zoneNodes = nodes.filter((n) => n.type === "zone");
  const itemNodes = nodes.filter((n) => n.type !== "zone");
  if (itemNodes.length === 0) return { nodes, edges };

  // Regroupe les nœuds par zone (ou "libre" si hors de toute zone / schéma
  // sans zone), en conservant l'ordre d'apparition d'origine pour décider
  // l'ordre de rangement des blocs ensuite.
  const groups = new Map<string, SchemaNode[]>();
  const groupOrigin = new Map<string, { x: number; y: number }>();
  for (const node of itemNodes) {
    const zoneId = zoneNodes.length > 0 ? findZoneForNode(node, zoneNodes) : UNZONED_LABEL;
    const list = groups.get(zoneId) ?? [];
    list.push(node);
    groups.set(zoneId, list);
    if (!groupOrigin.has(zoneId)) groupOrigin.set(zoneId, node.position);
  }

  // Met en page chaque groupe indépendamment.
  const laidOutGroups: { zoneId: string; box: { positions: Map<string, { x: number; y: number }>; width: number; height: number } }[] = [];
  for (const [zoneId, groupNodes] of groups) {
    laidOutGroups.push({ zoneId, box: layoutGroup(groupNodes, edges) });
  }

  // Ordre de rangement des blocs : reprend l'ordre visuel d'origine
  // (haut→bas, puis gauche→droite) plutôt qu'un ordre arbitraire, pour
  // rester fidèle à l'intention de l'auteur du schéma.
  laidOutGroups.sort((a, b) => {
    const oa = groupOrigin.get(a.zoneId)!;
    const ob = groupOrigin.get(b.zoneId)!;
    return oa.y - ob.y || oa.x - ob.x;
  });

  // Range les blocs en lignes (retour à la ligne au-delà de MAX_ROW_WIDTH),
  // avec un espacement généreux entre eux — "aéré des autres zones".
  const zoneBoxes: ZoneBox[] = [];
  const newPositions = new Map<string, { x: number; y: number }>();
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  for (const { zoneId, box } of laidOutGroups) {
    const blockWidth = box.width + ZONE_PADDING * 2;
    const blockHeight = box.height + ZONE_PADDING * 2 + (zoneId !== UNZONED_LABEL ? ZONE_LABEL_HEIGHT : 0);

    if (cursorX > 0 && cursorX + blockWidth > MAX_ROW_WIDTH) {
      cursorX = 0;
      cursorY += rowHeight + ZONE_GAP;
      rowHeight = 0;
    }

    const originX = cursorX;
    const originY = cursorY + (zoneId !== UNZONED_LABEL ? ZONE_LABEL_HEIGHT : 0);
    for (const [nodeId, pos] of box.positions) {
      newPositions.set(nodeId, { x: originX + ZONE_PADDING + pos.x, y: originY + ZONE_PADDING + pos.y });
    }
    if (zoneId !== UNZONED_LABEL) {
      zoneBoxes.push({ id: zoneId, x: originX, y: cursorY, width: blockWidth, height: blockHeight });
    }

    cursorX += blockWidth + ZONE_GAP;
    rowHeight = Math.max(rowHeight, blockHeight);
  }

  const zoneBoxById = new Map(zoneBoxes.map((z) => [z.id, z]));

  const newNodes = nodes.map((node) => {
    if (node.type === "zone") {
      const box = zoneBoxById.get(node.id);
      if (!box) return node;
      return { ...node, position: { x: box.x, y: box.y }, width: box.width, height: box.height };
    }
    const pos = newPositions.get(node.id);
    if (!pos) return node;
    return { ...node, position: pos };
  });

  // Un repositionnement global invalide les points de coude manuels des
  // câbles (coordonnées absolues, voir types/schema.ts) : un câble garderait
  // sinon un coude qui ne correspond plus du tout au nouveau tracé.
  const newEdges = edges.map((edge) => {
    if (!edge.data?.bendPoint && !edge.data?.bendPoints) return edge;
    const { bendPoint: _bendPoint, bendPoints: _bendPoints, ...restData } = edge.data;
    return { ...edge, data: restData as CableEdgeData };
  });

  return { nodes: newNodes, edges: newEdges };
}

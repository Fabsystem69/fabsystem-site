import type { Node, NodeChange } from "@xyflow/react";
import type { ElectricalNodeData } from "@/types/schema";

type SchemaNode = Node<ElectricalNodeData>;

export interface ZoneMove {
  zoneId: string;
  delta: { x: number; y: number };
  bounds: { x: number; y: number; width: number; height: number };
}

const FALLBACK_NODE_WIDTH = 130;
const FALLBACK_NODE_HEIGHT = 110;

function nodeDimensions(node: SchemaNode) {
  return {
    width: node.measured?.width ?? node.width ?? FALLBACK_NODE_WIDTH,
    height: node.measured?.height ?? node.height ?? FALLBACK_NODE_HEIGHT,
  };
}

function isInsideZone(node: SchemaNode, zone: SchemaNode) {
  const zoneDimensions = nodeDimensions(zone);
  const nodeSize = nodeDimensions(node);
  const centerX = node.position.x + nodeSize.width / 2;
  const centerY = node.position.y + nodeSize.height / 2;

  return (
    centerX >= zone.position.x &&
    centerX <= zone.position.x + zoneDimensions.width &&
    centerY >= zone.position.y &&
    centerY <= zone.position.y + zoneDimensions.height
  );
}

// Les zones restent des calques visuels, sans parentage React Flow. Cette
// translation explicite garde les positions absolues et les raccords
// existants tout en permettant de déplacer un groupe déjà composé à la main.
export function moveZoneContents(nodes: SchemaNode[], changes: NodeChange<SchemaNode>[]) {
  // Le déplacement d'un composant classique ne doit pas parcourir toutes les
  // zones et tous leurs contenus à chaque image du glisser.
  if (!changes.some((change) => change.type === "position" && change.position && nodes.some((node) => node.id === change.id && node.type === "zone" && node.data.locked !== true))) {
    return { nodes, moves: [] as ZoneMove[] };
  }

  const moves: ZoneMove[] = [];
  let movedNodes = nodes;

  for (const change of changes) {
    if (change.type !== "position" || !change.position) continue;
    const zone = movedNodes.find((node) => node.id === change.id);
    if (!zone || zone.type !== "zone" || zone.data.locked === true) continue;

    const delta = {
      x: change.position.x - zone.position.x,
      y: change.position.y - zone.position.y,
    };
    if (delta.x === 0 && delta.y === 0) continue;

    const dimensions = nodeDimensions(zone);
    moves.push({
      zoneId: zone.id,
      delta,
      bounds: { x: zone.position.x, y: zone.position.y, width: dimensions.width, height: dimensions.height },
    });
    movedNodes = movedNodes.map((node) => {
      if (node.id === zone.id || !isInsideZone(node, zone)) return node;
      return { ...node, position: { x: node.position.x + delta.x, y: node.position.y + delta.y } };
    });
  }

  return { nodes: movedNodes, moves };
}

export function movePointWithZones(point: { x: number; y: number }, moves: ZoneMove[]) {
  return moves.reduce((current, move) => {
    const isInside =
      current.x >= move.bounds.x &&
      current.x <= move.bounds.x + move.bounds.width &&
      current.y >= move.bounds.y &&
      current.y <= move.bounds.y + move.bounds.height;
    return isInside ? { x: current.x + move.delta.x, y: current.y + move.delta.y } : current;
  }, point);
}

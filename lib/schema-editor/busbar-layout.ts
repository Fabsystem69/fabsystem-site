import type { Edge, Node } from "@xyflow/react";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";

export type BusbarFace = "left" | "top" | "right" | "bottom";

const FACES: BusbarFace[] = ["left", "top", "right", "bottom"];
const FALLBACK_NODE_SIZE = 80;

function oppositeFace(face: BusbarFace): BusbarFace {
  if (face === "left") return "right";
  if (face === "right") return "left";
  if (face === "top") return "bottom";
  return "top";
}

function rotateFace(face: BusbarFace, degrees: number): BusbarFace {
  const steps = ((((Math.round(degrees / 90) % 4) + 4) % 4));
  return FACES[(FACES.indexOf(face) + steps) % FACES.length];
}

// ElectricalNode applique d'abord le miroir, puis la rotation. Le moteur
// calcule une face visible et remonte vers la face stockée dans les données.
function toStoredFace(visibleFace: BusbarFace, data: ElectricalNodeData): BusbarFace {
  const beforeRotation = rotateFace(visibleFace, -(Number(data.rotation) || 0));
  return data.mirrored && (beforeRotation === "left" || beforeRotation === "right")
    ? oppositeFace(beforeRotation)
    : beforeRotation;
}

function nodeCenter(node: Node<ElectricalNodeData>) {
  return {
    x: node.position.x + (node.measured?.width ?? node.width ?? FALLBACK_NODE_SIZE) / 2,
    y: node.position.y + (node.measured?.height ?? node.height ?? FALLBACK_NODE_SIZE) / 2,
  };
}

function closestFace(from: Node<ElectricalNodeData>, to: Node<ElectricalNodeData>): BusbarFace {
  const a = nodeCenter(from);
  const b = nodeCenter(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left";
  return dy >= 0 ? "bottom" : "top";
}

export interface BusbarLayoutUpdate {
  nodeId: string;
  handleSides: Record<string, BusbarFace>;
  faceCounts: Record<`${BusbarFace}Points`, number>;
}

// Les plots d'un busbar sont équivalents électriquement. On garde donc les
// ids de handles existants et ne déplace que leur face de rendu vers le câble
// relié. Aucun câble, calcul ou historique de connexion n'est modifié.
export function optimizeBusbarHandleLayout(
  nodes: Node<ElectricalNodeData>[],
  edges: Edge<CableEdgeData>[],
): BusbarLayoutUpdate[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return nodes
    .filter((node) => node.data.componentType === "busbar")
    .map((busbar) => {
      // Inclut aussi les plots libres : le nombre de bornes et leurs ids
      // restent strictement inchangés après une optimisation.
      const outputCount = Math.max(1, Math.round(Number(busbar.data.outputCount) || 4));
      const handleSides: Record<string, BusbarFace> = { input: "right" };
      for (let index = 1; index <= outputCount; index += 1) handleSides[`out-${index}`] = "right";
      for (const edge of edges) {
        const isSource = edge.source === busbar.id;
        const isTarget = edge.target === busbar.id;
        if (!isSource && !isTarget) continue;
        const handleId = isSource ? edge.sourceHandle : edge.targetHandle;
        const other = nodesById.get(isSource ? edge.target : edge.source);
        if (!handleId || !other) continue;
        handleSides[handleId] = toStoredFace(closestFace(busbar, other), busbar.data);
      }

      const faceCounts = {
        leftPoints: 0,
        topPoints: 0,
        rightPoints: 0,
        bottomPoints: 0,
      } as Record<`${BusbarFace}Points`, number>;
      for (const face of Object.values(handleSides)) faceCounts[`${face}Points`] += 1;

      return { nodeId: busbar.id, handleSides, faceCounts };
    })
    .filter((update) => Object.keys(update.handleSides).length > 0);
}

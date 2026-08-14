import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";

// Auto-agencement (retour utilisateur : export "trop petit et illisible"
// une fois posté sur Facebook — un schéma disposé à la main finit souvent
// très étalé, avec de grandes zones vides qui gaspillent la résolution une
// fois réduit pour un fil d'actualité). Dagre range les composants suivant
// le sens du courant (gauche → droite) en un bloc compact, sans les
// chevauchements qu'un repositionnement manuel risquerait d'introduire sur
// un schéma à plusieurs dizaines de composants.
const NODE_WIDTH = 96;
const NODE_HEIGHT = 64;
const NODE_SEP = 48; // écart entre deux nœuds d'un même rang (vertical, orientation LR)
const RANK_SEP = 110; // écart entre rangs (horizontal) — laisse la place aux étiquettes de câble

export function autoLayoutNodes<N extends Node, E extends Edge>(nodes: N[], edges: E[]): N[] {
  if (nodes.length === 0) return nodes;

  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: "LR", nodesep: NODE_SEP, ranksep: RANK_SEP, marginx: 40, marginy: 40 });
  graph.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    const width = (node.measured?.width as number | undefined) ?? NODE_WIDTH;
    const height = (node.measured?.height as number | undefined) ?? NODE_HEIGHT;
    graph.setNode(node.id, { width, height });
  }
  for (const edge of edges) {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  return nodes.map((node) => {
    const pos = graph.node(node.id);
    if (!pos) return node;
    // Dagre positionne par le centre du nœud, React Flow par le coin
    // supérieur gauche.
    const width = (node.measured?.width as number | undefined) ?? NODE_WIDTH;
    const height = (node.measured?.height as number | undefined) ?? NODE_HEIGHT;
    return { ...node, position: { x: Math.round(pos.x - width / 2), y: Math.round(pos.y - height / 2) } };
  });
}

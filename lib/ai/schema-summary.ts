import type { Node, Edge } from "@xyflow/react";
import { getComponentDefinition, getEffectiveHandles, getHandleLabel } from "@/lib/electrical-components/definitions";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";

// Description texte compacte du schéma, pensée pour un prompt IA — pas le
// JSON brut (nœuds/câbles portent beaucoup de métadonnées de rendu sans
// intérêt pour une relecture électrique) ni le récapitulatif matériel de
// lib/electrical-components/bom.ts (pensé pour une commande de pièces, pas
// pour décrire QUI est relié à QUOI).
export function buildSchemaSummaryText(nodes: Node<ElectricalNodeData>[], edges: Edge<CableEdgeData>[]): string {
  const nodeLines = nodes.map((node) => {
    const def = getComponentDefinition(node.data.componentType);
    const label = String(node.data.label ?? def?.label ?? node.data.componentType);
    return `- [${node.id}] ${label} (type: ${node.data.componentType})`;
  });

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const handleLabel = (nodeId: string, handleId: string | null | undefined) => {
    if (!handleId) return "?";
    const node = nodeById.get(nodeId);
    const def = node ? getComponentDefinition(node.data.componentType) : undefined;
    if (!node || !def) return handleId;
    const handle = getEffectiveHandles(def, node.data).find((h) => h.id === handleId);
    return handle ? getHandleLabel(def, node.data, handle) : handleId;
  };

  const edgeLines = edges.map((edge) => {
    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);
    const sourceLabel = sourceNode ? String(sourceNode.data.label ?? edge.source) : edge.source;
    const targetLabel = targetNode ? String(targetNode.data.label ?? edge.target) : edge.target;
    const parts = [`${sourceLabel} (${handleLabel(edge.source, edge.sourceHandle)}) -> ${targetLabel} (${handleLabel(edge.target, edge.targetHandle)})`];
    if (edge.data?.cableType) parts.push(`type ${edge.data.cableType}`);
    if (edge.data?.section) parts.push(`section ${edge.data.section}`);
    if (typeof edge.data?.length === "number") parts.push(`longueur ${edge.data.length} m`);
    return `- ${parts.join(", ")}`;
  });

  return [
    `Composants (${nodes.length}) :`,
    nodeLines.length > 0 ? nodeLines.join("\n") : "(aucun)",
    "",
    `Câbles (${edges.length}) :`,
    edgeLines.length > 0 ? edgeLines.join("\n") : "(aucun)",
  ].join("\n");
}

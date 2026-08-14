import { getComponentDefinition, getEffectiveHandles } from "./definitions";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";
import type { Node, Edge } from "@xyflow/react";

export interface SchemaIssue {
  id: string;
  nodeId: string;
  message: string;
}

// Contrôles structurels (CDC §22, §31) : des faits vérifiables sur le
// graphe, jamais une validation électrique — pas de "installation
// conforme". Deux règles suffisent à attraper l'essentiel des oublis
// débutants : un composant totalement isolé, ou un composant à 2 bornes
// (+/−) dont une seule est reliée.
export function computeSchemaIssues(
  nodes: Node<ElectricalNodeData>[],
  edges: Edge<CableEdgeData>[],
): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  for (const node of nodes) {
    const def = getComponentDefinition(node.data.componentType);
    if (!def) continue;
    // Les bornes facultatives (ex. port de communication VE.Direct) ne
    // comptent pas dans ce contrôle — leur absence de câble n'est jamais un
    // oubli à signaler (retour utilisateur explicite).
    const handles = getEffectiveHandles(def, node.data).filter((h) => !h.optional);
    if (handles.length === 0) continue;

    const connectedHandleIds = new Set(
      edges
        .filter((e) => e.source === node.id || e.target === node.id)
        .map((e) => (e.source === node.id ? e.sourceHandle : e.targetHandle)),
    );
    const connectedCount = handles.filter((h) => connectedHandleIds.has(h.id)).length;
    const label = String(node.data.label ?? def.label);

    if (connectedCount === 0) {
      issues.push({ id: `${node.id}-isolated`, nodeId: node.id, message: `« ${label} » n'est relié à rien.` });
    } else if (handles.length === 2 && connectedCount === 1) {
      issues.push({ id: `${node.id}-partial`, nodeId: node.id, message: `« ${label} » n'a qu'une seule borne reliée.` });
    }
  }

  return issues;
}

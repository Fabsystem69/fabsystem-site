import type { Edge, Node } from "@xyflow/react";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";

// Bornes retirées d'un type de composant après coup : les fils déjà
// enregistrés dessus (brouillons, projets, liens partagés) sont supprimés au
// chargement, sinon ils restent attachés à une borne fantôme ("relié à une
// borne qui n'existe plus").
//
// - socket-220v / earth (10/2026, retour utilisateur) : une prise 230 V est
//   tirée en 3G, la terre est déjà dans le câble — plus de ligne séparée.
const REMOVED_HANDLES: Record<string, Set<string>> = {
  "socket-220v": new Set(["earth"]),
};

type SchemaNode = Node<ElectricalNodeData>;
type SchemaEdge = Edge<CableEdgeData>;

/** Retourne `edges` tel quel (même référence) s'il n'y a rien à retirer. */
export function dropRemovedHandleEdges<E extends SchemaEdge>(nodes: SchemaNode[], edges: E[]): E[] {
  const typeById = new Map(nodes.map((n) => [n.id, n.data.componentType]));
  const isRemoved = (nodeId: string, handle: string | null | undefined) => {
    const type = typeById.get(nodeId);
    return Boolean(type && handle && REMOVED_HANDLES[type]?.has(handle));
  };
  const kept = edges.filter((e) => !isRemoved(e.source, e.sourceHandle) && !isRemoved(e.target, e.targetHandle));
  return kept.length === edges.length ? edges : kept;
}

import { getComponentDefinition, getEffectiveHandles } from "./definitions";
import { evaluateEdgeSection } from "./auto-size";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";
import type { Node, Edge } from "@xyflow/react";

export type SchemaIssueAction = "recalculate-all-cable-sections";

export interface SchemaIssue {
  id: string;
  targetKind: "node" | "edge";
  targetId: string;
  message: string;
  action?: SchemaIssueAction;
}

type SchemaNodeInternal = Node<ElectricalNodeData>;
type SchemaEdgeInternal = Edge<CableEdgeData>;

// V2 — règles électriques indicatives (retour d'analyse concurrentielle :
// Wireframe signale "pas de fusible principal", "MPPT sans protection",
// "pas de masse dans le système" en plus des contrôles structurels).
// Décision produit : on les ajoute, mais toujours comme rappels dans le
// même panneau "À vérifier" — jamais un blocage, jamais présenté comme une
// certification ou une validation réglementaire (CDC §31, §37).
//
// La détection reste volontairement tolérante (recherche sur 2 sauts, en
// traversant les busbars/platines comme de simples jonctions) plutôt qu'une
// vraie analyse de circuit : assez pour attraper l'oubli évident montré en
// démo concurrente, pas assez pour prétendre à une vérification complète.

const PASSTHROUGH_TYPES = new Set(["busbar", "battery-switch"]);
const PROTECTION_TYPES = new Set(["fuse", "circuit-breaker", "fuse-block", "distribution-panel"]);

// Bornes de sortie « charge » à protéger avant la batterie, par type de
// composant source.
const CHARGE_SOURCE_OUTPUT_HANDLE: Record<string, string> = {
  mppt: "bat-positive",
  dcdc: "out-positive",
  "ac-charger": "bat-positive",
  alternator: "positive",
};

const AC_COMPONENT_TYPES = new Set(["ac-panel", "socket-220v", "ac-charger", "inverter", "inverter-charger", "shore-power", "power-station"]);

function neighborsViaHandle(nodeId: string, handleId: string, edges: SchemaEdgeInternal[]): string[] {
  return edges
    .filter((e) => (e.source === nodeId && e.sourceHandle === handleId) || (e.target === nodeId && e.targetHandle === handleId))
    .map((e) => (e.source === nodeId ? e.target : e.source));
}

// Vrai si un composant de protection (fusible, disjoncteur, platine…) est
// atteint à moins de `maxHops` sauts depuis `nodeId`, en traversant
// librement les busbars/coupe-batterie (simples jonctions/interrupteurs,
// pas des protections en eux-mêmes).
function reachesProtection(
  startNodeId: string,
  startHandle: string,
  nodes: SchemaNodeInternal[],
  edges: SchemaEdgeInternal[],
  maxHops = 2,
): boolean {
  let frontier = neighborsViaHandle(startNodeId, startHandle, edges);
  const visited = new Set<string>([startNodeId]);

  for (let hop = 0; hop < maxHops; hop++) {
    const next: string[] = [];
    for (const id of frontier) {
      if (visited.has(id)) continue;
      visited.add(id);
      const node = nodes.find((n) => n.id === id);
      if (!node) continue;
      const type = node.data.componentType;
      if (PROTECTION_TYPES.has(type)) return true;
      if (PASSTHROUGH_TYPES.has(type)) {
        // On continue à travers toutes les bornes de ce nœud, pas seulement
        // celle par laquelle on est arrivé (un busbar redistribue).
        for (const e of edges) {
          if (e.source === id && !visited.has(e.target)) next.push(e.target);
          else if (e.target === id && !visited.has(e.source)) next.push(e.source);
        }
      }
    }
    frontier = next;
  }
  return false;
}

function computeElectricalIssues(nodes: SchemaNodeInternal[], edges: SchemaEdgeInternal[]): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  for (const node of nodes) {
    const type = node.data.componentType;
    const label = String(node.data.label ?? getComponentDefinition(type)?.label ?? type);

    // Batterie sans fusible principal accessible sur sa sortie +.
    if (type === "battery") {
      if (!reachesProtection(node.id, "positive", nodes, edges)) {
        issues.push({ id: `${node.id}-no-main-fuse`, targetKind: "node", targetId: node.id, message: `« ${label} » n'a pas de fusible principal repérable sur sa sortie +.` });
      }
      continue;
    }

    // Source de charge (MPPT, DC-DC, chargeur secteur, alternateur) sans
    // protection avant la batterie.
    const outputHandle = CHARGE_SOURCE_OUTPUT_HANDLE[type];
    if (outputHandle && !reachesProtection(node.id, outputHandle, nodes, edges)) {
      issues.push({ id: `${node.id}-unprotected-charge-source`, targetKind: "node", targetId: node.id, message: `« ${label} » n'est pas protégé par un fusible avant la batterie.` });
    }
  }

  // Masse absente alors que le schéma contient au moins un composant AC
  // (secteur/quai) — la masse est requise dès qu'il y a du 230V, pas
  // systématiquement en pur DC.
  const acNode = nodes.find((n) => AC_COMPONENT_TYPES.has(n.data.componentType));
  const hasGround = nodes.some((n) => n.data.componentType === "ground");
  if (acNode && !hasGround) {
    issues.push({ id: "no-ground-point", targetKind: "node", targetId: acNode.id, message: "Aucun point de masse dans le schéma alors qu'il contient du 230V." });
  }

  return issues;
}

function formatAmps(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

function getNodeLabel(nodeId: string, nodes: SchemaNodeInternal[]): string {
  const node = nodes.find((n) => n.id === nodeId);
  const fallback = node?.data.componentType ?? nodeId;
  return String(node?.data.label ?? getComponentDefinition(fallback)?.label ?? fallback);
}

function getEdgeLabel(edge: SchemaEdgeInternal, nodes: SchemaNodeInternal[]): string {
  if (edge.data?.label) return `« ${String(edge.data.label)} »`;
  return `le câble « ${getNodeLabel(edge.source, nodes)} → ${getNodeLabel(edge.target, nodes)} »`;
}

function computeCableSizingIssues(nodes: SchemaNodeInternal[], edges: SchemaEdgeInternal[]): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  for (const edge of edges) {
    const diagnostic = evaluateEdgeSection(edge, nodes, edges);
    if (!diagnostic || diagnostic.status === "ok") continue;

    const edgeLabel = getEdgeLabel(edge, nodes);
    const recommended = diagnostic.recommendedSectionLabel;
    const currentContext =
      diagnostic.ampsSource === "protection" && diagnostic.protectionAmps !== null
        ? `il est protégé en ${formatAmps(diagnostic.protectionAmps)} A`
        : `il transporte environ ${formatAmps(diagnostic.amps)} A`;

    if (diagnostic.status === "missing") {
      issues.push({
        id: `${edge.id}-missing-section`,
        targetKind: "edge",
        targetId: edge.id,
        message: `${edgeLabel} n'a pas de section renseignée alors que ${currentContext}. Suggestion : ${recommended}.`,
        action: "recalculate-all-cable-sections",
      });
      continue;
    }

    issues.push({
      id: `${edge.id}-undersized-section`,
      targetKind: "edge",
      targetId: edge.id,
      message: `${edgeLabel} est en ${diagnostic.currentSectionLabel}, trop juste alors que ${currentContext}. Suggestion : ${recommended}.`,
      action: "recalculate-all-cable-sections",
    });
  }

  return issues;
}

// Contrôles structurels (CDC §22, §31) : des faits vérifiables sur le
// graphe. Deux règles suffisent à attraper l'essentiel des oublis
// débutants : un composant totalement isolé, ou un composant à 2 bornes
// (+/−) dont une seule est reliée.
//
// V2 : on y ajoute des règles électriques indicatives ciblées (voir
// `computeElectricalIssues` plus haut) — toujours des rappels dans le même
// panneau « À vérifier », jamais une validation réglementaire complète ni
// un blocage (CDC §37). Un composant déjà signalé isolé n'est pas
// re-signalé côté électrique : le vrai problème à corriger d'abord, c'est
// qu'il n'est relié à rien.
export function computeSchemaIssues(
  nodes: Node<ElectricalNodeData>[],
  edges: Edge<CableEdgeData>[],
): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const structurallyBlockedNodeIds = new Set<string>();

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
      structurallyBlockedNodeIds.add(node.id);
      issues.push({ id: `${node.id}-isolated`, targetKind: "node", targetId: node.id, message: `« ${label} » n'est relié à rien.` });
    } else if (handles.length === 2 && connectedCount === 1) {
      structurallyBlockedNodeIds.add(node.id);
      issues.push({ id: `${node.id}-partial`, targetKind: "node", targetId: node.id, message: `« ${label} » n'a qu'une seule borne reliée.` });
    }
  }

  const electricalIssues = computeElectricalIssues(nodes, edges).filter((issue) => !structurallyBlockedNodeIds.has(issue.targetId));
  const cableSizingIssues = computeCableSizingIssues(nodes, edges).filter((issue) => {
    const edge = edges.find((candidate) => candidate.id === issue.targetId);
    if (!edge) return false;
    return !structurallyBlockedNodeIds.has(edge.source) && !structurallyBlockedNodeIds.has(edge.target);
  });

  return [...issues, ...electricalIssues, ...cableSizingIssues];
}

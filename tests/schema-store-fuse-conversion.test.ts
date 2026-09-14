import test from "node:test";
import assert from "node:assert/strict";
import type { Edge, Node } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";

// Retour utilisateur : "je veux avoir la possibilite de remplacer les
// fusible par des disjoncteur dc ou inversement sans devoir supprimmer et
// remettre le composant" — la conversion doit garder position/câblage et ne
// jamais laisser un câble orphelin sur une borne qui n'existe plus.

function fuseNode(data: Record<string, unknown> = {}): Node<ElectricalNodeData> {
  const def = getComponentDefinition("fuse");
  return {
    id: "prot-1",
    type: "electrical",
    position: { x: 0, y: 0 },
    data: { componentType: "fuse", label: def?.label ?? "Fusible", fuseType: "midi", amperage: 30, ...data },
  };
}

function breakerNode(data: Record<string, unknown> = {}): Node<ElectricalNodeData> {
  const def = getComponentDefinition("circuit-breaker");
  return {
    id: "prot-1",
    type: "electrical",
    position: { x: 0, y: 0 },
    data: { componentType: "circuit-breaker", label: def?.label ?? "Disjoncteur DC", poles: "simple", amperage: 16, ...data },
  };
}

function resetStore(nodes: Node<ElectricalNodeData>[], edges: Edge<CableEdgeData>[]) {
  useSchemaStore.setState({ nodes, edges, past: [], future: [] });
}

test("convertFuseCircuitBreaker transforme un fusible en disjoncteur DC en conservant position et calibre", () => {
  resetStore([fuseNode()], []);

  useSchemaStore.getState().convertFuseCircuitBreaker("prot-1");

  const node = useSchemaStore.getState().nodes.find((n) => n.id === "prot-1");
  assert.ok(node);
  assert.equal(node.data.componentType, "circuit-breaker");
  assert.equal(node.data.amperage, 30);
  assert.equal(node.data.poles, "simple");
  assert.equal(node.data.fuseType, undefined);
  assert.deepEqual(node.position, { x: 0, y: 0 });
});

test("convertFuseCircuitBreaker transforme un disjoncteur en fusible et repart sur un format par defaut", () => {
  resetStore([breakerNode()], []);

  useSchemaStore.getState().convertFuseCircuitBreaker("prot-1");

  const node = useSchemaStore.getState().nodes.find((n) => n.id === "prot-1");
  assert.ok(node);
  assert.equal(node.data.componentType, "fuse");
  assert.equal(node.data.amperage, 16);
  assert.equal(node.data.fuseType, "midi");
  assert.equal(node.data.poles, undefined);
});

test("convertFuseCircuitBreaker garde un libelle personnalise mais reinitialise le libelle par defaut de l'ancien type", () => {
  const customLabel = fuseNode({ label: "Fusible frigo" });
  resetStore([customLabel], []);
  useSchemaStore.getState().convertFuseCircuitBreaker("prot-1");
  assert.equal(useSchemaStore.getState().nodes[0]?.data.label, "Fusible frigo");

  const defaultLabelFuse = getComponentDefinition("fuse")?.label;
  resetStore([fuseNode({ label: defaultLabelFuse })], []);
  useSchemaStore.getState().convertFuseCircuitBreaker("prot-1");
  assert.equal(useSchemaStore.getState().nodes[0]?.data.label, getComponentDefinition("circuit-breaker")?.label);
});

test("convertFuseCircuitBreaker elague les cables branches sur les bornes IN-/OUT- absentes d'un fusible", () => {
  const other: Node<ElectricalNodeData> = {
    id: "other",
    type: "electrical",
    position: { x: 200, y: 0 },
    data: { componentType: "busbar", label: "Busbar", polarity: "negative" },
  };
  const edges: Edge<CableEdgeData>[] = [
    { id: "e-pos", source: "prot-1", sourceHandle: "output", target: "other", targetHandle: "input", data: {} },
    { id: "e-neg", source: "prot-1", sourceHandle: "output-negative", target: "other", targetHandle: "input", data: {} },
  ];
  resetStore([breakerNode({ poles: "bipolar" }), other], edges);

  useSchemaStore.getState().convertFuseCircuitBreaker("prot-1");

  const remainingEdgeIds = useSchemaStore.getState().edges.map((e) => e.id);
  assert.deepEqual(remainingEdgeIds, ["e-pos"]);
});

test("convertFuseCircuitBreaker ignore les composants qui ne sont ni fusible ni disjoncteur", () => {
  const busbar: Node<ElectricalNodeData> = {
    id: "prot-1",
    type: "electrical",
    position: { x: 0, y: 0 },
    data: { componentType: "busbar", label: "Busbar" },
  };
  resetStore([busbar], []);

  useSchemaStore.getState().convertFuseCircuitBreaker("prot-1");

  assert.equal(useSchemaStore.getState().nodes[0]?.data.componentType, "busbar");
});

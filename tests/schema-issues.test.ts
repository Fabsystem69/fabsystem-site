import assert from "node:assert/strict";
import test from "node:test";
import type { Edge, Node } from "@xyflow/react";
import { recalculateCableSections } from "@/lib/electrical-components/auto-size";
import { computeSchemaIssues } from "@/lib/electrical-components/checks";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";

type SchemaNode = Node<ElectricalNodeData>;
type SchemaEdge = Edge<CableEdgeData>;

function createNode(id: string, componentType: string, extra: Record<string, unknown> = {}): SchemaNode {
  return {
    id,
    position: { x: 0, y: 0 },
    data: {
      componentType,
      label: String(extra.label ?? componentType),
      ...extra,
    },
  };
}

function createEdge(
  id: string,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
  cableType: string,
  section?: string,
): SchemaEdge {
  return {
    id,
    source,
    sourceHandle,
    target,
    targetHandle,
    data: {
      cableType,
      ...(section ? { section } : {}),
    },
  };
}

function createSizingFixture(options: { batteryFuseSection?: string; fuseAmperage?: number; consumerPowerW?: number } = {}): {
  nodes: SchemaNode[];
  edges: SchemaEdge[];
} {
  const { batteryFuseSection, fuseAmperage = 100, consumerPowerW = 300 } = options;

  const nodes: SchemaNode[] = [
    createNode("battery", "battery", { label: "Batterie servitude", voltage: 12 }),
    createNode("fuse", "fuse", { label: "Fusible principal", amperage: fuseAmperage }),
    createNode("switch", "battery-switch", { label: "Coupe-batterie" }),
    createNode("panel", "fuse-block", { label: "Platine", outputCount: 1, outAmp1: 30 }),
    createNode("consumer", "consumer", { label: "Frigo", powerW: consumerPowerW }),
  ];

  const edges: SchemaEdge[] = [
    createEdge("edge-battery-fuse", "battery", "positive", "fuse", "input", "power-positive", batteryFuseSection),
    createEdge("edge-fuse-switch", "fuse", "output", "switch", "input", "power-positive", "4 mm²"),
    createEdge("edge-switch-panel", "switch", "output", "panel", "input", "power-positive", "4 mm²"),
    createEdge("edge-panel-consumer", "panel", "out-1", "consumer", "positive", "power-positive", "4 mm²"),
    createEdge("edge-battery-consumer-negative", "battery", "negative", "consumer", "negative", "power-negative", "4 mm²"),
  ];

  return { nodes, edges };
}

test("recalculateCableSections dimensionne le câblage principal depuis le fusible principal", () => {
  const { nodes, edges } = createSizingFixture();

  const result = recalculateCableSections(nodes, edges);
  const batteryFuseCable = result.edges.find((edge) => edge.id === "edge-battery-fuse");
  const fuseSwitchCable = result.edges.find((edge) => edge.id === "edge-fuse-switch");
  const switchPanelCable = result.edges.find((edge) => edge.id === "edge-switch-panel");

  assert.equal(result.updatedCount, 3);
  assert.equal(batteryFuseCable?.data?.section, "10 mm²");
  assert.equal(fuseSwitchCable?.data?.section, "10 mm²");
  assert.equal(switchPanelCable?.data?.section, "2,5 mm²");
});

test("recalculateCableSections peut dimensionner le câblage principal depuis le fusible principal même sans puissance consommateur connue", () => {
  const { nodes, edges } = createSizingFixture({ consumerPowerW: 0 });

  const result = recalculateCableSections(nodes, edges);
  const batteryFuseCable = result.edges.find((edge) => edge.id === "edge-battery-fuse");
  const fuseSwitchCable = result.edges.find((edge) => edge.id === "edge-fuse-switch");
  const switchPanelCable = result.edges.find((edge) => edge.id === "edge-switch-panel");

  assert.equal(result.updatedCount, 2);
  assert.equal(batteryFuseCable?.data?.section, "10 mm²");
  assert.equal(fuseSwitchCable?.data?.section, "10 mm²");
  assert.equal(switchPanelCable?.data?.section, "4 mm²");
});

test("computeSchemaIssues signale un câble de puissance sans section et propose le recalcul direct", () => {
  const { nodes, edges } = createSizingFixture();

  const issue = computeSchemaIssues(nodes, edges).find((candidate) => candidate.targetKind === "edge" && candidate.targetId === "edge-battery-fuse");

  assert.ok(issue);
  assert.match(issue.message, /n'a pas de section renseignée/i);
  assert.match(issue.message, /protégé en 100,0 A/i);
  assert.match(issue.message, /10 mm²/);
  assert.equal(issue.action, "recalculate-all-cable-sections");
});

test("computeSchemaIssues signale un câble trop petit pour le courant estimé", () => {
  const { nodes, edges } = createSizingFixture({ batteryFuseSection: "6 mm²" });

  const issue = computeSchemaIssues(nodes, edges).find((candidate) => candidate.targetKind === "edge" && candidate.targetId === "edge-battery-fuse");

  assert.ok(issue);
  assert.match(issue.message, /trop juste/i);
  assert.match(issue.message, /6 mm²/);
  assert.match(issue.message, /10 mm²/);
});

test("computeSchemaIssues ne signale pas un câble déjà dans la norme ou surdimensionné", () => {
  const { nodes, edges } = createSizingFixture({ batteryFuseSection: "25 mm²" });

  const issue = computeSchemaIssues(nodes, edges).find((candidate) => candidate.targetKind === "edge" && candidate.targetId === "edge-battery-fuse");

  assert.equal(issue, undefined);
});

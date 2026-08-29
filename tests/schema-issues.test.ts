import assert from "node:assert/strict";
import test from "node:test";
import type { Edge, Node } from "@xyflow/react";
import { estimateEdgeAmps, recalculateCableSections } from "@/lib/electrical-components/auto-size";
import { computeSchemaIssues } from "@/lib/electrical-components/checks";
import { getComponentDefinition, getEffectiveHandles } from "@/lib/electrical-components/definitions";
import { AVAILABLE_FUSES_A } from "@/lib/calc/section-cable";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";

type SchemaNode = Node<ElectricalNodeData>;
type SchemaEdge = Edge<CableEdgeData>;

test("une platine DC avec retours négatifs possède une entrée négative commune", () => {
  const definition = getComponentDefinition("fuse-block");
  assert.ok(definition);

  const handles = getEffectiveHandles(definition, {
    componentType: "fuse-block",
    outputCount: 2,
    layout: "positive-negative",
  });

  assert.ok(handles.some((handle) => handle.id === "in-negative" && handle.kind === "negative"));
  assert.ok(handles.some((handle) => handle.id === "out-1-neg"));
  assert.ok(handles.some((handle) => handle.id === "out-2-neg"));
});

test("un tableau 12 V avec fusibles expose un calibre réglable par départ", () => {
  const definition = getComponentDefinition("distribution-panel");
  assert.ok(definition);

  const data = { componentType: "distribution-panel", layout: "with-fuses", outputCount: 2, outAmp1: 10, outAmp2: 15 };
  const handles = getEffectiveHandles(definition, data);

  assert.equal(handles.filter((handle) => handle.id.startsWith("out-")).length, 2);
  assert.equal(definition.getHandleLabel?.(data, handles.find((handle) => handle.id === "out-2")!), "2 · 15A");
});

test("les suggestions de protection conservent le calibre 2 A puis des pas de 5 A", () => {
  assert.equal(AVAILABLE_FUSES_A[0], 2);
  assert.deepEqual(AVAILABLE_FUSES_A.slice(1, 6), [5, 10, 15, 20, 25]);
});

test("une centrale de gestion reçoit une suggestion sur ses câbles positif et négatif", () => {
  const nodes = [
    createNode("battery", "battery", { voltage: 12 }),
    createNode("cerbo", "system-controller", { brandModelId: "victron-cerbo-gx" }),
  ];
  const positive = createEdge("cerbo-plus", "battery", "positive", "cerbo", "positive", "power-positive");
  const negative = createEdge("cerbo-minus", "battery", "negative", "cerbo", "negative", "power-negative");

  assert.ok(Math.abs((estimateEdgeAmps(positive, nodes, [positive, negative]) ?? 0) - 0.4) < 0.000_001);
  assert.ok(Math.abs((estimateEdgeAmps(negative, nodes, [positive, negative]) ?? 0) - 0.4) < 0.000_001);
});

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

test("un retour négatif de consommateur est dimensionné dès que sa puissance est connue", () => {
  const nodes = [
    createNode("negative-busbar", "busbar", { polarity: "negative", outputCount: 1 }),
    createNode("pump", "consumer", { label: "Pompe", powerW: 60 }),
  ];
  const edges = [
    createEdge("edge-pump-negative", "negative-busbar", "out-1", "pump", "negative", "power-negative"),
  ];

  const result = recalculateCableSections(nodes, edges);
  assert.equal(result.updatedCount, 1);
  assert.ok(result.edges[0]?.data?.section?.endsWith("mm²"));
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

test("computeSchemaIssues signale un disjoncteur sous-calibré pour le courant du circuit", () => {
  const { nodes, edges } = createSizingFixture({ fuseAmperage: 16, consumerPowerW: 600 });
  const breaker = nodes.find((node) => node.id === "fuse")!;
  breaker.data.componentType = "circuit-breaker";
  breaker.data.label = "Disjoncteur principal";

  const issue = computeSchemaIssues(nodes, edges).find((candidate) => candidate.id === "fuse-undersized");

  assert.ok(issue);
  assert.match(issue.message, /16,0 A/i);
  assert.match(issue.message, /50,0 A/i);
  assert.match(issue.message, /sous-calibré/i);
});

test("computeSchemaIssues accepte deux panneaux solaires câblés en série", () => {
  const nodes = [createNode("panel-a", "solar-panel"), createNode("panel-b", "solar-panel")];
  const edges = [createEdge("series", "panel-a", "positive", "panel-b", "negative", "power-positive")];

  const issue = computeSchemaIssues(nodes, edges).find((candidate) => candidate.id === "series-polarity-mismatch");
  assert.equal(issue, undefined);
});

test("computeSchemaIssues signale une terre AC non raccordée", () => {
  const nodes = [createNode("ac-panel", "ac-panel")];
  const issue = computeSchemaIssues(nodes, []).find((candidate) => candidate.id === "ac-panel-earth-earth-missing");

  assert.ok(issue);
  assert.match(issue.message, /terre non raccordée/i);
  assert.equal(issue.severity, "error");
  assert.equal(issue.category, "connection");
});

test("computeSchemaIssues signale plus de quatre câbles sur une borne", () => {
  const nodes = [createNode("battery", "battery"), ...Array.from({ length: 5 }, (_, index) => createNode(`fuse-${index}`, "fuse"))];
  const edges = Array.from({ length: 5 }, (_, index) => createEdge(`wire-${index}`, "battery", "positive", `fuse-${index}`, "input", "power-positive"));

  const issue = computeSchemaIssues(nodes, edges).find((candidate) => candidate.id === "battery-positive-too-many-terminals");
  assert.ok(issue);
  assert.match(issue.message, /plus de 4 câbles/i);
});

import assert from "node:assert/strict";
import test from "node:test";
import type { Edge, Node } from "@xyflow/react";
import { evaluateEdgeSection } from "@/lib/electrical-components/auto-size";
import { BRAND_MODELS } from "@/lib/electrical-components/brand-models";
import { computeSchemaIssues } from "@/lib/electrical-components/checks";
import { getComponentDefinition, getEffectiveHandles } from "@/lib/electrical-components/definitions";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";

type SchemaNode = Node<ElectricalNodeData>;
type SchemaEdge = Edge<CableEdgeData>;

function panel(id: string): SchemaNode {
  return { id, position: { x: 0, y: 0 }, data: { componentType: "solar-panel", label: id, powerW: 110, voltage: 18, operatingCurrentA: 6.1, shortCircuitCurrentA: 6.4, vocVoltage: 22 } };
}

function node(id: string, componentType: string): SchemaNode {
  return { id, position: { x: 0, y: 0 }, data: { componentType, label: id } };
}

function edge(id: string, source: string, sourceHandle: string, target: string, targetHandle: string, length = 5): SchemaEdge {
  return { id, source, sourceHandle, target, targetHandle, data: { cableType: "power-positive", length } };
}

test("un câble PV série est dimensionné sur Isc et Vmp de la string, pas sur la batterie", () => {
  const nodes = [panel("panel-1"), panel("panel-2"), node("mppt", "mppt")];
  const edges = [
    edge("series", "panel-1", "positive", "panel-2", "negative"),
    edge("to-mppt", "panel-2", "positive", "mppt", "pv-positive"),
  ];

  const diagnostic = evaluateEdgeSection(edges[1]!, nodes, edges);
  assert.ok(diagnostic);
  assert.equal(diagnostic.ampsSource, "solar");
  assert.equal(diagnostic.voltage, 36);
  assert.equal(diagnostic.amps, 8);
  assert.equal(diagnostic.recommendedSectionLabel, "1,5 mm²");
});

test("un câble PV après un busbar additionne seulement les strings en parallèle", () => {
  const nodes = [panel("panel-1"), panel("panel-2"), node("pv-bus", "busbar"), node("mppt", "mppt")];
  const edges = [
    edge("panel-1-bus", "panel-1", "positive", "pv-bus", "input"),
    edge("panel-2-bus", "panel-2", "positive", "pv-bus", "out-1"),
    edge("bus-mppt", "pv-bus", "out-2", "mppt", "pv-positive"),
  ];

  const diagnostic = evaluateEdgeSection(edges[2]!, nodes, edges);
  assert.ok(diagnostic);
  assert.equal(diagnostic.amps, 16);
  assert.equal(diagnostic.voltage, 18);
  assert.equal(diagnostic.recommendedSectionLabel, "6 mm²");
});

test("le contrôle PV signale un array dont Isc dépasse la limite du MPPT", () => {
  const nodes = [panel("panel-1"), panel("panel-2"), { ...node("mppt", "mppt"), data: { componentType: "mppt", label: "Tracer 10A", maxPvInputCurrentA: 10 } }];
  const edges = [
    edge("panel-1-mppt", "panel-1", "positive", "mppt", "pv-positive"),
    edge("panel-2-mppt", "panel-2", "positive", "mppt", "pv-positive"),
  ];

  const issues = computeSchemaIssues(nodes, edges);
  assert.ok(issues.some((issue) => issue.id === "mppt-pv-input-overcurrent" && issue.severity === "error"));
});

test("les données solaires incomplètes produisent une alerte légère", () => {
  const incomplete = { id: "panel-incomplete", position: { x: 0, y: 0 }, data: { componentType: "solar-panel", label: "Panneau sans fiche", powerW: 100 } } as SchemaNode;
  const complete = panel("panel-complete");

  const issues = computeSchemaIssues([incomplete, complete], []);
  assert.ok(issues.some((issue) => issue.id === "panel-incomplete-solar-data-incomplete" && issue.severity === "info"));
  assert.equal(issues.some((issue) => issue.id === "panel-complete-solar-data-incomplete"), false);
});

test("un MPPT ne requiert pas une limite Isc quand le constructeur ne la publie pas", () => {
  const mppt = {
    id: "mppt-without-isc-limit",
    position: { x: 0, y: 0 },
    data: { componentType: "mppt", label: "MPPT documenté", amperage: 40, maxPvVoltage: 100, maxPvPower12V: 560 },
  } as SchemaNode;

  const issues = computeSchemaIssues([mppt], []);
  assert.equal(issues.some((issue) => issue.id === "mppt-without-isc-limit-solar-data-incomplete"), false);
});

test("chaque panneau de marque renseigne les donnees STC necessaires au calcul", () => {
  const required = ["powerW", "voltage", "operatingCurrentA", "shortCircuitCurrentA", "vocVoltage"];
  const incomplete = BRAND_MODELS.filter(
    (model) => model.componentType === "solar-panel" && required.some((key) => !(Number(model.defaults[key]) > 0)),
  );

  assert.deepEqual(incomplete.map((model) => model.id), []);
});

test("chaque chargeur DC-DC de marque precise son entree, sa sortie et son courant", () => {
  const required = ["voltageIn", "voltageOut", "amperage"];
  const incomplete = BRAND_MODELS.filter(
    (model) => model.componentType === "dcdc" && required.some((key) => !(Number(model.defaults[key]) > 0)),
  );

  assert.deepEqual(incomplete.map((model) => model.id), []);
});

test("chaque chargeur secteur precise la tension batterie et son courant de charge", () => {
  const required = ["voltageDC", "chargeAmperage"];
  const incomplete = BRAND_MODELS.filter(
    (model) => model.componentType === "ac-charger" && required.some((key) => !(Number(model.defaults[key]) > 0)),
  );

  assert.deepEqual(incomplete.map((model) => model.id), []);
});

test("chaque convertisseur renseigne sa puissance continue et sa tension DC", () => {
  const required = ["powerW", "voltageDC"];
  const incomplete = BRAND_MODELS.filter(
    (model) => model.componentType === "inverter" && required.some((key) => !(Number(model.defaults[key]) > 0)),
  );

  assert.deepEqual(incomplete.map((model) => model.id), []);
});

test("chaque convertisseur-chargeur renseigne ses donnees de puissance et de charge", () => {
  const required = ["powerW", "voltageDC", "chargeAmperage"];
  const incomplete = BRAND_MODELS.filter(
    (model) => model.componentType === "inverter-charger" && required.some((key) => !(Number(model.defaults[key]) > 0)),
  );

  assert.deepEqual(incomplete.map((model) => model.id), []);
});

test("les centrales Victron exposent le nombre reel de ports VE.Direct et VE.Bus", () => {
  const controller = getComponentDefinition("system-controller");
  assert.ok(controller);

  const expectedPorts: Record<string, string[]> = {
    "victron-cerbo-gx": ["ve-direct", "ve-direct-2", "ve-direct-3", "ve-bus", "ve-bus-2"],
    "victron-cerbo-gx-mk2": ["ve-direct", "ve-direct-2", "ve-direct-3", "ve-bus", "ve-bus-2"],
    "victron-ekrano-gx": ["ve-direct", "ve-direct-2", "ve-direct-3", "ve-bus", "ve-bus-2"],
    "victron-ccgx": ["ve-direct", "ve-direct-2", "ve-bus", "ve-bus-2"],
  };

  for (const [modelId, ports] of Object.entries(expectedPorts)) {
    const model = BRAND_MODELS.find((candidate) => candidate.id === modelId);
    assert.ok(model, `modele catalogue absent: ${modelId}`);
    const handles = getEffectiveHandles(controller, { componentType: "system-controller", brandModelId: modelId, ...model.defaults });
    assert.deepEqual(handles.filter((handle) => handle.id.startsWith("ve-")).map((handle) => handle.id), ports);
  }

  for (const modelId of ["victron-cerbo-gx", "victron-cerbo-gx-mk2", "victron-venus-gx"]) {
    const model = BRAND_MODELS.find((candidate) => candidate.id === modelId);
    assert.ok(model, `modele catalogue absent: ${modelId}`);
    const handles = getEffectiveHandles(controller, { componentType: "system-controller", brandModelId: modelId, ...model.defaults });
    assert.ok(handles.some((handle) => handle.id === "gx-display"), `${modelId} doit exposer une sortie écran`);
  }
});

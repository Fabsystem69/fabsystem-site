import assert from "node:assert/strict";
import test from "node:test";
import type { Edge, Node } from "@xyflow/react";
import { evaluateEdgeSection, recalculateFuseRatings } from "@/lib/electrical-components/auto-size";
import { computeSchemaIssues } from "@/lib/electrical-components/checks";
import { findCableBand, getManufacturerSpec } from "@/lib/electrical-components/manufacturer-specs";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";

// Retour utilisateur (10/2026) : préconisations des manuels Victron (section
// de câble par longueur, fusible, capacité batterie, borne) dans l'éditeur
// et dans les moteurs de vérification — 12 V uniquement pour l'instant.

type SchemaNode = Node<ElectricalNodeData>;
type SchemaEdge = Edge<CableEdgeData>;

function node(id: string, componentType: string, extra: Record<string, unknown> = {}): SchemaNode {
  return { id, position: { x: 0, y: 0 }, data: { componentType, label: id, ...extra } };
}

function cable(
  id: string,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
  cableType: string,
  data: Partial<CableEdgeData> = {},
): SchemaEdge {
  return { id, source, sourceHandle, target, targetHandle, type: "cable", data: { cableType, ...data } };
}

// Batterie → fusible → appareil (+), batterie → appareil (−).
function deviceFixture(options: {
  componentType: string;
  brandModelId: string;
  deviceData?: Record<string, unknown>;
  positiveHandle: string;
  negativeHandle: string;
  fuseA?: number | null;
  capacityAh?: number;
  cableData?: Partial<CableEdgeData>;
}): { nodes: SchemaNode[]; edges: SchemaEdge[] } {
  const { componentType, brandModelId, deviceData = {}, positiveHandle, negativeHandle, fuseA = null, capacityAh = 1000, cableData = {} } = options;
  const nodes: SchemaNode[] = [
    node("battery", "battery", { voltage: 12, capacityAh, technology: "lithium" }),
    node("device", componentType, { brandModelId, ...deviceData }),
  ];
  const edges: SchemaEdge[] = [];
  if (fuseA !== null) {
    nodes.push(node("fuse", "fuse", { amperage: fuseA }));
    edges.push(cable("e-bat-fuse", "battery", "positive", "fuse", "input", "power-positive", { ...cableData, length: 0.3 }));
    edges.push(cable("e-fuse-device", "fuse", "output", "device", positiveHandle, "power-positive", cableData));
  } else {
    edges.push(cable("e-fuse-device", "battery", "positive", "device", positiveHandle, "power-positive", cableData));
  }
  edges.push(cable("e-neg", "battery", "negative", "device", negativeHandle, "power-negative", cableData));
  return { nodes, edges };
}

const MULTIPLUS_3000 = {
  componentType: "inverter-charger",
  brandModelId: "victron-multiplus-3000-120",
  deviceData: { powerW: 2400, voltageDC: 12, chargeAmperage: 120 },
  positiveHandle: "dc-positive",
  negativeHandle: "dc-negative",
};

test("données : tranche de câble par longueur et longueur déconseillée", () => {
  const multiplus = getManufacturerSpec("victron-multiplus-3000-120");
  assert.ok(multiplus);
  assert.deepEqual(findCableBand(multiplus, 4), { maxLengthM: 5, sectionMm2: 50, conductors: 2 });
  assert.deepEqual(findCableBand(multiplus, 7), { maxLengthM: 10, sectionMm2: 70, conductors: 2 });
  const smart = getManufacturerSpec("victron-inverter-smart-1600");
  assert.equal(findCableBand(smart!, 6)?.sectionMm2, null);
  assert.equal(getManufacturerSpec("modele-inconnu"), null);
});

test("dimensionnement : jamais sous la préconisation Victron (MultiPlus 12/3000, 1 conducteur → section équivalente à 2 × 50 mm²)", () => {
  const { nodes, edges } = deviceFixture({ ...MULTIPLUS_3000, fuseA: 400, cableData: { length: 2 } });
  const diagnostic = evaluateEdgeSection(edges.find((e) => e.id === "e-neg")!, nodes, edges);
  assert.ok(diagnostic);
  assert.ok(diagnostic.recommendedSectionMm2 >= 120, `attendu ≥ 120 mm², obtenu ${diagnostic.recommendedSectionMm2}`);
});

test("dimensionnement : câbles doublés comptés (2 conducteurs → 50 mm² chacun suffisent)", () => {
  const { nodes, edges } = deviceFixture({ ...MULTIPLUS_3000, fuseA: 400, cableData: { length: 2, parallelRuns: 2, section: "50 mm²" } });
  const diagnostic = evaluateEdgeSection(edges.find((e) => e.id === "e-neg")!, nodes, edges);
  assert.ok(diagnostic);
  assert.equal(diagnostic.recommendedSectionMm2, 50);
  assert.equal(diagnostic.status, "ok");
});

test("vérification : montage conforme Victron (2 × 50 mm², 400 A) sans alerte d'ampacité ni de préconisation", () => {
  const { nodes, edges } = deviceFixture({ ...MULTIPLUS_3000, fuseA: 400, capacityAh: 600, cableData: { length: 2, parallelRuns: 2, section: "50 mm²" } });
  const issues = computeSchemaIssues(nodes, edges);
  const relevant = issues.filter((i) => /ampacity|manufacturer/.test(i.id));
  assert.deepEqual(relevant.map((i) => i.id), []);
});

test("vérification : câble plus fin que la préconisation Victron → erreur avec la valeur du manuel", () => {
  const { nodes, edges } = deviceFixture({ ...MULTIPLUS_3000, fuseA: 400, cableData: { length: 2, section: "35 mm²" } });
  const issue = computeSchemaIssues(nodes, edges).find((i) => i.id === "e-neg-manufacturer-section");
  assert.ok(issue);
  assert.equal(issue.severity, "error");
  assert.match(issue.message, /2 × 50 mm²/);
  assert.match(issue.message, /Victron/);
});

test("vérification : longueur déconseillée par Victron (Inverter Smart 12/1600 au-delà de 5 m)", () => {
  const { nodes, edges } = deviceFixture({
    componentType: "inverter",
    brandModelId: "victron-inverter-smart-1600",
    deviceData: { powerW: 1300, voltageDC: 12 },
    positiveHandle: "dc-positive",
    negativeHandle: "dc-negative",
    fuseA: 250,
    cableData: { length: 6, section: "70 mm²" },
  });
  const issue = computeSchemaIssues(nodes, edges).find((i) => i.id === "e-neg-manufacturer-length");
  assert.ok(issue);
  assert.match(issue.message, /déconseill/);
});

test("vérification : fusible MPPT au-dessus du maximum Victron → erreur, en dessous du minimum → avertissement", () => {
  const base = {
    componentType: "mppt",
    brandModelId: "victron-smartsolar-100-30",
    deviceData: { amperage: 30 },
    positiveHandle: "bat-positive",
    negativeHandle: "bat-negative",
    cableData: { length: 1, section: "10 mm²" },
  };
  const tooBig = computeSchemaIssues(...Object.values(deviceFixture({ ...base, fuseA: 60 })) as [SchemaNode[], SchemaEdge[]]);
  const over = tooBig.find((i) => i.id === "fuse-manufacturer-fuse-range-device");
  assert.ok(over);
  assert.equal(over.severity, "error");
  assert.match(over.message, /35.*40 A/);

  const tooSmall = computeSchemaIssues(...Object.values(deviceFixture({ ...base, fuseA: 30 })) as [SchemaNode[], SchemaEdge[]]);
  const under = tooSmall.find((i) => i.id === "fuse-manufacturer-fuse-range-device");
  assert.ok(under);
  assert.equal(under.severity, "warning");
});

test("vérification : section qui ne rentre pas dans la borne (MPPT 100/20, borne 6 mm²)", () => {
  const { nodes, edges } = deviceFixture({
    componentType: "mppt",
    brandModelId: "victron-smartsolar-100-20",
    deviceData: { amperage: 20 },
    positiveHandle: "bat-positive",
    negativeHandle: "bat-negative",
    fuseA: 25,
    cableData: { length: 1, section: "10 mm²" },
  });
  const issue = computeSchemaIssues(nodes, edges).find((i) => i.id === "e-neg-manufacturer-terminal");
  assert.ok(issue);
  assert.match(issue.message, /6 mm²/);
});

test("vérification : Phoenix VE.Direct à plus de 1,5 m sans fusible externe → erreur", () => {
  const { nodes, edges } = deviceFixture({
    componentType: "inverter",
    brandModelId: "victron-phoenix-800",
    deviceData: { powerW: 800, voltageDC: 12 },
    positiveHandle: "dc-positive",
    negativeHandle: "dc-negative",
    fuseA: null,
    cableData: { length: 2, section: "25 mm²" },
  });
  const issue = computeSchemaIssues(nodes, edges).find((i) => i.id === "device-manufacturer-external-fuse");
  assert.ok(issue);
  assert.equal(issue.severity, "error");
  assert.match(issue.message, /1,5 m/);
});

test("vérification : batterie sous la capacité conseillée par Victron → avertissement", () => {
  const { nodes, edges } = deviceFixture({
    componentType: "inverter-charger",
    brandModelId: "victron-multiplus-1200-50",
    deviceData: { powerW: 1000, voltageDC: 12, chargeAmperage: 50 },
    positiveHandle: "dc-positive",
    negativeHandle: "dc-negative",
    fuseA: 200,
    capacityAh: 100,
    cableData: { length: 2, section: "35 mm²" },
  });
  const issue = computeSchemaIssues(nodes, edges).find((i) => i.id === "device-manufacturer-battery-capacity");
  assert.ok(issue);
  assert.equal(issue.severity, "warning");
  assert.match(issue.message, /150/);
});

test("recalcul des protections : propose le calibre Victron (400 A pour un MultiPlus 12/3000)", () => {
  const { nodes, edges } = deviceFixture({ ...MULTIPLUS_3000, fuseA: 100, cableData: { length: 2, parallelRuns: 2, section: "50 mm²" } });
  const result = recalculateFuseRatings(nodes, edges);
  assert.equal(result.nodes.find((n) => n.id === "fuse")?.data.amperage, 400);
});

// Décision produit (10/2026, "corrige tout") : une association conforme au
// manuel Victron (fusible préconisé + section Victron pour la longueur)
// n'est plus contredite par l'hypothèse prudente PVC 70 °C du moteur.
const INVERTER_SMART_3000 = {
  componentType: "inverter",
  brandModelId: "victron-inverter-smart-3000",
  deviceData: { powerW: 2400, voltageDC: 12 },
  positiveHandle: "dc-positive",
  negativeHandle: "dc-negative",
};

test("ampacité : Inverter Smart 12/3000 en 95 mm² avec fusible 400 A (conforme Victron) → aucune alerte", () => {
  const { nodes, edges } = deviceFixture({ ...INVERTER_SMART_3000, fuseA: 400, capacityAh: 600, cableData: { length: 2, section: "95 mm²" } });
  const relevant = computeSchemaIssues(nodes, edges).filter((i) => /ampacity|manufacturer/.test(i.id));
  assert.deepEqual(relevant.map((i) => i.id), []);
});

test("ampacité : section sous la préconisation Victron → l'alerte d'ampacité reste", () => {
  const { nodes, edges } = deviceFixture({ ...INVERTER_SMART_3000, fuseA: 400, capacityAh: 600, cableData: { length: 2, section: "70 mm²" } });
  const ids = computeSchemaIssues(nodes, edges).map((i) => i.id);
  assert.ok(ids.includes("fuse-e-fuse-device-exceeds-cable-ampacity"));
});

test("trajet : la section Victron s'applique aussi au câble batterie → fusible (à travers le fusible)", () => {
  const { nodes, edges } = deviceFixture({ ...MULTIPLUS_3000, fuseA: 400, cableData: { length: 2, parallelRuns: 2, section: "50 mm²" } });
  const patched = edges.map((e) => (e.id === "e-bat-fuse" ? { ...e, data: { ...e.data, parallelRuns: 1, section: "35 mm²" } } : e));
  const ids = computeSchemaIssues(nodes, patched).map((i) => i.id);
  assert.ok(ids.includes("e-bat-fuse-manufacturer-section"), ids.join(", "));
  const diagnostic = evaluateEdgeSection(patched.find((e) => e.id === "e-bat-fuse")!, nodes, patched);
  assert.ok(diagnostic && diagnostic.recommendedSectionMm2 >= 120);
});

test("trajet : la section max. de borne ne concerne que le câble branché sur l'appareil", () => {
  const { nodes, edges } = deviceFixture({
    componentType: "mppt",
    brandModelId: "victron-smartsolar-100-20",
    deviceData: { amperage: 20 },
    positiveHandle: "bat-positive",
    negativeHandle: "bat-negative",
    fuseA: 25,
    cableData: { length: 1, section: "6 mm²" },
  });
  const patched = edges.map((e) => (e.id === "e-bat-fuse" ? { ...e, data: { ...e.data, section: "10 mm²" } } : e));
  const ids = computeSchemaIssues(nodes, patched).map((i) => i.id);
  assert.ok(!ids.includes("e-bat-fuse-manufacturer-terminal"));
});

test("borne : la section auto reste dans la borne quand Victron donne une section valable (Orion XS 50, 5 m → ≤ 25 mm²)", () => {
  const { nodes, edges } = deviceFixture({
    componentType: "dcdc",
    brandModelId: "victron-orion-xs-12-12-50",
    deviceData: { amperage: 50, voltageIn: 12, voltageOut: 12, topology: "non-isolated" },
    positiveHandle: "out-positive",
    negativeHandle: "out-negative",
    fuseA: 70,
    cableData: { length: 5 },
  });
  const diagnostic = evaluateEdgeSection(edges.find((e) => e.id === "e-fuse-device")!, nodes, edges);
  assert.ok(diagnostic);
  assert.ok(diagnostic.recommendedSectionMm2 >= 16 && diagnostic.recommendedSectionMm2 <= 25, `obtenu ${diagnostic.recommendedSectionMm2}`);
});

test("données : MultiPlus 12/1600 et gamme Compact 230 V (manuels officiels Victron)", () => {
  assert.equal(findCableBand(getManufacturerSpec("victron-multiplus-1600-70")!, 3)?.sectionMm2, 50);
  assert.equal(findCableBand(getManufacturerSpec("victron-multiplus-compact-800-35")!, 1)?.sectionMm2, 16);
  assert.equal(findCableBand(getManufacturerSpec("victron-multiplus-compact-1200-50")!, 4)?.sectionMm2, 50);
  assert.deepEqual(findCableBand(getManufacturerSpec("victron-multiplus-compact-1600-70")!, 8), { maxLengthM: 10, sectionMm2: 70, conductors: 2 });
  assert.deepEqual(getManufacturerSpec("victron-multiplus-compact-1600-70")?.batteryAh, { min: 200, max: 700 });
});

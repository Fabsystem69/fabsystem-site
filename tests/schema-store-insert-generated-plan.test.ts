import test from "node:test";
import assert from "node:assert/strict";
import type { Edge, Node } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import type { GeneratedSchemaPlan } from "@/lib/schema-editor/generated-plan";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";

// insertGeneratedPlan (features/schemas/store/useSchemaStore.ts) : pose une
// proposition validée de l'assistant IA de génération
// (lib/services/schema-ai-generate.ts). Même principe que
// insertGuidedInstall (assistant solaire à boutons, déjà existant) — une
// nouvelle zone autonome, un seul pas d'historique — mais jamais câblée vers
// l'existant et jamais de section inventée quand elle n'est pas calculable.

function resetStore(nodes: Node<ElectricalNodeData>[] = [], edges: Edge<CableEdgeData>[] = []) {
  useSchemaStore.setState({ nodes, edges, past: [], future: [], selectedNodeId: null, selectedEdgeId: null });
}

const BASIC_PLAN: GeneratedSchemaPlan = {
  zoneLabel: "Solaire + DC-DC",
  zoneWidth: 400,
  zoneHeight: 260,
  components: [
    { key: "battery-1", type: "battery", label: "Batterie", dataOverride: { voltage: 12, capacityAh: 100 }, offsetX: 0, offsetY: 0 },
    { key: "mppt-1", type: "mppt", label: "Régulateur MPPT", dataOverride: { amperage: 20 }, offsetX: 220, offsetY: 0 },
  ],
  edges: [{ sourceKey: "mppt-1", sourceHandle: "bat-positive", targetKey: "battery-1", targetHandle: "positive" }],
};

test("insertGeneratedPlan: pose une nouvelle zone avec ses composants et câbles, en un seul pas d'historique", () => {
  resetStore();

  const zoneId = useSchemaStore.getState().insertGeneratedPlan(BASIC_PLAN);

  const { nodes, edges, past } = useSchemaStore.getState();
  const zoneNode = nodes.find((n) => n.id === zoneId);
  assert.ok(zoneNode, "la zone doit avoir été créée");
  assert.equal(zoneNode!.data.label, "Solaire + DC-DC");
  assert.equal(zoneNode!.type, "zone");

  const componentNodes = nodes.filter((n) => n.type === "electrical");
  assert.equal(componentNodes.length, 2);
  assert.ok(componentNodes.some((n) => n.data.componentType === "battery"));
  assert.ok(componentNodes.some((n) => n.data.componentType === "mppt" && n.data.amperage === 20));

  assert.equal(edges.length, 1);
  assert.equal(edges[0].sourceHandle, "bat-positive");
  assert.equal(edges[0].targetHandle, "positive");

  // Un seul pas d'historique : un unique Ctrl/Cmd+Z retire tout le lot.
  assert.equal(past.length, 1);
});

test("insertGeneratedPlan: positionne la nouvelle zone à droite de l'existant, jamais par-dessus", () => {
  resetStore(
    [{ id: "existing-1", type: "electrical", position: { x: 0, y: 0 }, width: 220, data: { componentType: "battery", label: "Batterie existante" } }],
    []
  );

  const zoneId = useSchemaStore.getState().insertGeneratedPlan(BASIC_PLAN);

  const zoneNode = useSchemaStore.getState().nodes.find((n) => n.id === zoneId);
  assert.ok(zoneNode);
  assert.ok(zoneNode!.position.x > 220, "la nouvelle zone doit être posée à droite du composant existant");
});

test("insertGeneratedPlan: ne modifie jamais un câble déjà existant ailleurs dans le schéma, même quand sa section EST recalculable", () => {
  // Revue de sécurité du 30/09/2026 : repro réel d'un bug confirmé où
  // `recalculateCableSections` était appelé sur TOUTE la liste de câbles
  // (existants + neufs) et réécrivait la section d'un câble déjà présent,
  // réglé à la main, sans aucun rapport avec la zone ajoutée. Un circuit
  // batterie -> fusible -> consommateur 300W en "4 mm²" (nettement
  // sous-dimensionné pour ~25A sur 5m) est un cas où le moteur de
  // dimensionnement recommande explicitement AUTRE CHOSE que "4 mm²" —
  // contrairement au fixture batterie->batterie ci-dessous, celui-ci
  // exerce vraiment la garantie, pas seulement un cas où aucun diagnostic
  // n'est calculable.
  const batteryToFuse: Edge<CableEdgeData> = {
    id: "existing-battery-fuse",
    source: "batt",
    sourceHandle: "positive",
    target: "fuse1",
    targetHandle: "input",
    type: "cable",
    data: { color: "#000", cableType: "power-positive", section: "4 mm²", length: 5 },
  };
  const fuseToConsumer: Edge<CableEdgeData> = {
    id: "existing-fuse-consumer",
    source: "fuse1",
    sourceHandle: "output",
    target: "cons1",
    targetHandle: "positive",
    type: "cable",
    data: { color: "#000", cableType: "power-positive", section: "4 mm²", length: 5 },
  };
  resetStore(
    [
      { id: "batt", type: "electrical", position: { x: 0, y: 0 }, data: { componentType: "battery", label: "Batterie", voltage: 12, capacityAh: 100 } },
      { id: "fuse1", type: "electrical", position: { x: 100, y: 0 }, data: { componentType: "fuse", label: "Fusible", fuseType: "midi", amperage: 100 } },
      { id: "cons1", type: "electrical", position: { x: 200, y: 0 }, data: { componentType: "consumer", label: "Frigo", supplyType: "12v", powerW: 300 } },
    ],
    [batteryToFuse, fuseToConsumer]
  );

  useSchemaStore.getState().insertGeneratedPlan(BASIC_PLAN);

  const { edges } = useSchemaStore.getState();
  assert.equal(edges.find((e) => e.id === "existing-battery-fuse")?.data?.section, "4 mm²");
  assert.equal(edges.find((e) => e.id === "existing-fuse-consumer")?.data?.section, "4 mm²");
});

test("insertGeneratedPlan: ne modifie jamais un câble déjà existant dont la section n'est pas calculable", () => {
  const existingEdge: Edge<CableEdgeData> = {
    id: "existing-edge",
    source: "a",
    sourceHandle: "positive",
    target: "b",
    targetHandle: "negative",
    type: "cable",
    data: { color: "#000", cableType: "power-positive", section: "6 mm²", length: 1 },
  };
  resetStore(
    [
      { id: "a", type: "electrical", position: { x: 0, y: 0 }, data: { componentType: "battery", label: "A", voltage: 12 } },
      { id: "b", type: "electrical", position: { x: 100, y: 0 }, data: { componentType: "battery", label: "B", voltage: 12 } },
    ],
    [existingEdge]
  );

  useSchemaStore.getState().insertGeneratedPlan(BASIC_PLAN);

  const untouchedEdge = useSchemaStore.getState().edges.find((e) => e.id === "existing-edge");
  assert.ok(untouchedEdge);
  assert.equal(untouchedEdge!.data?.section, "6 mm²");
});

test("insertGeneratedPlan: retourne l'id de la zone pour que l'appelant puisse la sélectionner", () => {
  resetStore();

  const zoneId = useSchemaStore.getState().insertGeneratedPlan(BASIC_PLAN);

  assert.equal(useSchemaStore.getState().selectedNodeId, zoneId);
});

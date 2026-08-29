import assert from "node:assert/strict";
import test from "node:test";
import type { Node } from "@xyflow/react";
import { applyGuidedPlan, GUIDED_PLAN_ZONES, suggestedGuidedPosition, zoneForNode } from "@/lib/schema-editor/guided-plan";
import { getSchemaTemplate } from "@/features/schemas/templates";
import { getComponentDefinition, getEffectiveHandles } from "@/lib/electrical-components/definitions";
import type { ElectricalNodeData } from "@/types/schema";

function node(id: string, componentType: string): Node<ElectricalNodeData> {
  return { id, type: "electrical", position: { x: 0, y: 0 }, data: { componentType, label: componentType } };
}

test("le plan guide place les familles dans leurs zones A2 et cree les zones de lecture", () => {
  const result = applyGuidedPlan([node("solar", "solar-panel"), node("battery", "battery"), node("ac", "inverter")], []);

  assert.equal(result.nodes.filter((item) => item.id.startsWith("guided-zone-")).length, GUIDED_PLAN_ZONES.length);
  assert.deepEqual(result.nodes.find((item) => item.id === "solar")?.position, { x: 730, y: 175 });
  assert.deepEqual(result.nodes.find((item) => item.id === "battery")?.position, { x: 890, y: 1945 });
  assert.deepEqual(result.nodes.find((item) => item.id === "ac")?.position, { x: 2030, y: 1140 });
});

test("une suggestion en plan guide avance dans la zone sans empiler les composants", () => {
  const first = suggestedGuidedPosition("solar-panel", []);
  const second = suggestedGuidedPosition("solar-panel", [node("panel", "solar-panel")]);

  assert.notDeepEqual(first, second);
  assert.equal(first.y, second.y);
});

test("la batterie moteur rejoint la zone de charge alternateur", () => {
  const starterBattery = node("starter", "battery");
  starterBattery.data.label = "Batterie moteur 12V";

  assert.equal(zoneForNode(starterBattery), "alternator");
  assert.equal(zoneForNode(node("house", "battery")), "battery");
});

test("le noyau DC garde les busbars et protections au-dessus de la batterie", () => {
  const result = applyGuidedPlan([
    node("battery", "battery"),
    node("positive-busbar", "busbar"),
    node("negative-busbar", "busbar"),
    node("main-fuse", "fuse"),
    node("battery-switch", "battery-switch"),
    node("shunt", "shunt"),
  ], []);
  const byId = new Map(result.nodes.map((item) => [item.id, item]));

  assert.ok(byId.get("positive-busbar")!.position.y < byId.get("main-fuse")!.position.y);
  assert.ok(byId.get("main-fuse")!.position.y < byId.get("battery")!.position.y);
  assert.ok(byId.get("shunt")!.position.x < byId.get("main-fuse")!.position.x);
});

test("le plan guidé agrandit une zone quand son contenu dépasse", () => {
  const result = applyGuidedPlan(Array.from({ length: 10 }, (_, index) => node(`consumer-${index}`, "consumer")), []);
  const distribution = result.nodes.find((item) => item.id === "guided-zone-dc-distribution");

  assert.ok(distribution);
  assert.ok((distribution.height ?? 0) > 650);
});

test("les zones guidées agrandies restent strictement séparées", () => {
  const result = applyGuidedPlan(
    Array.from({ length: 24 }, (_, index) => node(`consumer-${index}`, "consumer")),
    [],
  );
  const zones = result.nodes.filter((item) => item.id.startsWith("guided-zone-"));

  for (let index = 0; index < zones.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < zones.length; otherIndex += 1) {
      const first = zones[index];
      const second = zones[otherIndex];
      const overlaps =
        first.position.x < second.position.x + (second.width ?? 0) &&
        first.position.x + (first.width ?? 0) > second.position.x &&
        first.position.y < second.position.y + (second.height ?? 0) &&
        first.position.y + (first.height ?? 0) > second.position.y;
      assert.equal(overlaps, false, `${first.id} recouvre ${second.id}`);
    }
  }
});

test("le gabarit Ducato implantation ne contient aucun câble vers une borne absente", () => {
  const schema = getSchemaTemplate("reference-v3-atelier-ducato-implantation")?.build();
  assert.ok(schema);
  const nodes = new Map(schema.nodes.map((item) => [item.id, item]));

  for (const edge of schema.edges) {
    for (const [nodeId, handleId] of [[edge.source, edge.sourceHandle], [edge.target, edge.targetHandle]] as const) {
      const item = nodes.get(nodeId);
      const definition = item ? getComponentDefinition(item.data.componentType) : undefined;
      assert.ok(item && definition, `composant introuvable pour ${edge.id}`);
      assert.ok(getEffectiveHandles(definition, item.data).some((handle) => handle.id === handleId), `${edge.id} pointe vers ${nodeId}.${handleId}`);
    }
  }
});

test("le gabarit AFERIY P280 mis à jour ne contient aucun câble vers une borne absente", () => {
  const schema = getSchemaTemplate("station-aferiy-p280")?.build();
  assert.ok(schema);
  const nodes = new Map(schema.nodes.map((item) => [item.id, item]));

  for (const edge of schema.edges) {
    for (const [nodeId, handleId] of [[edge.source, edge.sourceHandle], [edge.target, edge.targetHandle]] as const) {
      const item = nodes.get(nodeId);
      const definition = item ? getComponentDefinition(item.data.componentType) : undefined;
      assert.ok(item && definition, `composant introuvable pour ${edge.id}`);
      assert.ok(getEffectiveHandles(definition, item.data).some((handle) => handle.id === handleId), `${edge.id} pointe vers ${nodeId}.${handleId}`);
    }
  }
});

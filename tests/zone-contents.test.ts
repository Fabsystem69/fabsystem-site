import assert from "node:assert/strict";
import test from "node:test";
import type { Node, NodeChange } from "@xyflow/react";
import { movePointWithZones, moveZoneContents } from "@/lib/schema-editor/zone-contents";
import type { ElectricalNodeData } from "@/types/schema";

type SchemaNode = Node<ElectricalNodeData>;

function zone(id: string, x: number, y: number, locked = false): SchemaNode {
  return { id, type: "zone", position: { x, y }, width: 400, height: 300, data: { componentType: "zone", label: "Zone", color: "#0ea5e9", locked } };
}

function component(id: string, x: number, y: number): SchemaNode {
  return { id, type: "electrical", position: { x, y }, data: { componentType: "consumer", label: id } };
}

function move(id: string, x: number, y: number): NodeChange<SchemaNode>[] {
  return [{ id, type: "position", position: { x, y }, dragging: false }];
}

test("déplacer une zone entraîne seulement les éléments qu'elle contient", () => {
  const result = moveZoneContents([zone("zone", 100, 100), component("inside", 200, 180), component("outside", 600, 180)], move("zone", 180, 140));

  assert.deepEqual(result.nodes.find((node) => node.id === "inside")?.position, { x: 280, y: 220 });
  assert.deepEqual(result.nodes.find((node) => node.id === "outside")?.position, { x: 600, y: 180 });
  assert.deepEqual(result.moves[0]?.delta, { x: 80, y: 40 });
});

test("les points de coude contenus dans la zone suivent son déplacement", () => {
  const result = moveZoneContents([zone("zone", 100, 100), component("inside", 200, 180)], move("zone", 180, 140));

  assert.deepEqual(movePointWithZones({ x: 320, y: 260 }, result.moves), { x: 400, y: 300 });
  assert.deepEqual(movePointWithZones({ x: 700, y: 260 }, result.moves), { x: 700, y: 260 });
});

test("une zone verrouillée ne déplace pas son contenu", () => {
  const result = moveZoneContents([zone("zone", 100, 100, true), component("inside", 200, 180)], move("zone", 180, 140));

  assert.deepEqual(result.nodes.find((node) => node.id === "inside")?.position, { x: 200, y: 180 });
  assert.equal(result.moves.length, 0);
});

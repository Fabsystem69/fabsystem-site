import assert from "node:assert/strict";
import test from "node:test";
import type { Edge, Node } from "@xyflow/react";
import { computeBom } from "@/lib/electrical-components/bom";

function edge(id: string, section: string | undefined, cableType?: string): Edge {
  return { id, source: `${id}-a`, target: `${id}-b`, data: { section, cableType } } as unknown as Edge;
}

const NO_NODES: Node[] = [];

test("computeBom adds 2 lugs per cable, sized from the cable's section", () => {
  const bom = computeBom(NO_NODES, [edge("e1", "16 mm²")]);

  assert.equal(bom.lugRows.length, 1);
  assert.deepEqual(bom.lugRows[0], { section: "16 mm²", studDiameter: "M6", count: 2 });
});

test("computeBom tallies multiple cables of the same section into one lug row", () => {
  const bom = computeBom(NO_NODES, [edge("e1", "25 mm²"), edge("e2", "25 mm²"), edge("e3", "25 mm²")]);

  assert.equal(bom.lugRows.length, 1);
  assert.deepEqual(bom.lugRows[0], { section: "25 mm²", studDiameter: "M8", count: 6 });
});

test("computeBom keeps different sections as separate lug rows, ordered by section", () => {
  const bom = computeBom(NO_NODES, [edge("e1", "70 mm²"), edge("e2", "6 mm²"), edge("e3", "35 mm²")]);

  assert.deepEqual(
    bom.lugRows.map((r) => r.section),
    ["6 mm²", "35 mm²", "70 mm²"]
  );
});

test("computeBom skips lugs for cables with no section recorded", () => {
  const bom = computeBom(NO_NODES, [edge("e1", undefined)]);

  assert.deepEqual(bom.lugRows, []);
});

test("computeBom never counts data-bus cables toward lugs", () => {
  const bom = computeBom(NO_NODES, [edge("e1", "0,5 mm²", "data-bus")]);

  assert.deepEqual(bom.lugRows, []);
});

test("buildMaterialListText includes a lugs section with the indicative-diameter caveat", async () => {
  const { buildMaterialListText } = await import("@/lib/electrical-components/bom");
  const bom = computeBom(NO_NODES, [edge("e1", "16 mm²")]);

  const text = buildMaterialListText(bom, "Test");

  assert.match(text, /Cosses \(diamètre indicatif/);
  assert.match(text, /2x Cosse à œillet 16 mm² \/ M6/);
});

test("computeBom annotates each cable row with its AWG equivalent", () => {
  const bom = computeBom(NO_NODES, [edge("e1", "16 mm²")]);

  assert.equal(bom.cableRows.length, 1);
  assert.equal(bom.cableRows[0]?.awg, "6");
});

test("computeBom leaves awg null for a cable with no section recorded", () => {
  const bom = computeBom(NO_NODES, [edge("e1", undefined)]);

  assert.equal(bom.cableRows[0]?.awg, null);
});

test("buildMaterialListText shows the AWG equivalent next to the section", async () => {
  const { buildMaterialListText } = await import("@/lib/electrical-components/bom");
  const bom = computeBom(NO_NODES, [edge("e1", "16 mm²")]);

  const text = buildMaterialListText(bom, "Test");

  assert.match(text, /Section 16 mm² \(AWG 6\)/);
});

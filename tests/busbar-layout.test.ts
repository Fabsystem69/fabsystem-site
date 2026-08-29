import test from "node:test";
import assert from "node:assert/strict";
import type { Edge, Node } from "@xyflow/react";
import { getComponentDefinition, getEffectiveHandles } from "@/lib/electrical-components/definitions";
import { optimizeBusbarHandleLayout } from "@/lib/schema-editor/busbar-layout";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";

const busbar = (data: Record<string, unknown> = {}): Node<ElectricalNodeData> => ({
  id: "busbar",
  type: "electrical",
  position: { x: 100, y: 100 },
  data: { componentType: "busbar", label: "Busbar", polarity: "positive", outputCount: 4, ...data },
});

const consumer = (id: string, x: number, y: number): Node<ElectricalNodeData> => ({
  id,
  type: "electrical",
  position: { x, y },
  data: { componentType: "consumer", label: id },
});

const edge = (id: string, handle: string, target: string): Edge<CableEdgeData> => ({
  id,
  source: "busbar",
  sourceHandle: handle,
  target,
  targetHandle: "positive",
  type: "cable",
  data: { color: "#dc2626", cableType: "power-positive" },
});

test("l'optimiseur conserve les ids des plots et les place vers leurs câbles", () => {
  const nodes = [busbar(), consumer("left", 0, 120), consumer("top", 120, 0), consumer("right", 320, 120), consumer("bottom", 120, 320)];
  const updates = optimizeBusbarHandleLayout(nodes, [
    edge("left", "input", "left"),
    edge("top", "out-1", "top"),
    edge("right", "out-2", "right"),
    edge("bottom", "out-3", "bottom"),
  ]);

  assert.equal(updates.length, 1);
  assert.deepEqual(updates[0].handleSides, {
    input: "left", "out-1": "top", "out-2": "right", "out-3": "bottom", "out-4": "right",
  });

  const def = getComponentDefinition("busbar");
  assert.ok(def);
  const handles = getEffectiveHandles(def, {
    componentType: "busbar",
    polarity: "positive",
    outputCount: 4,
    ...updates[0].faceCounts,
    busbarHandleSides: updates[0].handleSides,
  });
  assert.deepEqual(handles.map((handle) => handle.id), ["input", "out-1", "out-2", "out-3", "out-4"]);
  assert.deepEqual(handles.map((handle) => handle.side), ["left", "top", "right", "bottom", "right"]);
});

test("l'optimiseur inverse correctement la rotation et le miroir du busbar", () => {
  const nodes = [busbar({ rotation: 90, mirrored: true }), consumer("right", 320, 120)];
  const [update] = optimizeBusbarHandleLayout(nodes, [edge("right", "input", "right")]);
  // Après miroir puis rotation à 90°, cette face stockée s'affiche à droite.
  assert.equal(update.handleSides.input, "top");
});

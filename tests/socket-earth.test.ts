import assert from "node:assert/strict";
import test from "node:test";
import type { Edge, Node } from "@xyflow/react";
import { computeSchemaIssues } from "@/lib/electrical-components/checks";
import { dropRemovedHandleEdges } from "@/lib/schema-editor/removed-handles";
import { SCHEMA_TEMPLATES } from "@/features/schemas/templates";
import { buildExampleSchema } from "@/features/schemas/example";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";

// Retour utilisateur (10/2026) : les prises 230 V sont tirées en 3G, la
// terre est dans le câble — une ligne de terre séparée sur chaque prise
// alourdit le schéma pour rien. La borne terre de la prise 230 V disparaît.

type SchemaNode = Node<ElectricalNodeData>;
type SchemaEdge = Edge<CableEdgeData>;

const node = (id: string, componentType: string, extra: Record<string, unknown> = {}): SchemaNode => ({
  id,
  position: { x: 0, y: 0 },
  data: { componentType, label: id, ...extra },
});
const edge = (id: string, source: string, sourceHandle: string, target: string, targetHandle: string, cableType: string): SchemaEdge => ({
  id,
  source,
  sourceHandle,
  target,
  targetHandle,
  data: { cableType },
});

test("une prise 230 V câblée seulement en 230 V (3G) ne déclenche aucune alerte de terre ni de câblage incomplet", () => {
  const nodes = [node("panel", "ac-panel", { hasDifferential: "yes" }), node("socket", "socket-220v"), node("ground", "ground")];
  const edges = [
    edge("panel-socket", "panel", "ac-out", "socket", "ac-in", "ac-230v"),
    edge("panel-earth", "panel", "earth", "ground", "ground", "earth"),
  ];
  const socketIssues = computeSchemaIssues(nodes, edges).filter((issue) => issue.targetId === "socket");
  assert.deepEqual(socketIssues.map((issue) => issue.id), []);
});

test("au chargement, un ancien fil de terre sur une prise 230 V est retiré, les autres fils sont conservés", () => {
  const nodes = [node("socket", "socket-220v"), node("ground", "ground"), node("panel", "ac-panel")];
  const edges = [
    edge("old-socket-earth", "socket", "earth", "ground", "ground", "earth"),
    edge("panel-earth", "panel", "earth", "ground", "ground", "earth"),
    edge("panel-socket", "panel", "ac-out", "socket", "ac-in", "ac-230v"),
  ];
  const result = dropRemovedHandleEdges(nodes, edges);
  assert.deepEqual(result.map((e) => e.id), ["panel-earth", "panel-socket"]);
  assert.equal(dropRemovedHandleEdges(nodes, result), result, "aucun changement → même référence");
});

test("aucun modèle de schéma livré ne câble une borne qui n'existe plus", () => {
  const schemas = [...SCHEMA_TEMPLATES.map((template) => ({ id: template.id, ...template.build() })), { id: "example", ...buildExampleSchema() }];
  for (const schema of schemas) {
    const nodes = schema.nodes as SchemaNode[];
    const edges = schema.edges as SchemaEdge[];
    assert.equal(dropRemovedHandleEdges(nodes, edges).length, edges.length, `${schema.id} câble encore une terre de prise 230 V`);
    const orphan = computeSchemaIssues(nodes, edges).find((issue) => /borne qui n'existe plus/.test(issue.message));
    assert.equal(orphan, undefined, `${schema.id} : ${orphan?.message}`);
  }
});

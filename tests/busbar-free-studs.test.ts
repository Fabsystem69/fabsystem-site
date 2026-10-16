import assert from "node:assert/strict";
import test from "node:test";
import type { Edge, Node } from "@xyflow/react";
import { computeSchemaIssues } from "@/lib/electrical-components/checks";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";

// Retour utilisateur (10/2026) : "on laisse naturellement une ou deux voies
// libres sur les busbars pour les évolutions" — des bornes de busbar non
// câblées ne sont pas un oubli, plus d'alerte "borne non reliée".

type SchemaNode = Node<ElectricalNodeData>;
type SchemaEdge = Edge<CableEdgeData>;

const node = (id: string, componentType: string): SchemaNode => ({ id, position: { x: 0, y: 0 }, data: { componentType, label: id } });

test("un busbar avec des bornes libres n'est pas signalé comme câblage incomplet", () => {
  const nodes = [node("battery", "battery"), node("busbar", "busbar")];
  const edges: SchemaEdge[] = [
    { id: "e1", source: "battery", sourceHandle: "negative", target: "busbar", targetHandle: "input", data: { cableType: "power-negative" } },
  ];
  const issue = computeSchemaIssues(nodes, edges).find((candidate) => candidate.id === "busbar-partial");
  assert.equal(issue, undefined);
});

test("un busbar relié à rien reste signalé", () => {
  const issue = computeSchemaIssues([node("busbar", "busbar")], []).find((candidate) => candidate.id === "busbar-isolated");
  assert.ok(issue);
});

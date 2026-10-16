import assert from "node:assert/strict";
import test from "node:test";
import type { Edge, Node } from "@xyflow/react";
import { computeSchemaIssues } from "@/lib/electrical-components/checks";
import { SCHEMA_TEMPLATES } from "@/features/schemas/templates";
import { buildExampleSchema } from "@/features/schemas/example";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";

// Retour utilisateur (10/2026, "fais une passe sur les exemples") : les
// schémas livrés (gabarits de l'éditeur, exemples publics /schemas-electriques,
// "Voir un exemple") servent de référence — aucun avertissement ni erreur,
// seules les informations (ex. fiche technique d'un panneau générique) sont
// tolérées.

const schemas = [
  ...SCHEMA_TEMPLATES.map((template) => ({ id: template.id, ...template.build() })),
  { id: "example", ...buildExampleSchema() },
];

for (const schema of schemas) {
  test(`exemple livré sans avertissement ni erreur : ${schema.id}`, () => {
    const issues = computeSchemaIssues(schema.nodes as Node<ElectricalNodeData>[], schema.edges as Edge<CableEdgeData>[]).filter(
      (issue) => issue.severity !== "info",
    );
    assert.deepEqual(
      issues.map((issue) => `${issue.id} — ${issue.message}`),
      [],
    );
  });
}

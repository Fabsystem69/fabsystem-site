import assert from "node:assert/strict";
import test from "node:test";
import { generatedSchemaPlanSchema } from "@/lib/schema-editor/generated-plan";

// lib/schema-editor/generated-plan.ts : contrôles croisés ajoutés en revue
// de sécurité du 30/09/2026, après repro réels confirmant que ces cas
// passaient tous les contrôles précédents et pouvaient atterrir sur le
// canevas (voir aussi tests/schema-store-insert-generated-plan.test.ts et
// tests/schema-ai-generate.test.ts pour les contrôles complémentaires).

const VALID_PLAN = {
  zoneLabel: "Solaire",
  zoneWidth: 400,
  zoneHeight: 260,
  components: [
    { key: "battery-1", type: "battery", label: "Batterie", dataOverride: {}, offsetX: 0, offsetY: 0 },
    { key: "mppt-1", type: "mppt", label: "MPPT", dataOverride: {}, offsetX: 200, offsetY: 0 },
  ],
  edges: [{ sourceKey: "mppt-1", sourceHandle: "bat-positive", targetKey: "battery-1", targetHandle: "positive" }],
};

test("generatedSchemaPlanSchema: accepte un plan valide", () => {
  const result = generatedSchemaPlanSchema.safeParse(VALID_PLAN);
  assert.equal(result.success, true);
});

test("generatedSchemaPlanSchema: rejette dataOverride.componentType (contournerait la validation catalogue)", () => {
  const result = generatedSchemaPlanSchema.safeParse({
    ...VALID_PLAN,
    components: [{ ...VALID_PLAN.components[0], dataOverride: { componentType: "autre-type" } }, VALID_PLAN.components[1]],
  });
  assert.equal(result.success, false);
});

test("generatedSchemaPlanSchema: rejette dataOverride.label (contournerait la preview affichée)", () => {
  const result = generatedSchemaPlanSchema.safeParse({
    ...VALID_PLAN,
    components: [{ ...VALID_PLAN.components[0], dataOverride: { label: "Autre libellé" } }, VALID_PLAN.components[1]],
  });
  assert.equal(result.success, false);
});

test("generatedSchemaPlanSchema: rejette des clés de composant en doublon", () => {
  const result = generatedSchemaPlanSchema.safeParse({
    ...VALID_PLAN,
    components: [VALID_PLAN.components[0], { ...VALID_PLAN.components[1], key: VALID_PLAN.components[0].key }],
  });
  assert.equal(result.success, false);
});

test("generatedSchemaPlanSchema: rejette un câble qui relie un composant à lui-même", () => {
  const result = generatedSchemaPlanSchema.safeParse({
    ...VALID_PLAN,
    edges: [{ sourceKey: "battery-1", sourceHandle: "positive", targetKey: "battery-1", targetHandle: "negative" }],
  });
  assert.equal(result.success, false);
});

test("generatedSchemaPlanSchema: rejette deux câbles strictement identiques", () => {
  const edge = VALID_PLAN.edges[0];
  const result = generatedSchemaPlanSchema.safeParse({ ...VALID_PLAN, edges: [edge, edge] });
  assert.equal(result.success, false);
});

test("generatedSchemaPlanSchema: rejette un composant positionné hors des dimensions de la zone", () => {
  const result = generatedSchemaPlanSchema.safeParse({
    ...VALID_PLAN,
    components: [{ ...VALID_PLAN.components[0], offsetX: -500, offsetY: -800 }, VALID_PLAN.components[1]],
  });
  assert.equal(result.success, false);
});

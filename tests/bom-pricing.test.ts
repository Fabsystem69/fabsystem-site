import assert from "node:assert/strict";
import test from "node:test";
import type { Node } from "@xyflow/react";
import { computeBom, buildMaterialListText, buildMaterialListCsv } from "@/lib/electrical-components/bom";
import type { ElectricalNodeData } from "@/types/schema";

// Correctif : le prix (`supplier.priceCents`) existait déjà dans
// brand-models.ts pour une quarantaine de composants, mais n'était jamais lu
// ni totalisé nulle part (retour utilisateur : "sortir un devis complet du
// schéma"). `null` (jamais 0) est le comportement attendu tant qu'aucun
// composant n'a de prix connu — un total à 0,00 € laisserait croire à tort
// que le matériel ne coûte rien.

function node(id: string, componentType: string, data: Record<string, unknown> = {}): Node<ElectricalNodeData> {
  return { id, type: "electrical", position: { x: 0, y: 0 }, data: { componentType, label: componentType, ...data } };
}

test("computeBom leaves totalPriceCents null when no component has a known price", () => {
  const bom = computeBom([node("b1", "battery", { technology: "plomb" })], []);

  assert.equal(bom.totalPriceCents, null);
  // hasUnpricedComponents reste vrai dès qu'un composant n'a aucun prix
  // connu, même quand AUCUN composant n'en a — totalPriceCents === null
  // suffit déjà à signaler "rien de chiffré" ; ce cas reste inoffensif car
  // l'UI ne lit ce flag que lorsque totalPriceCents n'est pas null.
  assert.equal(bom.hasUnpricedComponents, true);
  assert.deepEqual(bom.totalPriceCentsByFournisseur, []);
});

test("computeBom sums a priced component's price across its full count", () => {
  const nodes = [
    node("b1", "battery", { brandModelId: "victron-lithium-smart-100ah", technology: "lifepo4", voltage: 12, capacityAh: 100 }),
    node("b2", "battery", { brandModelId: "victron-lithium-smart-100ah", technology: "lifepo4", voltage: 12, capacityAh: 100 }),
  ];
  const bom = computeBom(nodes, []);

  // 74359 cents (le modèle réel Victron Lithium Smart 100Ah, brand-models.ts) × 2
  assert.equal(bom.totalPriceCents, 74359 * 2);
  assert.equal(bom.hasUnpricedComponents, false);
  assert.deepEqual(bom.totalPriceCentsByFournisseur, [{ name: "Solaris Store", priceCents: 74359 * 2 }]);
});

test("computeBom reports a partial total when some components have no known price", () => {
  const nodes = [
    node("b1", "battery", { brandModelId: "victron-lithium-smart-100ah", technology: "lifepo4", voltage: 12, capacityAh: 100 }),
    node("b2", "battery", { brandModelId: "yuasa-marine-100ah", technology: "plomb", voltage: 12, capacityAh: 100 }),
  ];
  const bom = computeBom(nodes, []);

  assert.equal(bom.totalPriceCents, 74359);
  assert.equal(bom.hasUnpricedComponents, true);
});

test("computeBom groups totals by supplier, correct for any number of suppliers present", () => {
  const nodes = [
    node("b1", "battery", { brandModelId: "victron-lithium-smart-100ah", technology: "lifepo4", voltage: 12, capacityAh: 100 }),
    node("s1", "pv-switch", { brandModelId: "revolt-sectionneur-dc-mc4-1200v-40a", amperage: 40 }),
  ];
  const bom = computeBom(nodes, []);

  assert.equal(bom.totalPriceCents, 74359 + 3895);
  assert.deepEqual(bom.totalPriceCentsByFournisseur, [
    { name: "Pearl", priceCents: 3895 },
    { name: "Solaris Store", priceCents: 74359 },
  ]);
});

test("buildMaterialListText prints a total line only when a price is known", () => {
  const unpriced = computeBom([node("b1", "battery", { technology: "plomb" })], []);
  assert.doesNotMatch(buildMaterialListText(unpriced, "Test"), /Total estimé/);

  const priced = computeBom([node("b1", "battery", { brandModelId: "victron-lithium-smart-100ah" })], []);
  // \s couvre l'espace insécable que Intl.NumberFormat("fr-FR") insère avant €.
  assert.match(buildMaterialListText(priced, "Test"), /Total estimé : 743,59\s€/);
});

test("computeBom groups priced items by supplier for a per-supplier shopping basket", () => {
  const nodes = [
    node("b1", "battery", { brandModelId: "victron-lithium-smart-100ah", technology: "lifepo4", voltage: 12, capacityAh: 100 }),
    node("s1", "pv-switch", { brandModelId: "revolt-sectionneur-dc-mc4-1200v-40a", amperage: 40 }),
  ];
  const bom = computeBom(nodes, []);

  assert.deepEqual(
    bom.itemsBySupplier.map((g) => g.name),
    ["Pearl", "Solaris Store"]
  );
  const solarisGroup = bom.itemsBySupplier.find((g) => g.name === "Solaris Store");
  assert.equal(solarisGroup?.items.length, 1);
  assert.equal(solarisGroup?.items[0]?.quantityLabel, "1x");
  assert.equal(solarisGroup?.items[0]?.priceCents, 74359);
});

test("computeBom excludes unpriced components from itemsBySupplier rather than adding an empty entry", () => {
  const bom = computeBom([node("b1", "battery", { technology: "plomb" })], []);

  assert.deepEqual(bom.itemsBySupplier, []);
});

test("buildMaterialListCsv prints a total row only when a price is known", () => {
  const unpriced = computeBom([node("b1", "battery", { technology: "plomb" })], []);
  assert.doesNotMatch(buildMaterialListCsv(unpriced, "Test"), /Total estimé/);

  const priced = computeBom([node("b1", "battery", { brandModelId: "victron-lithium-smart-100ah" })], []);
  assert.match(buildMaterialListCsv(priced, "Test"), /Total estimé/);
});

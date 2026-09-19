import assert from "node:assert/strict";
import test from "node:test";
import type { Node } from "@xyflow/react";
import { computeBom } from "@/lib/electrical-components/bom";
import { LUG_PRICES, CABLE_PRICES_PER_METER, FUSE_PRICES, getLugPrices, getCablePricesPerMeter, getFusePrices } from "@/lib/electrical-components/consumable-pricing";
import type { ElectricalNodeData } from "@/types/schema";

// Correctif : aucune donnée de prix n'existait pour les cosses/câbles/
// fusibles (retour utilisateur : "vraiment une liste de course avec les
// liens pour pouvoir commander... avoir les deux liens"). Les tables
// démarrent vides en production (voir consumable-pricing.ts) — ces tests
// seedent des entrées de test directement dans les tables exportées, sans
// dépendre de vraies données fournisseur.

function node(id: string, componentType: string, data: Record<string, unknown> = {}): Node<ElectricalNodeData> {
  return { id, type: "electrical", position: { x: 0, y: 0 }, data: { componentType, label: componentType, ...data } };
}

test("getLugPrices returns an empty array for an unknown key, never a guessed price", () => {
  assert.deepEqual(getLugPrices("999 mm²", "Cosse inconnue"), []);
});

test("getLugPrices returns every supplier option, sorted cheapest first", () => {
  LUG_PRICES["16 mm²__Cosse à œillet / M6"] = [
    { supplierName: "Vancore", priceCents: 80, url: "https://vancore.fr/cosse-16" },
    { supplierName: "Solaris Store", priceCents: 75, url: "https://solaris-store.com/cosse-16" },
  ];

  const options = getLugPrices("16 mm²", "Cosse à œillet / M6");

  assert.deepEqual(options, [
    { supplierName: "Solaris Store", priceCents: 75, url: "https://solaris-store.com/cosse-16" },
    { supplierName: "Vancore", priceCents: 80, url: "https://vancore.fr/cosse-16" },
  ]);

  delete LUG_PRICES["16 mm²__Cosse à œillet / M6"];
});

test("computeBom attaches all supplier options to a lug row and totals only the cheapest", () => {
  LUG_PRICES["16 mm²__Cosse à œillet / M6"] = [
    { supplierName: "Vancore", priceCents: 80, url: "https://vancore.fr/cosse-16" },
    { supplierName: "Solaris Store", priceCents: 75, url: "https://solaris-store.com/cosse-16" },
  ];

  const nodes = [node("a", "busbar"), node("b", "busbar")];
  const edges = [{ id: "e1", source: "a", target: "b", data: { section: "16 mm²" } }];
  const bom = computeBom(nodes, edges);

  assert.equal(bom.lugRows.length, 1);
  assert.equal(bom.lugRows[0]?.priceOptions.length, 2);
  // 2 cosses (une par extrémité) × 75 (la moins chère) — jamais compté deux fois.
  assert.equal(bom.totalPriceCents, 150);
  assert.deepEqual(bom.totalPriceCentsByFournisseur, [{ name: "Solaris Store", priceCents: 150 }]);

  delete LUG_PRICES["16 mm²__Cosse à œillet / M6"];
});

test("computeBom prices a cable row per meter, excluding rows with unknown length rather than guessing", () => {
  CABLE_PRICES_PER_METER["6 mm²__Autre"] = [{ supplierName: "Vancore", priceCents: 234, url: "https://vancore.fr/cable-6" }];

  const withLength = computeBom([], [{ id: "e1", source: "a", target: "b", data: { section: "6 mm²", length: 3 } }]);
  assert.equal(withLength.cableRows[0]?.priceOptionsPerMeter[0]?.priceCents, 234);
  assert.equal(withLength.totalPriceCents, Math.round(234 * 3));

  const withoutLength = computeBom([], [{ id: "e1", source: "a", target: "b", data: { section: "6 mm²" } }]);
  // Longueur inconnue : le prix/m est connu mais ne doit jamais alimenter un
  // total inventé.
  assert.equal(withoutLength.totalPriceCents, null);

  delete CABLE_PRICES_PER_METER["6 mm²__Autre"];
});

test("getCablePricesPerMeter returns nothing for an unpriced section", () => {
  assert.deepEqual(getCablePricesPerMeter("6 mm²", "Autre"), []);
});

test("a brand-model price on a fuse node always wins over the automatic FUSE_PRICES fallback", () => {
  FUSE_PRICES["midi__30"] = [{ supplierName: "Vancore", priceCents: 100, url: "https://vancore.fr/fusible-midi-30" }];

  // "victron-fuse-holder-midi" : entrée réelle de brand-models.ts,
  // priceCents 1020 — différent des 100 centimes du repli de test ci-dessus.
  const withBrandModel = computeBom([node("f1", "fuse", { fuseType: "midi", amperage: 30, brandModelId: "victron-fuse-holder-midi" })], []);
  const withoutBrandModel = computeBom([node("f2", "fuse", { fuseType: "midi", amperage: 30 })], []);

  // Le repli automatique s'applique bien en l'absence de modèle choisi…
  assert.equal(withoutBrandModel.componentGroups.flatMap((g) => g.rows)[0]?.priceCents, 100);
  // …mais jamais si l'utilisateur a explicitement choisi un modèle de marque.
  assert.equal(withBrandModel.componentGroups.flatMap((g) => g.rows)[0]?.priceCents, 1020);

  delete FUSE_PRICES["midi__30"];
});

test("getFusePrices returns nothing for an unknown fuseType/amperage pair", () => {
  assert.deepEqual(getFusePrices("midi", 999), []);
});

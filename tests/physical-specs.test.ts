import assert from "node:assert/strict";
import test from "node:test";
import { getBrandModel } from "@/lib/electrical-components/brand-models";
import { getPhysicalSpec, listPhysicalSpecIds } from "@/lib/electrical-components/physical-specs";

// Lot 0 de docs/18-EDITEUR-IMPLANTATION.md : dimensions des boîtiers lues dans
// les documents Victron officiels.

test("chaque fiche de dimensions correspond à un modèle du catalogue", () => {
  for (const id of listPhysicalSpecIds()) assert.ok(getBrandModel(id), `${id} absent de brand-models.ts`);
});

test("chaque fiche a des cotes plausibles et une source", () => {
  for (const id of listPhysicalSpecIds()) {
    const spec = getPhysicalSpec(id)!;
    for (const value of [spec.heightMm, spec.widthMm, spec.depthMm]) assert.ok(value > 0 && value < 1500, `${id} : cote ${value} mm`);
    if (spec.weightKg !== undefined) assert.ok(spec.weightKg > 0 && spec.weightKg < 100, `${id} : poids ${spec.weightKg} kg`);
    assert.match(spec.sourceUrl, /^https:\/\//);
    assert.ok(spec.source.length > 0);
  }
});

test("exemples relevés dans les manuels", () => {
  assert.deepEqual(
    [getPhysicalSpec("victron-multiplus-ii-12-3000-120")?.heightMm, getPhysicalSpec("victron-multiplus-ii-12-3000-120")?.widthMm, getPhysicalSpec("victron-multiplus-ii-12-3000-120")?.depthMm],
    [546, 275, 147],
  );
  assert.equal(getPhysicalSpec("victron-smartsolar-100-50")?.weightKg, 1.3);
  assert.equal(getPhysicalSpec("modele-inconnu"), null);
});

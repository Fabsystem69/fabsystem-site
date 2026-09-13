import assert from "node:assert/strict";
import test from "node:test";
import { getCableHarmonizationSuggestions, CABLE_HARMONIZATION_THRESHOLD_M } from "@/lib/electrical-components/cable-harmonization";

function totals(entries: Array<{ section: string; cableTypeLabel: string; totalLengthM: number }>) {
  return new Map(entries.map((e) => [`${e.section}__${e.cableTypeLabel}`, e]));
}

test("suggests harmonizing a small section/color pair whose total is below the threshold", () => {
  const suggestions = getCableHarmonizationSuggestions(
    totals([{ section: "0,75 mm²", cableTypeLabel: "Puissance +", totalLengthM: 4 }])
  );

  assert.deepEqual(suggestions, [
    { section: "0,75 mm²", cableTypeLabel: "Puissance +", targetSection: "1,5 mm²", totalLengthM: 4 },
  ]);
});

test("does not suggest harmonizing once the total reaches the threshold", () => {
  const suggestions = getCableHarmonizationSuggestions(
    totals([{ section: "0,75 mm²", cableTypeLabel: "Puissance +", totalLengthM: CABLE_HARMONIZATION_THRESHOLD_M }])
  );

  assert.deepEqual(suggestions, []);
});

// Bug corrigé (retour utilisateur) : un total combiné de 18m qui est en
// réalité 9m rouge + 9m noir a besoin de DEUX petites bobines, pas d'une
// seule "assez grande" — chaque couleur doit être évaluée indépendamment.
test("evaluates each color independently, never a combined total across colors", () => {
  const suggestions = getCableHarmonizationSuggestions(
    totals([
      { section: "1 mm²", cableTypeLabel: "Puissance +", totalLengthM: 9 },
      { section: "1 mm²", cableTypeLabel: "Puissance −", totalLengthM: 9 },
    ])
  );

  assert.equal(suggestions.length, 2);
  assert.ok(suggestions.some((s) => s.cableTypeLabel === "Puissance +" && s.totalLengthM === 9));
  assert.ok(suggestions.some((s) => s.cableTypeLabel === "Puissance −" && s.totalLengthM === 9));
});

test("only flags the color that is actually under the threshold, not its sibling", () => {
  const suggestions = getCableHarmonizationSuggestions(
    totals([
      { section: "1 mm²", cableTypeLabel: "Puissance +", totalLengthM: 4 },
      { section: "1 mm²", cableTypeLabel: "Puissance −", totalLengthM: 15 },
    ])
  );

  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0]?.cableTypeLabel, "Puissance +");
});

test("covers all three documented step-up pairs (retour utilisateur)", () => {
  const suggestions = getCableHarmonizationSuggestions(
    totals([
      { section: "1 mm²", cableTypeLabel: "Puissance +", totalLengthM: 3 },
      { section: "4 mm²", cableTypeLabel: "Puissance +", totalLengthM: 2 },
      { section: "10 mm²", cableTypeLabel: "Puissance +", totalLengthM: 5 },
    ])
  );

  assert.deepEqual(
    suggestions.map((s) => [s.section, s.targetSection]).sort(),
    [
      ["1 mm²", "1,5 mm²"],
      ["10 mm²", "16 mm²"],
      ["4 mm²", "6 mm²"],
    ].sort()
  );
});

test("ignores sections that are not harmonization candidates", () => {
  const suggestions = getCableHarmonizationSuggestions(
    totals([
      { section: "1,5 mm²", cableTypeLabel: "Puissance +", totalLengthM: 1 },
      { section: "25 mm²", cableTypeLabel: "Puissance +", totalLengthM: 1 },
    ])
  );

  assert.deepEqual(suggestions, []);
});

test("ignores a section/color with zero total", () => {
  const suggestions = getCableHarmonizationSuggestions(
    totals([{ section: "0,5 mm²", cableTypeLabel: "Puissance +", totalLengthM: 0 }])
  );

  assert.deepEqual(suggestions, []);
});

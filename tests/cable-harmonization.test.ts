import assert from "node:assert/strict";
import test from "node:test";
import { getCableHarmonizationSuggestions, CABLE_HARMONIZATION_THRESHOLD_M } from "@/lib/electrical-components/cable-harmonization";

test("suggests harmonizing a small section whose total is below the threshold", () => {
  const totals = new Map([["0,75 mm²", 4]]);

  const suggestions = getCableHarmonizationSuggestions(totals);

  assert.deepEqual(suggestions, [{ section: "0,75 mm²", targetSection: "1,5 mm²", totalLengthM: 4 }]);
});

test("does not suggest harmonizing once the total reaches the threshold", () => {
  const totals = new Map([["0,75 mm²", CABLE_HARMONIZATION_THRESHOLD_M]]);

  assert.deepEqual(getCableHarmonizationSuggestions(totals), []);
});

test("covers all three documented step-up pairs (retour utilisateur)", () => {
  const totals = new Map([
    ["1 mm²", 3],
    ["4 mm²", 2],
    ["10 mm²", 5],
  ]);

  const suggestions = getCableHarmonizationSuggestions(totals);

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
  const totals = new Map([["1,5 mm²", 1], ["25 mm²", 1]]);

  assert.deepEqual(getCableHarmonizationSuggestions(totals), []);
});

test("ignores a section with zero total", () => {
  const totals = new Map([["0,5 mm²", 0]]);

  assert.deepEqual(getCableHarmonizationSuggestions(totals), []);
});

import assert from "node:assert/strict";
import test from "node:test";
import { calcSection, fusibleRecommande } from "@/lib/calc/section-cable";

// Cas de référence croisé avec lib/engines/cable-engine.ts (même formule,
// voir tests/cable-engine.test.ts "un seul circuit") : 5 A, 3 m aller
// (6 m aller-retour), 12 V, chute 3 % → minimumSectionMm2 ≈ 1,4583 mm²,
// section normalisée 1,5 mm².
test("calcSection : cas nominal cohérent avec le moteur backend cable-engine", () => {
  const result = calcSection(5, 3, 3, 12);
  assert.equal(result.sMin, "1.46");
  assert.equal(result.section, 1.5);
});

test("calcSection : section normalisée = plus petite section du catalogue ≥ section minimale", () => {
  // 30 A, 6 m, 12 V, chute 3 % → sMin = (2×6×30×0.0175)/(0.03×12) = 6.3/0.36 = 17.5 → 25 mm²
  const result = calcSection(30, 6, 3, 12);
  assert.equal(result.section, 25);
  assert.equal(Number(result.sMin) <= result.section, true);
});

test("calcSection : plafonne à 50 mm² lorsque la section minimale dépasse le catalogue", () => {
  const result = calcSection(400, 20, 3, 12);
  assert.equal(result.section, 50);
});

test("calcSection : une chute admissible plus large réduit la section minimale", () => {
  const large = calcSection(30, 6, 5, 12);
  const strict = calcSection(30, 6, 2, 12);
  assert.ok(Number(large.sMin) < Number(strict.sMin));
});

test("fusibleRecommande : calibre normalisé immédiatement supérieur à 125% du courant", () => {
  // 20 A × 1.25 = 25 A → calibre 25 A
  assert.equal(fusibleRecommande(20), "25 A");
});

test("fusibleRecommande : cas limite exact sur un calibre du catalogue", () => {
  // 8 A × 1.25 = 10 A → calibre 10 A (limite incluse)
  assert.equal(fusibleRecommande(8), "10 A");
});

test("fusibleRecommande : au-delà du catalogue, recommande un disjoncteur", () => {
  assert.equal(fusibleRecommande(150), "> 125 A — prévoir un disjoncteur");
});

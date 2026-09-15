import assert from "node:assert/strict";
import test from "node:test";
import { calcSection, calcSectionSafe, pickSectionForAmpacity, fusibleRecommande } from "@/lib/calc/section-cable";

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

test("calcSection : replie sur la plus grande section du catalogue (120 mm²) lorsque la section minimale le dépasse", () => {
  // Correctif : ce repli était figé à "50" (valeur historique, avant
  // l'extension du catalogue à 120 mm²) — sous-recommandait en silence.
  const result = calcSection(400, 20, 3, 12);
  assert.equal(result.section, 120);
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

// Correctif sécurité : calcSection seule ne vérifie que la chute de
// tension, jamais l'ampacité — calcSectionSafe doit toujours retenir la
// plus grande des deux exigences.

test("pickSectionForAmpacity : section dont l'ampacité PVC/30°C/seul couvre le courant donné", () => {
  // 16 mm² → 90 A (ISO 13297, ampacity70C) ; 150,5 A dépasse 16, 25 (120A)
  // et nécessite le prochain palier, 35 mm² (160 A).
  assert.equal(pickSectionForAmpacity(150.5), 35);
});

test("calcSectionSafe : cas réel signalé — 120,4 A, 1 m aller, 12 V doit recommander 35 mm², pas 16 mm²", () => {
  // Chute de tension seule (2,5 %) donnerait ≈ 14 mm² → 16 mm² normalisé —
  // dangereusement insuffisant pour 120,4 A en continu (ampacité 16 mm² :
  // 90 A). L'ampacité (marge continue 25 % → 150,5 A) impose 35 mm².
  const unsafe = calcSection(120.4, 1, 2.5, 12);
  assert.equal(unsafe.section, 16);

  const safe = calcSectionSafe(120.4, 1, 2.5, 12);
  assert.equal(safe.section, 35);
});

test("calcSectionSafe : la chute de tension reste dimensionnante sur un câble long à faible courant", () => {
  // 5 A, 3 m : ampacité largement couverte par une petite section, la
  // chute de tension (1,46 mm² → 1,5 mm²) reste la contrainte réelle.
  const result = calcSectionSafe(5, 3, 3, 12);
  assert.equal(result.section, 1.5);
});

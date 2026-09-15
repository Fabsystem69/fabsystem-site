import assert from "node:assert/strict";
import test from "node:test";
import { computeInverterSize } from "@/lib/calc/inverter-size";

// Correctif sécurité : computeInverterSize appelait calcSection seule
// (chute de tension uniquement) pour le câble DC batterie→onduleur — un
// onduleur de forte puissance appelle un fort courant DC, où la chute de
// tension seule sous-évalue largement la section nécessaire.

test("computeInverterSize recommande une section couvrant l'ampacité du courant DC, pas seulement la chute de tension", () => {
  // 3000 W continu / 12 V / rendement 0,9 ≈ 277,8 A DC.
  const result = computeInverterSize([{ label: "Onduleur 3000W", watts: 3000, surge: false }], 12, 2);

  assert.equal(Math.round(result.dcCurrentA), 278);
  // Chute de tension seule donnerait 70 mm² ; l'ampacité (marge continue
  // 25 % → ~347 A) impose 120 mm².
  assert.equal(result.dcCableSectionMm2, 120);
});

test("computeInverterSize reste sur la chute de tension pour une petite charge continue", () => {
  const result = computeInverterSize([{ label: "Petit onduleur", watts: 150, surge: false }], 12, 2);

  assert.ok(result.dcCableSectionMm2 <= 6, `section inattendue: ${result.dcCableSectionMm2}`);
});

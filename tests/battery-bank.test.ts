import assert from "node:assert/strict";
import test from "node:test";
import { computeBatteryBank } from "@/lib/calc/battery-bank";

// Correctif sécurité : computeBatteryBank appelait calcSection seule (chute
// de tension uniquement) pour le câble inter-batteries — une distance très
// courte (0,3 m) minimise la chute de tension calculée alors que le
// courant de décharge max d'une banque lithium reste élevé, exactement le
// cas où la chute de tension seule sous-évalue le plus dangereusement la
// section réellement nécessaire.

test("computeBatteryBank recommande une section inter-batteries couvrant l'ampacité du courant de décharge max", () => {
  // 200 Ah LiFePO4, 1C de décharge max → 200 A.
  const result = computeBatteryBank(12, 200, 1, 1, "lifepo4");

  assert.equal(result.maxDischargeA, 200);
  // Chute de tension seule (0,3 m, 2 %) donnerait 10 mm² ; l'ampacité
  // (marge continue 25 % → 250 A) impose 70 mm².
  assert.equal(result.interBatteryCableSectionMm2, 70);
});

test("computeBatteryBank reste sur la chute de tension pour une petite banque AGM/Gel", () => {
  // 100 Ah AGM/Gel, décharge max 0,2C → 20 A seulement.
  const result = computeBatteryBank(12, 100, 1, 1, "agm-gel");

  assert.equal(result.maxDischargeA, 20);
  assert.ok(result.interBatteryCableSectionMm2 <= 6, `section inattendue: ${result.interBatteryCableSectionMm2}`);
});

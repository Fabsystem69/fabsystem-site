import assert from "node:assert/strict";
import test from "node:test";
import { getEngineRegistry, listRegisteredEngineIds } from "@/lib/engines/index";

// UI-8 FINAL §5 : la structure du Project doit refléter exactement les
// moteurs réellement enregistrés — cette liste doit rester la seule
// source de vérité (aucune recopie à la main ailleurs).
const EXPECTED_ENGINE_IDS = [
  "energy.consumption",
  "battery.sizing",
  "alternator.charging",
  "solar.production",
  "charger.recharging",
  "energyBalance.global",
  "circuit.structure",
  "cable.sizing",
  "protection.selection",
  "diagram.model",
].sort();

test("the populated registry contains exactly the 10 real engines, no more, no less", () => {
  const ids = listRegisteredEngineIds().sort();
  assert.deepEqual(ids, EXPECTED_ENGINE_IDS);
});

test("every registered engine is retrievable by id from the registry", () => {
  const registry = getEngineRegistry();
  for (const id of EXPECTED_ENGINE_IDS) {
    assert.equal(registry.has(id), true);
    assert.ok(registry.get(id));
  }
});

test("the registry rejects lookups for an engine that was never registered", () => {
  const registry = getEngineRegistry();
  assert.equal(registry.has("not.a.real.engine"), false);
  assert.equal(registry.get("not.a.real.engine"), undefined);
});

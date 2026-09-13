import assert from "node:assert/strict";
import test from "node:test";
import { displayName } from "@/lib/electrical-components/bom";

// Bug corrigé (découvert en migrant les pompes Pentair/plafonniers Uniteck
// de préréglages à part vers de vrais modèles de marque, retour
// utilisateur : "pompe à eau... plus appareil pour la même chose et pas
// juste le choix du modèle") — un appareil "consumer" avec à la fois un
// presetType (ex. "pompe-eau") ET un brandModelId (ex. Pentair Shurflo)
// retombait sur le libellé générique du préréglage ("Pompe à eau") au lieu
// du produit précis, parce que le préréglage était vérifié avant la marque.
test("displayName prefers the specific brand/model over the generic preset label", () => {
  const data = { presetType: "pompe-eau", brand: "Pentair", model: "Shurflo Deluxe (13,2 L/min)" };

  assert.equal(displayName("consumer", "Pompe à eau", data), "Pentair Shurflo Deluxe (13,2 L/min)");
});

test("displayName falls back to the preset label when no brand/model is chosen", () => {
  const data = { presetType: "pompe-eau" };

  assert.equal(displayName("consumer", "Pompe à eau", data), "Pompe à eau");
});

test("displayName falls back to the generic preset label for 'generique', ignoring it as a real preset", () => {
  const data = { presetType: "generique" };

  assert.equal(displayName("consumer", "Consommateur", data), "Consommateur");
});

test("displayName falls back to the raw component label outside 'consumer' when no brand/model is chosen", () => {
  assert.equal(displayName("mppt", "Régulateur MPPT", {}), "Régulateur MPPT");
});

test("displayName uses brand/model for non-consumer types too", () => {
  const data = { brand: "Victron", model: "SmartSolar MPPT 100/30" };

  assert.equal(displayName("mppt", "Régulateur MPPT", data), "Victron SmartSolar MPPT 100/30");
});

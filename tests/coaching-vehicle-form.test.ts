import assert from "node:assert/strict";
import test from "node:test";
import { parseAdminVehicleFields, parseOptionalEuroBudget } from "@/lib/coaching-vehicle-form";

test("vehicle budgets convert euros to cents without losing zero or decimals", () => {
  for (const [input, expected] of [["2000", 200000], ["0", 0], ["12,34", 1234], ["12.3", 1230], ["", null], ["21474836.47", 2147483647]] as const) {
    assert.equal(parseOptionalEuroBudget(input), expected);
  }
  for (const input of ["-1", "NaN", "1e3", "1.234", "21474836.48", "Infinity"]) {
    assert.throws(() => parseOptionalEuroBudget(input));
  }
});

test("vehicle update preserves omitted fields and parses objectifs/niveauClient (constat d'audit : ces deux champs rejoignent ce formulaire pour partager une seule verification de version avec le reste de la section)", () => {
  const form = new FormData();
  form.set("vehicleBrand", "  Fiat  ");
  form.set("vehicleModel", "");
  form.set("materialBudgetEuros", "2000");
  form.set("objectifs", "  Rouler en autonomie 5 jours  ");
  form.set("niveauClient", "INTERMEDIAIRE");
  assert.deepEqual(parseAdminVehicleFields(form), {
    vehicleBrand: "Fiat", vehicleModel: null, materialBudgetCents: 200000,
    objectifs: "Rouler en autonomie 5 jours", niveauClient: "INTERMEDIAIRE",
  });
  assert.deepEqual(parseAdminVehicleFields(new FormData()), {});

  // niveauClient est desormais valide (ne peut plus etre une valeur inventee).
  const invalidLevel = new FormData();
  invalidLevel.set("niveauClient", "must not overwrite");
  assert.throws(() => parseAdminVehicleFields(invalidLevel));

  // Chaine vide = "non precise" explicite, jamais une valeur par defaut.
  const clearedLevel = new FormData();
  clearedLevel.set("niveauClient", "");
  assert.deepEqual(parseAdminVehicleFields(clearedLevel), { niveauClient: null });
});

test("vehicle budgets distinguish empty from zero and reject file fields", () => {
  const form = new FormData();
  form.set("materialBudgetEuros", "");
  form.set("laborBudgetEuros", "0");
  assert.deepEqual(parseAdminVehicleFields(form), { materialBudgetCents: null, laborBudgetCents: 0 });
  form.set("vehicleBrand", new Blob(["bad input"]), "invalid.txt");
  assert.throws(() => parseAdminVehicleFields(form));
});

test("assetType: valeur connue acceptée, vide = inconnu explicite, valeur invalide refusée", () => {
  const known = new FormData();
  known.set("assetType", "MOTORHOME");
  assert.deepEqual(parseAdminVehicleFields(known), { assetType: "MOTORHOME" });

  const empty = new FormData();
  empty.set("assetType", "");
  assert.deepEqual(parseAdminVehicleFields(empty), { assetType: null });

  const omitted = new FormData();
  assert.equal("assetType" in parseAdminVehicleFields(omitted), false, "absent field must not invent a value");

  const invalid = new FormData();
  invalid.set("assetType", "SUBMARINE");
  assert.throws(() => parseAdminVehicleFields(invalid));
});

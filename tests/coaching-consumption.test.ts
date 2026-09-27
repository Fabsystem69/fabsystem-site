import assert from "node:assert/strict";
import test from "node:test";
import {
  computeDeviceEnergyWh,
  computeScenarioBilan,
  computeTechnicalSynthesis,
  type CoachingDeviceUsageInput,
} from "@/lib/calc/coaching-consumption";

// Fixtures reprises telles quelles du cahier des charges
// (docs/_local/Prompt_Claude_Fabsystem_Dossier_Van.md, "Tests et critères de
// réussite") — ce sont des cas de test, pas des valeurs recommandées.

test("2 lampes de 5 W pendant 4 h donnent 40 Wh/j", () => {
  const usage: CoachingDeviceUsageInput = { calcMethod: "PUISSANCE_TEMPS", continuousPowerW: 5, effectiveHoursPerDay: 4 };
  const result = computeDeviceEnergyWh(usage, 2);
  assert.deepEqual(result, { energyWh: 40, incomplete: false });
});

test("1 appareil de 60 W pendant 30 minutes (0,5 h) donne 30 Wh/j", () => {
  // La conversion minutes -> heures se fait à la saisie (formulaire), le
  // moteur de calcul travaille toujours en heures.
  const usage: CoachingDeviceUsageInput = { calcMethod: "PUISSANCE_TEMPS", continuousPowerW: 60, effectiveHoursPerDay: 0.5 };
  const result = computeDeviceEnergyWh(usage, 1);
  assert.deepEqual(result, { energyWh: 30, incomplete: false });
});

test("un appareil renseigné directement à 400 Wh/j n'est pas recalculé depuis sa puissance", () => {
  const usage: CoachingDeviceUsageInput = {
    calcMethod: "ENERGIE_JOUR",
    dailyEnergyWhPerUnit: 400,
    // Champs de l'autre méthode laissés par erreur (changement de méthode) :
    // doivent être totalement ignorés puisque calcMethod = ENERGIE_JOUR.
    continuousPowerW: 9999,
    effectiveHoursPerDay: 9999,
  };
  const result = computeDeviceEnergyWh(usage, 1);
  assert.deepEqual(result, { energyWh: 400, incomplete: false });
});

test("2 appareils à 100 Wh/cycle et 0,5 cycle/j donnent 100 Wh/j au total", () => {
  const usage: CoachingDeviceUsageInput = { calcMethod: "RECHARGE_CYCLE", energyPerCycleWh: 100, cyclesPerDay: 0.5 };
  const result = computeDeviceEnergyWh(usage, 2);
  assert.deepEqual(result, { energyWh: 100, incomplete: false });
});

test("une durée effective directe n'est jamais multipliée une seconde fois par un taux de fonctionnement", () => {
  const withEffectiveHours: CoachingDeviceUsageInput = {
    calcMethod: "PUISSANCE_TEMPS",
    continuousPowerW: 10,
    effectiveHoursPerDay: 10,
    // Champs de disponibilité/taux présents mais doivent être ignorés dès
    // qu'une durée effective directe est fournie.
    availabilityHoursPerDay: 20,
    dutyCycleRatio: 0.5,
  };
  const withAvailabilityAndRatio: CoachingDeviceUsageInput = {
    calcMethod: "PUISSANCE_TEMPS",
    continuousPowerW: 10,
    availabilityHoursPerDay: 20,
    dutyCycleRatio: 0.5,
  };
  assert.deepEqual(computeDeviceEnergyWh(withEffectiveHours, 1), { energyWh: 100, incomplete: false });
  assert.deepEqual(computeDeviceEnergyWh(withAvailabilityAndRatio, 1), { energyWh: 100, incomplete: false });
});

test("900 Wh utiles avec un rendement de 0,90 donnent 1000 Wh côté batterie, avant auxiliaires et marge", () => {
  const result = computeTechnicalSynthesis(900, {
    pathEfficiency: 0.9,
    auxiliaryLoadsWh: 0,
    marginRatio: 1,
    autonomyDays: 1,
    usableCapacityRatio: 0.9,
    systemVoltage: 12,
  });
  assert.equal(result.incomplete, false);
  if (!result.incomplete) assert.equal(result.batterySideEnergyWh, 1000);
});

test("une valeur inconnue déclenche un bilan incomplet, jamais un zéro silencieux", () => {
  const usage: CoachingDeviceUsageInput = { calcMethod: "PUISSANCE_TEMPS", continuousPowerW: 10 }; // durée manquante
  const result = computeDeviceEnergyWh(usage, 1);
  assert.deepEqual(result, { energyWh: null, incomplete: true });
});

test("un rendement nul est refusé plutôt que de produire un chiffre faux", () => {
  const result = computeTechnicalSynthesis(900, {
    pathEfficiency: 0,
    auxiliaryLoadsWh: 0,
    marginRatio: 1,
    autonomyDays: 1,
    usableCapacityRatio: 0.9,
    systemVoltage: 12,
  });
  assert.equal(result.incomplete, true);
});

test("computeScenarioBilan affiche un sous-total connu plutôt qu'un faux total quand un appareil est incomplet", () => {
  const bilan = computeScenarioBilan([
    { deviceId: "a", quantity: 1, powerSupply: "DC12", usage: { calcMethod: "PUISSANCE_TEMPS", continuousPowerW: 10, effectiveHoursPerDay: 10 } },
    { deviceId: "b", quantity: 1, powerSupply: "AC230", usage: { calcMethod: "PUISSANCE_TEMPS", continuousPowerW: 50 } }, // durée inconnue
  ]);

  assert.equal(bilan.totalWhPerDay, 100); // seul l'appareil "a" est comptabilisé
  assert.equal(bilan.isIncomplete, true);
  assert.equal(bilan.incompleteCount, 1);
  assert.equal(bilan.subtotalsByPowerType.DC12, 100);
  assert.equal(bilan.subtotalsByPowerType.AC230, 0);
});

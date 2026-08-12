import assert from "node:assert/strict";
import test from "node:test";
import {
  translateBilanConsoToEnergyInput,
  translateSectionCableToCableInput,
} from "@/lib/outils-project-bridge";
import { COPPER_RESISTIVITY_OHM_MM2_PER_M, AVAILABLE_SECTIONS_MM2 } from "@/lib/calc/section-cable";

test("translateBilanConsoToEnergyInput renomme les champs vers le contrat energy.consumption", () => {
  const result = translateBilanConsoToEnergyInput([
    { id: 1, nom: "Frigo", puissance: "40", heures: "12" },
  ]);

  assert.deepEqual(result, {
    consumers: [{ name: "Frigo", powerW: 40, dailyUsageHours: 12, quantity: 1 }],
  });
});

test("translateBilanConsoToEnergyInput ignore les lignes sans nom", () => {
  const result = translateBilanConsoToEnergyInput([
    { id: 1, nom: "", puissance: "40", heures: "12" },
    { id: 2, nom: "Pompe", puissance: "30", heures: "1" },
  ]);

  assert.equal(result.consumers.length, 1);
  assert.equal(result.consumers[0].name, "Pompe");
});

test("translateBilanConsoToEnergyInput ne dérive aucune consommation (aucun calcul, uniquement un renommage)", () => {
  const result = translateBilanConsoToEnergyInput([
    { id: 1, nom: "Frigo", puissance: "40", heures: "12" },
  ]);

  // Le moteur real energy.consumption doit recevoir puissance/heures brutes,
  // jamais un Wh déjà calculé côté outil (mission §27 : ne jamais dupliquer
  // le calcul du moteur).
  assert.equal("dailyWh" in result.consumers[0], false);
  assert.equal(result.consumers[0].powerW, 40);
});

test("translateBilanConsoToEnergyInput traite une puissance non numérique comme absente", () => {
  const result = translateBilanConsoToEnergyInput([
    { id: 1, nom: "Appareil", puissance: "", heures: "5" },
  ]);

  assert.equal(result.consumers[0].powerW, undefined);
  assert.equal(result.consumers[0].dailyUsageHours, 5);
});

test("translateSectionCableToCableInput renomme les champs vers le contrat cable.sizing", () => {
  const result = translateSectionCableToCableInput("circuit_1", {
    intensite: "20",
    longueur: "6",
    chute: "3",
    tension: "12",
  });

  assert.deepEqual(result, {
    cables: [
      {
        circuitId: "circuit_1",
        oneWayLengthM: 6,
        maxVoltageDropPercentage: 3,
        conductorResistivityOhmMm2PerM: COPPER_RESISTIVITY_OHM_MM2_PER_M,
        availableSectionsMm2: AVAILABLE_SECTIONS_MM2,
      },
    ],
  });
});

test("translateSectionCableToCableInput réutilise les constantes exportées de l'outil public (pas de duplication de valeurs)", () => {
  const result = translateSectionCableToCableInput("circuit_1", {
    intensite: "10",
    longueur: "3",
    chute: "3",
    tension: "12",
  });

  assert.equal(
    result.cables[0].conductorResistivityOhmMm2PerM,
    COPPER_RESISTIVITY_OHM_MM2_PER_M
  );
  assert.deepEqual(result.cables[0].availableSectionsMm2, AVAILABLE_SECTIONS_MM2);
});

test("translateSectionCableToCableInput retombe sur 0 pour des champs non numériques plutôt que NaN", () => {
  const result = translateSectionCableToCableInput("circuit_1", {
    intensite: "abc",
    longueur: "",
    chute: "3",
    tension: "12",
  });

  assert.equal(result.cables[0].oneWayLengthM, 0);
  assert.equal(Number.isNaN(result.cables[0].oneWayLengthM), false);
});

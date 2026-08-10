import assert from "node:assert/strict";
import test from "node:test";
import { CalculationError } from "@/lib/engines/errors";
import {
  computeAlternatorEngineOutput,
  type AlternatorEngineInput,
} from "@/lib/engines/alternator-engine";

function input(overrides: Partial<AlternatorEngineInput> = {}): AlternatorEngineInput {
  return {
    nominalCurrentA: overrides.nominalCurrentA ?? 100,
    availableCurrentA: overrides.availableCurrentA ?? 40,
    referenceRpm: overrides.referenceRpm ?? 2000,
    efficiencyRatio: overrides.efficiencyRatio,
    rollingDurationHours: overrides.rollingDurationHours ?? 2,
  };
}

function assertClose(actual: number, expected: number, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be close to ${expected}`);
}

const ENERGY = { dailyWh: 200 };
const BATTERY = { usefulCapacityAh: 40 };

// ── Formule 1 : courant exploitable ─────────────────────────────────────

test("sans rendement fourni : le courant exploitable égale le courant disponible", () => {
  const output = computeAlternatorEngineOutput(input({ availableCurrentA: 40 }), ENERGY, BATTERY, 12);

  assert.equal(output.usableCurrentA, 40);
  assert.equal(output.efficiencyRatio, null);
});

test("rendement faible : le courant exploitable est réduit en conséquence", () => {
  const output = computeAlternatorEngineOutput(
    input({ availableCurrentA: 40, efficiencyRatio: 0.5 }),
    ENERGY,
    BATTERY,
    12
  );

  assert.equal(output.usableCurrentA, 20);
});

test("rendement élevé : le courant exploitable est proche du courant disponible", () => {
  const output = computeAlternatorEngineOutput(
    input({ availableCurrentA: 40, efficiencyRatio: 0.95 }),
    ENERGY,
    BATTERY,
    12
  );

  assertClose(output.usableCurrentA, 38);
});

// ── Alternateur faible / puissant ────────────────────────────────────────

test("alternateur faible : courant disponible réduit, énergie rechargeable réduite en conséquence", () => {
  const output = computeAlternatorEngineOutput(
    input({ nominalCurrentA: 30, availableCurrentA: 10, rollingDurationHours: 2 }),
    ENERGY,
    BATTERY,
    12
  );

  assert.equal(output.usableCurrentA, 10);
  assert.equal(output.rechargeableEnergyWh, 10 * 12 * 2);
});

test("alternateur puissant : courant disponible élevé, énergie rechargeable proportionnellement plus grande", () => {
  const output = computeAlternatorEngineOutput(
    input({ nominalCurrentA: 200, availableCurrentA: 150, rollingDurationHours: 2 }),
    ENERGY,
    BATTERY,
    12
  );

  assert.equal(output.usableCurrentA, 150);
  assert.equal(output.rechargeableEnergyWh, 150 * 12 * 2);
});

// ── Durée de roulage ──────────────────────────────────────────────────

test("faible durée de roulage : énergie rechargeable proportionnellement faible", () => {
  const output = computeAlternatorEngineOutput(
    input({ availableCurrentA: 40, rollingDurationHours: 0.5 }),
    ENERGY,
    BATTERY,
    12
  );

  assert.equal(output.rechargeableEnergyWh, 40 * 12 * 0.5);
});

test("longue durée de roulage : énergie rechargeable proportionnellement grande", () => {
  const output = computeAlternatorEngineOutput(
    input({ availableCurrentA: 40, rollingDurationHours: 8 }),
    ENERGY,
    BATTERY,
    12
  );

  assert.equal(output.rechargeableEnergyWh, 40 * 12 * 8);
});

test("durée de roulage nulle : énergie rechargeable nulle, marge = -besoin journalier", () => {
  const output = computeAlternatorEngineOutput(
    input({ availableCurrentA: 40, rollingDurationHours: 0 }),
    ENERGY,
    BATTERY,
    12
  );

  assert.equal(output.rechargeableEnergyWh, 0);
  assert.equal(output.rechargeMarginWh, -ENERGY.dailyWh);
});

// ── Temps de recharge théorique ─────────────────────────────────────────

test("temps de recharge théorique = capacité utile batterie / courant exploitable", () => {
  const output = computeAlternatorEngineOutput(
    input({ availableCurrentA: 20 }),
    ENERGY,
    { usefulCapacityAh: 40 },
    12
  );

  assert.equal(output.theoreticalRechargeTimeHours, 2);
});

test("batterie déjà suffisante (capacité utile nulle) : temps de recharge nul, sans erreur", () => {
  const output = computeAlternatorEngineOutput(
    input({ availableCurrentA: 20 }),
    ENERGY,
    { usefulCapacityAh: 0 },
    12
  );

  assert.equal(output.theoreticalRechargeTimeHours, 0);
});

// ── Marge de recharge ────────────────────────────────────────────────

test("marge de recharge positive : l'alternateur couvre plus que le besoin journalier", () => {
  const output = computeAlternatorEngineOutput(
    input({ availableCurrentA: 40, rollingDurationHours: 2 }),
    { dailyWh: 100 },
    BATTERY,
    12
  );

  assert.equal(output.rechargeableEnergyWh, 960);
  assert.equal(output.rechargeMarginWh, 860);
});

test("marge de recharge négative : l'alternateur ne couvre pas le besoin journalier", () => {
  const output = computeAlternatorEngineOutput(
    input({ availableCurrentA: 5, rollingDurationHours: 1 }),
    { dailyWh: 500 },
    BATTERY,
    12
  );

  assert.equal(output.rechargeableEnergyWh, 60);
  assert.equal(output.rechargeMarginWh, -440);
});

// ── Calcul impossible ────────────────────────────────────────────────

test("tension système inconnue : CalculationError, aucune valeur inventée", () => {
  assert.throws(
    () => computeAlternatorEngineOutput(input(), ENERGY, BATTERY, null),
    (error: unknown) => error instanceof CalculationError && error.code === "ALTERNATOR_VOLTAGE_UNKNOWN"
  );
});

// ── Non-recalcul ────────────────────────────────────────────────────

test("les grandeurs energy.*/battery.* sont reprises telles quelles, jamais recalculées", () => {
  const output = computeAlternatorEngineOutput(input(), { dailyWh: 321 }, { usefulCapacityAh: 55 }, 24);

  assert.equal(output.dailyWh, 321);
  assert.equal(output.usefulCapacityAh, 55);
  assert.equal(output.projectVoltageV, 24);
});

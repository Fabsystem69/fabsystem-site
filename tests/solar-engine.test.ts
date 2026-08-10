import assert from "node:assert/strict";
import test from "node:test";
import { CalculationError } from "@/lib/engines/errors";
import { computeSolarEngineOutput, type SolarEngineInput } from "@/lib/engines/solar-engine";

function input(overrides: Partial<SolarEngineInput> = {}): SolarEngineInput {
  return {
    panelPowerWp: overrides.panelPowerWp ?? 200,
    equivalentSunHours: overrides.equivalentSunHours ?? 5,
    systemEfficiencyRatio: overrides.systemEfficiencyRatio ?? 0.8,
    shadingFactor: overrides.shadingFactor,
  };
}

function assertClose(actual: number, expected: number, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be close to ${expected}`);
}

const ENERGY = { dailyWh: 400 };
const BATTERY = { usefulCapacityAh: 40 };

// ── Petit panneau / grande installation ────────────────────────────────

test("petit panneau : énergie quotidienne proportionnellement faible", () => {
  const output = computeSolarEngineOutput(
    input({ panelPowerWp: 50, systemEfficiencyRatio: 1 }),
    ENERGY,
    BATTERY,
    12
  );

  assert.equal(output.usablePowerW, 50);
  assert.equal(output.dailySolarEnergyWh, 250); // 50 x 5h
});

test("grande installation : énergie quotidienne proportionnellement grande", () => {
  const output = computeSolarEngineOutput(
    input({ panelPowerWp: 2000, systemEfficiencyRatio: 1 }),
    ENERGY,
    BATTERY,
    12
  );

  assert.equal(output.usablePowerW, 2000);
  assert.equal(output.dailySolarEnergyWh, 10000);
});

// ── Ensoleillement ──────────────────────────────────────────────────────

test("faible ensoleillement : énergie quotidienne proportionnellement faible", () => {
  const output = computeSolarEngineOutput(
    input({ panelPowerWp: 200, systemEfficiencyRatio: 1, equivalentSunHours: 1 }),
    ENERGY,
    BATTERY,
    12
  );

  assert.equal(output.dailySolarEnergyWh, 200);
});

test("fort ensoleillement : énergie quotidienne proportionnellement grande", () => {
  const output = computeSolarEngineOutput(
    input({ panelPowerWp: 200, systemEfficiencyRatio: 1, equivalentSunHours: 8 }),
    ENERGY,
    BATTERY,
    12
  );

  assert.equal(output.dailySolarEnergyWh, 1600);
});

// ── Rendement ─────────────────────────────────────────────────────────

test("rendement faible : puissance et énergie exploitables réduites en conséquence", () => {
  const output = computeSolarEngineOutput(
    input({ panelPowerWp: 200, systemEfficiencyRatio: 0.5, equivalentSunHours: 5 }),
    ENERGY,
    BATTERY,
    12
  );

  assert.equal(output.usablePowerW, 100);
  assert.equal(output.dailySolarEnergyWh, 500);
});

test("rendement élevé : puissance exploitable proche de la puissance crête", () => {
  const output = computeSolarEngineOutput(
    input({ panelPowerWp: 200, systemEfficiencyRatio: 0.95, equivalentSunHours: 5 }),
    ENERGY,
    BATTERY,
    12
  );

  assertClose(output.usablePowerW, 190);
});

test("facteur de masquage appliqué en plus du rendement", () => {
  const output = computeSolarEngineOutput(
    input({ panelPowerWp: 200, systemEfficiencyRatio: 1, shadingFactor: 0.7 }),
    ENERGY,
    BATTERY,
    12
  );

  assert.equal(output.usablePowerW, 140);
});

test("sans masquage fourni : aucune réduction supplémentaire (repli neutre)", () => {
  const output = computeSolarEngineOutput(
    input({ panelPowerWp: 200, systemEfficiencyRatio: 1 }),
    ENERGY,
    BATTERY,
    12
  );

  assert.equal(output.usablePowerW, 200);
  assert.equal(output.shadingFactor, null);
});

// ── Courant moyen de charge et temps de recharge théorique ────────────

test("courant moyen de charge = puissance exploitable / tension système", () => {
  const output = computeSolarEngineOutput(
    input({ panelPowerWp: 240, systemEfficiencyRatio: 1 }),
    ENERGY,
    BATTERY,
    12
  );

  assert.equal(output.averageChargingCurrentA, 20);
});

test("temps de recharge théorique = capacité utile batterie / courant moyen de charge", () => {
  const output = computeSolarEngineOutput(
    input({ panelPowerWp: 240, systemEfficiencyRatio: 1 }),
    ENERGY,
    { usefulCapacityAh: 60 },
    12
  );

  assert.equal(output.averageChargingCurrentA, 20);
  assert.equal(output.theoreticalRechargeTimeHours, 3);
});

// ── Couverture des besoins ──────────────────────────────────────────

test("couverture insuffisante : le solaire ne couvre pas le besoin journalier", () => {
  const output = computeSolarEngineOutput(
    input({ panelPowerWp: 50, systemEfficiencyRatio: 1, equivalentSunHours: 2 }),
    { dailyWh: 500 },
    BATTERY,
    12
  );

  assert.equal(output.dailySolarEnergyWh, 100);
  assert.ok(output.coverageRatio < 1);
  assertClose(output.coverageRatio, 0.2);
});

test("couverture complète : le solaire couvre au moins le besoin journalier", () => {
  const output = computeSolarEngineOutput(
    input({ panelPowerWp: 300, systemEfficiencyRatio: 1, equivalentSunHours: 6 }),
    { dailyWh: 900 },
    BATTERY,
    12
  );

  assert.equal(output.dailySolarEnergyWh, 1800);
  assert.ok(output.coverageRatio >= 1);
  assertClose(output.coverageRatio, 2);
});

// ── Calcul impossible ────────────────────────────────────────────────

test("tension système inconnue : CalculationError, aucune valeur inventée", () => {
  assert.throws(
    () => computeSolarEngineOutput(input(), ENERGY, BATTERY, null),
    (error: unknown) => error instanceof CalculationError && error.code === "SOLAR_VOLTAGE_UNKNOWN"
  );
});

test("besoin journalier nul : couverture indéterminée, CalculationError", () => {
  assert.throws(
    () => computeSolarEngineOutput(input(), { dailyWh: 0 }, BATTERY, 12),
    (error: unknown) => error instanceof CalculationError && error.code === "SOLAR_COVERAGE_INDETERMINATE"
  );
});

// ── Non-recalcul ────────────────────────────────────────────────────

test("les grandeurs energy.*/battery.* sont reprises telles quelles, jamais recalculées", () => {
  const output = computeSolarEngineOutput(input(), { dailyWh: 321 }, { usefulCapacityAh: 55 }, 24);

  assert.equal(output.dailyWh, 321);
  assert.equal(output.usefulCapacityAh, 55);
  assert.equal(output.projectVoltageV, 24);
});

import assert from "node:assert/strict";
import test from "node:test";
import { CalculationError } from "@/lib/engines/errors";
import { computeChargerEngineOutput, type ChargerEngineInput } from "@/lib/engines/charger-engine";

function input(overrides: Partial<ChargerEngineInput> = {}): ChargerEngineInput {
  return {
    nominalPowerW: overrides.nominalPowerW ?? 300,
    maxCurrentA: overrides.maxCurrentA ?? 25,
    outputVoltageV: overrides.outputVoltageV ?? 12,
    systemEfficiencyRatio: overrides.systemEfficiencyRatio ?? 0.9,
    chargingDurationHours: overrides.chargingDurationHours ?? 4,
  };
}

function assertClose(actual: number, expected: number, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be close to ${expected}`);
}

const ENERGY = { dailyWh: 400 };
const BATTERY = { usefulCapacityAh: 40 };

// ── Petit chargeur / gros chargeur ──────────────────────────────────────

test("petit chargeur : puissance disponible limitée par la puissance nominale", () => {
  const output = computeChargerEngineOutput(
    input({ nominalPowerW: 60, maxCurrentA: 100, outputVoltageV: 12, systemEfficiencyRatio: 1 }),
    ENERGY,
    BATTERY
  );

  // min(60, 100 x 12) = 60
  assert.equal(output.availablePowerW, 60);
});

test("gros chargeur : puissance disponible plus élevée, proportionnelle", () => {
  const output = computeChargerEngineOutput(
    input({ nominalPowerW: 3000, maxCurrentA: 250, outputVoltageV: 12, systemEfficiencyRatio: 1 }),
    ENERGY,
    BATTERY
  );

  // min(3000, 250 x 12=3000) = 3000
  assert.equal(output.availablePowerW, 3000);
});

test("puissance disponible limitée par le courant maximal plutôt que la puissance nominale", () => {
  const output = computeChargerEngineOutput(
    input({ nominalPowerW: 1000, maxCurrentA: 20, outputVoltageV: 12, systemEfficiencyRatio: 1 }),
    ENERGY,
    BATTERY
  );

  // min(1000, 20 x 12=240) = 240
  assert.equal(output.availablePowerW, 240);
});

// ── Durée de charge ──────────────────────────────────────────────────

test("faible durée de charge : énergie rechargeable proportionnellement faible", () => {
  const output = computeChargerEngineOutput(
    input({ nominalPowerW: 120, maxCurrentA: 100, outputVoltageV: 12, systemEfficiencyRatio: 1, chargingDurationHours: 0.5 }),
    ENERGY,
    BATTERY
  );

  assert.equal(output.rechargeableEnergyWh, 60);
});

test("longue durée de charge : énergie rechargeable proportionnellement grande", () => {
  const output = computeChargerEngineOutput(
    input({ nominalPowerW: 120, maxCurrentA: 100, outputVoltageV: 12, systemEfficiencyRatio: 1, chargingDurationHours: 10 }),
    ENERGY,
    BATTERY
  );

  assert.equal(output.rechargeableEnergyWh, 1200);
});

test("durée de charge nulle : énergie rechargeable nulle, couverture nulle", () => {
  const output = computeChargerEngineOutput(
    input({ nominalPowerW: 120, maxCurrentA: 100, outputVoltageV: 12, systemEfficiencyRatio: 1, chargingDurationHours: 0 }),
    ENERGY,
    BATTERY
  );

  assert.equal(output.rechargeableEnergyWh, 0);
  assert.equal(output.coverageRatio, 0);
});

// ── Rendement ─────────────────────────────────────────────────────────

test("rendement faible : puissance disponible réduite en conséquence", () => {
  const output = computeChargerEngineOutput(
    input({ nominalPowerW: 120, maxCurrentA: 100, outputVoltageV: 12, systemEfficiencyRatio: 0.5 }),
    ENERGY,
    BATTERY
  );

  assert.equal(output.availablePowerW, 60);
});

test("rendement élevé : puissance disponible proche de la puissance nominale", () => {
  const output = computeChargerEngineOutput(
    input({ nominalPowerW: 120, maxCurrentA: 100, outputVoltageV: 12, systemEfficiencyRatio: 0.95 }),
    ENERGY,
    BATTERY
  );

  assertClose(output.availablePowerW, 114);
});

// ── Courant de charge et temps de recharge ─────────────────────────────

test("courant de charge = puissance disponible / tension de sortie", () => {
  const output = computeChargerEngineOutput(
    input({ nominalPowerW: 240, maxCurrentA: 100, outputVoltageV: 12, systemEfficiencyRatio: 1 }),
    ENERGY,
    BATTERY
  );

  assert.equal(output.chargingCurrentA, 20);
});

test("temps de recharge théorique = capacité utile batterie / courant de charge", () => {
  const output = computeChargerEngineOutput(
    input({ nominalPowerW: 240, maxCurrentA: 100, outputVoltageV: 12, systemEfficiencyRatio: 1 }),
    ENERGY,
    { usefulCapacityAh: 60 }
  );

  assert.equal(output.chargingCurrentA, 20);
  assert.equal(output.theoreticalRechargeTimeHours, 3);
});

// ── Couverture énergétique ──────────────────────────────────────────

test("couverture insuffisante : le chargeur ne couvre pas le besoin journalier", () => {
  const output = computeChargerEngineOutput(
    input({ nominalPowerW: 60, maxCurrentA: 100, outputVoltageV: 12, systemEfficiencyRatio: 1, chargingDurationHours: 2 }),
    { dailyWh: 500 },
    BATTERY
  );

  assert.equal(output.rechargeableEnergyWh, 120);
  assert.ok(output.coverageRatio < 1);
  assertClose(output.coverageRatio, 0.24);
});

test("couverture complète : le chargeur couvre au moins le besoin journalier", () => {
  const output = computeChargerEngineOutput(
    input({ nominalPowerW: 300, maxCurrentA: 100, outputVoltageV: 12, systemEfficiencyRatio: 1, chargingDurationHours: 4 }),
    { dailyWh: 900 },
    BATTERY
  );

  assert.equal(output.rechargeableEnergyWh, 1200);
  assert.ok(output.coverageRatio >= 1);
  assertClose(output.coverageRatio, 1200 / 900);
});

// ── Calcul impossible ────────────────────────────────────────────────

test("besoin journalier nul : couverture indéterminée, CalculationError", () => {
  assert.throws(
    () => computeChargerEngineOutput(input(), { dailyWh: 0 }, BATTERY),
    (error: unknown) => error instanceof CalculationError && error.code === "CHARGER_COVERAGE_INDETERMINATE"
  );
});

// ── Non-recalcul ────────────────────────────────────────────────────

test("les grandeurs energy.*/battery.* sont reprises telles quelles, jamais recalculées", () => {
  const output = computeChargerEngineOutput(input(), { dailyWh: 321 }, { usefulCapacityAh: 55 });

  assert.equal(output.dailyWh, 321);
  assert.equal(output.usefulCapacityAh, 55);
});

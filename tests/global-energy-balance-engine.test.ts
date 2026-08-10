import assert from "node:assert/strict";
import test from "node:test";
import { CalculationError } from "@/lib/engines/errors";
import { computeGlobalEnergyBalanceOutput } from "@/lib/engines/global-energy-balance-engine";

function sources(overrides: Partial<Parameters<typeof computeGlobalEnergyBalanceOutput>[0]> = {}) {
  return {
    dailyWh: overrides.dailyWh ?? 400,
    usefulEnergyWh: overrides.usefulEnergyWh ?? 2000,
    alternatorRechargeableEnergyWh: overrides.alternatorRechargeableEnergyWh ?? 100,
    solarRechargeableEnergyWh: overrides.solarRechargeableEnergyWh ?? 150,
    chargerRechargeableEnergyWh: overrides.chargerRechargeableEnergyWh ?? 50,
  };
}

function assertClose(actual: number, expected: number, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be close to ${expected}`);
}

// ── Agrégation (aucune formule primaire recalculée) ────────────────────

test("énergie rechargeable totale = somme des trois sources déjà calculées", () => {
  const output = computeGlobalEnergyBalanceOutput(
    sources({ alternatorRechargeableEnergyWh: 100, solarRechargeableEnergyWh: 150, chargerRechargeableEnergyWh: 50 })
  );

  assert.equal(output.totalRechargeableEnergyWh, 300);
});

test("énergie disponible totale = réserve utile batterie, reprise telle quelle", () => {
  const output = computeGlobalEnergyBalanceOutput(sources({ usefulEnergyWh: 1234 }));

  assert.equal(output.totalAvailableEnergyWh, 1234);
});

// ── Couverture ────────────────────────────────────────────────────────

test("couverture complète : les sources combinées couvrent au moins le besoin journalier", () => {
  const output = computeGlobalEnergyBalanceOutput(
    sources({
      dailyWh: 200,
      alternatorRechargeableEnergyWh: 100,
      solarRechargeableEnergyWh: 100,
      chargerRechargeableEnergyWh: 50,
    })
  );

  assert.ok(output.globalCoverageRatio >= 1);
  assertClose(output.globalCoverageRatio, 250 / 200);
});

test("couverture partielle : les sources combinées ne couvrent pas le besoin journalier", () => {
  const output = computeGlobalEnergyBalanceOutput(
    sources({
      dailyWh: 1000,
      alternatorRechargeableEnergyWh: 100,
      solarRechargeableEnergyWh: 100,
      chargerRechargeableEnergyWh: 50,
    })
  );

  assert.ok(output.globalCoverageRatio < 1);
  assertClose(output.globalCoverageRatio, 250 / 1000);
});

// ── Équilibre énergétique ────────────────────────────────────────────

test("équilibre positif : surplus, autonomie globale illimitée (null)", () => {
  const output = computeGlobalEnergyBalanceOutput(
    sources({
      dailyWh: 200,
      alternatorRechargeableEnergyWh: 100,
      solarRechargeableEnergyWh: 100,
      chargerRechargeableEnergyWh: 50,
    })
  );

  assert.equal(output.globalBalanceWh, 50);
  assert.equal(output.globalAutonomyDays, null);
});

test("équilibre exactement nul : soutenable, autonomie globale illimitée (null)", () => {
  const output = computeGlobalEnergyBalanceOutput(
    sources({
      dailyWh: 250,
      alternatorRechargeableEnergyWh: 100,
      solarRechargeableEnergyWh: 100,
      chargerRechargeableEnergyWh: 50,
    })
  );

  assert.equal(output.globalBalanceWh, 0);
  assert.equal(output.globalAutonomyDays, null);
});

test("équilibre négatif : déficit, autonomie globale finie déduite de la réserve utile", () => {
  const output = computeGlobalEnergyBalanceOutput(
    sources({
      dailyWh: 1000,
      usefulEnergyWh: 500,
      alternatorRechargeableEnergyWh: 100,
      solarRechargeableEnergyWh: 100,
      chargerRechargeableEnergyWh: 50,
    })
  );

  assert.equal(output.globalBalanceWh, -750);
  assertClose(output.globalAutonomyDays as number, 500 / 750);
});

// ── Calcul impossible ────────────────────────────────────────────────

test("besoin journalier nul : couverture indéterminée, CalculationError", () => {
  assert.throws(
    () => computeGlobalEnergyBalanceOutput(sources({ dailyWh: 0 })),
    (error: unknown) =>
      error instanceof CalculationError && error.code === "ENERGY_BALANCE_COVERAGE_INDETERMINATE"
  );
});

// ── Non-recalcul ────────────────────────────────────────────────────

test("les grandeurs sources sont reprises telles quelles dans la sortie", () => {
  const output = computeGlobalEnergyBalanceOutput(
    sources({
      dailyWh: 321,
      usefulEnergyWh: 999,
      alternatorRechargeableEnergyWh: 11,
      solarRechargeableEnergyWh: 22,
      chargerRechargeableEnergyWh: 33,
    })
  );

  assert.equal(output.dailyWh, 321);
  assert.equal(output.usefulEnergyWh, 999);
  assert.equal(output.alternatorRechargeableEnergyWh, 11);
  assert.equal(output.solarRechargeableEnergyWh, 22);
  assert.equal(output.chargerRechargeableEnergyWh, 33);
});

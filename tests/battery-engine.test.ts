import assert from "node:assert/strict";
import test from "node:test";
import { CalculationError } from "@/lib/engines/errors";
import { computeBatteryEngineOutput, type BatteryEngineInput } from "@/lib/engines/battery-engine";

function input(overrides: Partial<BatteryEngineInput> = {}): BatteryEngineInput {
  return {
    technology: overrides.technology ?? "AGM",
    maxDepthOfDischarge: overrides.maxDepthOfDischarge ?? 0.5,
    desiredAutonomyDays: overrides.desiredAutonomyDays ?? 1,
    systemVoltageV: overrides.systemVoltageV ?? 12,
  };
}

function assertClose(actual: number, expected: number, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be close to ${expected}`);
}

// ── Formules, consommation faible/élevée ───────────────────────────────

test("consommation faible : les formules restent proportionnelles", () => {
  const output = computeBatteryEngineOutput(input({ desiredAutonomyDays: 1 }), {
    dailyWh: 60,
    dailyAh: 5,
    maxCurrentA: 2,
  });

  assert.equal(output.usefulEnergyWh, 60);
  assert.equal(output.usefulCapacityAh, 5);
  assert.equal(output.nominalCapacityAh, 10); // 5 / 0.5
  assert.equal(output.autonomyDays, 1);
});

test("consommation élevée : les formules restent proportionnelles", () => {
  const output = computeBatteryEngineOutput(input({ desiredAutonomyDays: 1 }), {
    dailyWh: 3000,
    dailyAh: 250,
    maxCurrentA: 40,
  });

  assert.equal(output.usefulEnergyWh, 3000);
  assert.equal(output.usefulCapacityAh, 250);
  assert.equal(output.nominalCapacityAh, 500); // 250 / 0.5
  assert.equal(output.autonomyDays, 1);
});

// ── Technologies (la formule ne dépend que du DoD fourni, jamais d'une
// table de correspondance technologie → DoD codée en dur) ─────────────

test("batterie plomb (LEAD_ACID, DoD 50%)", () => {
  const output = computeBatteryEngineOutput(
    input({ technology: "LEAD_ACID", maxDepthOfDischarge: 0.5 }),
    { dailyWh: 120, dailyAh: 10, maxCurrentA: 3 }
  );

  assert.equal(output.technology, "LEAD_ACID");
  assert.equal(output.nominalCapacityAh, 20); // 10 / 0.5
});

test("batterie AGM (DoD 50%)", () => {
  const output = computeBatteryEngineOutput(input({ technology: "AGM", maxDepthOfDischarge: 0.5 }), {
    dailyWh: 120,
    dailyAh: 10,
    maxCurrentA: 3,
  });

  assert.equal(output.technology, "AGM");
  assert.equal(output.nominalCapacityAh, 20);
});

test("batterie GEL (DoD 60%)", () => {
  const output = computeBatteryEngineOutput(input({ technology: "GEL", maxDepthOfDischarge: 0.6 }), {
    dailyWh: 120,
    dailyAh: 10,
    maxCurrentA: 3,
  });

  assert.equal(output.technology, "GEL");
  assertClose(output.nominalCapacityAh, 10 / 0.6);
});

test("batterie LiFePO4 (DoD 80%) : capacité nominale plus faible à besoin égal", () => {
  const output = computeBatteryEngineOutput(
    input({ technology: "LIFEPO4", maxDepthOfDischarge: 0.8 }),
    { dailyWh: 120, dailyAh: 10, maxCurrentA: 3 }
  );

  assert.equal(output.technology, "LIFEPO4");
  assertClose(output.nominalCapacityAh, 10 / 0.8);
  assert.ok(output.nominalCapacityAh < 20); // moins que le plomb à DoD 50 %
});

// ── Autonomie ───────────────────────────────────────────────────────────

test("autonomie 1 jour : capacité utile = besoin journalier", () => {
  const output = computeBatteryEngineOutput(input({ desiredAutonomyDays: 1 }), {
    dailyWh: 100,
    dailyAh: 8,
    maxCurrentA: 2,
  });

  assert.equal(output.usefulCapacityAh, 8);
  assert.equal(output.autonomyDays, 1);
});

test("autonomie multiple (3 jours) : capacité utile multipliée par le nombre de jours", () => {
  const output = computeBatteryEngineOutput(input({ desiredAutonomyDays: 3 }), {
    dailyWh: 100,
    dailyAh: 8,
    maxCurrentA: 2,
  });

  assert.equal(output.usefulEnergyWh, 300);
  assert.equal(output.usefulCapacityAh, 24);
  assert.equal(output.autonomyDays, 3);
});

// ── Profondeur de décharge (effet sur la capacité nominale) ────────────

test("profondeur de décharge plus faible ⇒ capacité nominale plus grande", () => {
  const shallow = computeBatteryEngineOutput(input({ maxDepthOfDischarge: 0.3 }), {
    dailyWh: 120,
    dailyAh: 10,
    maxCurrentA: 3,
  });
  const deep = computeBatteryEngineOutput(input({ maxDepthOfDischarge: 0.9 }), {
    dailyWh: 120,
    dailyAh: 10,
    maxCurrentA: 3,
  });

  assert.ok(shallow.nominalCapacityAh > deep.nominalCapacityAh);
  assertClose(shallow.nominalCapacityAh, 10 / 0.3);
  assertClose(deep.nominalCapacityAh, 10 / 0.9);
});

// ── Calcul impossible ────────────────────────────────────────────────

test("consommation journalière (Ah) nulle : autonomie indéterminée, CalculationError", () => {
  assert.throws(
    () => computeBatteryEngineOutput(input(), { dailyWh: 0, dailyAh: 0, maxCurrentA: 0 }),
    (error: unknown) =>
      error instanceof CalculationError && error.code === "BATTERY_AUTONOMY_INDETERMINATE"
  );
});

test("les valeurs energy.* sont reprises telles quelles dans la sortie, jamais recalculées", () => {
  const output = computeBatteryEngineOutput(input(), { dailyWh: 77, dailyAh: 6.4, maxCurrentA: 1.9 });

  assert.equal(output.dailyWh, 77);
  assert.equal(output.dailyAh, 6.4);
  assert.equal(output.maxCurrentA, 1.9);
});

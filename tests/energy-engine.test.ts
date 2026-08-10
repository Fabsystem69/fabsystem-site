import assert from "node:assert/strict";
import test from "node:test";
import { CalculationError, ValidationError } from "@/lib/engines/errors";
import {
  computeEnergyEngineOutput,
  type EnergyConsumerInput,
} from "@/lib/engines/energy-engine";

function assertClose(actual: number, expected: number, epsilon = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be close to ${expected}`
  );
}

function consumer(overrides: Partial<EnergyConsumerInput> = {}): EnergyConsumerInput {
  return {
    name: overrides.name ?? "Frigo",
    powerW: overrides.powerW,
    currentA: overrides.currentA,
    voltageV: overrides.voltageV,
    dailyUsageHours: overrides.dailyUsageHours ?? 24,
    quantity: overrides.quantity,
  };
}

// ── Cas nominaux ────────────────────────────────────────────────────────

test("aucun consommateur : totaux à zéro, calcul complet, sans erreur", () => {
  const { output, errors } = computeEnergyEngineOutput({ consumers: [] }, 12);

  assert.deepEqual(output.consumers, []);
  assert.equal(output.totalPowerW, 0);
  assert.equal(output.dailyWh, 0);
  assert.equal(output.dailyAh, 0);
  assert.equal(output.maxCurrentA, 0);
  assert.equal(output.complete, true);
  assert.deepEqual(errors, []);
});

test("un consommateur : puissance et durée correctement multipliées", () => {
  const { output } = computeEnergyEngineOutput(
    { consumers: [consumer({ name: "Frigo", powerW: 50, dailyUsageHours: 10 })] },
    12
  );

  assert.equal(output.consumers.length, 1);
  assert.equal(output.totalPowerW, 50);
  assert.equal(output.dailyWh, 500);
  assertClose(output.dailyAh, 500 / 12);
});

test("plusieurs consommateurs : les totaux sont la somme de chacun", () => {
  const { output } = computeEnergyEngineOutput(
    {
      consumers: [
        consumer({ name: "Frigo", powerW: 50, dailyUsageHours: 10 }),
        consumer({ name: "Éclairage", powerW: 20, dailyUsageHours: 5 }),
      ],
    },
    12
  );

  assert.equal(output.consumers.length, 2);
  assert.equal(output.totalPowerW, 70);
  assert.equal(output.dailyWh, 50 * 10 + 20 * 5);
});

test("tension 12V : le courant est dérivé avec la tension système du Project", () => {
  const { output } = computeEnergyEngineOutput(
    { consumers: [consumer({ name: "Frigo", powerW: 60, dailyUsageHours: 1 })] },
    12
  );

  assert.equal(output.consumers[0]?.unitCurrentA, 5);
  assert.equal(output.consumers[0]?.voltageV, 12);
});

test("tension 24V : le courant est dérivé avec la tension système du Project", () => {
  const { output } = computeEnergyEngineOutput(
    { consumers: [consumer({ name: "Frigo", powerW: 60, dailyUsageHours: 1 })] },
    24
  );

  assert.equal(output.consumers[0]?.unitCurrentA, 2.5);
  assert.equal(output.consumers[0]?.voltageV, 24);
});

test("puissance connue : le courant est dérivé (P / U)", () => {
  const { output } = computeEnergyEngineOutput(
    { consumers: [consumer({ name: "Frigo", powerW: 120, dailyUsageHours: 1 })] },
    12
  );

  assert.equal(output.consumers[0]?.unitPowerW, 120);
  assert.equal(output.consumers[0]?.unitCurrentA, 10);
});

test("courant connu : la puissance est dérivée (I × U)", () => {
  const { output } = computeEnergyEngineOutput(
    { consumers: [consumer({ name: "Frigo", currentA: 5, dailyUsageHours: 1 })] },
    12
  );

  assert.equal(output.consumers[0]?.unitCurrentA, 5);
  assert.equal(output.consumers[0]?.unitPowerW, 60);
});

test("puissance et courant cohérents fournis ensemble : conservés tels quels", () => {
  const { output, errors } = computeEnergyEngineOutput(
    { consumers: [consumer({ name: "Frigo", powerW: 60, currentA: 5, dailyUsageHours: 1 })] },
    12
  );

  assert.equal(output.consumers[0]?.unitPowerW, 60);
  assert.equal(output.consumers[0]?.unitCurrentA, 5);
  assert.deepEqual(errors, []);
});

test("durée nulle : contribue pour zéro sans déclencher d'erreur", () => {
  const { output, errors } = computeEnergyEngineOutput(
    { consumers: [consumer({ name: "Frigo", powerW: 50, dailyUsageHours: 0 })] },
    12
  );

  assert.equal(output.consumers[0]?.dailyWh, 0);
  assert.equal(output.consumers[0]?.dailyAh, 0);
  assert.equal(output.dailyWh, 0);
  assert.deepEqual(errors, []);
});

test("quantité multiple : les totaux sont multipliés par la quantité", () => {
  const { output } = computeEnergyEngineOutput(
    { consumers: [consumer({ name: "Spot LED", powerW: 10, dailyUsageHours: 4, quantity: 3 })] },
    12
  );

  assert.equal(output.consumers[0]?.totalPowerW, 30);
  assert.equal(output.consumers[0]?.dailyWh, 120);
});

test("quantité zéro : consommateur valide, contribue pour zéro", () => {
  const { output, errors } = computeEnergyEngineOutput(
    { consumers: [consumer({ name: "Spot LED (désactivé)", powerW: 10, dailyUsageHours: 4, quantity: 0 })] },
    12
  );

  assert.equal(output.consumers[0]?.totalPowerW, 0);
  assert.equal(output.totalPowerW, 0);
  assert.deepEqual(errors, []);
});

// ── Calcul impossible (non bloquant) ───────────────────────────────────

test("puissance connue mais tension système inconnue : courant non calculable, signalé sans bloquer", () => {
  const { output, errors } = computeEnergyEngineOutput(
    { consumers: [consumer({ name: "Frigo", powerW: 60, dailyUsageHours: 1 })] },
    null
  );

  assert.equal(output.consumers[0]?.unitPowerW, 60);
  assert.equal(output.consumers[0]?.unitCurrentA, null);
  assert.equal(output.consumers[0]?.dailyAh, null);
  assert.equal(output.totalPowerW, 60);
  assert.equal(output.dailyAh, 0);
  assert.equal(output.complete, false);
  assert.equal(errors.length, 1);
  assert.equal(errors[0]?.code, "CONSUMER_CALCULATION_IMPOSSIBLE");
});

test("un consommateur incomplet n'empêche pas le calcul des autres", () => {
  const { output, errors } = computeEnergyEngineOutput(
    {
      consumers: [
        consumer({ name: "Frigo", powerW: 60, dailyUsageHours: 1 }),
        consumer({ name: "Pompe", currentA: 3, voltageV: 12, dailyUsageHours: 1 }),
      ],
    },
    null
  );

  assert.equal(output.consumers[1]?.unitCurrentA, 3);
  assert.equal(output.maxCurrentA, 3);
  assert.equal(errors.length, 1);
});

// ── Erreurs de validation (bloquantes) ─────────────────────────────────

test("nom manquant : ValidationError", () => {
  assert.throws(
    () => computeEnergyEngineOutput({ consumers: [consumer({ name: "" })] }, 12),
    (error: unknown) => error instanceof ValidationError && error.code === "CONSUMER_INVALID_VALUE"
  );
});

test("ni puissance ni courant : ValidationError (donnée manquante)", () => {
  assert.throws(
    () => computeEnergyEngineOutput({ consumers: [consumer({ name: "Mystère" })] }, 12),
    (error: unknown) => error instanceof ValidationError && error.code === "CONSUMER_MISSING_POWER_DATA"
  );
});

test("valeur négative : ValidationError (valeur invalide)", () => {
  assert.throws(
    () => computeEnergyEngineOutput({ consumers: [consumer({ powerW: -10, dailyUsageHours: 1 })] }, 12),
    (error: unknown) => error instanceof ValidationError && error.code === "CONSUMER_INVALID_VALUE"
  );
});

test("valeur non finie : ValidationError (valeur invalide)", () => {
  assert.throws(
    () =>
      computeEnergyEngineOutput(
        { consumers: [consumer({ powerW: Number.NaN, dailyUsageHours: 1 })] },
        12
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "CONSUMER_INVALID_VALUE"
  );
});

test("durée supérieure à 24h : ValidationError (valeur invalide)", () => {
  assert.throws(
    () => computeEnergyEngineOutput({ consumers: [consumer({ powerW: 10, dailyUsageHours: 25 })] }, 12),
    (error: unknown) => error instanceof ValidationError && error.code === "CONSUMER_INVALID_VALUE"
  );
});

test("tension nulle déclarée : ValidationError (valeur invalide)", () => {
  assert.throws(
    () =>
      computeEnergyEngineOutput(
        { consumers: [consumer({ powerW: 10, voltageV: 0, dailyUsageHours: 1 })] },
        12
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "CONSUMER_INVALID_VALUE"
  );
});

test("tension consommateur incohérente avec la tension système : ValidationError (unité incohérente)", () => {
  assert.throws(
    () =>
      computeEnergyEngineOutput(
        { consumers: [consumer({ powerW: 60, voltageV: 24, dailyUsageHours: 1 })] },
        12
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "CONSUMER_VOLTAGE_MISMATCH"
  );
});

test("puissance et courant incohérents entre eux : ValidationError (unité incohérente)", () => {
  assert.throws(
    () =>
      computeEnergyEngineOutput(
        { consumers: [consumer({ powerW: 1000, currentA: 5, voltageV: 12, dailyUsageHours: 1 })] },
        12
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "CONSUMER_POWER_CURRENT_MISMATCH"
  );
});

test("puissance et courant cohérents à l'arrondi près : aucune erreur", () => {
  // 12 V x 5 A = 60 W ; une saisie arrondie à 60.3 W reste dans la tolérance.
  assert.doesNotThrow(() =>
    computeEnergyEngineOutput(
      { consumers: [consumer({ powerW: 60.3, currentA: 5, voltageV: 12, dailyUsageHours: 1 })] },
      12
    )
  );
});

test("consumers absent du payload : ValidationError", () => {
  assert.throws(
    () => computeEnergyEngineOutput({} as never, 12),
    (error: unknown) => error instanceof ValidationError && error.code === "CONSUMERS_MISSING"
  );
});

test("toutes les erreurs sont des EngineError (Validation ou Calculation), jamais une Error générique", () => {
  try {
    computeEnergyEngineOutput({ consumers: [consumer({ name: "" })] }, 12);
    assert.fail("expected to throw");
  } catch (error) {
    assert.ok(error instanceof ValidationError);
  }

  const { errors } = computeEnergyEngineOutput(
    { consumers: [consumer({ powerW: 10, dailyUsageHours: 1 })] },
    null
  );
  assert.equal(errors[0]?.code, "CONSUMER_CALCULATION_IMPOSSIBLE");
  assert.ok(new CalculationError("x").code === "CALCULATION_ERROR");
});

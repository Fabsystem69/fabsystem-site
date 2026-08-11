import assert from "node:assert/strict";
import test from "node:test";
import {
  ENGINE_INPUT_SCHEMAS,
  getEngineInputSchema,
  isRegisteredEngineId,
  ENGINE_LABELS,
  ENERGY_CHAIN,
  CIRCUIT_CHAIN,
} from "@/lib/engine-payload";

// UI-8 FINAL §1/§12 : le contrat réel de chaque moteur doit être validé
// avant d'atteindre EngineRunner — jamais une valeur inventée, jamais un
// moteur inconnu accepté silencieusement.

test("unknown engine id is rejected cleanly", () => {
  assert.equal(isRegisteredEngineId("not.a.real.engine"), false);
  assert.equal(getEngineInputSchema("not.a.real.engine"), null);
});

test("every registered engine id has a schema and a human label", () => {
  for (const engineId of Object.keys(ENGINE_INPUT_SCHEMAS)) {
    assert.ok(isRegisteredEngineId(engineId));
    assert.ok(getEngineInputSchema(engineId));
    assert.ok(ENGINE_LABELS[engineId as keyof typeof ENGINE_LABELS]);
  }
});

test("energy chain and circuit chain together cover exactly the 10 registered engines", () => {
  const combined = [...ENERGY_CHAIN, ...CIRCUIT_CHAIN].sort();
  const allIds = Object.keys(ENGINE_INPUT_SCHEMAS).sort();
  assert.deepEqual(combined, allIds);
});

test("energy.consumption schema accepts a real minimal input and rejects an empty consumer list", () => {
  const schema = getEngineInputSchema("energy.consumption")!;
  assert.equal(
    schema.safeParse({ consumers: [{ name: "Frigo", dailyUsageHours: 24 }] }).success,
    true
  );
  assert.equal(schema.safeParse({ consumers: [] }).success, false);
  assert.equal(schema.safeParse({}).success, false);
});

test("battery.sizing schema rejects an out-of-range depth of discharge", () => {
  const schema = getEngineInputSchema("battery.sizing")!;
  assert.equal(
    schema.safeParse({
      technology: "AGM",
      maxDepthOfDischarge: 0.5,
      desiredAutonomyDays: 2,
      systemVoltageV: 12,
    }).success,
    true
  );
  assert.equal(
    schema.safeParse({
      technology: "AGM",
      maxDepthOfDischarge: 1.5,
      desiredAutonomyDays: 2,
      systemVoltageV: 12,
    }).success,
    false
  );
});

test("energyBalance.global schema takes no input field", () => {
  const schema = getEngineInputSchema("energyBalance.global")!;
  assert.equal(schema.safeParse({}).success, true);
  assert.equal(schema.safeParse({ unexpected: true }).success, false);
});

test("circuit.structure schema requires at least one circuit with a consumer name", () => {
  const schema = getEngineInputSchema("circuit.structure")!;
  assert.equal(
    schema.safeParse({ circuits: [{ name: "Éclairage", consumerNames: ["Plafonnier"] }] })
      .success,
    true
  );
  assert.equal(schema.safeParse({ circuits: [{ name: "Éclairage", consumerNames: [] }] }).success, false);
});

test("cable.sizing schema requires a circuitId and at least one available section", () => {
  const schema = getEngineInputSchema("cable.sizing")!;
  assert.equal(
    schema.safeParse({
      cables: [
        {
          circuitId: "eclairage",
          oneWayLengthM: 3,
          maxVoltageDropPercentage: 3,
          conductorResistivityOhmMm2PerM: 0.0175,
          availableSectionsMm2: [1.5, 2.5],
        },
      ],
    }).success,
    true
  );
  assert.equal(
    schema.safeParse({
      cables: [
        {
          circuitId: "eclairage",
          oneWayLengthM: 3,
          maxVoltageDropPercentage: 3,
          conductorResistivityOhmMm2PerM: 0.0175,
          availableSectionsMm2: [],
        },
      ],
    }).success,
    false
  );
});

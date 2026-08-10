import assert from "node:assert/strict";
import test from "node:test";
import { CalculationError, ValidationError } from "@/lib/engines/errors";
import {
  computeCableEngineOutput,
  type CableDefinitionInput,
} from "@/lib/engines/cable-engine";

type CircuitFixture = {
  cumulatedPowerW: number;
  cumulatedCurrentA: number | null;
  voltageV: number;
};

function circuit(overrides: Partial<CircuitFixture> = {}): CircuitFixture {
  return {
    cumulatedPowerW: overrides.cumulatedPowerW ?? 60,
    cumulatedCurrentA: overrides.cumulatedCurrentA === undefined ? 5 : overrides.cumulatedCurrentA,
    voltageV: overrides.voltageV ?? 12,
  };
}

const STANDARD_SECTIONS = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50];
const COPPER_RESISTIVITY = 0.0175;

function cableDef(overrides: Partial<CableDefinitionInput> = {}): CableDefinitionInput {
  return {
    circuitId: overrides.circuitId ?? "frigo",
    oneWayLengthM: overrides.oneWayLengthM ?? 3,
    maxVoltageDropPercentage: overrides.maxVoltageDropPercentage ?? 3,
    conductorResistivityOhmMm2PerM: overrides.conductorResistivityOhmMm2PerM ?? COPPER_RESISTIVITY,
    availableSectionsMm2: overrides.availableSectionsMm2 ?? STANDARD_SECTIONS,
  };
}

// ── Un seul circuit ──────────────────────────────────────────────────

test("un seul circuit : dimensionne correctement son conducteur", () => {
  const { cables } = computeCableEngineOutput(
    { cables: [cableDef({ circuitId: "frigo" })] },
    { frigo: circuit({ cumulatedCurrentA: 5, voltageV: 12 }) }
  );

  assert.equal(cables.length, 1);
  assert.equal(cables[0]?.circuitId, "frigo");
  assert.equal(cables[0]?.referenceCurrentA, 5);
  assert.equal(cables[0]?.electricalLengthM, 6);
  assert.equal(cables[0]?.voltageV, 12);
  assert.ok(cables[0]!.retainedSectionMm2 >= cables[0]!.minimumSectionMm2);
  assert.ok(STANDARD_SECTIONS.includes(cables[0]!.retainedSectionMm2));
});

// ── Plusieurs circuits ──────────────────────────────────────────────

test("plusieurs circuits : chacun dimensionné indépendamment", () => {
  const { cables } = computeCableEngineOutput(
    {
      cables: [
        cableDef({ circuitId: "frigo", oneWayLengthM: 3 }),
        cableDef({ circuitId: "pompe", oneWayLengthM: 8 }),
      ],
    },
    {
      frigo: circuit({ cumulatedCurrentA: 5, voltageV: 12 }),
      pompe: circuit({ cumulatedCurrentA: 3, voltageV: 12 }),
    }
  );

  assert.equal(cables.length, 2);
  const frigo = cables.find((c) => c.circuitId === "frigo");
  const pompe = cables.find((c) => c.circuitId === "pompe");
  assert.equal(frigo?.electricalLengthM, 6);
  assert.equal(pompe?.electricalLengthM, 16);
});

// ── Courant faible / élevé ───────────────────────────────────────────

test("courant faible : section minimale réduite", () => {
  const { cables } = computeCableEngineOutput(
    { cables: [cableDef({ circuitId: "veille", oneWayLengthM: 3 })] },
    { veille: circuit({ cumulatedCurrentA: 0.5, voltageV: 12 }) }
  );

  assert.ok(cables[0]!.minimumSectionMm2 < 1);
});

test("courant élevé : section minimale plus importante qu'avec un courant faible", () => {
  const low = computeCableEngineOutput(
    { cables: [cableDef({ circuitId: "c", oneWayLengthM: 3 })] },
    { c: circuit({ cumulatedCurrentA: 2, voltageV: 12 }) }
  );
  const high = computeCableEngineOutput(
    { cables: [cableDef({ circuitId: "c", oneWayLengthM: 3 })] },
    { c: circuit({ cumulatedCurrentA: 40, voltageV: 12 }) }
  );

  assert.ok(high.cables[0]!.minimumSectionMm2 > low.cables[0]!.minimumSectionMm2);
});

// ── Longueur faible / importante ─────────────────────────────────────

test("longueur faible : section minimale réduite", () => {
  const { cables } = computeCableEngineOutput(
    { cables: [cableDef({ circuitId: "c", oneWayLengthM: 0.5 })] },
    { c: circuit({ cumulatedCurrentA: 5, voltageV: 12 }) }
  );

  assert.equal(cables[0]?.electricalLengthM, 1);
});

test("longueur importante : section minimale plus importante qu'avec une longueur faible", () => {
  const short = computeCableEngineOutput(
    { cables: [cableDef({ circuitId: "c", oneWayLengthM: 1 })] },
    { c: circuit({ cumulatedCurrentA: 5, voltageV: 12 }) }
  );
  const long = computeCableEngineOutput(
    { cables: [cableDef({ circuitId: "c", oneWayLengthM: 15 })] },
    { c: circuit({ cumulatedCurrentA: 5, voltageV: 12 }) }
  );

  assert.ok(long.cables[0]!.minimumSectionMm2 > short.cables[0]!.minimumSectionMm2);
});

// ── Chute de tension admissible / excessive ──────────────────────────

test("chute de tension admissible : la section retenue respecte la limite", () => {
  const { cables } = computeCableEngineOutput(
    { cables: [cableDef({ circuitId: "c", oneWayLengthM: 3, maxVoltageDropPercentage: 3 })] },
    { c: circuit({ cumulatedCurrentA: 5, voltageV: 12 }) }
  );

  assert.ok(cables[0]!.computedVoltageDropPercentage <= 3);
});

test("chute de tension excessive : aucune section du catalogue ne convient, CalculationError", () => {
  assert.throws(
    () =>
      computeCableEngineOutput(
        {
          cables: [
            cableDef({
              circuitId: "c",
              oneWayLengthM: 100,
              maxVoltageDropPercentage: 1,
              availableSectionsMm2: [0.5, 1, 1.5],
            }),
          ],
        },
        { c: circuit({ cumulatedCurrentA: 40, voltageV: 12 }) }
      ),
    (error: unknown) => error instanceof CalculationError && error.code === "CABLE_SECTION_OUT_OF_RANGE"
  );
});

// ── Circuit absent ────────────────────────────────────────────────────

test("circuit absent : DependencyError si aucune donnée circuit n'est fournie pour le circuitId", () => {
  assert.throws(
    () => computeCableEngineOutput({ cables: [cableDef({ circuitId: "inconnu" })] }, {}),
    (error: unknown) => (error as { code?: string }).code === "CIRCUIT_DATA_MISSING"
  );
});

// ── Paramètres invalides ─────────────────────────────────────────────

test("longueur invalide : ValidationError si oneWayLengthM <= 0", () => {
  assert.throws(
    () =>
      computeCableEngineOutput(
        { cables: [cableDef({ circuitId: "c", oneWayLengthM: 0 })] },
        { c: circuit() }
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "CABLE_LENGTH_INVALID"
  );
});

test("chute de tension max invalide : ValidationError si maxVoltageDropPercentage <= 0", () => {
  assert.throws(
    () =>
      computeCableEngineOutput(
        { cables: [cableDef({ circuitId: "c", maxVoltageDropPercentage: 0 })] },
        { c: circuit() }
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "CABLE_VOLTAGE_DROP_LIMIT_INVALID"
  );
});

test("résistivité invalide : ValidationError si conductorResistivityOhmMm2PerM <= 0", () => {
  assert.throws(
    () =>
      computeCableEngineOutput(
        { cables: [cableDef({ circuitId: "c", conductorResistivityOhmMm2PerM: -1 })] },
        { c: circuit() }
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "CABLE_RESISTIVITY_INVALID"
  );
});

test("catalogue de sections invalide : ValidationError si availableSectionsMm2 est vide", () => {
  assert.throws(
    () =>
      computeCableEngineOutput(
        { cables: [cableDef({ circuitId: "c", availableSectionsMm2: [] })] },
        { c: circuit() }
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "CABLE_SECTION_CATALOG_INVALID"
  );
});

test("circuitId manquant : ValidationError", () => {
  assert.throws(
    () =>
      computeCableEngineOutput(
        { cables: [{ ...cableDef(), circuitId: "" }] },
        { c: circuit() }
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "CABLE_PARAMETER_MISSING"
  );
});

test("circuitId dupliqué : ValidationError", () => {
  assert.throws(
    () =>
      computeCableEngineOutput(
        { cables: [cableDef({ circuitId: "frigo" }), cableDef({ circuitId: "frigo" })] },
        { frigo: circuit() }
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "CABLE_DUPLICATE_CIRCUIT"
  );
});

test("cables absent du payload : ValidationError", () => {
  assert.throws(
    () => computeCableEngineOutput({} as never, {}),
    (error: unknown) => error instanceof ValidationError && error.code === "CABLES_MISSING"
  );
});

test("courant indéterminé : CalculationError si le courant dérivé est négatif ou infini", () => {
  assert.throws(
    () =>
      computeCableEngineOutput(
        { cables: [cableDef({ circuitId: "c" })] },
        { c: circuit({ cumulatedCurrentA: null, cumulatedPowerW: 60, voltageV: 0 }) }
      ),
    (error: unknown) => error instanceof CalculationError && error.code === "CABLE_CURRENT_INDETERMINATE"
  );
});

// ── Valeurs retenues proposées (fonction pure : pas de proposal ici, testé
// via cable-engine-runner.test.ts) ────────────────────────────────────

test("les grandeurs du circuit sont reprises telles quelles, jamais recalculées", () => {
  const { cables } = computeCableEngineOutput(
    { cables: [cableDef({ circuitId: "c", oneWayLengthM: 3 })] },
    { c: circuit({ cumulatedCurrentA: 7.25, voltageV: 24 }) }
  );

  assert.equal(cables[0]?.referenceCurrentA, 7.25);
  assert.equal(cables[0]?.voltageV, 24);
});

test("courant non fourni : dérivé de la puissance cumulée et de la tension du circuit", () => {
  const { cables } = computeCableEngineOutput(
    { cables: [cableDef({ circuitId: "c" })] },
    { c: circuit({ cumulatedCurrentA: null, cumulatedPowerW: 120, voltageV: 12 }) }
  );

  assert.equal(cables[0]?.referenceCurrentA, 10);
});

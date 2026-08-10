import assert from "node:assert/strict";
import test from "node:test";
import { CalculationError, ValidationError } from "@/lib/engines/errors";
import {
  computeCircuitEngineOutput,
  type CircuitDefinitionInput,
} from "@/lib/engines/circuit-engine";

type ConsumerFixture = {
  name: string;
  quantity: number;
  voltageV: number | null;
  totalPowerW: number | null;
  totalCurrentA: number | null;
};

function consumer(overrides: Partial<ConsumerFixture> = {}): ConsumerFixture {
  return {
    name: overrides.name ?? "Frigo",
    quantity: overrides.quantity ?? 1,
    voltageV: overrides.voltageV === undefined ? 12 : overrides.voltageV,
    totalPowerW: overrides.totalPowerW === undefined ? 60 : overrides.totalPowerW,
    totalCurrentA: overrides.totalCurrentA === undefined ? 5 : overrides.totalCurrentA,
  };
}

// Phase 4.7.1 : le moteur produit désormais lui-même l'identifiant du
// circuit à partir de son nom — l'appelant ne fournit plus que les
// données nécessaires au regroupement (nom, type, consommateurs).
function circuitDef(overrides: Partial<CircuitDefinitionInput> = {}): CircuitDefinitionInput {
  return {
    name: overrides.name ?? "Circuit frigo",
    circuitType: overrides.circuitType,
    consumerNames: overrides.consumerNames ?? ["Frigo"],
  };
}

// ── Un seul circuit ──────────────────────────────────────────────────

test("un seul circuit : regroupe correctement son unique consommateur, id dérivé du nom", () => {
  const { circuits } = computeCircuitEngineOutput(
    { circuits: [circuitDef({ name: "Circuit frigo", consumerNames: ["Frigo"] })] },
    [consumer({ name: "Frigo", totalPowerW: 60, totalCurrentA: 5, voltageV: 12 })]
  );

  assert.equal(circuits.length, 1);
  assert.equal(circuits[0]?.id, "circuit-frigo");
  assert.equal(circuits[0]?.name, "Circuit frigo");
  assert.equal(circuits[0]?.cumulatedPowerW, 60);
  assert.equal(circuits[0]?.cumulatedCurrentA, 5);
  assert.equal(circuits[0]?.voltageV, 12);
});

test("l'identifiant dérivé ignore la casse et les accents", () => {
  const { circuits } = computeCircuitEngineOutput(
    { circuits: [circuitDef({ name: "Éclairage Général", consumerNames: ["Frigo"] })] },
    [consumer({ name: "Frigo" })]
  );

  assert.equal(circuits[0]?.id, "eclairage-general");
});

// ── Plusieurs circuits ──────────────────────────────────────────────

test("plusieurs circuits : chacun regroupe ses propres consommateurs indépendamment", () => {
  const { circuits } = computeCircuitEngineOutput(
    {
      circuits: [
        circuitDef({ name: "Frigo", consumerNames: ["Frigo"] }),
        circuitDef({ name: "Éclairage", consumerNames: ["Spot"] }),
      ],
    },
    [
      consumer({ name: "Frigo", totalPowerW: 60, totalCurrentA: 5 }),
      consumer({ name: "Spot", totalPowerW: 10, totalCurrentA: 0.83 }),
    ]
  );

  assert.equal(circuits.length, 2);
  assert.equal(circuits.find((c) => c.id === "frigo")?.cumulatedPowerW, 60);
  assert.equal(circuits.find((c) => c.id === "eclairage")?.cumulatedPowerW, 10);
});

// ── Plusieurs consommateurs dans un même circuit ───────────────────────

test("plusieurs consommateurs dans un même circuit : puissance et courant additionnés", () => {
  const { circuits } = computeCircuitEngineOutput(
    { circuits: [circuitDef({ name: "Frigo", consumerNames: ["Frigo", "Pompe"] })] },
    [
      consumer({ name: "Frigo", totalPowerW: 60, totalCurrentA: 5 }),
      consumer({ name: "Pompe", totalPowerW: 36, totalCurrentA: 3 }),
    ]
  );

  assert.equal(circuits[0]?.cumulatedPowerW, 96);
  assert.equal(circuits[0]?.cumulatedCurrentA, 8);
});

test("consommateur au courant inconnu : contribue pour zéro à la puissance, le courant cumulé reste partiel", () => {
  const { circuits } = computeCircuitEngineOutput(
    { circuits: [circuitDef({ name: "Frigo", consumerNames: ["Frigo", "Pompe"] })] },
    [
      consumer({ name: "Frigo", totalPowerW: 60, totalCurrentA: null }),
      consumer({ name: "Pompe", totalPowerW: 36, totalCurrentA: 3 }),
    ]
  );

  assert.equal(circuits[0]?.cumulatedPowerW, 96);
  assert.equal(circuits[0]?.cumulatedCurrentA, 3);
});

test("aucun consommateur du circuit n'a de courant connu : courant cumulé null", () => {
  const { circuits } = computeCircuitEngineOutput(
    { circuits: [circuitDef({ name: "Frigo", consumerNames: ["Frigo"] })] },
    [consumer({ name: "Frigo", totalPowerW: 60, totalCurrentA: null })]
  );

  assert.equal(circuits[0]?.cumulatedCurrentA, null);
  assert.equal(circuits[0]?.cumulatedPowerW, 60);
});

// ── Consommateur absent ─────────────────────────────────────────────

test("consommateur absent : ValidationError si le circuit référence un nom inconnu", () => {
  assert.throws(
    () =>
      computeCircuitEngineOutput(
        { circuits: [circuitDef({ name: "Frigo", consumerNames: ["Inconnu"] })] },
        [consumer({ name: "Frigo" })]
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "CIRCUIT_CONSUMER_NOT_FOUND"
  );
});

// ── Circuit vide ─────────────────────────────────────────────────────

test("circuit vide : ValidationError si aucun consommateur n'est associé", () => {
  assert.throws(
    () =>
      computeCircuitEngineOutput({ circuits: [circuitDef({ name: "Frigo", consumerNames: [] })] }, [
        consumer({ name: "Frigo" }),
      ]),
    (error: unknown) => error instanceof ValidationError && error.code === "CIRCUIT_EMPTY"
  );
});

// ── Tensions différentes ─────────────────────────────────────────────

test("tensions différentes : ValidationError si le circuit mélange plusieurs tensions", () => {
  assert.throws(
    () =>
      computeCircuitEngineOutput(
        { circuits: [circuitDef({ name: "Mixte", consumerNames: ["Frigo", "Winch"] })] },
        [consumer({ name: "Frigo", voltageV: 12 }), consumer({ name: "Winch", voltageV: 24 })]
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "CIRCUIT_VOLTAGE_MISMATCH"
  );
});

test("tension indéterminée : CalculationError si aucun consommateur du circuit n'a de tension connue", () => {
  assert.throws(
    () =>
      computeCircuitEngineOutput({ circuits: [circuitDef({ name: "Frigo", consumerNames: ["Frigo"] })] }, [
        consumer({ name: "Frigo", voltageV: null }),
      ]),
    (error: unknown) => error instanceof CalculationError && error.code === "CIRCUIT_VOLTAGE_INDETERMINATE"
  );
});

// ── Données incohérentes / structure ────────────────────────────────

test("données incohérentes : un consommateur ne peut pas appartenir à deux circuits", () => {
  assert.throws(
    () =>
      computeCircuitEngineOutput(
        {
          circuits: [
            circuitDef({ name: "Frigo", consumerNames: ["Frigo"] }),
            circuitDef({ name: "Pompe", consumerNames: ["Frigo"] }),
          ],
        },
        [consumer({ name: "Frigo" })]
      ),
    (error: unknown) =>
      error instanceof ValidationError && error.code === "CIRCUIT_CONSUMER_DUPLICATE_ASSIGNMENT"
  );
});

test("noms de circuit dupliqués (même identifiant dérivé) : ValidationError", () => {
  assert.throws(
    () =>
      computeCircuitEngineOutput(
        {
          circuits: [
            circuitDef({ name: "Frigo", consumerNames: ["Frigo"] }),
            circuitDef({ name: "Frigo", consumerNames: ["Pompe"] }),
          ],
        },
        [consumer({ name: "Frigo" }), consumer({ name: "Pompe" })]
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "CIRCUIT_DUPLICATE_ID"
  );
});

test("nom de circuit sans caractère alphanumérique : ValidationError", () => {
  assert.throws(
    () =>
      computeCircuitEngineOutput(
        { circuits: [circuitDef({ name: "!!!", consumerNames: ["Frigo"] })] },
        [consumer({ name: "Frigo" })]
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "CIRCUIT_INVALID_VALUE"
  );
});

test("circuits absent du payload : ValidationError", () => {
  assert.throws(
    () => computeCircuitEngineOutput({} as never, []),
    (error: unknown) => error instanceof ValidationError && error.code === "CIRCUITS_MISSING"
  );
});

test("aucun circuit défini : liste vide, sans erreur", () => {
  const { circuits } = computeCircuitEngineOutput({ circuits: [] }, [consumer({ name: "Frigo" })]);

  assert.deepEqual(circuits, []);
});

// ── Type de circuit / non-recalcul ──────────────────────────────────

test("type de circuit optionnel : conservé lorsqu'il est fourni, null sinon", () => {
  const { circuits } = computeCircuitEngineOutput(
    {
      circuits: [
        circuitDef({ name: "Frigo", consumerNames: ["Frigo"], circuitType: "confort" }),
        circuitDef({ name: "Pompe", consumerNames: ["Pompe"] }),
      ],
    },
    [consumer({ name: "Frigo" }), consumer({ name: "Pompe" })]
  );

  assert.equal(circuits.find((c) => c.id === "frigo")?.circuitType, "confort");
  assert.equal(circuits.find((c) => c.id === "pompe")?.circuitType, null);
});

test("les grandeurs des consommateurs sont reprises telles quelles, jamais recalculées", () => {
  const { circuits } = computeCircuitEngineOutput(
    { circuits: [circuitDef({ name: "Frigo", consumerNames: ["Frigo"] })] },
    [consumer({ name: "Frigo", totalPowerW: 77.7, totalCurrentA: 6.475, voltageV: 12 })]
  );

  assert.equal(circuits[0]?.cumulatedPowerW, 77.7);
  assert.equal(circuits[0]?.cumulatedCurrentA, 6.475);
});

import assert from "node:assert/strict";
import test from "node:test";
import { CalculationError, ValidationError } from "@/lib/engines/errors";
import { computeDiagramEngineOutput } from "@/lib/engines/diagram-engine";

function circuitRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "frigo",
    name: "Frigo",
    circuitType: null,
    consumerNames: ["Frigo"],
    cumulatedPowerW: 60,
    cumulatedCurrentA: 5,
    voltageV: 12,
    ...overrides,
  };
}

function cableRecord(overrides: Record<string, unknown> = {}) {
  return {
    circuitId: "frigo",
    electricalLengthM: 6,
    retainedSectionMm2: 2.5,
    computedVoltageDropPercentage: 2.1,
    ...overrides,
  };
}

function protectionRecord(overrides: Record<string, unknown> = {}) {
  return {
    circuitId: "frigo",
    protectionType: "fusible",
    retainedRatingA: 5,
    marginRatio: 1,
    ...overrides,
  };
}

// ── Un seul circuit ──────────────────────────────────────────────────

test("un seul circuit : assemble correctement le modèle de diagramme", () => {
  const { circuits } = computeDiagramEngineOutput(
    { circuits: [{ circuitId: "frigo" }] },
    { frigo: circuitRecord() },
    { frigo: cableRecord() },
    { frigo: protectionRecord() }
  );

  assert.equal(circuits.length, 1);
  assert.equal(circuits[0]?.circuitId, "frigo");
  assert.equal(circuits[0]?.circuit.name, "Frigo");
  assert.deepEqual(circuits[0]?.circuit.consumerNames, ["Frigo"]);
  assert.equal(circuits[0]?.cable.retainedSectionMm2, 2.5);
  assert.equal(circuits[0]?.protection.retainedRatingA, 5);
});

// ── Plusieurs circuits ──────────────────────────────────────────────

test("plusieurs circuits : chacun assemblé indépendamment", () => {
  const { circuits } = computeDiagramEngineOutput(
    { circuits: [{ circuitId: "frigo" }, { circuitId: "pompe" }] },
    {
      frigo: circuitRecord(),
      pompe: circuitRecord({ id: "pompe", name: "Pompe", consumerNames: ["Pompe"] }),
    },
    {
      frigo: cableRecord(),
      pompe: cableRecord({ circuitId: "pompe", retainedSectionMm2: 4 }),
    },
    {
      frigo: protectionRecord(),
      pompe: protectionRecord({ circuitId: "pompe", retainedRatingA: 15 }),
    }
  );

  assert.equal(circuits.length, 2);
  const frigo = circuits.find((c) => c.circuitId === "frigo");
  const pompe = circuits.find((c) => c.circuitId === "pompe");
  assert.equal(frigo?.cable.retainedSectionMm2, 2.5);
  assert.equal(pompe?.cable.retainedSectionMm2, 4);
  assert.equal(pompe?.protection.retainedRatingA, 15);
});

// ── Données complètes ────────────────────────────────────────────────

test("données complètes : le modèle reprend toutes les grandeurs utiles à l'affichage", () => {
  const { circuits } = computeDiagramEngineOutput(
    { circuits: [{ circuitId: "frigo" }] },
    { frigo: circuitRecord({ circuitType: "confort" }) },
    { frigo: cableRecord() },
    { frigo: protectionRecord() }
  );

  const circuit = circuits[0]!;
  assert.deepEqual(circuit.circuit, {
    name: "Frigo",
    circuitType: "confort",
    consumerNames: ["Frigo"],
    cumulatedPowerW: 60,
    cumulatedCurrentA: 5,
    voltageV: 12,
  });
  assert.deepEqual(circuit.cable, {
    electricalLengthM: 6,
    retainedSectionMm2: 2.5,
    computedVoltageDropPercentage: 2.1,
  });
  assert.deepEqual(circuit.protection, {
    protectionType: "fusible",
    retainedRatingA: 5,
    marginRatio: 1,
  });
});

// ── Circuit / câble / protection absent ──────────────────────────────

test("circuit absent : DependencyError si aucune donnée circuit n'est fournie pour le circuitId", () => {
  assert.throws(
    () =>
      computeDiagramEngineOutput(
        { circuits: [{ circuitId: "inconnu" }] },
        {},
        { inconnu: cableRecord({ circuitId: "inconnu" }) },
        { inconnu: protectionRecord({ circuitId: "inconnu" }) }
      ),
    (error: unknown) => (error as { code?: string }).code === "CIRCUIT_DATA_MISSING"
  );
});

test("câble absent : DependencyError si aucune donnée cable n'est fournie pour le circuitId", () => {
  assert.throws(
    () =>
      computeDiagramEngineOutput(
        { circuits: [{ circuitId: "frigo" }] },
        { frigo: circuitRecord() },
        {},
        { frigo: protectionRecord() }
      ),
    (error: unknown) => (error as { code?: string }).code === "CABLE_DATA_MISSING"
  );
});

test("protection absente : DependencyError si aucune donnée protection n'est fournie pour le circuitId", () => {
  assert.throws(
    () =>
      computeDiagramEngineOutput(
        { circuits: [{ circuitId: "frigo" }] },
        { frigo: circuitRecord() },
        { frigo: cableRecord() },
        {}
      ),
    (error: unknown) => (error as { code?: string }).code === "PROTECTION_DATA_MISSING"
  );
});

// ── Modèle impossible à construire ───────────────────────────────────

test("données incohérentes entre sources : CalculationError, modèle impossible à construire", () => {
  assert.throws(
    () =>
      computeDiagramEngineOutput(
        { circuits: [{ circuitId: "frigo" }] },
        { frigo: circuitRecord() },
        { frigo: cableRecord({ circuitId: "autre-circuit" }) },
        { frigo: protectionRecord() }
      ),
    (error: unknown) => error instanceof CalculationError && error.code === "DIAGRAM_MODEL_IMPOSSIBLE"
  );
});

// ── Paramètres / structure invalides ─────────────────────────────────

test("circuitId manquant : ValidationError", () => {
  assert.throws(
    () => computeDiagramEngineOutput({ circuits: [{ circuitId: "" }] }, {}, {}, {}),
    (error: unknown) => error instanceof ValidationError && error.code === "DIAGRAM_PARAMETER_MISSING"
  );
});

test("circuitId dupliqué : ValidationError", () => {
  assert.throws(
    () =>
      computeDiagramEngineOutput(
        { circuits: [{ circuitId: "frigo" }, { circuitId: "frigo" }] },
        { frigo: circuitRecord() },
        { frigo: cableRecord() },
        { frigo: protectionRecord() }
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "DIAGRAM_DUPLICATE_CIRCUIT"
  );
});

test("circuits absent du payload : ValidationError", () => {
  assert.throws(
    () => computeDiagramEngineOutput({} as never, {}, {}, {}),
    (error: unknown) => error instanceof ValidationError && error.code === "CIRCUITS_MISSING"
  );
});

// ── Modèle produit ────────────────────────────────────────────────────

test("aucun circuit demandé : modèle vide, sans erreur", () => {
  const { circuits } = computeDiagramEngineOutput({ circuits: [] }, {}, {}, {});

  assert.deepEqual(circuits, []);
});

test("le moteur n'effectue aucun calcul : les grandeurs sont reprises telles quelles", () => {
  const { circuits } = computeDiagramEngineOutput(
    { circuits: [{ circuitId: "frigo" }] },
    { frigo: circuitRecord({ cumulatedPowerW: 77.7, cumulatedCurrentA: 6.475 }) },
    { frigo: cableRecord({ retainedSectionMm2: 2.5, computedVoltageDropPercentage: 1.9 }) },
    { frigo: protectionRecord({ retainedRatingA: 10, marginRatio: 2 }) }
  );

  assert.equal(circuits[0]?.circuit.cumulatedPowerW, 77.7);
  assert.equal(circuits[0]?.circuit.cumulatedCurrentA, 6.475);
  assert.equal(circuits[0]?.cable.retainedSectionMm2, 2.5);
  assert.equal(circuits[0]?.protection.retainedRatingA, 10);
  assert.equal(circuits[0]?.protection.marginRatio, 2);
});

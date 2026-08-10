import assert from "node:assert/strict";
import test from "node:test";
import { CalculationError, ValidationError } from "@/lib/engines/errors";
import {
  computeProtectionEngineOutput,
  type ProtectionCatalogEntry,
  type ProtectionDefinitionInput,
} from "@/lib/engines/protection-engine";

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

function cable(retainedSectionMm2 = 2.5) {
  return { retainedSectionMm2 };
}

const STANDARD_CATALOG: ProtectionCatalogEntry[] = [
  { type: "fusible", ratingA: 5 },
  { type: "fusible", ratingA: 10 },
  { type: "disjoncteur", ratingA: 15 },
  { type: "disjoncteur", ratingA: 20 },
  { type: "disjoncteur", ratingA: 30 },
];

function protectionDef(overrides: Partial<ProtectionDefinitionInput> = {}): ProtectionDefinitionInput {
  return {
    circuitId: overrides.circuitId ?? "frigo",
    minMarginRatio: overrides.minMarginRatio ?? 1,
    maxMarginRatio: overrides.maxMarginRatio ?? 2,
    catalog: overrides.catalog ?? STANDARD_CATALOG,
  };
}

// ── Un seul circuit ──────────────────────────────────────────────────

test("un seul circuit : sélectionne correctement une protection compatible", () => {
  const { protections } = computeProtectionEngineOutput(
    { protections: [protectionDef({ circuitId: "frigo" })] },
    { frigo: circuit({ cumulatedCurrentA: 5, voltageV: 12 }) },
    { frigo: cable(2.5) }
  );

  assert.equal(protections.length, 1);
  assert.equal(protections[0]?.circuitId, "frigo");
  assert.equal(protections[0]?.referenceCurrentA, 5);
  assert.equal(protections[0]?.cableSectionMm2, 2.5);
  assert.equal(protections[0]?.retainedRatingA, 5);
  assert.equal(protections[0]?.protectionType, "fusible");
});

// ── Plusieurs circuits ──────────────────────────────────────────────

test("plusieurs circuits : chacun protégé indépendamment", () => {
  const { protections } = computeProtectionEngineOutput(
    {
      protections: [
        protectionDef({ circuitId: "frigo" }),
        protectionDef({ circuitId: "pompe" }),
      ],
    },
    {
      frigo: circuit({ cumulatedCurrentA: 5, voltageV: 12 }),
      pompe: circuit({ cumulatedCurrentA: 12, voltageV: 12 }),
    },
    { frigo: cable(2.5), pompe: cable(4) }
  );

  assert.equal(protections.length, 2);
  const frigo = protections.find((p) => p.circuitId === "frigo");
  const pompe = protections.find((p) => p.circuitId === "pompe");
  assert.equal(frigo?.retainedRatingA, 5);
  assert.equal(pompe?.retainedRatingA, 15);
});

// ── Petit calibre / gros calibre ─────────────────────────────────────

test("petit calibre : un courant faible sélectionne le plus petit calibre compatible", () => {
  const { protections } = computeProtectionEngineOutput(
    { protections: [protectionDef({ circuitId: "c", minMarginRatio: 1, maxMarginRatio: 5 })] },
    { c: circuit({ cumulatedCurrentA: 1, voltageV: 12 }) },
    { c: cable() }
  );

  assert.equal(protections[0]?.retainedRatingA, 5);
});

test("gros calibre : un courant élevé sélectionne un calibre plus important", () => {
  const { protections } = computeProtectionEngineOutput(
    { protections: [protectionDef({ circuitId: "c", minMarginRatio: 1, maxMarginRatio: 1.5 })] },
    { c: circuit({ cumulatedCurrentA: 25, voltageV: 12 }) },
    { c: cable() }
  );

  assert.equal(protections[0]?.retainedRatingA, 30);
});

// ── Marge faible / élevée ─────────────────────────────────────────────

test("marge faible : marginRatio proche de 1 lorsque minMarginRatio/maxMarginRatio sont serrés", () => {
  const { protections } = computeProtectionEngineOutput(
    { protections: [protectionDef({ circuitId: "c", minMarginRatio: 1, maxMarginRatio: 1.1 })] },
    { c: circuit({ cumulatedCurrentA: 10, voltageV: 12 }) },
    { c: cable() }
  );

  assert.equal(protections[0]?.retainedRatingA, 10);
  assert.ok(protections[0]!.marginRatio <= 1.1);
});

test("marge élevée : une fourchette large peut sélectionner un calibre bien supérieur au courant nominal", () => {
  const { protections } = computeProtectionEngineOutput(
    { protections: [protectionDef({ circuitId: "c", minMarginRatio: 1, maxMarginRatio: 6 })] },
    { c: circuit({ cumulatedCurrentA: 3, voltageV: 12 }) },
    { c: cable() }
  );

  // Le plus petit calibre compatible dans [3, 18] reste retenu (5A).
  assert.equal(protections[0]?.retainedRatingA, 5);
  assert.ok(protections[0]!.marginRatio > 1);
});

// ── Aucune protection compatible ─────────────────────────────────────

test("aucune protection compatible : CalculationError si aucun calibre du catalogue n'entre dans la fourchette", () => {
  assert.throws(
    () =>
      computeProtectionEngineOutput(
        {
          protections: [
            protectionDef({
              circuitId: "c",
              minMarginRatio: 1,
              maxMarginRatio: 1.05,
              catalog: [{ type: "fusible", ratingA: 100 }],
            }),
          ],
        },
        { c: circuit({ cumulatedCurrentA: 5, voltageV: 12 }) },
        { c: cable() }
      ),
    (error: unknown) => error instanceof CalculationError && error.code === "PROTECTION_NO_COMPATIBLE_DEVICE"
  );
});

// ── Circuit absent / câble absent ────────────────────────────────────

test("circuit absent : DependencyError si aucune donnée circuit n'est fournie pour le circuitId", () => {
  assert.throws(
    () => computeProtectionEngineOutput({ protections: [protectionDef({ circuitId: "inconnu" })] }, {}, { inconnu: cable() }),
    (error: unknown) => (error as { code?: string }).code === "CIRCUIT_DATA_MISSING"
  );
});

test("câble absent : DependencyError si aucune donnée cable n'est fournie pour le circuitId", () => {
  assert.throws(
    () =>
      computeProtectionEngineOutput(
        { protections: [protectionDef({ circuitId: "c" })] },
        { c: circuit() },
        {}
      ),
    (error: unknown) => (error as { code?: string }).code === "CABLE_DATA_MISSING"
  );
});

// ── Paramètres invalides ─────────────────────────────────────────────

test("circuitId manquant : ValidationError", () => {
  assert.throws(
    () => computeProtectionEngineOutput({ protections: [{ ...protectionDef(), circuitId: "" }] }, { c: circuit() }, { c: cable() }),
    (error: unknown) => error instanceof ValidationError && error.code === "PROTECTION_PARAMETER_MISSING"
  );
});

test("circuitId dupliqué : ValidationError", () => {
  assert.throws(
    () =>
      computeProtectionEngineOutput(
        { protections: [protectionDef({ circuitId: "frigo" }), protectionDef({ circuitId: "frigo" })] },
        { frigo: circuit() },
        { frigo: cable() }
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "PROTECTION_DUPLICATE_CIRCUIT"
  );
});

test("minMarginRatio invalide : ValidationError si <= 0", () => {
  assert.throws(
    () =>
      computeProtectionEngineOutput(
        { protections: [protectionDef({ circuitId: "c", minMarginRatio: 0 })] },
        { c: circuit() },
        { c: cable() }
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "PROTECTION_MARGIN_INVALID"
  );
});

test("maxMarginRatio inférieur à minMarginRatio : ValidationError", () => {
  assert.throws(
    () =>
      computeProtectionEngineOutput(
        { protections: [protectionDef({ circuitId: "c", minMarginRatio: 2, maxMarginRatio: 1 })] },
        { c: circuit() },
        { c: cable() }
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "PROTECTION_MARGIN_INVALID"
  );
});

test("catalogue absent : ValidationError", () => {
  assert.throws(
    () =>
      computeProtectionEngineOutput(
        { protections: [protectionDef({ circuitId: "c", catalog: [] })] },
        { c: circuit() },
        { c: cable() }
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "PROTECTION_CATALOG_MISSING"
  );
});

test("catalogue invalide : ValidationError si une entrée est mal formée", () => {
  assert.throws(
    () =>
      computeProtectionEngineOutput(
        {
          protections: [
            protectionDef({ circuitId: "c", catalog: [{ type: "fusible", ratingA: -5 }] }),
          ],
        },
        { c: circuit() },
        { c: cable() }
      ),
    (error: unknown) => error instanceof ValidationError && error.code === "PROTECTION_CATALOG_INVALID"
  );
});

test("protections absent du payload : ValidationError", () => {
  assert.throws(
    () => computeProtectionEngineOutput({} as never, {}, {}),
    (error: unknown) => error instanceof ValidationError && error.code === "PROTECTIONS_MISSING"
  );
});

// ── Non-recalcul ──────────────────────────────────────────────────────

test("le courant nominal est dérivé du circuit, jamais recalculé depuis le câble", () => {
  const { protections } = computeProtectionEngineOutput(
    { protections: [protectionDef({ circuitId: "c" })] },
    { c: circuit({ cumulatedCurrentA: null, cumulatedPowerW: 120, voltageV: 12 }) },
    { c: cable(4) }
  );

  assert.equal(protections[0]?.referenceCurrentA, 10);
  assert.equal(protections[0]?.cableSectionMm2, 4);
});

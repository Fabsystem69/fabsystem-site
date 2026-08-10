import { CalculationError, DependencyError, ValidationError } from "@/lib/engines/errors";
import type {
  BaseEngine,
  EngineContext,
  EngineDependencyProposal,
  EngineResult,
  EngineRetainedValueProposal,
} from "@/lib/engines/types";

// Phase 4.9 (MASTER-11) : huitième moteur métier, construit exclusivement
// sur le socle de la Phase 4.0. Choisit uniquement la protection adaptée à
// chaque circuit déjà construit par le Circuit Engine (Phase 4.7/4.7.1) et
// dimensionné par le Cable Engine (Phase 4.8) — jamais de recalcul de
// section de câble, jamais de modification de circuit, jamais de schéma.
// Ne connaît aucune table normative : le catalogue des protections
// disponibles et les règles de marge admissible sont entièrement fournis
// par l'appelant, circuit par circuit.

export const PROTECTION_ENGINE_ID = "protection.selection";

/** Un dispositif de protection disponible, fourni par l'appelant — jamais
 * une table normative codée en dur dans le moteur. */
export type ProtectionCatalogEntry = {
  /** Type libre du dispositif (ex. "fusible", "disjoncteur"...). Aucune
   * liste fermée n'est imposée ici. */
  type: string;
  /** Calibre du dispositif, en Ampères. */
  ratingA: number;
};

export type ProtectionDefinitionInput = {
  /** Identifiant du circuit à protéger — doit correspondre à un
   * circuit.<id> déjà produit par le Circuit Engine. */
  circuitId: string;
  /** Marge minimale admissible au-dessus du courant nominal du circuit
   * (calibre ≥ referenceCurrentA × minMarginRatio) : limite métier, jamais
   * déduite par le moteur. */
  minMarginRatio: number;
  /** Marge maximale admissible au-dessus du courant nominal du circuit
   * (calibre ≤ referenceCurrentA × maxMarginRatio) : limite métier, jamais
   * déduite par le moteur. */
  maxMarginRatio: number;
  /** Catalogue des dispositifs de protection disponibles pour ce circuit. */
  catalog: ProtectionCatalogEntry[];
};

export type ProtectionEngineInput = {
  protections: ProtectionDefinitionInput[];
};

export type ProtectionComputation = {
  circuitId: string;
  /** Courant nominal de protection (A) : courant du circuit à protéger,
   * repris de circuit.<id>.cumulatedCurrentA si connu, sinon dérivé de
   * cumulatedPowerW / voltageV — jamais recalculé depuis energy.*. */
  referenceCurrentA: number;
  /** Section du câble déjà retenue pour ce circuit (mm²), reprise telle
   * quelle depuis cable.<id> — jamais recalculée. */
  cableSectionMm2: number;
  /** Type du dispositif retenu, tel que porté par l'entrée de catalogue
   * choisie. */
  protectionType: string;
  /** Calibre retenu (A), issu du catalogue fourni. */
  retainedRatingA: number;
  minMarginRatio: number;
  maxMarginRatio: number;
  /** Marge de protection réellement obtenue : retainedRatingA / referenceCurrentA. */
  marginRatio: number;
};

export type ProtectionEngineOutput = {
  protections: ProtectionComputation[];
};

type CircuitRecord = {
  cumulatedPowerW: number;
  cumulatedCurrentA: number | null;
  voltageV: number;
};

type CableRecord = {
  retainedSectionMm2: number;
};

function hasNumberField(value: unknown, field: string): boolean {
  return typeof value === "object" && value !== null && typeof (value as Record<string, unknown>)[field] === "number";
}

function hasNullableNumberField(value: unknown, field: string): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return record[field] === null || typeof record[field] === "number";
}

function parseCircuitRecord(raw: unknown, circuitKey: string): CircuitRecord {
  if (
    !hasNumberField(raw, "cumulatedPowerW") ||
    !hasNullableNumberField(raw, "cumulatedCurrentA") ||
    !hasNumberField(raw, "voltageV")
  ) {
    throw new DependencyError(
      `"${circuitKey}" has an unexpected shape and cannot be used by the Protection Engine`,
      { code: "CIRCUIT_DATA_INCOMPATIBLE", details: { key: circuitKey, raw } }
    );
  }

  const record = raw as Record<string, unknown>;
  return {
    cumulatedPowerW: record.cumulatedPowerW as number,
    cumulatedCurrentA: record.cumulatedCurrentA as number | null,
    voltageV: record.voltageV as number,
  };
}

function parseCableRecord(raw: unknown, cableKey: string): CableRecord {
  if (!hasNumberField(raw, "retainedSectionMm2")) {
    throw new DependencyError(
      `"${cableKey}" has an unexpected shape and cannot be used by the Protection Engine`,
      { code: "CABLE_DATA_INCOMPATIBLE", details: { key: cableKey, raw } }
    );
  }

  const record = raw as Record<string, unknown>;
  return { retainedSectionMm2: record.retainedSectionMm2 as number };
}

/**
 * Lit exclusivement une valeur retenue circuit.<id> via EngineContext. Ne
 * recalcule jamais le Circuit Engine : absente ou obsolète → DependencyError.
 */
async function readCircuitRecord(context: EngineContext, circuitId: string): Promise<CircuitRecord> {
  const key = `circuit.${circuitId}`;
  const record = await context.getRetainedValue(key);

  if (!record) {
    throw new DependencyError(
      `No "${key}" retained value found for this Project — run the Circuit Engine before the Protection Engine`,
      { code: "CIRCUIT_DATA_MISSING", details: { key } }
    );
  }

  if (record.status !== "ACTIVE") {
    throw new DependencyError(
      `"${key}" is not ACTIVE (status: ${record.status}) — recompute the Circuit Engine before selecting protections`,
      { code: "CIRCUIT_DATA_OBSOLETE", details: { key, status: record.status } }
    );
  }

  return parseCircuitRecord(record.value, key);
}

/**
 * Lit exclusivement une valeur retenue cable.<id> via EngineContext. Ne
 * recalcule jamais le Cable Engine : absente ou obsolète → DependencyError.
 */
async function readCableRecord(context: EngineContext, circuitId: string): Promise<CableRecord> {
  const key = `cable.${circuitId}`;
  const record = await context.getRetainedValue(key);

  if (!record) {
    throw new DependencyError(
      `No "${key}" retained value found for this Project — run the Cable Engine before the Protection Engine`,
      { code: "CABLE_DATA_MISSING", details: { key } }
    );
  }

  if (record.status !== "ACTIVE") {
    throw new DependencyError(
      `"${key}" is not ACTIVE (status: ${record.status}) — recompute the Cable Engine before selecting protections`,
      { code: "CABLE_DATA_OBSOLETE", details: { key, status: record.status } }
    );
  }

  return parseCableRecord(record.value, key);
}

function assertFiniteNumber(value: unknown, field: string, code: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ValidationError(`${field} must be a finite number`, {
      code,
      details: { field, value },
    });
  }
}

function assertRequired(value: unknown, field: string) {
  if (typeof value === "undefined") {
    throw new ValidationError(`${field} is a required protection parameter`, {
      code: "PROTECTION_PARAMETER_MISSING",
      details: { field },
    });
  }
}

function isValidCatalogEntry(entry: unknown): entry is ProtectionCatalogEntry {
  return (
    typeof entry === "object" &&
    entry !== null &&
    typeof (entry as Record<string, unknown>).type === "string" &&
    ((entry as Record<string, unknown>).type as string).trim().length > 0 &&
    typeof (entry as Record<string, unknown>).ratingA === "number" &&
    Number.isFinite((entry as Record<string, unknown>).ratingA) &&
    ((entry as Record<string, unknown>).ratingA as number) > 0
  );
}

type ResolvedProtectionDefinition = ProtectionDefinitionInput;

/**
 * Valide la structure et les paramètres propres du moteur (identifiant de
 * circuit, marges admissibles, catalogue). Ne touche jamais aux données
 * circuit.* et cable.* — celles-ci sont lues séparément.
 */
function validateProtectionDefinitions(input: ProtectionEngineInput): ResolvedProtectionDefinition[] {
  if (!input || !Array.isArray(input.protections)) {
    throw new ValidationError("protections must be an array", { code: "PROTECTIONS_MISSING" });
  }

  const seenCircuitIds = new Set<string>();

  return input.protections.map((protection, index) => {
    if (!protection || typeof protection.circuitId !== "string" || !protection.circuitId.trim()) {
      throw new ValidationError(`Protection at index ${index} is missing a circuitId`, {
        code: "PROTECTION_PARAMETER_MISSING",
        details: { index, field: "circuitId" },
      });
    }

    if (seenCircuitIds.has(protection.circuitId)) {
      throw new ValidationError(
        `Duplicate circuitId "${protection.circuitId}": a circuit can only be protected once`,
        { code: "PROTECTION_DUPLICATE_CIRCUIT", details: { circuitId: protection.circuitId } }
      );
    }
    seenCircuitIds.add(protection.circuitId);

    assertRequired(protection.minMarginRatio, "minMarginRatio");
    assertFiniteNumber(protection.minMarginRatio, "minMarginRatio", "PROTECTION_MARGIN_INVALID");
    if (protection.minMarginRatio <= 0) {
      throw new ValidationError("minMarginRatio must be greater than zero", {
        code: "PROTECTION_MARGIN_INVALID",
        details: { circuitId: protection.circuitId, field: "minMarginRatio", value: protection.minMarginRatio },
      });
    }

    assertRequired(protection.maxMarginRatio, "maxMarginRatio");
    assertFiniteNumber(protection.maxMarginRatio, "maxMarginRatio", "PROTECTION_MARGIN_INVALID");
    if (protection.maxMarginRatio <= 0) {
      throw new ValidationError("maxMarginRatio must be greater than zero", {
        code: "PROTECTION_MARGIN_INVALID",
        details: { circuitId: protection.circuitId, field: "maxMarginRatio", value: protection.maxMarginRatio },
      });
    }

    if (protection.maxMarginRatio < protection.minMarginRatio) {
      throw new ValidationError("maxMarginRatio must be greater than or equal to minMarginRatio", {
        code: "PROTECTION_MARGIN_INVALID",
        details: {
          circuitId: protection.circuitId,
          minMarginRatio: protection.minMarginRatio,
          maxMarginRatio: protection.maxMarginRatio,
        },
      });
    }

    assertRequired(protection.catalog, "catalog");
    if (!Array.isArray(protection.catalog) || protection.catalog.length === 0) {
      throw new ValidationError("catalog must be a non-empty array of protection devices", {
        code: "PROTECTION_CATALOG_MISSING",
        details: { circuitId: protection.circuitId },
      });
    }

    if (!protection.catalog.every(isValidCatalogEntry)) {
      throw new ValidationError("catalog contains an invalid protection device entry", {
        code: "PROTECTION_CATALOG_INVALID",
        details: { circuitId: protection.circuitId, catalog: protection.catalog },
      });
    }

    return protection;
  });
}

/**
 * Fonction pure : sélectionne la protection de chaque circuit à partir des
 * définitions fournies et des circuits/câbles déjà connus (circuit.*,
 * cable.*, jamais recalculés). Ne touche jamais EngineContext ni aucune
 * base de données — testable indépendamment.
 *
 * Algorithme (aucune table normative, aucun calibre imposé — tous les
 * paramètres proviennent de `ProtectionDefinitionInput` ou de
 * circuit.<id>/cable.<id>) :
 *
 * 1. Courant nominal de protection (A) :
 *    referenceCurrentA = circuit.cumulatedCurrentA si connu,
 *                         sinon circuit.cumulatedPowerW / circuit.voltageV
 *
 * 2. Bornes de marge admissible (A) :
 *    minA = referenceCurrentA × minMarginRatio
 *    maxA = referenceCurrentA × maxMarginRatio
 *
 * 3. Candidats compatibles : entrées du catalogue dont ratingA ∈ [minA, maxA].
 *
 * 4. Calibre retenu : le plus petit calibre compatible (minimise la marge
 *    réelle plutôt que de sur-dimensionner arbitrairement). Aucun candidat
 *    compatible → calcul impossible.
 *
 * 5. Marge de protection réellement obtenue :
 *    marginRatio = retainedRatingA / referenceCurrentA
 */
export function computeProtectionEngineOutput(
  input: ProtectionEngineInput,
  circuits: Record<string, CircuitRecord>,
  cables: Record<string, CableRecord>
): ProtectionEngineOutput {
  const resolvedDefinitions = validateProtectionDefinitions(input);

  const protections: ProtectionComputation[] = resolvedDefinitions.map((definition) => {
    const circuit = circuits[definition.circuitId];

    // Circuit absent : la définition référence un circuitId sans donnée
    // circuit.* correspondante déjà résolue (cas normalement écarté en
    // amont par createProtectionEngine, mais vérifié ici pour garder la
    // fonction pure sûre indépendamment de son appelant).
    if (!circuit) {
      throw new DependencyError(`No circuit data available for circuitId "${definition.circuitId}"`, {
        code: "CIRCUIT_DATA_MISSING",
        details: { circuitId: definition.circuitId },
      });
    }

    const cable = cables[definition.circuitId];

    // Câble absent : idem, la définition référence un circuitId sans
    // donnée cable.* correspondante déjà résolue.
    if (!cable) {
      throw new DependencyError(`No cable data available for circuitId "${definition.circuitId}"`, {
        code: "CABLE_DATA_MISSING",
        details: { circuitId: definition.circuitId },
      });
    }

    // Courant nominal de protection : repris du circuit si connu, sinon
    // dérivé de la puissance cumulée et de la tension du circuit — jamais
    // depuis le câble, dont ce moteur ne recalcule jamais le dimensionnement.
    const referenceCurrentA =
      circuit.cumulatedCurrentA !== null ? circuit.cumulatedCurrentA : circuit.cumulatedPowerW / circuit.voltageV;

    if (!Number.isFinite(referenceCurrentA) || referenceCurrentA < 0) {
      throw new CalculationError(
        `Reference current for circuit "${definition.circuitId}" cannot be determined`,
        { code: "PROTECTION_CURRENT_INDETERMINATE", details: { circuitId: definition.circuitId } }
      );
    }

    const minA = referenceCurrentA * definition.minMarginRatio;
    const maxA = referenceCurrentA * definition.maxMarginRatio;

    const compatibleDevices = definition.catalog
      .filter((device) => device.ratingA >= minA && device.ratingA <= maxA)
      .sort((a, b) => a.ratingA - b.ratingA);

    // Calcul impossible : aucun dispositif du catalogue fourni ne se situe
    // dans la fourchette de marge admissible pour ce circuit.
    if (compatibleDevices.length === 0) {
      throw new CalculationError(
        `No compatible protection device found for circuit "${definition.circuitId}" (required range: [${minA}, ${maxA}] A)`,
        {
          code: "PROTECTION_NO_COMPATIBLE_DEVICE",
          details: { circuitId: definition.circuitId, minA, maxA, catalog: definition.catalog },
        }
      );
    }

    const retainedDevice = compatibleDevices[0]!;

    return {
      circuitId: definition.circuitId,
      referenceCurrentA,
      cableSectionMm2: cable.retainedSectionMm2,
      protectionType: retainedDevice.type,
      retainedRatingA: retainedDevice.ratingA,
      minMarginRatio: definition.minMarginRatio,
      maxMarginRatio: definition.maxMarginRatio,
      marginRatio: retainedDevice.ratingA / referenceCurrentA,
    };
  });

  return { protections };
}

/**
 * ProtectionEngine : implémentation de BaseEngine. Ne dépend d'aucun code
 * du Circuit Engine ni du Cable Engine (lit uniquement circuit.* et
 * cable.*, déjà persistés), ne recalcule aucune section de câble, ne
 * modifie aucun circuit, ne construit aucun schéma.
 */
export function createProtectionEngine(): BaseEngine<ProtectionEngineInput, ProtectionEngineOutput> {
  return {
    id: PROTECTION_ENGINE_ID,

    async run(
      context: EngineContext,
      input: ProtectionEngineInput
    ): Promise<EngineResult<ProtectionEngineOutput>> {
      const resolvedDefinitions = validateProtectionDefinitions(input);

      const circuits: Record<string, CircuitRecord> = {};
      const cables: Record<string, CableRecord> = {};
      for (const definition of resolvedDefinitions) {
        circuits[definition.circuitId] = await readCircuitRecord(context, definition.circuitId);
        cables[definition.circuitId] = await readCableRecord(context, definition.circuitId);
      }

      const output = computeProtectionEngineOutput(input, circuits, cables);

      // Une clé protection.<circuitId> par circuit protégé : même
      // convention que circuit.<id> et cable.<circuitId> — un nombre
      // variable d'objets, chacun individuellement adressable et
      // propageable.
      const retainedValues: EngineRetainedValueProposal[] = output.protections.map((protection) => ({
        key: `protection.${protection.circuitId}`,
        value: protection,
        simulatedValue: protection,
      }));

      // Chaque protection.<circuitId> dépend uniquement de circuit.<circuitId>
      // et cable.<circuitId>, les deux seules sources réellement lues —
      // jamais de diagram.* ni de Volta.
      const dependencies: EngineDependencyProposal[] = output.protections.flatMap((protection) => [
        { dependentKey: `protection.${protection.circuitId}`, dependsOnKey: `circuit.${protection.circuitId}` },
        { dependentKey: `protection.${protection.circuitId}`, dependsOnKey: `cable.${protection.circuitId}` },
      ]);

      return {
        output,
        retainedValues,
        dependencies,
        debug: { computedAt: context.now().toISOString(), protectionCount: output.protections.length },
      };
    },
  };
}

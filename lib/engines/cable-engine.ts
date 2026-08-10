import { CalculationError, DependencyError, ValidationError } from "@/lib/engines/errors";
import type {
  BaseEngine,
  EngineContext,
  EngineDependencyProposal,
  EngineResult,
  EngineRetainedValueProposal,
} from "@/lib/engines/types";

// Phase 4.8 (MASTER-11) : septième moteur métier, construit exclusivement
// sur le socle de la Phase 4.0. Dimensionne uniquement les conducteurs des
// circuits déjà construits par le Circuit Engine (Phase 4.7/4.7.1) — jamais
// de protection, jamais de schéma. Ne recalcule jamais Energy ni Circuit,
// n'appelle aucun autre moteur : il lit exclusivement circuit.* via
// EngineContext.

export const CABLE_ENGINE_ID = "cable.sizing";

// Aucune valeur métier n'est codée en dur : la longueur, la limite de
// chute de tension, la résistivité du conducteur (dépendante du matériau)
// et le catalogue des sections normalisées disponibles doivent tous être
// fournis explicitement par l'appelant, circuit par circuit.
export type CableDefinitionInput = {
  /** Identifiant du circuit à câbler — doit correspondre à un circuit.<id>
   * déjà produit par le Circuit Engine (Phase 4.7.1). */
  circuitId: string;
  /** Longueur simple (aller simple) entre la source et le consommateur, en
   * mètres. La longueur électrique utilisée pour le calcul est le double
   * (aller-retour du courant continu) — voir `electricalLengthM` en sortie. */
  oneWayLengthM: number;
  /** Chute de tension maximale admissible pour ce circuit, en pourcentage
   * de sa tension (ex. 3 pour 3 %). Limite métier/réglementaire : jamais
   * déduite par le moteur, toujours fournie par l'appelant. */
  maxVoltageDropPercentage: number;
  /** Résistivité linéique du conducteur, en Ω·mm²/m. Dépend du matériau
   * (cuivre, aluminium...) : jamais une constante figée dans le moteur. */
  conductorResistivityOhmMm2PerM: number;
  /** Catalogue des sections normalisées disponibles (mm²), utilisé pour
   * arrondir la section minimale calculée à la section immédiatement
   * supérieure réellement disponible. Ordre indifférent en entrée (trié
   * par le moteur). */
  availableSectionsMm2: number[];
};

export type CableEngineInput = {
  cables: CableDefinitionInput[];
};

export type CableComputation = {
  circuitId: string;
  /** Courant de référence (A) utilisé pour le dimensionnement : repris de
   * circuit.<id>.cumulatedCurrentA si connu, sinon dérivé de
   * cumulatedPowerW / voltageV. */
  referenceCurrentA: number;
  /** Longueur électrique utilisée (m) : 2 × oneWayLengthM (aller-retour). */
  electricalLengthM: number;
  /** Tension du circuit (V), reprise de circuit.<id>.voltageV. */
  voltageV: number;
  /** Chute de tension maximale admissible (V), dérivée de
   * maxVoltageDropPercentage × voltageV / 100. */
  maxVoltageDropV: number;
  /** Section minimale admissible (mm²), avant arrondi au catalogue. */
  minimumSectionMm2: number;
  /** Section retenue (mm²) : plus petite section du catalogue fourni
   * supérieure ou égale à la section minimale admissible. */
  retainedSectionMm2: number;
  /** Chute de tension réellement obtenue avec la section retenue (V). */
  computedVoltageDropV: number;
  /** Chute de tension réellement obtenue avec la section retenue, en
   * pourcentage de la tension du circuit. */
  computedVoltageDropPercentage: number;
};

export type CableEngineOutput = {
  cables: CableComputation[];
};

type CircuitRecord = {
  cumulatedPowerW: number;
  cumulatedCurrentA: number | null;
  voltageV: number;
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
      `"${circuitKey}" has an unexpected shape and cannot be used by the Cable Engine`,
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

/**
 * Lit exclusivement une valeur retenue circuit.<id> via EngineContext. Ne
 * recalcule jamais le Circuit Engine : absente ou obsolète → DependencyError.
 * Même patron que les moteurs précédents (cf. audit Phase 4.5.1), reproduit
 * ici faute de pouvoir modifier un fichier existant pour partager un helper
 * commun.
 */
async function readCircuitRecord(context: EngineContext, circuitId: string): Promise<CircuitRecord> {
  const key = `circuit.${circuitId}`;
  const record = await context.getRetainedValue(key);

  if (!record) {
    throw new DependencyError(
      `No "${key}" retained value found for this Project — run the Circuit Engine before the Cable Engine`,
      { code: "CIRCUIT_DATA_MISSING", details: { key } }
    );
  }

  if (record.status !== "ACTIVE") {
    throw new DependencyError(
      `"${key}" is not ACTIVE (status: ${record.status}) — recompute the Circuit Engine before sizing cables`,
      { code: "CIRCUIT_DATA_OBSOLETE", details: { key, status: record.status } }
    );
  }

  return parseCircuitRecord(record.value, key);
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
    throw new ValidationError(`${field} is a required cable parameter`, {
      code: "CABLE_PARAMETER_MISSING",
      details: { field },
    });
  }
}

type ResolvedCableDefinition = CableDefinitionInput & { sortedSections: number[] };

/**
 * Valide la structure et les paramètres propres du moteur (longueur, limite
 * de chute de tension, résistivité, catalogue de sections). Ne touche
 * jamais aux données circuit.* — celles-ci sont lues séparément.
 */
function validateCableDefinitions(input: CableEngineInput): ResolvedCableDefinition[] {
  if (!input || !Array.isArray(input.cables)) {
    throw new ValidationError("cables must be an array", { code: "CABLES_MISSING" });
  }

  const seenCircuitIds = new Set<string>();

  return input.cables.map((cable, index) => {
    if (!cable || typeof cable.circuitId !== "string" || !cable.circuitId.trim()) {
      throw new ValidationError(`Cable at index ${index} is missing a circuitId`, {
        code: "CABLE_PARAMETER_MISSING",
        details: { index, field: "circuitId" },
      });
    }

    if (seenCircuitIds.has(cable.circuitId)) {
      throw new ValidationError(`Duplicate circuitId "${cable.circuitId}": a circuit can only be cabled once`, {
        code: "CABLE_DUPLICATE_CIRCUIT",
        details: { circuitId: cable.circuitId },
      });
    }
    seenCircuitIds.add(cable.circuitId);

    assertRequired(cable.oneWayLengthM, "oneWayLengthM");
    assertFiniteNumber(cable.oneWayLengthM, "oneWayLengthM", "CABLE_LENGTH_INVALID");
    if (cable.oneWayLengthM <= 0) {
      throw new ValidationError("oneWayLengthM must be greater than zero", {
        code: "CABLE_LENGTH_INVALID",
        details: { circuitId: cable.circuitId, value: cable.oneWayLengthM },
      });
    }

    assertRequired(cable.maxVoltageDropPercentage, "maxVoltageDropPercentage");
    assertFiniteNumber(cable.maxVoltageDropPercentage, "maxVoltageDropPercentage", "CABLE_VOLTAGE_DROP_LIMIT_INVALID");
    if (cable.maxVoltageDropPercentage <= 0) {
      throw new ValidationError("maxVoltageDropPercentage must be greater than zero", {
        code: "CABLE_VOLTAGE_DROP_LIMIT_INVALID",
        details: { circuitId: cable.circuitId, value: cable.maxVoltageDropPercentage },
      });
    }

    assertRequired(cable.conductorResistivityOhmMm2PerM, "conductorResistivityOhmMm2PerM");
    assertFiniteNumber(
      cable.conductorResistivityOhmMm2PerM,
      "conductorResistivityOhmMm2PerM",
      "CABLE_RESISTIVITY_INVALID"
    );
    if (cable.conductorResistivityOhmMm2PerM <= 0) {
      throw new ValidationError("conductorResistivityOhmMm2PerM must be greater than zero", {
        code: "CABLE_RESISTIVITY_INVALID",
        details: { circuitId: cable.circuitId, value: cable.conductorResistivityOhmMm2PerM },
      });
    }

    assertRequired(cable.availableSectionsMm2, "availableSectionsMm2");
    if (
      !Array.isArray(cable.availableSectionsMm2) ||
      cable.availableSectionsMm2.length === 0 ||
      !cable.availableSectionsMm2.every((section) => typeof section === "number" && Number.isFinite(section) && section > 0)
    ) {
      throw new ValidationError("availableSectionsMm2 must be a non-empty array of positive finite numbers", {
        code: "CABLE_SECTION_CATALOG_INVALID",
        details: { circuitId: cable.circuitId, value: cable.availableSectionsMm2 },
      });
    }

    const sortedSections = [...cable.availableSectionsMm2].sort((a, b) => a - b);

    return { ...cable, sortedSections };
  });
}

/**
 * Fonction pure : dimensionne les conducteurs à partir des définitions
 * fournies et des circuits déjà connus (circuit.*, jamais recalculés). Ne
 * touche jamais EngineContext ni aucune base de données — testable
 * indépendamment.
 *
 * Formules (aucune valeur codée en dur, tous les paramètres proviennent de
 * `CableDefinitionInput` ou de circuit.<id>) :
 *
 * 1. Courant de référence (A) :
 *    referenceCurrentA = circuit.cumulatedCurrentA si connu,
 *                         sinon circuit.cumulatedPowerW / circuit.voltageV
 *
 * 2. Longueur électrique utilisée (m), aller-retour du courant continu :
 *    electricalLengthM = 2 × oneWayLengthM
 *
 * 3. Chute de tension maximale admissible (V) :
 *    maxVoltageDropV = (maxVoltageDropPercentage / 100) × voltageV
 *
 * 4. Section minimale admissible (mm²), loi d'Ohm appliquée à un
 *    conducteur de résistivité linéique donnée :
 *    minimumSectionMm2 = (electricalLengthM × referenceCurrentA × resistivity)
 *                         / maxVoltageDropV
 *
 * 5. Section retenue (mm²) : plus petite section du catalogue fourni
 *    supérieure ou égale à minimumSectionMm2.
 *
 * 6. Chute de tension réellement obtenue avec la section retenue :
 *    computedVoltageDropV = (electricalLengthM × referenceCurrentA × resistivity)
 *                            / retainedSectionMm2
 *    computedVoltageDropPercentage = (computedVoltageDropV / voltageV) × 100
 */
export function computeCableEngineOutput(
  input: CableEngineInput,
  circuits: Record<string, CircuitRecord>
): CableEngineOutput {
  const resolvedDefinitions = validateCableDefinitions(input);

  const cables: CableComputation[] = resolvedDefinitions.map((definition) => {
    const circuit = circuits[definition.circuitId];

    // Circuit absent : la définition référence un circuitId sans donnée
    // circuit.* correspondante déjà résolue (cas normalement écarté en
    // amont par createCableEngine, mais vérifié ici pour garder la
    // fonction pure sûre indépendamment de son appelant).
    if (!circuit) {
      throw new DependencyError(`No circuit data available for circuitId "${definition.circuitId}"`, {
        code: "CIRCUIT_DATA_MISSING",
        details: { circuitId: definition.circuitId },
      });
    }

    // Courant de référence : repris du circuit si connu, sinon dérivé de
    // la puissance cumulée et de la tension du circuit.
    const referenceCurrentA =
      circuit.cumulatedCurrentA !== null ? circuit.cumulatedCurrentA : circuit.cumulatedPowerW / circuit.voltageV;

    if (!Number.isFinite(referenceCurrentA) || referenceCurrentA < 0) {
      throw new CalculationError(
        `Reference current for circuit "${definition.circuitId}" cannot be determined`,
        { code: "CABLE_CURRENT_INDETERMINATE", details: { circuitId: definition.circuitId } }
      );
    }

    const electricalLengthM = 2 * definition.oneWayLengthM;
    const maxVoltageDropV = (definition.maxVoltageDropPercentage / 100) * circuit.voltageV;

    if (!Number.isFinite(maxVoltageDropV) || maxVoltageDropV <= 0) {
      throw new CalculationError(
        `Maximum voltage drop for circuit "${definition.circuitId}" cannot be determined`,
        { code: "CABLE_VOLTAGE_DROP_INDETERMINATE", details: { circuitId: definition.circuitId } }
      );
    }

    const minimumSectionMm2 =
      (electricalLengthM * referenceCurrentA * definition.conductorResistivityOhmMm2PerM) / maxVoltageDropV;

    const retainedSectionMm2 = definition.sortedSections.find((section) => section >= minimumSectionMm2);

    // Calcul impossible : aucune section du catalogue fourni ne permet de
    // rester sous la chute de tension maximale admissible.
    if (retainedSectionMm2 === undefined) {
      throw new CalculationError(
        `No available section covers the minimum required section (${minimumSectionMm2.toFixed(
          2
        )} mm²) for circuit "${definition.circuitId}"`,
        {
          code: "CABLE_SECTION_OUT_OF_RANGE",
          details: { circuitId: definition.circuitId, minimumSectionMm2, availableSectionsMm2: definition.sortedSections },
        }
      );
    }

    const computedVoltageDropV =
      (electricalLengthM * referenceCurrentA * definition.conductorResistivityOhmMm2PerM) / retainedSectionMm2;
    const computedVoltageDropPercentage = (computedVoltageDropV / circuit.voltageV) * 100;

    return {
      circuitId: definition.circuitId,
      referenceCurrentA,
      electricalLengthM,
      voltageV: circuit.voltageV,
      maxVoltageDropV,
      minimumSectionMm2,
      retainedSectionMm2,
      computedVoltageDropV,
      computedVoltageDropPercentage,
    };
  });

  return { cables };
}

/**
 * CableEngine : implémentation de BaseEngine. Ne dépend d'aucun code du
 * Circuit Engine ni d'aucun autre moteur (lit uniquement circuit.*, déjà
 * persisté), ne choisit aucune protection, ne construit aucun schéma.
 */
export function createCableEngine(): BaseEngine<CableEngineInput, CableEngineOutput> {
  return {
    id: CABLE_ENGINE_ID,

    async run(context: EngineContext, input: CableEngineInput): Promise<EngineResult<CableEngineOutput>> {
      const resolvedDefinitions = validateCableDefinitions(input);

      const circuits: Record<string, CircuitRecord> = {};
      for (const definition of resolvedDefinitions) {
        circuits[definition.circuitId] = await readCircuitRecord(context, definition.circuitId);
      }

      const output = computeCableEngineOutput(input, circuits);

      // Une clé cable.<circuitId> par circuit câblé : même convention que
      // circuit.<id> (Phase 4.7) — un moteur structurel/dérivé produit un
      // nombre variable d'objets, chacun individuellement adressable et
      // propageable.
      const retainedValues: EngineRetainedValueProposal[] = output.cables.map((cable) => ({
        key: `cable.${cable.circuitId}`,
        value: cable,
        simulatedValue: cable,
      }));

      // Chaque cable.<circuitId> dépend uniquement du circuit.<circuitId>
      // réellement lu — jamais de energy.*, battery.*, alternator.*,
      // solar.*, charger.*, protection.*, diagram.* ou Volta.
      const dependencies: EngineDependencyProposal[] = output.cables.map((cable) => ({
        dependentKey: `cable.${cable.circuitId}`,
        dependsOnKey: `circuit.${cable.circuitId}`,
      }));

      return {
        output,
        retainedValues,
        dependencies,
        debug: { computedAt: context.now().toISOString(), cableCount: output.cables.length },
      };
    },
  };
}

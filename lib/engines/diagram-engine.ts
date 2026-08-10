import { CalculationError, DependencyError, ValidationError } from "@/lib/engines/errors";
import type {
  BaseEngine,
  EngineContext,
  EngineDependencyProposal,
  EngineResult,
  EngineRetainedValueProposal,
} from "@/lib/engines/types";

// Phase 5.0 (MASTER-11) : neuvième moteur, mais le premier moteur de
// *représentation* — construit exclusivement sur le socle de la Phase 4.0.
// N'effectue aucun calcul électrique : il assemble uniquement les données
// déjà produites par le Circuit Engine (Phase 4.7/4.7.1), le Cable Engine
// (Phase 4.8) et le Protection Engine (Phase 4.9) en un modèle prêt à être
// consommé par un futur générateur de schémas (MASTER-06 §43-44 : le
// Schéma référence le Circuit, il ne recopie pas ses données métier — ce
// moteur est le pont qui prépare cette référence sans dessiner).
//
// Ne décide jamais du placement graphique, ne génère aucun SVG, aucun PDF.
// Ne recalcule jamais un moteur existant, n'appelle jamais un autre moteur.

export const DIAGRAM_ENGINE_ID = "diagram.model";

// Aucun calcul ici : la seule décision laissée à l'appelant est la liste
// des circuits à inclure dans le modèle de diagramme.
export type DiagramDefinitionInput = {
  /** Identifiant du circuit à représenter — doit correspondre à un
   * circuit.<id> (Circuit Engine), un cable.<id> (Cable Engine) et un
   * protection.<id> (Protection Engine) déjà produits. */
  circuitId: string;
};

export type DiagramEngineInput = {
  circuits: DiagramDefinitionInput[];
};

/** Sous-ensemble de circuit.<id> utile à l'affichage d'un schéma —
 * repris tel quel, jamais recalculé. */
export type DiagramCircuitInfo = {
  name: string;
  circuitType: string | null;
  consumerNames: string[];
  cumulatedPowerW: number;
  cumulatedCurrentA: number | null;
  voltageV: number;
};

/** Sous-ensemble de cable.<id> utile à l'affichage d'un schéma — repris
 * tel quel, jamais recalculé. */
export type DiagramCableInfo = {
  electricalLengthM: number;
  retainedSectionMm2: number;
  computedVoltageDropPercentage: number;
};

/** Sous-ensemble de protection.<id> utile à l'affichage d'un schéma —
 * repris tel quel, jamais recalculé. */
export type DiagramProtectionInfo = {
  protectionType: string;
  retainedRatingA: number;
  marginRatio: number;
};

export type DiagramComputation = {
  circuitId: string;
  circuit: DiagramCircuitInfo;
  cable: DiagramCableInfo;
  protection: DiagramProtectionInfo;
};

export type DiagramEngineOutput = {
  circuits: DiagramComputation[];
};

type CircuitRecord = {
  id: string;
  name: string;
  circuitType: string | null;
  consumerNames: string[];
  cumulatedPowerW: number;
  cumulatedCurrentA: number | null;
  voltageV: number;
};

type CableRecord = {
  circuitId: string;
  electricalLengthM: number;
  retainedSectionMm2: number;
  computedVoltageDropPercentage: number;
};

type ProtectionRecord = {
  circuitId: string;
  protectionType: string;
  retainedRatingA: number;
  marginRatio: number;
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

function hasStringField(value: unknown, field: string): boolean {
  return typeof value === "object" && value !== null && typeof (value as Record<string, unknown>)[field] === "string";
}

function hasNullableStringField(value: unknown, field: string): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return record[field] === null || typeof record[field] === "string";
}

function hasStringArrayField(value: unknown, field: string): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return Array.isArray(record[field]) && (record[field] as unknown[]).every((item) => typeof item === "string");
}

function parseCircuitRecord(raw: unknown, circuitKey: string): CircuitRecord {
  if (
    !hasStringField(raw, "id") ||
    !hasStringField(raw, "name") ||
    !hasNullableStringField(raw, "circuitType") ||
    !hasStringArrayField(raw, "consumerNames") ||
    !hasNumberField(raw, "cumulatedPowerW") ||
    !hasNullableNumberField(raw, "cumulatedCurrentA") ||
    !hasNumberField(raw, "voltageV")
  ) {
    throw new DependencyError(
      `"${circuitKey}" has an unexpected shape and cannot be used by the Diagram Engine`,
      { code: "CIRCUIT_DATA_INCOMPATIBLE", details: { key: circuitKey, raw } }
    );
  }

  const record = raw as Record<string, unknown>;
  return {
    id: record.id as string,
    name: record.name as string,
    circuitType: record.circuitType as string | null,
    consumerNames: record.consumerNames as string[],
    cumulatedPowerW: record.cumulatedPowerW as number,
    cumulatedCurrentA: record.cumulatedCurrentA as number | null,
    voltageV: record.voltageV as number,
  };
}

function parseCableRecord(raw: unknown, cableKey: string): CableRecord {
  if (
    !hasStringField(raw, "circuitId") ||
    !hasNumberField(raw, "electricalLengthM") ||
    !hasNumberField(raw, "retainedSectionMm2") ||
    !hasNumberField(raw, "computedVoltageDropPercentage")
  ) {
    throw new DependencyError(
      `"${cableKey}" has an unexpected shape and cannot be used by the Diagram Engine`,
      { code: "CABLE_DATA_INCOMPATIBLE", details: { key: cableKey, raw } }
    );
  }

  const record = raw as Record<string, unknown>;
  return {
    circuitId: record.circuitId as string,
    electricalLengthM: record.electricalLengthM as number,
    retainedSectionMm2: record.retainedSectionMm2 as number,
    computedVoltageDropPercentage: record.computedVoltageDropPercentage as number,
  };
}

function parseProtectionRecord(raw: unknown, protectionKey: string): ProtectionRecord {
  if (
    !hasStringField(raw, "circuitId") ||
    !hasStringField(raw, "protectionType") ||
    !hasNumberField(raw, "retainedRatingA") ||
    !hasNumberField(raw, "marginRatio")
  ) {
    throw new DependencyError(
      `"${protectionKey}" has an unexpected shape and cannot be used by the Diagram Engine`,
      { code: "PROTECTION_DATA_INCOMPATIBLE", details: { key: protectionKey, raw } }
    );
  }

  const record = raw as Record<string, unknown>;
  return {
    circuitId: record.circuitId as string,
    protectionType: record.protectionType as string,
    retainedRatingA: record.retainedRatingA as number,
    marginRatio: record.marginRatio as number,
  };
}

/**
 * Lit exclusivement une valeur retenue via EngineContext. Ne recalcule
 * jamais le moteur d'origine : absente ou obsolète → DependencyError. Même
 * patron que les moteurs précédents (cf. audit Phase 4.5.1), reproduit ici
 * faute de pouvoir modifier un fichier existant pour partager un helper
 * commun.
 */
async function readRetainedValue<T>(
  context: EngineContext,
  key: string,
  missingCode: string,
  obsoleteCode: string,
  sourceLabel: string,
  parse: (raw: unknown) => T
): Promise<T> {
  const record = await context.getRetainedValue(key);

  if (!record) {
    throw new DependencyError(
      `No "${key}" retained value found for this Project — run the ${sourceLabel} before the Diagram Engine`,
      { code: missingCode, details: { key } }
    );
  }

  if (record.status !== "ACTIVE") {
    throw new DependencyError(
      `"${key}" is not ACTIVE (status: ${record.status}) — recompute the ${sourceLabel} before building the diagram model`,
      { code: obsoleteCode, details: { key, status: record.status } }
    );
  }

  return parse(record.value);
}

/**
 * Valide la structure des définitions de diagramme (identifiant de
 * circuit requis, non dupliqué). Ne touche jamais aux données circuit.*,
 * cable.* et protection.* — celles-ci sont lues séparément.
 */
function validateDiagramDefinitions(input: DiagramEngineInput): DiagramDefinitionInput[] {
  if (!input || !Array.isArray(input.circuits)) {
    throw new ValidationError("circuits must be an array", { code: "CIRCUITS_MISSING" });
  }

  const seenCircuitIds = new Set<string>();

  return input.circuits.map((definition, index) => {
    if (!definition || typeof definition.circuitId !== "string" || !definition.circuitId.trim()) {
      throw new ValidationError(`Diagram entry at index ${index} is missing a circuitId`, {
        code: "DIAGRAM_PARAMETER_MISSING",
        details: { index, field: "circuitId" },
      });
    }

    if (seenCircuitIds.has(definition.circuitId)) {
      throw new ValidationError(`Duplicate circuitId "${definition.circuitId}": a circuit can only appear once`, {
        code: "DIAGRAM_DUPLICATE_CIRCUIT",
        details: { circuitId: definition.circuitId },
      });
    }
    seenCircuitIds.add(definition.circuitId);

    return definition;
  });
}

/**
 * Fonction pure : assemble le modèle de diagramme à partir des définitions
 * fournies et des circuits/câbles/protections déjà connus (circuit.*,
 * cable.*, protection.*, jamais recalculés). Ne touche jamais EngineContext
 * ni aucune base de données — testable indépendamment. Aucun calcul
 * électrique : uniquement de l'assemblage de données déjà produites.
 */
export function computeDiagramEngineOutput(
  input: DiagramEngineInput,
  circuits: Record<string, CircuitRecord>,
  cables: Record<string, CableRecord>,
  protections: Record<string, ProtectionRecord>
): DiagramEngineOutput {
  const resolvedDefinitions = validateDiagramDefinitions(input);

  const diagramCircuits: DiagramComputation[] = resolvedDefinitions.map((definition) => {
    const circuit = circuits[definition.circuitId];
    if (!circuit) {
      throw new DependencyError(`No circuit data available for circuitId "${definition.circuitId}"`, {
        code: "CIRCUIT_DATA_MISSING",
        details: { circuitId: definition.circuitId },
      });
    }

    const cable = cables[definition.circuitId];
    if (!cable) {
      throw new DependencyError(`No cable data available for circuitId "${definition.circuitId}"`, {
        code: "CABLE_DATA_MISSING",
        details: { circuitId: definition.circuitId },
      });
    }

    const protection = protections[definition.circuitId];
    if (!protection) {
      throw new DependencyError(`No protection data available for circuitId "${definition.circuitId}"`, {
        code: "PROTECTION_DATA_MISSING",
        details: { circuitId: definition.circuitId },
      });
    }

    // Modèle impossible à construire : les trois sources doivent
    // référencer le même circuit. Une divergence signifie que les données
    // stockées sous ces clés ne décrivent pas réellement le même circuit
    // — le modèle ne peut pas être assemblé de façon fiable.
    if (
      circuit.id !== definition.circuitId ||
      cable.circuitId !== definition.circuitId ||
      protection.circuitId !== definition.circuitId
    ) {
      throw new CalculationError(
        `Diagram model for circuit "${definition.circuitId}" cannot be built: circuit/cable/protection data are inconsistent`,
        {
          code: "DIAGRAM_MODEL_IMPOSSIBLE",
          details: {
            circuitId: definition.circuitId,
            circuitOwnId: circuit.id,
            cableCircuitId: cable.circuitId,
            protectionCircuitId: protection.circuitId,
          },
        }
      );
    }

    return {
      circuitId: definition.circuitId,
      circuit: {
        name: circuit.name,
        circuitType: circuit.circuitType,
        consumerNames: circuit.consumerNames,
        cumulatedPowerW: circuit.cumulatedPowerW,
        cumulatedCurrentA: circuit.cumulatedCurrentA,
        voltageV: circuit.voltageV,
      },
      cable: {
        electricalLengthM: cable.electricalLengthM,
        retainedSectionMm2: cable.retainedSectionMm2,
        computedVoltageDropPercentage: cable.computedVoltageDropPercentage,
      },
      protection: {
        protectionType: protection.protectionType,
        retainedRatingA: protection.retainedRatingA,
        marginRatio: protection.marginRatio,
      },
    };
  });

  return { circuits: diagramCircuits };
}

/**
 * DiagramEngine : implémentation de BaseEngine. Ne dépend d'aucun code du
 * Circuit Engine, Cable Engine ou Protection Engine (lit uniquement
 * circuit.*, cable.* et protection.*, déjà persistés), n'effectue aucun
 * calcul électrique, ne décide d'aucun placement graphique, ne génère ni
 * SVG ni PDF.
 */
export function createDiagramEngine(): BaseEngine<DiagramEngineInput, DiagramEngineOutput> {
  return {
    id: DIAGRAM_ENGINE_ID,

    async run(context: EngineContext, input: DiagramEngineInput): Promise<EngineResult<DiagramEngineOutput>> {
      const resolvedDefinitions = validateDiagramDefinitions(input);

      const circuits: Record<string, CircuitRecord> = {};
      const cables: Record<string, CableRecord> = {};
      const protections: Record<string, ProtectionRecord> = {};

      for (const definition of resolvedDefinitions) {
        circuits[definition.circuitId] = await readRetainedValue(
          context,
          `circuit.${definition.circuitId}`,
          "CIRCUIT_DATA_MISSING",
          "CIRCUIT_DATA_OBSOLETE",
          "Circuit Engine",
          (raw) => parseCircuitRecord(raw, `circuit.${definition.circuitId}`)
        );
        cables[definition.circuitId] = await readRetainedValue(
          context,
          `cable.${definition.circuitId}`,
          "CABLE_DATA_MISSING",
          "CABLE_DATA_OBSOLETE",
          "Cable Engine",
          (raw) => parseCableRecord(raw, `cable.${definition.circuitId}`)
        );
        protections[definition.circuitId] = await readRetainedValue(
          context,
          `protection.${definition.circuitId}`,
          "PROTECTION_DATA_MISSING",
          "PROTECTION_DATA_OBSOLETE",
          "Protection Engine",
          (raw) => parseProtectionRecord(raw, `protection.${definition.circuitId}`)
        );
      }

      const output = computeDiagramEngineOutput(input, circuits, cables, protections);

      // Une clé diagram.<circuitId> par circuit représenté : même
      // convention que circuit.<id>, cable.<circuitId> et
      // protection.<circuitId>.
      const retainedValues: EngineRetainedValueProposal[] = output.circuits.map((diagramCircuit) => ({
        key: `diagram.${diagramCircuit.circuitId}`,
        value: diagramCircuit,
        simulatedValue: diagramCircuit,
      }));

      // Chaque diagram.<circuitId> dépend des trois sources réellement
      // lues — jamais de energyBalance.*, diagram.* d'un autre circuit, ou
      // Volta.
      const dependencies: EngineDependencyProposal[] = output.circuits.flatMap((diagramCircuit) => [
        { dependentKey: `diagram.${diagramCircuit.circuitId}`, dependsOnKey: `circuit.${diagramCircuit.circuitId}` },
        { dependentKey: `diagram.${diagramCircuit.circuitId}`, dependsOnKey: `cable.${diagramCircuit.circuitId}` },
        {
          dependentKey: `diagram.${diagramCircuit.circuitId}`,
          dependsOnKey: `protection.${diagramCircuit.circuitId}`,
        },
      ]);

      return {
        output,
        retainedValues,
        dependencies,
        debug: { computedAt: context.now().toISOString(), circuitCount: output.circuits.length },
      };
    },
  };
}

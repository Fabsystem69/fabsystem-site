import { CalculationError, DependencyError, ValidationError } from "@/lib/engines/errors";
import type {
  BaseEngine,
  EngineContext,
  EngineDependencyProposal,
  EngineResult,
  EngineRetainedValueProposal,
} from "@/lib/engines/types";

// Phase 4.7 (MASTER-11), corrigée en Phase 4.7.1 : premier moteur décrivant
// la structure électrique du Project, construit exclusivement sur le socle
// de la Phase 4.0. Ne dimensionne aucun câble, ne choisit aucune
// protection, ne réalise aucun schéma : il regroupe uniquement les
// consommateurs déjà connus (Energy Engine, Phase 4.1) en circuits
// logiques. Ne recalcule jamais l'énergie, n'appelle jamais un autre
// moteur.
//
// Phase 4.7.1 : le moteur est désormais seul responsable de la
// construction du modèle logique — y compris de l'identifiant du circuit.
// L'appelant ne fournit plus qu'un CircuitDefinitionInput minimal (les
// données nécessaires au regroupement) ; il n'a plus à construire
// lui-même un identifiant technique.

export const CIRCUIT_ENGINE_ID = "circuit.structure";

// Regroupement fourni explicitement par l'appelant : ce moteur ne décide
// jamais lui-même quels consommateurs appartiennent à quel circuit — ce
// n'est pas une donnée dérivable des grandeurs énergétiques. En revanche,
// l'identifiant du circuit (`CircuitComputation.id`) est désormais produit
// par le moteur lui-même à partir du nom (voir `deriveCircuitId`) :
// l'appelant ne fournit que ce qui est nécessaire au regroupement.
export type CircuitDefinitionInput = {
  name: string;
  /** Type de circuit, si fourni par l'appelant (ex. "éclairage",
   * "confort"). Aucune liste fermée n'est imposée ici. */
  circuitType?: string;
  /** Noms des consommateurs (energy.consumers[].name) associés à ce circuit. */
  consumerNames: string[];
};

export type CircuitEngineInput = {
  circuits: CircuitDefinitionInput[];
};

export type CircuitComputation = {
  /** Identifiant stable, produit par le moteur à partir du nom (voir
   * `deriveCircuitId`) — jamais fourni par l'appelant. */
  id: string;
  name: string;
  circuitType: string | null;
  consumerNames: string[];
  /** Puissance cumulée (W) : somme de ce qui est calculable parmi les
   * consommateurs du circuit (mêmes conventions que l'Energy Engine). */
  cumulatedPowerW: number;
  /** Courant cumulé (A), si disponible : null si aucun consommateur du
   * circuit n'a de courant calculable. */
  cumulatedCurrentA: number | null;
  /** Tension du circuit (V) : partagée par tous ses consommateurs. */
  voltageV: number;
};

export type CircuitEngineOutput = {
  circuits: CircuitComputation[];
};

type EnergyConsumerRecord = {
  name: string;
  quantity: number;
  voltageV: number | null;
  totalPowerW: number | null;
  totalCurrentA: number | null;
};

function hasNullableNumberField(value: unknown, field: string): boolean {
  const record = value as Record<string, unknown>;
  return record[field] === null || typeof record[field] === "number";
}

function isEnergyConsumerRecord(value: unknown): value is EnergyConsumerRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.name === "string" &&
    typeof record.quantity === "number" &&
    hasNullableNumberField(value, "voltageV") &&
    hasNullableNumberField(value, "totalPowerW") &&
    hasNullableNumberField(value, "totalCurrentA")
  );
}

function parseEnergyConsumers(raw: unknown): EnergyConsumerRecord[] {
  if (!Array.isArray(raw) || !raw.every(isEnergyConsumerRecord)) {
    throw new DependencyError(
      "energy.consumers has an unexpected shape and cannot be used by the Circuit Engine",
      { code: "ENERGY_DATA_INCOMPATIBLE", details: { key: "energy.consumers", raw } }
    );
  }

  return raw;
}

/**
 * Lit exclusivement une valeur retenue via EngineContext. Ne recalcule
 * jamais Energy : absente ou obsolète → DependencyError. Même patron que
 * les moteurs précédents (cf. audit Phase 4.5.1), reproduit ici faute de
 * pouvoir les modifier pour partager un helper commun.
 */
async function readRetainedValue<T>(
  context: EngineContext,
  key: "energy.consumers",
  parse: (raw: unknown) => T
): Promise<T> {
  const record = await context.getRetainedValue(key);

  if (!record) {
    throw new DependencyError(
      `No "${key}" retained value found for this Project — run the Energy Engine before the Circuit Engine`,
      { code: "ENERGY_DATA_MISSING", details: { key } }
    );
  }

  if (record.status !== "ACTIVE") {
    throw new DependencyError(
      `"${key}" is not ACTIVE (status: ${record.status}) — recompute the Energy Engine before building circuits`,
      { code: "ENERGY_DATA_OBSOLETE", details: { key, status: record.status } }
    );
  }

  return parse(record.value);
}

/**
 * Dérive un identifiant stable et déterministe à partir du nom du circuit
 * (minuscules, sans accents, séparateurs normalisés en tirets). Fonction
 * pure : le moteur ne génère jamais d'identifiant aléatoire ou dépendant
 * du temps, pour rester déterministe et testable.
 */
function deriveCircuitId(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ResolvedCircuitDefinition = CircuitDefinitionInput & { id: string };

/**
 * Valide la structure des définitions de circuits (noms, identifiants
 * dérivés sans doublon, non-vacuité, un consommateur ne peut appartenir
 * qu'à un seul circuit à la fois) et produit l'identifiant de chaque
 * circuit. Ne résout pas encore les consommateurs eux-mêmes contre
 * energy.consumers.
 */
function validateCircuitDefinitions(input: CircuitEngineInput): ResolvedCircuitDefinition[] {
  if (!input || !Array.isArray(input.circuits)) {
    throw new ValidationError("circuits must be an array", { code: "CIRCUITS_MISSING" });
  }

  const seenIds = new Set<string>();
  const consumerAssignment = new Map<string, string>();

  return input.circuits.map((circuit, index) => {
    if (!circuit || typeof circuit.name !== "string" || !circuit.name.trim()) {
      throw new ValidationError(`Circuit at index ${index} is missing a name`, {
        code: "CIRCUIT_INVALID_VALUE",
        details: { index },
      });
    }

    const id = deriveCircuitId(circuit.name);

    if (!id) {
      throw new ValidationError(
        `Circuit name "${circuit.name}" does not contain any character usable to build an identifier`,
        { code: "CIRCUIT_INVALID_VALUE", details: { index, name: circuit.name } }
      );
    }

    if (seenIds.has(id)) {
      throw new ValidationError(
        `Duplicate circuit name "${circuit.name}" (resolves to the same identifier "${id}")`,
        { code: "CIRCUIT_DUPLICATE_ID", details: { id, name: circuit.name } }
      );
    }
    seenIds.add(id);

    if (!Array.isArray(circuit.consumerNames) || circuit.consumerNames.length === 0) {
      // Circuit vide : aucun consommateur associé.
      throw new ValidationError(`Circuit "${circuit.name}" has no associated consumer`, {
        code: "CIRCUIT_EMPTY",
        details: { id, name: circuit.name },
      });
    }

    for (const consumerName of circuit.consumerNames) {
      const existingAssignment = consumerAssignment.get(consumerName);

      // Données incohérentes : un même consommateur ne peut pas être
      // rattaché à deux circuits simultanément.
      if (existingAssignment) {
        throw new ValidationError(
          `Consumer "${consumerName}" is assigned to multiple circuits ("${existingAssignment}" and "${id}")`,
          {
            code: "CIRCUIT_CONSUMER_DUPLICATE_ASSIGNMENT",
            details: { consumerName, circuits: [existingAssignment, id] },
          }
        );
      }

      consumerAssignment.set(consumerName, id);
    }

    return { ...circuit, id };
  });
}

/**
 * Fonction pure : construit le modèle logique des circuits à partir des
 * définitions fournies et des consommateurs déjà connus (energy.consumers,
 * jamais recalculés). Ne touche jamais EngineContext ni aucune base de
 * données — testable indépendamment.
 */
export function computeCircuitEngineOutput(
  input: CircuitEngineInput,
  consumers: EnergyConsumerRecord[]
): CircuitEngineOutput {
  const resolvedDefinitions = validateCircuitDefinitions(input);

  const consumersByName = new Map(consumers.map((consumer) => [consumer.name, consumer]));

  const circuits: CircuitComputation[] = resolvedDefinitions.map((circuitDef) => {
    const resolvedConsumers = circuitDef.consumerNames.map((consumerName) => {
      const consumer = consumersByName.get(consumerName);

      // Consommateur absent : le circuit référence un nom qui n'existe
      // pas (ou plus) dans energy.consumers.
      if (!consumer) {
        throw new ValidationError(
          `Circuit "${circuitDef.id}" references an unknown consumer: "${consumerName}"`,
          { code: "CIRCUIT_CONSUMER_NOT_FOUND", details: { circuitId: circuitDef.id, consumerName } }
        );
      }

      return consumer;
    });

    // Puissance cumulée : somme de ce qui est calculable, comme
    // l'Energy Engine (jamais une valeur inventée pour ce qui manque).
    const cumulatedPowerW = resolvedConsumers.reduce(
      (sum, consumer) => sum + (consumer.totalPowerW ?? 0),
      0
    );

    const currentValues = resolvedConsumers.map((consumer) => consumer.totalCurrentA);
    const hasAnyKnownCurrent = currentValues.some((value) => value !== null);
    const cumulatedCurrentA = hasAnyKnownCurrent
      ? currentValues.reduce((sum: number, value) => sum + (value ?? 0), 0)
      : null;

    const resolvedVoltages = [
      ...new Set(
        resolvedConsumers.map((consumer) => consumer.voltageV).filter((value): value is number => value !== null)
      ),
    ];

    // Calcul impossible : aucun consommateur du circuit n'a de tension
    // connue, la tension du circuit est indéterminée.
    if (resolvedVoltages.length === 0) {
      throw new CalculationError(
        `Circuit "${circuitDef.id}" voltage cannot be determined: none of its consumers have a known voltage`,
        { code: "CIRCUIT_VOLTAGE_INDETERMINATE", details: { circuitId: circuitDef.id } }
      );
    }

    // Tension incompatible : le circuit mélange des consommateurs à des
    // tensions différentes — un circuit est une seule branche électrique.
    if (resolvedVoltages.length > 1) {
      throw new ValidationError(
        `Circuit "${circuitDef.id}" mixes consumers with different voltages (${resolvedVoltages.join(", ")} V)`,
        { code: "CIRCUIT_VOLTAGE_MISMATCH", details: { circuitId: circuitDef.id, voltages: resolvedVoltages } }
      );
    }

    return {
      id: circuitDef.id,
      name: circuitDef.name,
      circuitType: circuitDef.circuitType ?? null,
      consumerNames: circuitDef.consumerNames,
      cumulatedPowerW,
      cumulatedCurrentA,
      voltageV: resolvedVoltages[0],
    };
  });

  return { circuits };
}

/**
 * CircuitEngine : implémentation de BaseEngine. Ne dépend d'aucun code
 * d'un autre moteur (lit uniquement energy.consumers, déjà persisté), ne
 * calcule aucun élément physique (câble, protection, schéma).
 */
export function createCircuitEngine(): BaseEngine<CircuitEngineInput, CircuitEngineOutput> {
  return {
    id: CIRCUIT_ENGINE_ID,

    async run(context: EngineContext, input: CircuitEngineInput): Promise<EngineResult<CircuitEngineOutput>> {
      const consumers = await readRetainedValue(context, "energy.consumers", parseEnergyConsumers);

      const output = computeCircuitEngineOutput(input, consumers);

      // Une clé circuit.<id> par circuit produit : un moteur structurel
      // ne produit pas un nombre fixe de grandeurs comme un moteur de
      // calcul, mais un nombre variable d'objets — chacun reste sous
      // l'espace de noms circuit.* exigé.
      const retainedValues: EngineRetainedValueProposal[] = output.circuits.map((circuit) => ({
        key: `circuit.${circuit.id}`,
        value: circuit,
        simulatedValue: circuit,
      }));

      // Chaque circuit dépend uniquement de energy.consumers, la seule
      // source réellement lue — jamais de battery/alternator/solar/
      // charger/cable/protection/diagram/Volta.
      const dependencies: EngineDependencyProposal[] = output.circuits.map((circuit) => ({
        dependentKey: `circuit.${circuit.id}`,
        dependsOnKey: "energy.consumers",
      }));

      return {
        output,
        retainedValues,
        dependencies,
        debug: { computedAt: context.now().toISOString(), circuitCount: output.circuits.length },
      };
    },
  };
}

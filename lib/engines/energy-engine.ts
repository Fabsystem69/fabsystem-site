import { DEFAULT_FLOAT_TOLERANCE_RATIO } from "@/lib/engines/constants";
import { CalculationError, ValidationError, type EngineError } from "@/lib/engines/errors";
import type {
  BaseEngine,
  EngineContext,
  EngineDependencyProposal,
  EngineResult,
  EngineResultError,
  EngineRetainedValueProposal,
} from "@/lib/engines/types";

// Phase 4.1 (MASTER-11) : premier moteur métier réel, construit
// exclusivement sur le socle de la Phase 4.0. Calcule uniquement les
// besoins énergétiques d'un Project à partir de consommateurs déclarés.
// Ne connaît ni batterie, ni alternateur, ni solaire, ni protections, ni
// sections de câble, ni Volta (contrainte explicite de cette phase).

export const ENERGY_ENGINE_ID = "energy.consumption";

// Un jour ne peut physiquement pas compter plus de 24 heures d'usage pour
// un même consommateur : contrainte dimensionnelle, pas une règle métier.
const MAX_DAILY_USAGE_HOURS = 24;

export type EnergyConsumerInput = {
  name: string;
  /** Puissance unitaire, en Watts. */
  powerW?: number;
  /** Courant unitaire, en Ampères, si connu directement. */
  currentA?: number;
  /** Tension de ce consommateur, en Volts. À défaut, la tension système du
   * Project (12 V / 24 V) est utilisée si elle est connue. */
  voltageV?: number;
  /** Durée d'utilisation quotidienne, en heures. 0 est une valeur valide
   * (consommateur installé mais non utilisé ce jour-là). */
  dailyUsageHours: number;
  /** Nombre d'unités identiques. 0 est valide (contribue pour zéro). */
  quantity?: number;
};

export type EnergyEngineInput = {
  consumers: EnergyConsumerInput[];
};

export type EnergyConsumerComputation = {
  name: string;
  quantity: number;
  voltageV: number | null;
  unitPowerW: number | null;
  totalPowerW: number | null;
  unitCurrentA: number | null;
  totalCurrentA: number | null;
  dailyUsageHours: number;
  dailyWh: number | null;
  dailyAh: number | null;
};

export type EnergyEngineOutput = {
  consumers: EnergyConsumerComputation[];
  /** Somme des puissances totales connues (W). */
  totalPowerW: number;
  /** Somme des consommations journalières connues (Wh). */
  dailyWh: number;
  /** Somme des consommations journalières connues (Ah). */
  dailyAh: number;
  /** Somme des courants totaux connus (A) — pire cas si tout fonctionne
   * simultanément, limité aux consommateurs dont le courant est calculable. */
  maxCurrentA: number;
  /** false si au moins un consommateur a une grandeur non calculable
   * (voir `errors` du EngineResult pour le détail). */
  complete: boolean;
};

function toResultError(error: EngineError): EngineResultError {
  return { code: error.code, message: error.message, details: error.details };
}

function assertFiniteNonNegative(value: number, label: string, index: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ValidationError(`${label} must be a finite number`, {
      code: "CONSUMER_INVALID_VALUE",
      details: { index, field: label, value },
    });
  }

  if (value < 0) {
    throw new ValidationError(`${label} cannot be negative`, {
      code: "CONSUMER_INVALID_VALUE",
      details: { index, field: label, value },
    });
  }
}

function resolveSystemVoltage(voltage: EngineContext["project"]["voltage"]): number | null {
  if (voltage === "V12") return 12;
  if (voltage === "V24") return 24;
  return null;
}

function validateConsumerFields(consumer: EnergyConsumerInput, index: number) {
  if (!consumer || typeof consumer.name !== "string" || !consumer.name.trim()) {
    throw new ValidationError(`Consumer at index ${index} is missing a name`, {
      code: "CONSUMER_INVALID_VALUE",
      details: { index },
    });
  }

  const label = consumer.name.trim();

  assertFiniteNonNegative(consumer.quantity ?? 1, `${label}.quantity`, index);
  assertFiniteNonNegative(consumer.dailyUsageHours, `${label}.dailyUsageHours`, index);

  if (consumer.dailyUsageHours > MAX_DAILY_USAGE_HOURS) {
    throw new ValidationError(`${label}.dailyUsageHours cannot exceed ${MAX_DAILY_USAGE_HOURS} hours`, {
      code: "CONSUMER_INVALID_VALUE",
      details: { index, field: "dailyUsageHours", value: consumer.dailyUsageHours },
    });
  }

  if (typeof consumer.powerW !== "undefined") {
    assertFiniteNonNegative(consumer.powerW, `${label}.powerW`, index);
  }

  if (typeof consumer.currentA !== "undefined") {
    assertFiniteNonNegative(consumer.currentA, `${label}.currentA`, index);
  }

  if (typeof consumer.voltageV !== "undefined") {
    assertFiniteNonNegative(consumer.voltageV, `${label}.voltageV`, index);

    if (consumer.voltageV === 0) {
      throw new ValidationError(`${label}.voltageV must be greater than zero`, {
        code: "CONSUMER_INVALID_VALUE",
        details: { index, field: "voltageV", value: consumer.voltageV },
      });
    }
  }

  if (typeof consumer.powerW === "undefined" && typeof consumer.currentA === "undefined") {
    throw new ValidationError(
      `Consumer "${label}" must declare at least a power (powerW) or a current (currentA)`,
      { code: "CONSUMER_MISSING_POWER_DATA", details: { index, name: label } }
    );
  }
}

function resolveConsumer(
  consumer: EnergyConsumerInput,
  index: number,
  systemVoltageV: number | null
): { computation: EnergyConsumerComputation; issues: EngineResultError[] } {
  const label = consumer.name.trim();
  const issues: EngineResultError[] = [];
  const quantity = consumer.quantity ?? 1;

  const hasPower = typeof consumer.powerW !== "undefined";
  const hasCurrent = typeof consumer.currentA !== "undefined";

  // Unité incohérente (1/2) : le consommateur déclare sa propre tension et
  // elle diverge de la tension système du Project — les agréger sans
  // conversion définie serait une valeur inventée.
  if (
    typeof consumer.voltageV !== "undefined" &&
    systemVoltageV !== null &&
    consumer.voltageV !== systemVoltageV
  ) {
    throw new ValidationError(
      `Consumer "${label}" voltage (${consumer.voltageV} V) does not match the project system voltage (${systemVoltageV} V)`,
      {
        code: "CONSUMER_VOLTAGE_MISMATCH",
        details: { index, name: label, consumerVoltageV: consumer.voltageV, systemVoltageV },
      }
    );
  }

  const resolvedVoltageV = typeof consumer.voltageV !== "undefined" ? consumer.voltageV : systemVoltageV;

  let unitPowerW: number | null = hasPower ? consumer.powerW! : null;
  let unitCurrentA: number | null = hasCurrent ? consumer.currentA! : null;

  // Unité incohérente (2/2) : puissance ET courant déclarés simultanément,
  // mais physiquement incompatibles (P ≠ U × I au-delà de l'arrondi).
  if (hasPower && hasCurrent && resolvedVoltageV !== null) {
    const expectedPowerW = consumer.currentA! * resolvedVoltageV;
    const referenceW = Math.max(Math.abs(expectedPowerW), Math.abs(consumer.powerW!));
    const deltaW = Math.abs(consumer.powerW! - expectedPowerW);

    if (referenceW > 0 && deltaW / referenceW > DEFAULT_FLOAT_TOLERANCE_RATIO) {
      throw new ValidationError(
        `Consumer "${label}" declared power (${consumer.powerW} W) is inconsistent with current × voltage (${consumer.currentA} A × ${resolvedVoltageV} V = ${expectedPowerW} W)`,
        {
          code: "CONSUMER_POWER_CURRENT_MISMATCH",
          details: { index, name: label, declaredPowerW: consumer.powerW, expectedPowerW },
        }
      );
    }
  }

  // Calcul impossible (non bloquant) : la grandeur manquante ne peut pas
  // être dérivée faute de tension connue (ni le consommateur, ni le
  // Project). Le reste du calcul se poursuit pour les autres grandeurs et
  // les autres consommateurs (MASTER-06 §41 : projet incomplet autorisé).
  if (unitPowerW === null && hasCurrent) {
    if (resolvedVoltageV !== null) {
      unitPowerW = consumer.currentA! * resolvedVoltageV;
    } else {
      issues.push(
        toResultError(
          new CalculationError(
            `Consumer "${label}" power cannot be derived: no voltage is known (neither the consumer's own voltage nor the project's system voltage)`,
            { code: "CONSUMER_CALCULATION_IMPOSSIBLE", details: { index, name: label, missing: "voltageV", target: "powerW" } }
          )
        )
      );
    }
  }

  if (unitCurrentA === null && hasPower) {
    if (resolvedVoltageV !== null) {
      unitCurrentA = consumer.powerW! / resolvedVoltageV;
    } else {
      issues.push(
        toResultError(
          new CalculationError(
            `Consumer "${label}" current cannot be derived: no voltage is known (neither the consumer's own voltage nor the project's system voltage)`,
            { code: "CONSUMER_CALCULATION_IMPOSSIBLE", details: { index, name: label, missing: "voltageV", target: "currentA" } }
          )
        )
      );
    }
  }

  const totalPowerW = unitPowerW !== null ? unitPowerW * quantity : null;
  const totalCurrentA = unitCurrentA !== null ? unitCurrentA * quantity : null;
  const dailyWh = totalPowerW !== null ? totalPowerW * consumer.dailyUsageHours : null;
  const dailyAh = totalCurrentA !== null ? totalCurrentA * consumer.dailyUsageHours : null;

  return {
    computation: {
      name: label,
      quantity,
      voltageV: resolvedVoltageV,
      unitPowerW,
      totalPowerW,
      unitCurrentA,
      totalCurrentA,
      dailyUsageHours: consumer.dailyUsageHours,
      dailyWh,
      dailyAh,
    },
    issues,
  };
}

function sumKnown(values: Array<number | null>): number {
  return values.reduce((sum: number, value) => sum + (value ?? 0), 0);
}

/**
 * Fonction pure : calcule le résultat énergétique à partir des
 * consommateurs et de la tension système résolue. Ne touche jamais le
 * Project ni aucune base de données — testable indépendamment du moteur.
 */
export function computeEnergyEngineOutput(
  input: EnergyEngineInput,
  systemVoltageV: number | null
): { output: EnergyEngineOutput; errors: EngineResultError[] } {
  if (!input || !Array.isArray(input.consumers)) {
    throw new ValidationError("consumers must be an array", { code: "CONSUMERS_MISSING" });
  }

  const computations: EnergyConsumerComputation[] = [];
  const errors: EngineResultError[] = [];

  input.consumers.forEach((consumer, index) => {
    validateConsumerFields(consumer, index);
    const { computation, issues } = resolveConsumer(consumer, index, systemVoltageV);
    computations.push(computation);
    errors.push(...issues);
  });

  const output: EnergyEngineOutput = {
    consumers: computations,
    totalPowerW: sumKnown(computations.map((c) => c.totalPowerW)),
    dailyWh: sumKnown(computations.map((c) => c.dailyWh)),
    dailyAh: sumKnown(computations.map((c) => c.dailyAh)),
    maxCurrentA: sumKnown(computations.map((c) => c.totalCurrentA)),
    complete: errors.length === 0,
  };

  return { output, errors };
}

/**
 * EnergyEngine : implémentation de BaseEngine. Ne dépend d'aucun autre
 * moteur, ne connaît aucune donnée hors de son propre domaine
 * (consommateurs + tension système du Project).
 */
export function createEnergyEngine(): BaseEngine<EnergyEngineInput, EnergyEngineOutput> {
  return {
    id: ENERGY_ENGINE_ID,

    run(context: EngineContext, input: EnergyEngineInput): EngineResult<EnergyEngineOutput> {
      const systemVoltageV = resolveSystemVoltage(context.project.voltage);
      const { output, errors } = computeEnergyEngineOutput(input, systemVoltageV);

      const dailyConsumption = {
        totalPowerW: output.totalPowerW,
        dailyWh: output.dailyWh,
        dailyAh: output.dailyAh,
        complete: output.complete,
      };
      const maxCurrent = { maxCurrentA: output.maxCurrentA, complete: output.complete };

      // Chaîne de dépendances "Consommateurs → Énergie quotidienne →
      // Courant maximal" : le moteur ne propose que ses propres clés,
      // jamais une clé appartenant à un futur moteur (batterie, solaire...).
      const retainedValues: EngineRetainedValueProposal[] = [
        { key: "energy.consumers", value: output.consumers, simulatedValue: output.consumers },
        { key: "energy.dailyConsumption", value: dailyConsumption, simulatedValue: dailyConsumption },
        { key: "energy.maxCurrent", value: maxCurrent, simulatedValue: maxCurrent },
      ];

      const dependencies: EngineDependencyProposal[] = [
        { dependentKey: "energy.dailyConsumption", dependsOnKey: "energy.consumers" },
        { dependentKey: "energy.maxCurrent", dependsOnKey: "energy.dailyConsumption" },
      ];

      return {
        output,
        retainedValues,
        dependencies,
        errors: errors.length > 0 ? errors : undefined,
        debug: { computedAt: context.now().toISOString(), systemVoltageV },
      };
    },
  };
}

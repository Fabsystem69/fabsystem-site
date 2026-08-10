import { CalculationError, DependencyError, ValidationError } from "@/lib/engines/errors";
import type {
  BaseEngine,
  EngineContext,
  EngineDependencyProposal,
  EngineResult,
  EngineRetainedValueProposal,
} from "@/lib/engines/types";

// Phase 4.2 (MASTER-11) : deuxième moteur métier réel, construit
// exclusivement sur le socle de la Phase 4.0. Détermine uniquement les
// caractéristiques de batterie nécessaires au Project à partir des
// résultats déjà produits par l'Energy Engine (Phase 4.1) — jamais
// recalculés ici. Ne connaît ni alternateur, ni solaire, ni protections,
// ni sections de câble, ni Volta (contrainte explicite de cette phase).

export const BATTERY_ENGINE_ID = "battery.sizing";

export type BatteryChemistry = "LEAD_ACID" | "AGM" | "GEL" | "LIFEPO4";

const KNOWN_CHEMISTRIES: readonly BatteryChemistry[] = ["LEAD_ACID", "AGM", "GEL", "LIFEPO4"];

// Aucune valeur métier n'est codée en dur : les quatre paramètres suivants
// doivent tous être fournis explicitement par l'appelant. Le moteur ne
// choisit jamais une profondeur de décharge, une autonomie ou une tension
// par défaut selon la technologie — c'est à l'appelant de les connaître.
export type BatteryEngineInput = {
  technology: BatteryChemistry;
  /** Profondeur de décharge maximale admise, en fraction (0, 1]. Ex. 0.5 = 50 %. */
  maxDepthOfDischarge: number;
  /** Autonomie souhaitée, en jours. */
  desiredAutonomyDays: number;
  /** Tension système du Project, en Volts. Doit correspondre à
   * `Project.voltage` lorsque celle-ci est connue. */
  systemVoltageV: number;
};

export type BatteryEngineOutput = {
  technology: BatteryChemistry;
  maxDepthOfDischarge: number;
  desiredAutonomyDays: number;
  systemVoltageV: number;
  /** Grandeurs énergétiques lues depuis energy.* (jamais recalculées). */
  dailyWh: number;
  dailyAh: number;
  maxCurrentA: number;
  /** Énergie utile nécessaire sur la durée d'autonomie souhaitée (Wh). */
  usefulEnergyWh: number;
  /** Capacité utile nécessaire sur la durée d'autonomie souhaitée (Ah). */
  usefulCapacityAh: number;
  /** Capacité nominale à acquérir compte tenu de la profondeur de décharge (Ah). */
  nominalCapacityAh: number;
  /** Autonomie théorique recalculée à partir de la capacité utile (jours). */
  autonomyDays: number;
};

type EnergyDailyConsumptionValue = {
  totalPowerW: number;
  dailyWh: number;
  dailyAh: number;
  complete: boolean;
};

type EnergyMaxCurrentValue = {
  maxCurrentA: number;
  complete: boolean;
};

function hasNumberField(value: unknown, field: string): boolean {
  return typeof value === "object" && value !== null && typeof (value as Record<string, unknown>)[field] === "number";
}

function hasBooleanField(value: unknown, field: string): boolean {
  return typeof value === "object" && value !== null && typeof (value as Record<string, unknown>)[field] === "boolean";
}

function parseEnergyDailyConsumption(raw: unknown): EnergyDailyConsumptionValue {
  if (
    !hasNumberField(raw, "totalPowerW") ||
    !hasNumberField(raw, "dailyWh") ||
    !hasNumberField(raw, "dailyAh") ||
    !hasBooleanField(raw, "complete")
  ) {
    throw new DependencyError(
      "energy.dailyConsumption has an unexpected shape and cannot be used to size the battery",
      { code: "ENERGY_DATA_INVALID_SHAPE", details: { key: "energy.dailyConsumption", raw } }
    );
  }

  return raw as EnergyDailyConsumptionValue;
}

function parseEnergyMaxCurrent(raw: unknown): EnergyMaxCurrentValue {
  if (!hasNumberField(raw, "maxCurrentA") || !hasBooleanField(raw, "complete")) {
    throw new DependencyError(
      "energy.maxCurrent has an unexpected shape and cannot be used to size the battery",
      { code: "ENERGY_DATA_INVALID_SHAPE", details: { key: "energy.maxCurrent", raw } }
    );
  }

  return raw as EnergyMaxCurrentValue;
}

/**
 * Lit exclusivement les valeurs retenues energy.* via EngineContext.
 * Ne recalcule jamais l'énergie : si la donnée est absente ou obsolète,
 * c'est une DependencyError, jamais une nouvelle estimation inventée.
 */
async function readEnergyValue<T>(
  context: EngineContext,
  key: "energy.dailyConsumption" | "energy.maxCurrent",
  parse: (raw: unknown) => T
): Promise<T> {
  const record = await context.getRetainedValue(key);

  if (!record) {
    throw new DependencyError(
      `No "${key}" retained value found for this Project — run the Energy Engine before the Battery Engine`,
      { code: "ENERGY_DATA_MISSING", details: { key } }
    );
  }

  if (record.status !== "ACTIVE") {
    throw new DependencyError(
      `"${key}" is not ACTIVE (status: ${record.status}) — recompute the Energy Engine before sizing the battery`,
      { code: "ENERGY_DATA_OBSOLETE", details: { key, status: record.status } }
    );
  }

  return parse(record.value);
}

function resolveProjectVoltage(voltage: EngineContext["project"]["voltage"]): number | null {
  if (voltage === "V12") return 12;
  if (voltage === "V24") return 24;
  return null;
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
    throw new ValidationError(`${field} is a required battery parameter`, {
      code: "BATTERY_PARAMETER_MISSING",
      details: { field },
    });
  }
}

function validateParameters(input: BatteryEngineInput, projectVoltageV: number | null) {
  assertRequired(input?.technology, "technology");

  if (!KNOWN_CHEMISTRIES.includes(input.technology)) {
    throw new ValidationError(`Unknown battery technology: ${String(input.technology)}`, {
      code: "BATTERY_PARAMETER_INVALID",
      details: { field: "technology", value: input.technology, allowed: KNOWN_CHEMISTRIES },
    });
  }

  assertRequired(input.maxDepthOfDischarge, "maxDepthOfDischarge");
  assertFiniteNumber(input.maxDepthOfDischarge, "maxDepthOfDischarge", "BATTERY_DOD_INVALID");

  if (input.maxDepthOfDischarge <= 0 || input.maxDepthOfDischarge > 1) {
    throw new ValidationError("maxDepthOfDischarge must be within (0, 1]", {
      code: "BATTERY_DOD_INVALID",
      details: { field: "maxDepthOfDischarge", value: input.maxDepthOfDischarge },
    });
  }

  assertRequired(input.desiredAutonomyDays, "desiredAutonomyDays");
  assertFiniteNumber(input.desiredAutonomyDays, "desiredAutonomyDays", "BATTERY_PARAMETER_INVALID");

  if (input.desiredAutonomyDays <= 0) {
    throw new ValidationError("desiredAutonomyDays must be greater than zero", {
      code: "BATTERY_PARAMETER_INVALID",
      details: { field: "desiredAutonomyDays", value: input.desiredAutonomyDays },
    });
  }

  assertRequired(input.systemVoltageV, "systemVoltageV");
  assertFiniteNumber(input.systemVoltageV, "systemVoltageV", "BATTERY_PARAMETER_INVALID");

  if (input.systemVoltageV <= 0) {
    throw new ValidationError("systemVoltageV must be greater than zero", {
      code: "BATTERY_PARAMETER_INVALID",
      details: { field: "systemVoltageV", value: input.systemVoltageV },
    });
  }

  if (projectVoltageV !== null && input.systemVoltageV !== projectVoltageV) {
    throw new ValidationError(
      `systemVoltageV (${input.systemVoltageV} V) does not match the project system voltage (${projectVoltageV} V)`,
      {
        code: "BATTERY_VOLTAGE_INCOMPATIBLE",
        details: { systemVoltageV: input.systemVoltageV, projectVoltageV },
      }
    );
  }
}

/**
 * Fonction pure : calcule le dimensionnement batterie à partir des
 * paramètres et des grandeurs energy.* déjà lues. Ne touche jamais
 * EngineContext ni aucune base de données — testable indépendamment.
 */
export function computeBatteryEngineOutput(
  input: BatteryEngineInput,
  energy: { dailyWh: number; dailyAh: number; maxCurrentA: number }
): BatteryEngineOutput {
  // Formule 1 — énergie utile nécessaire (Wh) :
  // usefulEnergyWh = dailyWh × desiredAutonomyDays
  const usefulEnergyWh = energy.dailyWh * input.desiredAutonomyDays;

  // Formule 2 — capacité utile nécessaire (Ah) :
  // usefulCapacityAh = dailyAh × desiredAutonomyDays
  const usefulCapacityAh = energy.dailyAh * input.desiredAutonomyDays;

  if (energy.dailyAh === 0) {
    // 0 Wh/jour → autonomie théorique mathématiquement indéterminée
    // (division par zéro) : ce n'est pas une valeur infinie utile, c'est
    // un calcul impossible à rapporter tel quel.
    throw new CalculationError(
      "Theoretical autonomy cannot be computed: daily energy consumption (Ah) is zero",
      { code: "BATTERY_AUTONOMY_INDETERMINATE", details: { dailyAh: energy.dailyAh } }
    );
  }

  // Formule 3 — capacité nominale à acquérir (Ah) :
  // nominalCapacityAh = usefulCapacityAh / maxDepthOfDischarge
  const nominalCapacityAh = usefulCapacityAh / input.maxDepthOfDischarge;

  // Formule 4 — autonomie théorique (jours), recalculée indépendamment de
  // desiredAutonomyDays à partir de la capacité utile et du besoin
  // journalier (vérification de cohérence, pas une simple recopie) :
  // autonomyDays = usefulCapacityAh / dailyAh
  const autonomyDays = usefulCapacityAh / energy.dailyAh;

  return {
    technology: input.technology,
    maxDepthOfDischarge: input.maxDepthOfDischarge,
    desiredAutonomyDays: input.desiredAutonomyDays,
    systemVoltageV: input.systemVoltageV,
    dailyWh: energy.dailyWh,
    dailyAh: energy.dailyAh,
    maxCurrentA: energy.maxCurrentA,
    usefulEnergyWh,
    usefulCapacityAh,
    nominalCapacityAh,
    autonomyDays,
  };
}

/**
 * BatteryEngine : implémentation de BaseEngine. Ne dépend d'aucun autre
 * moteur (lit uniquement les valeurs retenues energy.* déjà persistées),
 * ne connaît aucune donnée hors de son propre domaine.
 */
export function createBatteryEngine(): BaseEngine<BatteryEngineInput, BatteryEngineOutput> {
  return {
    id: BATTERY_ENGINE_ID,

    async run(context: EngineContext, input: BatteryEngineInput): Promise<EngineResult<BatteryEngineOutput>> {
      const projectVoltageV = resolveProjectVoltage(context.project.voltage);
      validateParameters(input, projectVoltageV);

      const dailyConsumption = await readEnergyValue(
        context,
        "energy.dailyConsumption",
        parseEnergyDailyConsumption
      );
      const maxCurrent = await readEnergyValue(context, "energy.maxCurrent", parseEnergyMaxCurrent);

      if (!dailyConsumption.complete || !maxCurrent.complete) {
        throw new CalculationError(
          "Energy data for this Project is incomplete: complete the missing consumer data and rerun the Energy Engine before sizing the battery",
          {
            code: "ENERGY_DATA_INCOMPLETE",
            details: {
              dailyConsumptionComplete: dailyConsumption.complete,
              maxCurrentComplete: maxCurrent.complete,
            },
          }
        );
      }

      const output = computeBatteryEngineOutput(input, {
        dailyWh: dailyConsumption.dailyWh,
        dailyAh: dailyConsumption.dailyAh,
        maxCurrentA: maxCurrent.maxCurrentA,
      });

      const usefulEnergy = { usefulEnergyWh: output.usefulEnergyWh };
      const usefulCapacity = { usefulCapacityAh: output.usefulCapacityAh };
      const nominalCapacity = {
        nominalCapacityAh: output.nominalCapacityAh,
        maxDepthOfDischarge: output.maxDepthOfDischarge,
        technology: output.technology,
      };
      const autonomy = { autonomyDays: output.autonomyDays, desiredAutonomyDays: output.desiredAutonomyDays };

      // Uniquement battery.* : ce moteur ne propose jamais de clé
      // appartenant à un autre domaine (solar/alternator/cable/protection/Volta).
      const retainedValues: EngineRetainedValueProposal[] = [
        { key: "battery.usefulEnergy", value: usefulEnergy, simulatedValue: usefulEnergy },
        { key: "battery.usefulCapacity", value: usefulCapacity, simulatedValue: usefulCapacity },
        { key: "battery.nominalCapacity", value: nominalCapacity, simulatedValue: nominalCapacity },
        { key: "battery.autonomy", value: autonomy, simulatedValue: autonomy },
      ];

      // Uniquement battery.* ↓ energy.* : aucune dépendance battery-interne,
      // aucune dépendance vers solar/alternator/cable/protection/Volta.
      const dependencies: EngineDependencyProposal[] = [
        { dependentKey: "battery.usefulEnergy", dependsOnKey: "energy.dailyConsumption" },
        { dependentKey: "battery.usefulEnergy", dependsOnKey: "energy.maxCurrent" },
        { dependentKey: "battery.usefulCapacity", dependsOnKey: "energy.dailyConsumption" },
        { dependentKey: "battery.usefulCapacity", dependsOnKey: "energy.maxCurrent" },
        { dependentKey: "battery.nominalCapacity", dependsOnKey: "energy.dailyConsumption" },
        { dependentKey: "battery.nominalCapacity", dependsOnKey: "energy.maxCurrent" },
        { dependentKey: "battery.autonomy", dependsOnKey: "energy.dailyConsumption" },
        { dependentKey: "battery.autonomy", dependsOnKey: "energy.maxCurrent" },
      ];

      return {
        output,
        retainedValues,
        dependencies,
        debug: { computedAt: context.now().toISOString(), projectVoltageV },
      };
    },
  };
}

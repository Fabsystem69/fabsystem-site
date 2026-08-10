import { CalculationError, DependencyError, ValidationError } from "@/lib/engines/errors";
import type {
  BaseEngine,
  EngineContext,
  EngineDependencyProposal,
  EngineResult,
  EngineRetainedValueProposal,
} from "@/lib/engines/types";

// Phase 4.5 (MASTER-11) : cinquième moteur métier réel, construit
// exclusivement sur le socle de la Phase 4.0. Évalue uniquement la
// recharge par chargeur secteur à partir des besoins déjà produits par
// l'Energy Engine (Phase 4.1) et le Battery Engine (Phase 4.2) — jamais
// recalculés ici. Ne connaît ni alternateur, ni solaire, ni protections,
// ni sections de câble, ni Volta (contrainte explicite de cette phase).

export const CHARGER_ENGINE_ID = "charger.recharging";

// Aucune valeur métier n'est codée en dur : tous les paramètres suivants
// doivent être fournis explicitement par l'appelant.
export type ChargerEngineInput = {
  /** Puissance nominale du chargeur, en Watts. */
  nominalPowerW: number;
  /** Courant maximal délivré par le chargeur, en Ampères. */
  maxCurrentA: number;
  /** Tension de sortie du chargeur, en Volts. Contrairement à
   * l'Alternator/Solar Engine, ce moteur ne lit pas `Project.voltage` :
   * la tension de sortie est un paramètre propre au chargeur choisi. */
  outputVoltageV: number;
  /** Rendement global du chargeur (0, 1]. */
  systemEfficiencyRatio: number;
  /** Durée de charge disponible, en heures (0 à 24). */
  chargingDurationHours: number;
};

export type ChargerEngineOutput = {
  nominalPowerW: number;
  maxCurrentA: number;
  outputVoltageV: number;
  systemEfficiencyRatio: number;
  chargingDurationHours: number;
  /** Grandeurs lues depuis energy.* et battery.* (jamais recalculées). */
  dailyWh: number;
  usefulCapacityAh: number;
  /** Puissance réellement disponible (W), après application de la
   * contrainte la plus restrictive (nominale ou courant × tension) et du
   * rendement. */
  availablePowerW: number;
  /** Courant de charge (A). */
  chargingCurrentA: number;
  /** Énergie rechargeable (Wh) sur la durée de charge donnée. */
  rechargeableEnergyWh: number;
  /** Temps de recharge théorique (h) pour combler la capacité utile
   * batterie (battery.usefulCapacity). */
  theoreticalRechargeTimeHours: number;
  /** Couverture des besoins journaliers (energy.dailyConsumption) :
   * 1 = couverture exacte, > 1 = surplus, < 1 = insuffisant. */
  coverageRatio: number;
};

type EnergyDailyConsumptionValue = {
  totalPowerW: number;
  dailyWh: number;
  dailyAh: number;
  complete: boolean;
};

type BatteryUsefulCapacityValue = {
  usefulCapacityAh: number;
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
      "energy.dailyConsumption has an unexpected shape and cannot be used by the Charger Engine",
      { code: "ENERGY_DATA_INVALID_SHAPE", details: { key: "energy.dailyConsumption", raw } }
    );
  }

  return raw as EnergyDailyConsumptionValue;
}

function parseBatteryUsefulCapacity(raw: unknown): BatteryUsefulCapacityValue {
  if (!hasNumberField(raw, "usefulCapacityAh")) {
    throw new DependencyError(
      "battery.usefulCapacity has an unexpected shape and cannot be used by the Charger Engine",
      { code: "BATTERY_DATA_INVALID_SHAPE", details: { key: "battery.usefulCapacity", raw } }
    );
  }

  return raw as BatteryUsefulCapacityValue;
}

/**
 * Lit exclusivement une valeur retenue via EngineContext. Ne recalcule
 * jamais Energy ni Battery : absente ou obsolète → DependencyError.
 */
async function readRetainedValue<T>(
  context: EngineContext,
  key: "energy.dailyConsumption" | "battery.usefulCapacity",
  domainLabel: "energy" | "battery",
  parse: (raw: unknown) => T
): Promise<T> {
  const record = await context.getRetainedValue(key);

  if (!record) {
    throw new DependencyError(
      `No "${key}" retained value found for this Project — run the ${
        domainLabel === "energy" ? "Energy" : "Battery"
      } Engine before the Charger Engine`,
      { code: `${domainLabel.toUpperCase()}_DATA_MISSING`, details: { key } }
    );
  }

  if (record.status !== "ACTIVE") {
    throw new DependencyError(
      `"${key}" is not ACTIVE (status: ${record.status}) — recompute it before evaluating the charger`,
      { code: `${domainLabel.toUpperCase()}_DATA_OBSOLETE`, details: { key, status: record.status } }
    );
  }

  return parse(record.value);
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
    throw new ValidationError(`${field} is a required charger parameter`, {
      code: "CHARGER_PARAMETER_MISSING",
      details: { field },
    });
  }
}

function validateParameters(input: ChargerEngineInput) {
  assertRequired(input?.nominalPowerW, "nominalPowerW");
  assertFiniteNumber(input.nominalPowerW, "nominalPowerW", "CHARGER_POWER_INVALID");

  if (input.nominalPowerW <= 0) {
    throw new ValidationError("nominalPowerW must be greater than zero", {
      code: "CHARGER_POWER_INVALID",
      details: { field: "nominalPowerW", value: input.nominalPowerW },
    });
  }

  assertRequired(input.maxCurrentA, "maxCurrentA");
  assertFiniteNumber(input.maxCurrentA, "maxCurrentA", "CHARGER_CURRENT_INVALID");

  if (input.maxCurrentA <= 0) {
    throw new ValidationError("maxCurrentA must be greater than zero", {
      code: "CHARGER_CURRENT_INVALID",
      details: { field: "maxCurrentA", value: input.maxCurrentA },
    });
  }

  assertRequired(input.outputVoltageV, "outputVoltageV");
  assertFiniteNumber(input.outputVoltageV, "outputVoltageV", "CHARGER_CURRENT_INVALID");

  if (input.outputVoltageV <= 0) {
    throw new ValidationError("outputVoltageV must be greater than zero", {
      code: "CHARGER_CURRENT_INVALID",
      details: { field: "outputVoltageV", value: input.outputVoltageV },
    });
  }

  assertRequired(input.systemEfficiencyRatio, "systemEfficiencyRatio");
  assertFiniteNumber(input.systemEfficiencyRatio, "systemEfficiencyRatio", "CHARGER_EFFICIENCY_INVALID");

  if (input.systemEfficiencyRatio <= 0 || input.systemEfficiencyRatio > 1) {
    throw new ValidationError("systemEfficiencyRatio must be within (0, 1]", {
      code: "CHARGER_EFFICIENCY_INVALID",
      details: { field: "systemEfficiencyRatio", value: input.systemEfficiencyRatio },
    });
  }

  assertRequired(input.chargingDurationHours, "chargingDurationHours");
  assertFiniteNumber(input.chargingDurationHours, "chargingDurationHours", "CHARGER_DURATION_INVALID");

  if (input.chargingDurationHours < 0) {
    throw new ValidationError("chargingDurationHours cannot be negative", {
      code: "CHARGER_DURATION_INVALID",
      details: { field: "chargingDurationHours", value: input.chargingDurationHours },
    });
  }

  if (input.chargingDurationHours > 24) {
    // Un jour ne peut physiquement pas compter plus de 24 heures de
    // charge : contrainte dimensionnelle, pas une règle métier.
    throw new ValidationError("chargingDurationHours cannot exceed 24 hours", {
      code: "CHARGER_DURATION_INVALID",
      details: { field: "chargingDurationHours", value: input.chargingDurationHours },
    });
  }
}

/**
 * Fonction pure : calcule l'évaluation de recharge chargeur à partir des
 * paramètres et des grandeurs energy.* et battery.* déjà lues. Ne touche
 * jamais EngineContext ni aucune base de données — testable indépendamment.
 */
export function computeChargerEngineOutput(
  input: ChargerEngineInput,
  energy: { dailyWh: number },
  battery: { usefulCapacityAh: number }
): ChargerEngineOutput {
  if (energy.dailyWh === 0) {
    // Couverture = énergie rechargeable / besoin journalier : un besoin
    // nul rend ce ratio mathématiquement indéterminé (0/0), jamais
    // laissé fuiter comme NaN.
    throw new CalculationError(
      "Coverage ratio cannot be computed: daily energy consumption (Wh) is zero",
      { code: "CHARGER_COVERAGE_INDETERMINATE", details: { dailyWh: energy.dailyWh } }
    );
  }

  // Formule 1 — puissance réellement disponible (W) : la contrainte la
  // plus restrictive entre la puissance nominale et le produit
  // courant maximal × tension de sortie, après application du rendement.
  // Un chargeur est limité par la première de ses deux limites nominales
  // (puissance ou courant) qui est atteinte — jamais par une valeur
  // inventée entre les deux.
  const ratedPowerW = Math.min(input.nominalPowerW, input.maxCurrentA * input.outputVoltageV);
  const availablePowerW = ratedPowerW * input.systemEfficiencyRatio;

  // Formule 2 — courant de charge (A) :
  // chargingCurrentA = availablePowerW / outputVoltageV
  const chargingCurrentA = availablePowerW / input.outputVoltageV;

  // Formule 3 — énergie rechargeable (Wh) sur la durée de charge :
  // rechargeableEnergyWh = availablePowerW × chargingDurationHours
  const rechargeableEnergyWh = availablePowerW * input.chargingDurationHours;

  // Formule 4 — temps de recharge théorique (h) pour combler la capacité
  // utile batterie (battery.usefulCapacity) :
  // theoreticalRechargeTimeHours = usefulCapacityAh / chargingCurrentA
  const theoreticalRechargeTimeHours = battery.usefulCapacityAh / chargingCurrentA;

  // Formule 5 — couverture des besoins journaliers
  // (energy.dailyConsumption) :
  // coverageRatio = rechargeableEnergyWh / dailyWh
  const coverageRatio = rechargeableEnergyWh / energy.dailyWh;

  return {
    nominalPowerW: input.nominalPowerW,
    maxCurrentA: input.maxCurrentA,
    outputVoltageV: input.outputVoltageV,
    systemEfficiencyRatio: input.systemEfficiencyRatio,
    chargingDurationHours: input.chargingDurationHours,
    dailyWh: energy.dailyWh,
    usefulCapacityAh: battery.usefulCapacityAh,
    availablePowerW,
    chargingCurrentA,
    rechargeableEnergyWh,
    theoreticalRechargeTimeHours,
    coverageRatio,
  };
}

/**
 * ChargerEngine : implémentation de BaseEngine. Ne dépend d'aucun code
 * d'Energy Engine, Battery Engine, Alternator Engine ou Solar Engine (lit
 * uniquement des valeurs retenues déjà persistées), ne connaît aucune
 * donnée hors de son propre domaine.
 */
export function createChargerEngine(): BaseEngine<ChargerEngineInput, ChargerEngineOutput> {
  return {
    id: CHARGER_ENGINE_ID,

    async run(context: EngineContext, input: ChargerEngineInput): Promise<EngineResult<ChargerEngineOutput>> {
      validateParameters(input);

      const dailyConsumption = await readRetainedValue(
        context,
        "energy.dailyConsumption",
        "energy",
        parseEnergyDailyConsumption
      );
      const usefulCapacity = await readRetainedValue(
        context,
        "battery.usefulCapacity",
        "battery",
        parseBatteryUsefulCapacity
      );

      if (!dailyConsumption.complete) {
        throw new CalculationError(
          "Energy data for this Project is incomplete: complete the missing consumer data and rerun the Energy Engine before evaluating the charger",
          { code: "ENERGY_DATA_INCOMPLETE", details: { dailyConsumptionComplete: dailyConsumption.complete } }
        );
      }

      const output = computeChargerEngineOutput(
        input,
        { dailyWh: dailyConsumption.dailyWh },
        { usefulCapacityAh: usefulCapacity.usefulCapacityAh }
      );

      const availablePower = { availablePowerW: output.availablePowerW };
      const chargingCurrent = { chargingCurrentA: output.chargingCurrentA };
      const rechargeableEnergy = { rechargeableEnergyWh: output.rechargeableEnergyWh };
      const rechargeTime = { theoreticalRechargeTimeHours: output.theoreticalRechargeTimeHours };
      const coverage = { coverageRatio: output.coverageRatio };

      // Uniquement charger.* : ce moteur ne propose jamais de clé
      // appartenant à un autre domaine (alternator/solar/cable/protection/Volta).
      const retainedValues: EngineRetainedValueProposal[] = [
        { key: "charger.availablePower", value: availablePower, simulatedValue: availablePower },
        { key: "charger.chargingCurrent", value: chargingCurrent, simulatedValue: chargingCurrent },
        {
          key: "charger.rechargeableEnergy",
          value: rechargeableEnergy,
          simulatedValue: rechargeableEnergy,
        },
        { key: "charger.rechargeTime", value: rechargeTime, simulatedValue: rechargeTime },
        { key: "charger.coverage", value: coverage, simulatedValue: coverage },
      ];

      // Uniquement des dépendances réellement utilisées par les formules
      // (mission explicite) :
      // - charger.availablePower      : dérivée uniquement des paramètres → aucune dépendance
      // - charger.chargingCurrent     : dérivée de la puissance disponible + tension de sortie → aucune dépendance
      // - charger.rechargeableEnergy  : dérivée de la puissance disponible + durée → aucune dépendance
      // - charger.rechargeTime        : utilise battery.usefulCapacity.usefulCapacityAh
      // - charger.coverage            : utilise energy.dailyConsumption.dailyWh
      const dependencies: EngineDependencyProposal[] = [
        { dependentKey: "charger.rechargeTime", dependsOnKey: "battery.usefulCapacity" },
        { dependentKey: "charger.coverage", dependsOnKey: "energy.dailyConsumption" },
      ];

      return {
        output,
        retainedValues,
        dependencies,
        debug: { computedAt: context.now().toISOString() },
      };
    },
  };
}

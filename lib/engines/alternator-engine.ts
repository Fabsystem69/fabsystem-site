import { CalculationError, DependencyError, ValidationError } from "@/lib/engines/errors";
import type {
  BaseEngine,
  EngineContext,
  EngineDependencyProposal,
  EngineResult,
  EngineRetainedValueProposal,
} from "@/lib/engines/types";

// Phase 4.3 (MASTER-11) : troisième moteur métier réel, construit
// exclusivement sur le socle de la Phase 4.0. Évalue uniquement la
// capacité de recharge par alternateur à partir des besoins déjà produits
// par l'Energy Engine (Phase 4.1) et le Battery Engine (Phase 4.2) —
// jamais recalculés ici. Ne connaît ni solaire, ni chargeur secteur, ni
// protections, ni sections de câble, ni Volta (contrainte explicite).

export const ALTERNATOR_ENGINE_ID = "alternator.charging";

// Aucune valeur métier n'est codée en dur : tous les paramètres suivants
// doivent être fournis explicitement (efficiencyRatio excepté, dont
// l'omission signifie explicitement "aucun rendement à appliquer", pas une
// valeur métier par défaut — voir "Arbitrages nécessaires" du rapport).
export type AlternatorEngineInput = {
  /** Courant nominal (maximal) de l'alternateur, en Ampères. */
  nominalCurrentA: number;
  /** Courant réellement disponible pour la charge de la batterie, en
   * Ampères (après consommation moteur/autres circuits). */
  availableCurrentA: number;
  /** Régime moteur de référence, en tr/min — traçabilité de l'hypothèse,
   * n'intervient dans aucune formule (aucune courbe alternateur/régime
   * n'est disponible dans ce périmètre). */
  referenceRpm: number;
  /** Rendement global de la chaîne de charge (0, 1], si applicable
   * (ex. pertes câblage / convertisseur). Optionnel : en son absence,
   * aucun rendement n'est appliqué. */
  efficiencyRatio?: number;
  /** Durée de roulage disponible pour la charge, en heures (0 à 24). */
  rollingDurationHours: number;
};

export type AlternatorEngineOutput = {
  nominalCurrentA: number;
  availableCurrentA: number;
  referenceRpm: number;
  efficiencyRatio: number | null;
  rollingDurationHours: number;
  projectVoltageV: number;
  /** Grandeurs lues depuis energy.* et battery.* (jamais recalculées). */
  dailyWh: number;
  usefulCapacityAh: number;
  /** Courant exploitable (A) = availableCurrentA × rendement éventuel. */
  usableCurrentA: number;
  /** Énergie rechargeable (Wh) sur la durée de roulage donnée. */
  rechargeableEnergyWh: number;
  /** Temps de recharge théorique (h) pour combler la capacité utile
   * batterie (energy.dailyConsumption / battery.usefulCapacity). */
  theoreticalRechargeTimeHours: number;
  /** Marge de recharge (Wh) = énergie rechargeable − besoin journalier.
   * Positive = surplus, négative = déficit. */
  rechargeMarginWh: number;
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
      "energy.dailyConsumption has an unexpected shape and cannot be used by the Alternator Engine",
      { code: "ENERGY_DATA_INVALID_SHAPE", details: { key: "energy.dailyConsumption", raw } }
    );
  }

  return raw as EnergyDailyConsumptionValue;
}

function parseBatteryUsefulCapacity(raw: unknown): BatteryUsefulCapacityValue {
  if (!hasNumberField(raw, "usefulCapacityAh")) {
    throw new DependencyError(
      "battery.usefulCapacity has an unexpected shape and cannot be used by the Alternator Engine",
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
      } Engine before the Alternator Engine`,
      { code: `${domainLabel.toUpperCase()}_DATA_MISSING`, details: { key } }
    );
  }

  if (record.status !== "ACTIVE") {
    throw new DependencyError(
      `"${key}" is not ACTIVE (status: ${record.status}) — recompute it before evaluating the alternator`,
      { code: `${domainLabel.toUpperCase()}_DATA_OBSOLETE`, details: { key, status: record.status } }
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
    throw new ValidationError(`${field} is a required alternator parameter`, {
      code: "ALTERNATOR_PARAMETER_MISSING",
      details: { field },
    });
  }
}

function validateParameters(input: AlternatorEngineInput) {
  assertRequired(input?.nominalCurrentA, "nominalCurrentA");
  assertFiniteNumber(input.nominalCurrentA, "nominalCurrentA", "ALTERNATOR_CURRENT_INVALID");

  if (input.nominalCurrentA <= 0) {
    throw new ValidationError("nominalCurrentA must be greater than zero", {
      code: "ALTERNATOR_CURRENT_INVALID",
      details: { field: "nominalCurrentA", value: input.nominalCurrentA },
    });
  }

  assertRequired(input.availableCurrentA, "availableCurrentA");
  assertFiniteNumber(input.availableCurrentA, "availableCurrentA", "ALTERNATOR_CURRENT_INVALID");

  if (input.availableCurrentA <= 0) {
    throw new ValidationError("availableCurrentA must be greater than zero", {
      code: "ALTERNATOR_CURRENT_INVALID",
      details: { field: "availableCurrentA", value: input.availableCurrentA },
    });
  }

  if (input.availableCurrentA > input.nominalCurrentA) {
    throw new ValidationError(
      `availableCurrentA (${input.availableCurrentA} A) cannot exceed nominalCurrentA (${input.nominalCurrentA} A)`,
      {
        code: "ALTERNATOR_CURRENT_INVALID",
        details: { availableCurrentA: input.availableCurrentA, nominalCurrentA: input.nominalCurrentA },
      }
    );
  }

  assertRequired(input.referenceRpm, "referenceRpm");
  assertFiniteNumber(input.referenceRpm, "referenceRpm", "ALTERNATOR_PARAMETER_INVALID");

  if (input.referenceRpm <= 0) {
    throw new ValidationError("referenceRpm must be greater than zero", {
      code: "ALTERNATOR_PARAMETER_INVALID",
      details: { field: "referenceRpm", value: input.referenceRpm },
    });
  }

  if (typeof input.efficiencyRatio !== "undefined") {
    assertFiniteNumber(input.efficiencyRatio, "efficiencyRatio", "ALTERNATOR_EFFICIENCY_INVALID");

    if (input.efficiencyRatio <= 0 || input.efficiencyRatio > 1) {
      throw new ValidationError("efficiencyRatio must be within (0, 1]", {
        code: "ALTERNATOR_EFFICIENCY_INVALID",
        details: { field: "efficiencyRatio", value: input.efficiencyRatio },
      });
    }
  }

  assertRequired(input.rollingDurationHours, "rollingDurationHours");
  assertFiniteNumber(input.rollingDurationHours, "rollingDurationHours", "ALTERNATOR_PARAMETER_INVALID");

  if (input.rollingDurationHours < 0) {
    throw new ValidationError("rollingDurationHours cannot be negative", {
      code: "ALTERNATOR_PARAMETER_INVALID",
      details: { field: "rollingDurationHours", value: input.rollingDurationHours },
    });
  }

  if (input.rollingDurationHours > 24) {
    // Un jour ne peut physiquement pas compter plus de 24 heures de
    // roulage : contrainte dimensionnelle, pas une règle métier.
    throw new ValidationError("rollingDurationHours cannot exceed 24 hours", {
      code: "ALTERNATOR_PARAMETER_INVALID",
      details: { field: "rollingDurationHours", value: input.rollingDurationHours },
    });
  }
}

/**
 * Fonction pure : calcule l'évaluation de recharge alternateur à partir
 * des paramètres et des grandeurs energy.* et battery.* déjà lues. Ne touche
 * jamais EngineContext ni aucune base de données — testable indépendamment.
 */
export function computeAlternatorEngineOutput(
  input: AlternatorEngineInput,
  energy: { dailyWh: number },
  battery: { usefulCapacityAh: number },
  projectVoltageV: number | null
): AlternatorEngineOutput {
  if (projectVoltageV === null) {
    // La tension système du Project est nécessaire pour convertir un
    // courant exploitable en énergie rechargeable (Wh) ; sans elle, ce
    // calcul est indéterminé, pas approximé.
    throw new CalculationError(
      "Rechargeable energy cannot be computed: the project system voltage is unknown",
      { code: "ALTERNATOR_VOLTAGE_UNKNOWN" }
    );
  }

  // Formule 1 — courant exploitable (A) :
  // usableCurrentA = availableCurrentA × (efficiencyRatio ?? 1)
  const usableCurrentA = input.availableCurrentA * (input.efficiencyRatio ?? 1);

  // Formule 2 — énergie rechargeable (Wh) sur la durée de roulage :
  // rechargeableEnergyWh = usableCurrentA × projectVoltageV × rollingDurationHours
  const rechargeableEnergyWh = usableCurrentA * projectVoltageV * input.rollingDurationHours;

  // Formule 3 — temps de recharge théorique (h) pour combler la capacité
  // utile batterie (battery.usefulCapacity) :
  // theoreticalRechargeTimeHours = usefulCapacityAh / usableCurrentA
  const theoreticalRechargeTimeHours = battery.usefulCapacityAh / usableCurrentA;

  // Formule 4 — marge de recharge (Wh), surplus (+) ou déficit (−) par
  // rapport au besoin journalier (energy.dailyConsumption) :
  // rechargeMarginWh = rechargeableEnergyWh − dailyWh
  const rechargeMarginWh = rechargeableEnergyWh - energy.dailyWh;

  return {
    nominalCurrentA: input.nominalCurrentA,
    availableCurrentA: input.availableCurrentA,
    referenceRpm: input.referenceRpm,
    efficiencyRatio: input.efficiencyRatio ?? null,
    rollingDurationHours: input.rollingDurationHours,
    projectVoltageV,
    dailyWh: energy.dailyWh,
    usefulCapacityAh: battery.usefulCapacityAh,
    usableCurrentA,
    rechargeableEnergyWh,
    theoreticalRechargeTimeHours,
    rechargeMarginWh,
  };
}

/**
 * AlternatorEngine : implémentation de BaseEngine. Ne dépend d'aucun code
 * d'Energy Engine ou de Battery Engine (lit uniquement leurs valeurs
 * retenues déjà persistées), ne connaît aucune donnée hors de son propre
 * domaine.
 */
export function createAlternatorEngine(): BaseEngine<AlternatorEngineInput, AlternatorEngineOutput> {
  return {
    id: ALTERNATOR_ENGINE_ID,

    async run(
      context: EngineContext,
      input: AlternatorEngineInput
    ): Promise<EngineResult<AlternatorEngineOutput>> {
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
          "Energy data for this Project is incomplete: complete the missing consumer data and rerun the Energy Engine before evaluating the alternator",
          { code: "ENERGY_DATA_INCOMPLETE", details: { dailyConsumptionComplete: dailyConsumption.complete } }
        );
      }

      const projectVoltageV = resolveProjectVoltage(context.project.voltage);

      const output = computeAlternatorEngineOutput(
        input,
        { dailyWh: dailyConsumption.dailyWh },
        { usefulCapacityAh: usefulCapacity.usefulCapacityAh },
        projectVoltageV
      );

      const usableCurrent = { usableCurrentA: output.usableCurrentA };
      const rechargeableEnergy = { rechargeableEnergyWh: output.rechargeableEnergyWh };
      const rechargeTime = { theoreticalRechargeTimeHours: output.theoreticalRechargeTimeHours };
      const rechargeMargin = { rechargeMarginWh: output.rechargeMarginWh };

      // Uniquement alternator.* : ce moteur ne propose jamais de clé
      // appartenant à un autre domaine (solar/charger/cable/protection/Volta).
      const retainedValues: EngineRetainedValueProposal[] = [
        { key: "alternator.usableCurrent", value: usableCurrent, simulatedValue: usableCurrent },
        { key: "alternator.rechargeableEnergy", value: rechargeableEnergy, simulatedValue: rechargeableEnergy },
        { key: "alternator.rechargeTime", value: rechargeTime, simulatedValue: rechargeTime },
        { key: "alternator.rechargeMargin", value: rechargeMargin, simulatedValue: rechargeMargin },
      ];

      // Graphe exact : une arête n'existe que lorsque la grandeur
      // alternator.* dépend réellement, dans sa formule, de la valeur
      // energy.*/battery.* concernée — pas simplement parce qu'elle a été
      // lue pour une vérification de complétude.
      // - alternator.usableCurrent      : dérivée uniquement des paramètres → aucune dépendance
      // - alternator.rechargeableEnergy : dérivée du courant exploitable + tension Project + durée → aucune dépendance
      // - alternator.rechargeTime       : utilise battery.usefulCapacity.usefulCapacityAh
      // - alternator.rechargeMargin     : utilise energy.dailyConsumption.dailyWh
      const dependencies: EngineDependencyProposal[] = [
        { dependentKey: "alternator.rechargeTime", dependsOnKey: "battery.usefulCapacity" },
        { dependentKey: "alternator.rechargeMargin", dependsOnKey: "energy.dailyConsumption" },
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

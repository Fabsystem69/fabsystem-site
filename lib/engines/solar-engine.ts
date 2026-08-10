import { CalculationError, DependencyError, ValidationError } from "@/lib/engines/errors";
import type {
  BaseEngine,
  EngineContext,
  EngineDependencyProposal,
  EngineResult,
  EngineRetainedValueProposal,
} from "@/lib/engines/types";

// Phase 4.4 (MASTER-11) : quatrième moteur métier réel, construit
// exclusivement sur le socle de la Phase 4.0. Évalue uniquement la
// production énergétique solaire à partir des besoins déjà produits par
// l'Energy Engine (Phase 4.1) et le Battery Engine (Phase 4.2) — jamais
// recalculés ici. Ne connaît ni alternateur, ni chargeur secteur, ni
// protections, ni sections de câble, ni Volta (contrainte explicite).

export const SOLAR_ENGINE_ID = "solar.production";

// Aucune valeur métier n'est codée en dur, et aucun ensoleillement n'est
// jamais inventé : `equivalentSunHours` doit systématiquement provenir de
// l'appelant. `shadingFactor` est le seul paramètre optionnel — son
// absence signifie explicitement "aucun masquage à appliquer", pas une
// valeur métier par défaut (voir "Arbitrages nécessaires" du rapport).
export type SolarEngineInput = {
  /** Puissance crête totale des panneaux, en Watts-crête (Wc/Wp). */
  panelPowerWp: number;
  /** Heures de production équivalentes par jour (ensoleillement effectif
   * à pleine puissance), fournies par l'appelant — jamais déduites d'une
   * table géographique interne. */
  equivalentSunHours: number;
  /** Rendement global du système (0, 1] : pertes câblage, régulateur/MPPT,
   * température, orientation et inclinaison déjà prises en compte en
   * amont par l'appelant s'il y a lieu. */
  systemEfficiencyRatio: number;
  /** Facteur de masquage (0, 1], si fourni : fraction de la puissance
   * conservée après ombrage éventuel. */
  shadingFactor?: number;
};

export type SolarEngineOutput = {
  panelPowerWp: number;
  equivalentSunHours: number;
  systemEfficiencyRatio: number;
  shadingFactor: number | null;
  projectVoltageV: number;
  /** Grandeurs lues depuis energy.* et battery.* (jamais recalculées). */
  dailyWh: number;
  usefulCapacityAh: number;
  /** Puissance photovoltaïque exploitable (W) — étape interne, non
   * exposée comme valeur retenue propre (voir rapport, section Calculs). */
  usablePowerW: number;
  /** Énergie solaire quotidienne (Wh). */
  dailySolarEnergyWh: number;
  /** Courant moyen de charge pendant la production (A). */
  averageChargingCurrentA: number;
  /** Temps de recharge théorique (h) pour combler la capacité utile
   * batterie (battery.usefulCapacity). */
  theoreticalRechargeTimeHours: number;
  /** Taux de couverture des besoins journaliers (energy.dailyConsumption) :
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
      "energy.dailyConsumption has an unexpected shape and cannot be used by the Solar Engine",
      { code: "ENERGY_DATA_INVALID_SHAPE", details: { key: "energy.dailyConsumption", raw } }
    );
  }

  return raw as EnergyDailyConsumptionValue;
}

function parseBatteryUsefulCapacity(raw: unknown): BatteryUsefulCapacityValue {
  if (!hasNumberField(raw, "usefulCapacityAh")) {
    throw new DependencyError(
      "battery.usefulCapacity has an unexpected shape and cannot be used by the Solar Engine",
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
      } Engine before the Solar Engine`,
      { code: `${domainLabel.toUpperCase()}_DATA_MISSING`, details: { key } }
    );
  }

  if (record.status !== "ACTIVE") {
    throw new DependencyError(
      `"${key}" is not ACTIVE (status: ${record.status}) — recompute it before evaluating solar production`,
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
    throw new ValidationError(`${field} is a required solar parameter`, {
      code: "SOLAR_PARAMETER_MISSING",
      details: { field },
    });
  }
}

function validateParameters(input: SolarEngineInput) {
  assertRequired(input?.panelPowerWp, "panelPowerWp");
  assertFiniteNumber(input.panelPowerWp, "panelPowerWp", "SOLAR_POWER_INVALID");

  if (input.panelPowerWp <= 0) {
    throw new ValidationError("panelPowerWp must be greater than zero", {
      code: "SOLAR_POWER_INVALID",
      details: { field: "panelPowerWp", value: input.panelPowerWp },
    });
  }

  assertRequired(input.equivalentSunHours, "equivalentSunHours");
  assertFiniteNumber(input.equivalentSunHours, "equivalentSunHours", "SOLAR_SUN_HOURS_INVALID");

  if (input.equivalentSunHours <= 0) {
    throw new ValidationError("equivalentSunHours must be greater than zero", {
      code: "SOLAR_SUN_HOURS_INVALID",
      details: { field: "equivalentSunHours", value: input.equivalentSunHours },
    });
  }

  if (input.equivalentSunHours > 24) {
    // Un jour ne peut physiquement pas compter plus de 24 heures de
    // production : contrainte dimensionnelle, pas une règle métier.
    throw new ValidationError("equivalentSunHours cannot exceed 24 hours", {
      code: "SOLAR_SUN_HOURS_INVALID",
      details: { field: "equivalentSunHours", value: input.equivalentSunHours },
    });
  }

  assertRequired(input.systemEfficiencyRatio, "systemEfficiencyRatio");
  assertFiniteNumber(input.systemEfficiencyRatio, "systemEfficiencyRatio", "SOLAR_EFFICIENCY_INVALID");

  if (input.systemEfficiencyRatio <= 0 || input.systemEfficiencyRatio > 1) {
    throw new ValidationError("systemEfficiencyRatio must be within (0, 1]", {
      code: "SOLAR_EFFICIENCY_INVALID",
      details: { field: "systemEfficiencyRatio", value: input.systemEfficiencyRatio },
    });
  }

  if (typeof input.shadingFactor !== "undefined") {
    assertFiniteNumber(input.shadingFactor, "shadingFactor", "SOLAR_EFFICIENCY_INVALID");

    if (input.shadingFactor <= 0 || input.shadingFactor > 1) {
      throw new ValidationError("shadingFactor must be within (0, 1]", {
        code: "SOLAR_EFFICIENCY_INVALID",
        details: { field: "shadingFactor", value: input.shadingFactor },
      });
    }
  }
}

/**
 * Fonction pure : calcule l'évaluation de production solaire à partir des
 * paramètres et des grandeurs energy.* et battery.* déjà lues. Ne touche
 * jamais EngineContext ni aucune base de données — testable indépendamment.
 */
export function computeSolarEngineOutput(
  input: SolarEngineInput,
  energy: { dailyWh: number },
  battery: { usefulCapacityAh: number },
  projectVoltageV: number | null
): SolarEngineOutput {
  if (projectVoltageV === null) {
    // La tension système du Project est nécessaire pour convertir une
    // puissance exploitable en courant moyen ; sans elle, ce calcul est
    // indéterminé, pas approximé.
    throw new CalculationError(
      "Average charging current cannot be computed: the project system voltage is unknown",
      { code: "SOLAR_VOLTAGE_UNKNOWN" }
    );
  }

  if (energy.dailyWh === 0) {
    // Taux de couverture = énergie solaire / besoin journalier :
    // un besoin nul rend ce ratio mathématiquement indéterminé (0/0),
    // jamais laissé fuiter comme NaN.
    throw new CalculationError(
      "Coverage ratio cannot be computed: daily energy consumption (Wh) is zero",
      { code: "SOLAR_COVERAGE_INDETERMINATE", details: { dailyWh: energy.dailyWh } }
    );
  }

  // Formule 1 — puissance photovoltaïque exploitable (W), étape interne :
  // usablePowerW = panelPowerWp × systemEfficiencyRatio × (shadingFactor ?? 1)
  const usablePowerW = input.panelPowerWp * input.systemEfficiencyRatio * (input.shadingFactor ?? 1);

  // Formule 2 — énergie solaire quotidienne (Wh) :
  // dailySolarEnergyWh = usablePowerW × equivalentSunHours
  const dailySolarEnergyWh = usablePowerW * input.equivalentSunHours;

  // Formule 3 — courant moyen de charge (A) pendant la production :
  // averageChargingCurrentA = usablePowerW / projectVoltageV
  const averageChargingCurrentA = usablePowerW / projectVoltageV;

  // Formule 4 — temps de recharge théorique (h) pour combler la capacité
  // utile batterie (battery.usefulCapacity) :
  // theoreticalRechargeTimeHours = usefulCapacityAh / averageChargingCurrentA
  const theoreticalRechargeTimeHours = battery.usefulCapacityAh / averageChargingCurrentA;

  // Formule 5 — taux de couverture des besoins journaliers
  // (energy.dailyConsumption) :
  // coverageRatio = dailySolarEnergyWh / dailyWh
  const coverageRatio = dailySolarEnergyWh / energy.dailyWh;

  return {
    panelPowerWp: input.panelPowerWp,
    equivalentSunHours: input.equivalentSunHours,
    systemEfficiencyRatio: input.systemEfficiencyRatio,
    shadingFactor: input.shadingFactor ?? null,
    projectVoltageV,
    dailyWh: energy.dailyWh,
    usefulCapacityAh: battery.usefulCapacityAh,
    usablePowerW,
    dailySolarEnergyWh,
    averageChargingCurrentA,
    theoreticalRechargeTimeHours,
    coverageRatio,
  };
}

/**
 * SolarEngine : implémentation de BaseEngine. Ne dépend d'aucun code
 * d'Energy Engine ou de Battery Engine (lit uniquement leurs valeurs
 * retenues déjà persistées), ne connaît aucune donnée hors de son propre
 * domaine.
 */
export function createSolarEngine(): BaseEngine<SolarEngineInput, SolarEngineOutput> {
  return {
    id: SOLAR_ENGINE_ID,

    async run(context: EngineContext, input: SolarEngineInput): Promise<EngineResult<SolarEngineOutput>> {
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
          "Energy data for this Project is incomplete: complete the missing consumer data and rerun the Energy Engine before evaluating solar production",
          { code: "ENERGY_DATA_INCOMPLETE", details: { dailyConsumptionComplete: dailyConsumption.complete } }
        );
      }

      const projectVoltageV = resolveProjectVoltage(context.project.voltage);

      const output = computeSolarEngineOutput(
        input,
        { dailyWh: dailyConsumption.dailyWh },
        { usefulCapacityAh: usefulCapacity.usefulCapacityAh },
        projectVoltageV
      );

      const dailyEnergy = { dailySolarEnergyWh: output.dailySolarEnergyWh };
      const averageChargingCurrent = { averageChargingCurrentA: output.averageChargingCurrentA };
      const rechargeTime = { theoreticalRechargeTimeHours: output.theoreticalRechargeTimeHours };
      const coverage = { coverageRatio: output.coverageRatio };

      // Uniquement solar.* : ce moteur ne propose jamais de clé
      // appartenant à un autre domaine (alternator/charger/cable/protection/Volta).
      const retainedValues: EngineRetainedValueProposal[] = [
        { key: "solar.dailyEnergy", value: dailyEnergy, simulatedValue: dailyEnergy },
        {
          key: "solar.averageChargingCurrent",
          value: averageChargingCurrent,
          simulatedValue: averageChargingCurrent,
        },
        { key: "solar.rechargeTime", value: rechargeTime, simulatedValue: rechargeTime },
        { key: "solar.coverage", value: coverage, simulatedValue: coverage },
      ];

      // Uniquement des dépendances réellement utilisées par les formules
      // (mission explicite) :
      // - solar.dailyEnergy             : dérivée uniquement des paramètres → aucune dépendance
      // - solar.averageChargingCurrent  : dérivée de la puissance exploitable + tension Project → aucune dépendance
      // - solar.rechargeTime            : utilise battery.usefulCapacity.usefulCapacityAh
      // - solar.coverage                : utilise energy.dailyConsumption.dailyWh
      const dependencies: EngineDependencyProposal[] = [
        { dependentKey: "solar.rechargeTime", dependsOnKey: "battery.usefulCapacity" },
        { dependentKey: "solar.coverage", dependsOnKey: "energy.dailyConsumption" },
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

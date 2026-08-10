import { CalculationError, DependencyError } from "@/lib/engines/errors";
import type {
  BaseEngine,
  EngineContext,
  EngineDependencyProposal,
  EngineResult,
  EngineRetainedValueProposal,
} from "@/lib/engines/types";

// Phase 4.6 (MASTER-11) : premier moteur d'agrégation, construit
// exclusivement sur le socle de la Phase 4.0. Ne réalise aucun calcul
// primaire : il compose uniquement les valeurs déjà produites par
// l'Energy Engine (4.1), le Battery Engine (4.2), l'Alternator Engine
// (4.3), le Solar Engine (4.4) et le Charger Engine (4.5). N'appelle
// jamais un autre moteur, ne recalcule aucune de leurs formules.

export const GLOBAL_ENERGY_BALANCE_ENGINE_ID = "energyBalance.global";

// Aucun paramètre : ce moteur ne fait qu'agréger des valeurs déjà
// retenues pour le Project, il n'a donc rien à recevoir en entrée.
export type GlobalEnergyBalanceEngineInput = Record<string, never>;

export type GlobalEnergyBalanceEngineOutput = {
  /** Besoin journalier (Wh), lu depuis energy.dailyConsumption. */
  dailyWh: number;
  /** Énergie utile déjà dimensionnée par le Battery Engine (Wh). */
  usefulEnergyWh: number;
  alternatorRechargeableEnergyWh: number;
  solarRechargeableEnergyWh: number;
  chargerRechargeableEnergyWh: number;
  /** Énergie disponible totale (Wh) : la réserve utile batterie. */
  totalAvailableEnergyWh: number;
  /** Énergie rechargeable totale (Wh) : somme des trois sources de recharge. */
  totalRechargeableEnergyWh: number;
  /** Couverture énergétique globale : 1 = couverture exacte du besoin
   * journalier par l'ensemble des sources de recharge combinées. */
  globalCoverageRatio: number;
  /** Équilibre énergétique (Wh) : positif = surplus, négatif = déficit. */
  globalBalanceWh: number;
  /** Autonomie globale (jours) : null si l'équilibre est soutenable
   * (recharge ≥ besoin), sinon nombre de jours avant épuisement de la
   * réserve utile au rythme du déficit quotidien constaté. */
  globalAutonomyDays: number | null;
};

type EnergyDailyConsumptionValue = { dailyWh: number; complete: boolean };
type BatteryUsefulEnergyValue = { usefulEnergyWh: number };
type AlternatorRechargeableEnergyValue = { rechargeableEnergyWh: number };
type SolarDailyEnergyValue = { dailySolarEnergyWh: number };
type ChargerRechargeableEnergyValue = { rechargeableEnergyWh: number };

function hasNumberField(value: unknown, field: string): boolean {
  return typeof value === "object" && value !== null && typeof (value as Record<string, unknown>)[field] === "number";
}

function hasBooleanField(value: unknown, field: string): boolean {
  return typeof value === "object" && value !== null && typeof (value as Record<string, unknown>)[field] === "boolean";
}

function parseEnergyDailyConsumption(raw: unknown): EnergyDailyConsumptionValue {
  if (!hasNumberField(raw, "dailyWh") || !hasBooleanField(raw, "complete")) {
    throw new DependencyError(
      "energy.dailyConsumption has an unexpected shape and cannot be used by the Global Energy Balance Engine",
      { code: "ENERGY_DATA_INCOMPATIBLE", details: { key: "energy.dailyConsumption", raw } }
    );
  }

  return raw as EnergyDailyConsumptionValue;
}

function parseBatteryUsefulEnergy(raw: unknown): BatteryUsefulEnergyValue {
  if (!hasNumberField(raw, "usefulEnergyWh")) {
    throw new DependencyError(
      "battery.usefulEnergy has an unexpected shape and cannot be used by the Global Energy Balance Engine",
      { code: "BATTERY_DATA_INCOMPATIBLE", details: { key: "battery.usefulEnergy", raw } }
    );
  }

  return raw as BatteryUsefulEnergyValue;
}

function parseAlternatorRechargeableEnergy(raw: unknown): AlternatorRechargeableEnergyValue {
  if (!hasNumberField(raw, "rechargeableEnergyWh")) {
    throw new DependencyError(
      "alternator.rechargeableEnergy has an unexpected shape and cannot be used by the Global Energy Balance Engine",
      { code: "ALTERNATOR_DATA_INCOMPATIBLE", details: { key: "alternator.rechargeableEnergy", raw } }
    );
  }

  return raw as AlternatorRechargeableEnergyValue;
}

function parseSolarDailyEnergy(raw: unknown): SolarDailyEnergyValue {
  if (!hasNumberField(raw, "dailySolarEnergyWh")) {
    throw new DependencyError(
      "solar.dailyEnergy has an unexpected shape and cannot be used by the Global Energy Balance Engine",
      { code: "SOLAR_DATA_INCOMPATIBLE", details: { key: "solar.dailyEnergy", raw } }
    );
  }

  return raw as SolarDailyEnergyValue;
}

function parseChargerRechargeableEnergy(raw: unknown): ChargerRechargeableEnergyValue {
  if (!hasNumberField(raw, "rechargeableEnergyWh")) {
    throw new DependencyError(
      "charger.rechargeableEnergy has an unexpected shape and cannot be used by the Global Energy Balance Engine",
      { code: "CHARGER_DATA_INCOMPATIBLE", details: { key: "charger.rechargeableEnergy", raw } }
    );
  }

  return raw as ChargerRechargeableEnergyValue;
}

type SourceKey =
  | "energy.dailyConsumption"
  | "battery.usefulEnergy"
  | "alternator.rechargeableEnergy"
  | "solar.dailyEnergy"
  | "charger.rechargeableEnergy";

type SourceDomain = "ENERGY" | "BATTERY" | "ALTERNATOR" | "SOLAR" | "CHARGER";

/**
 * Lit exclusivement une valeur retenue via EngineContext. Ne recalcule
 * jamais Energy/Battery/Alternator/Solar/Charger : absente ou obsolète →
 * DependencyError. Même patron que les moteurs précédents (Phases
 * 4.2-4.5), reproduit ici faute de pouvoir les modifier pour partager un
 * helper commun (cf. audit Phase 4.5.1).
 */
async function readRetainedValue<T>(
  context: EngineContext,
  key: SourceKey,
  domain: SourceDomain,
  parse: (raw: unknown) => T
): Promise<T> {
  const record = await context.getRetainedValue(key);

  if (!record) {
    throw new DependencyError(
      `No "${key}" retained value found for this Project — run the required engine before the Global Energy Balance Engine`,
      { code: `${domain}_DATA_MISSING`, details: { key } }
    );
  }

  if (record.status !== "ACTIVE") {
    throw new DependencyError(
      `"${key}" is not ACTIVE (status: ${record.status}) — recompute it before evaluating the global energy balance`,
      { code: `${domain}_DATA_OBSOLETE`, details: { key, status: record.status } }
    );
  }

  return parse(record.value);
}

/**
 * Fonction pure : compose l'équilibre énergétique global à partir des
 * grandeurs déjà lues sur les cinq domaines. N'implémente aucune formule
 * primaire — uniquement des sommes, différences et ratios entre valeurs
 * déjà calculées ailleurs.
 */
export function computeGlobalEnergyBalanceOutput(sources: {
  dailyWh: number;
  usefulEnergyWh: number;
  alternatorRechargeableEnergyWh: number;
  solarRechargeableEnergyWh: number;
  chargerRechargeableEnergyWh: number;
}): GlobalEnergyBalanceEngineOutput {
  if (sources.dailyWh === 0) {
    // Couverture = énergie rechargeable totale / besoin journalier : un
    // besoin nul rend ce ratio mathématiquement indéterminé (0/0), jamais
    // laissé fuiter comme NaN.
    throw new CalculationError(
      "Global coverage ratio cannot be computed: daily energy consumption (Wh) is zero",
      { code: "ENERGY_BALANCE_COVERAGE_INDETERMINATE", details: { dailyWh: sources.dailyWh } }
    );
  }

  // Agrégation 1 — énergie rechargeable totale (Wh) : somme des trois
  // sources de recharge déjà calculées (aucune n'est recalculée) :
  // totalRechargeableEnergyWh = alternator + solar + charger
  const totalRechargeableEnergyWh =
    sources.alternatorRechargeableEnergyWh +
    sources.solarRechargeableEnergyWh +
    sources.chargerRechargeableEnergyWh;

  // Agrégation 2 — énergie disponible totale (Wh) : la réserve utile déjà
  // dimensionnée par le Battery Engine, reprise telle quelle.
  const totalAvailableEnergyWh = sources.usefulEnergyWh;

  // Agrégation 3 — couverture énergétique globale :
  // globalCoverageRatio = totalRechargeableEnergyWh / dailyWh
  const globalCoverageRatio = totalRechargeableEnergyWh / sources.dailyWh;

  // Agrégation 4 — équilibre énergétique (Wh), positif = surplus, négatif
  // = déficit (recouvre le même concept que « marge énergétique » listée
  // en exemple par la mission — voir Arbitrages du rapport) :
  // globalBalanceWh = totalRechargeableEnergyWh − dailyWh
  const globalBalanceWh = totalRechargeableEnergyWh - sources.dailyWh;

  // Agrégation 5 — autonomie globale (jours) : équilibre soutenable
  // (recharge ≥ besoin) → null ; sinon nombre de jours avant épuisement
  // de la réserve utile au rythme du déficit quotidien constaté :
  // globalAutonomyDays = globalBalanceWh >= 0 ? null : totalAvailableEnergyWh / |globalBalanceWh|
  const globalAutonomyDays =
    globalBalanceWh >= 0 ? null : totalAvailableEnergyWh / Math.abs(globalBalanceWh);

  return {
    dailyWh: sources.dailyWh,
    usefulEnergyWh: sources.usefulEnergyWh,
    alternatorRechargeableEnergyWh: sources.alternatorRechargeableEnergyWh,
    solarRechargeableEnergyWh: sources.solarRechargeableEnergyWh,
    chargerRechargeableEnergyWh: sources.chargerRechargeableEnergyWh,
    totalAvailableEnergyWh,
    totalRechargeableEnergyWh,
    globalCoverageRatio,
    globalBalanceWh,
    globalAutonomyDays,
  };
}

/**
 * GlobalEnergyBalanceEngine : implémentation de BaseEngine. Ne dépend
 * d'aucun code des cinq moteurs sources (lit uniquement leurs valeurs
 * retenues déjà persistées), ne connaît aucune donnée hors de son propre
 * domaine d'agrégation.
 */
export function createGlobalEnergyBalanceEngine(): BaseEngine<
  GlobalEnergyBalanceEngineInput,
  GlobalEnergyBalanceEngineOutput
> {
  return {
    id: GLOBAL_ENERGY_BALANCE_ENGINE_ID,

    async run(
      context: EngineContext,
      _input: GlobalEnergyBalanceEngineInput
    ): Promise<EngineResult<GlobalEnergyBalanceEngineOutput>> {
      const dailyConsumption = await readRetainedValue(
        context,
        "energy.dailyConsumption",
        "ENERGY",
        parseEnergyDailyConsumption
      );
      const usefulEnergy = await readRetainedValue(
        context,
        "battery.usefulEnergy",
        "BATTERY",
        parseBatteryUsefulEnergy
      );
      const alternatorEnergy = await readRetainedValue(
        context,
        "alternator.rechargeableEnergy",
        "ALTERNATOR",
        parseAlternatorRechargeableEnergy
      );
      const solarEnergy = await readRetainedValue(
        context,
        "solar.dailyEnergy",
        "SOLAR",
        parseSolarDailyEnergy
      );
      const chargerEnergy = await readRetainedValue(
        context,
        "charger.rechargeableEnergy",
        "CHARGER",
        parseChargerRechargeableEnergy
      );

      if (!dailyConsumption.complete) {
        throw new CalculationError(
          "Energy data for this Project is incomplete: complete the missing consumer data and rerun the Energy Engine before evaluating the global energy balance",
          { code: "ENERGY_DATA_INCOMPLETE", details: { dailyConsumptionComplete: dailyConsumption.complete } }
        );
      }

      const output = computeGlobalEnergyBalanceOutput({
        dailyWh: dailyConsumption.dailyWh,
        usefulEnergyWh: usefulEnergy.usefulEnergyWh,
        alternatorRechargeableEnergyWh: alternatorEnergy.rechargeableEnergyWh,
        solarRechargeableEnergyWh: solarEnergy.dailySolarEnergyWh,
        chargerRechargeableEnergyWh: chargerEnergy.rechargeableEnergyWh,
      });

      const totalAvailable = { totalAvailableEnergyWh: output.totalAvailableEnergyWh };
      const totalRechargeable = { totalRechargeableEnergyWh: output.totalRechargeableEnergyWh };
      const coverage = { globalCoverageRatio: output.globalCoverageRatio };
      const balance = { globalBalanceWh: output.globalBalanceWh };
      const autonomy = { globalAutonomyDays: output.globalAutonomyDays };

      // Uniquement energyBalance.* : ce moteur ne propose jamais de clé
      // appartenant à un autre domaine.
      const retainedValues: EngineRetainedValueProposal[] = [
        { key: "energyBalance.totalAvailableEnergy", value: totalAvailable, simulatedValue: totalAvailable },
        {
          key: "energyBalance.totalRechargeableEnergy",
          value: totalRechargeable,
          simulatedValue: totalRechargeable,
        },
        { key: "energyBalance.coverage", value: coverage, simulatedValue: coverage },
        { key: "energyBalance.balance", value: balance, simulatedValue: balance },
        { key: "energyBalance.autonomy", value: autonomy, simulatedValue: autonomy },
      ];

      // Graphe exact : une arête n'existe que lorsque la grandeur
      // energyBalance.* dépend réellement, dans sa formule, de la source
      // visée — jamais vers solar/alternator/charger internes non lus,
      // jamais une invalidation globale.
      const dependencies: EngineDependencyProposal[] = [
        { dependentKey: "energyBalance.totalAvailableEnergy", dependsOnKey: "battery.usefulEnergy" },

        { dependentKey: "energyBalance.totalRechargeableEnergy", dependsOnKey: "alternator.rechargeableEnergy" },
        { dependentKey: "energyBalance.totalRechargeableEnergy", dependsOnKey: "solar.dailyEnergy" },
        { dependentKey: "energyBalance.totalRechargeableEnergy", dependsOnKey: "charger.rechargeableEnergy" },

        { dependentKey: "energyBalance.coverage", dependsOnKey: "energy.dailyConsumption" },
        { dependentKey: "energyBalance.coverage", dependsOnKey: "alternator.rechargeableEnergy" },
        { dependentKey: "energyBalance.coverage", dependsOnKey: "solar.dailyEnergy" },
        { dependentKey: "energyBalance.coverage", dependsOnKey: "charger.rechargeableEnergy" },

        { dependentKey: "energyBalance.balance", dependsOnKey: "energy.dailyConsumption" },
        { dependentKey: "energyBalance.balance", dependsOnKey: "alternator.rechargeableEnergy" },
        { dependentKey: "energyBalance.balance", dependsOnKey: "solar.dailyEnergy" },
        { dependentKey: "energyBalance.balance", dependsOnKey: "charger.rechargeableEnergy" },

        { dependentKey: "energyBalance.autonomy", dependsOnKey: "energy.dailyConsumption" },
        { dependentKey: "energyBalance.autonomy", dependsOnKey: "battery.usefulEnergy" },
        { dependentKey: "energyBalance.autonomy", dependsOnKey: "alternator.rechargeableEnergy" },
        { dependentKey: "energyBalance.autonomy", dependsOnKey: "solar.dailyEnergy" },
        { dependentKey: "energyBalance.autonomy", dependsOnKey: "charger.rechargeableEnergy" },
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

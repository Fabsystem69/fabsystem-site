// Moteur de calcul du bilan de consommation pour le dossier client van
// (docs/_local/Prompt_Claude_Fabsystem_Dossier_Van.md, étape 3) — DÉLIBÉRÉMENT
// séparé de lib/calc/energy-budget.ts (outil public anonyme, un seul
// scénario implicite, une seule méthode) : ce module couvre 3 méthodes de
// calcul, un point de mesure explicite, plusieurs scénarios indépendants, et
// une synthèse technique réservée au coach avec rendements/marge explicites.
// Règle d'or reprise telle quelle du cahier des charges : une donnée
// inconnue ne vaut jamais zéro — un appareil incalculable rend le bilan
// "incomplet", jamais un faux total.

export type CoachingCalcMethod = "PUISSANCE_TEMPS" | "ENERGIE_JOUR" | "RECHARGE_CYCLE";
export type CoachingPowerSupply = "DC12" | "DC24" | "DC_AUTRE" | "USB" | "AC230" | "INCONNU";

export type CoachingDeviceUsageInput = {
  calcMethod: CoachingCalcMethod;
  continuousPowerW?: number | null;
  effectiveHoursPerDay?: number | null;
  availabilityHoursPerDay?: number | null;
  dutyCycleRatio?: number | null;
  dailyEnergyWhPerUnit?: number | null;
  dailyEnergyIsGroupTotal?: boolean;
  energyPerCycleWh?: number | null;
  cyclesPerDay?: number | null;
};

export type DeviceEnergyResult = { energyWh: number; incomplete: false } | { energyWh: null; incomplete: true };

function isKnown(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// Méthode 1 : puissance × temps effectif. Une durée "effective" fournie
// directement n'est JAMAIS multipliée en plus par un taux de fonctionnement
// (sinon un réfrigérateur qui tourne réellement 12 h/j serait recompté comme
// s'il tournait 24 h à pleine puissance) — le taux ne s'applique qu'à une
// durée de DISPONIBILITÉ, quand c'est la seule donnée fournie.
function resolveEffectiveHours(usage: CoachingDeviceUsageInput): number | null {
  if (isKnown(usage.effectiveHoursPerDay)) return usage.effectiveHoursPerDay;
  if (isKnown(usage.availabilityHoursPerDay) && isKnown(usage.dutyCycleRatio)) {
    return usage.availabilityHoursPerDay * usage.dutyCycleRatio;
  }
  return null;
}

function computeMethodPuissanceTemps(usage: CoachingDeviceUsageInput, quantity: number): DeviceEnergyResult {
  const hours = resolveEffectiveHours(usage);
  if (!isKnown(usage.continuousPowerW) || hours === null) return { energyWh: null, incomplete: true };
  return { energyWh: quantity * usage.continuousPowerW * hours, incomplete: false };
}

function computeMethodEnergieJour(usage: CoachingDeviceUsageInput, quantity: number): DeviceEnergyResult {
  if (!isKnown(usage.dailyEnergyWhPerUnit)) return { energyWh: null, incomplete: true };
  // Une valeur déjà globale (dailyEnergyIsGroupTotal) ne se multiplie jamais
  // une seconde fois par la quantité.
  const energyWh = usage.dailyEnergyIsGroupTotal ? usage.dailyEnergyWhPerUnit : quantity * usage.dailyEnergyWhPerUnit;
  return { energyWh, incomplete: false };
}

function computeMethodRechargeCycle(usage: CoachingDeviceUsageInput, quantity: number): DeviceEnergyResult {
  if (!isKnown(usage.energyPerCycleWh) || !isKnown(usage.cyclesPerDay)) return { energyWh: null, incomplete: true };
  return { energyWh: quantity * usage.energyPerCycleWh * usage.cyclesPerDay, incomplete: false };
}

export function computeDeviceEnergyWh(usage: CoachingDeviceUsageInput, quantity: number): DeviceEnergyResult {
  if (quantity <= 0) return { energyWh: null, incomplete: true };
  if (usage.calcMethod === "PUISSANCE_TEMPS") return computeMethodPuissanceTemps(usage, quantity);
  if (usage.calcMethod === "ENERGIE_JOUR") return computeMethodEnergieJour(usage, quantity);
  return computeMethodRechargeCycle(usage, quantity);
}

export type ScenarioDeviceInput = {
  deviceId: string;
  quantity: number;
  powerSupply: CoachingPowerSupply;
  usage: CoachingDeviceUsageInput;
};

export type ScenarioBilan = {
  perDevice: { deviceId: string; energyWh: number | null; incomplete: boolean }[];
  subtotalsByPowerType: Record<CoachingPowerSupply, number>;
  totalWhPerDay: number;
  topConsumers: { deviceId: string; energyWh: number }[];
  incompleteCount: number;
  isIncomplete: boolean;
};

const POWER_SUPPLY_KEYS: CoachingPowerSupply[] = ["DC12", "DC24", "DC_AUTRE", "USB", "AC230", "INCONNU"];

// Sous-total connu plutôt qu'un faux total final (retour utilisateur
// explicite) : les appareils incomplets sont exclus de totalWhPerDay, jamais
// comptés comme 0 — isIncomplete signale qu'il manque des données.
export function computeScenarioBilan(devices: ScenarioDeviceInput[]): ScenarioBilan {
  const perDevice = devices.map((d) => {
    const result = computeDeviceEnergyWh(d.usage, d.quantity);
    return { deviceId: d.deviceId, energyWh: result.energyWh, incomplete: result.incomplete };
  });

  const subtotalsByPowerType = Object.fromEntries(POWER_SUPPLY_KEYS.map((k) => [k, 0])) as Record<CoachingPowerSupply, number>;
  for (const d of devices) {
    const energy = perDevice.find((p) => p.deviceId === d.deviceId)?.energyWh;
    if (energy !== null && energy !== undefined) subtotalsByPowerType[d.powerSupply] += energy;
  }

  const totalWhPerDay = perDevice.reduce((sum, p) => sum + (p.energyWh ?? 0), 0);
  const topConsumers = perDevice
    .filter((p): p is { deviceId: string; energyWh: number; incomplete: false } => p.energyWh !== null)
    .sort((a, b) => b.energyWh - a.energyWh)
    .slice(0, 5)
    .map((p) => ({ deviceId: p.deviceId, energyWh: p.energyWh }));

  const incompleteCount = perDevice.filter((p) => p.incomplete).length;

  return { perDevice, subtotalsByPowerType, totalWhPerDay, topConsumers, incompleteCount, isIncomplete: incompleteCount > 0 };
}

// --- Synthèse technique réservée au coach -----------------------------------
// Sépare le total utile des appareils de l'énergie prélevée sur la
// batterie — jamais un rendement ou une marge devinés silencieusement
// (retour utilisateur explicite). Un paramètre requis manquant ou un
// rendement à 0 rend le résultat incomplet plutôt que de produire un chiffre
// faux.
export type TechnicalSynthesisParams = {
  pathEfficiency: number | null; // 0 < x <= 1, rendement du trajet source->batterie
  auxiliaryLoadsWh: number; // conso à vide du convertisseur/auxiliaires, déjà exclue du total appareils
  marginRatio: number; // ex. 1.2 pour +20%, toujours explicite
  autonomyDays: number;
  usableCapacityRatio: number; // 0 < x <= 1 (LiFePO4 ~0.9, plomb ~0.5)
  systemVoltage: number;
};

export type TechnicalSynthesisResult =
  | {
      incomplete: false;
      batterySideEnergyWh: number;
      requiredUsableEnergyWh: number;
      indicativeCapacityWh: number;
      indicativeCapacityAh: number;
    }
  | { incomplete: true; reason: string };

export function computeTechnicalSynthesis(usefulEnergyWhPerDay: number, params: TechnicalSynthesisParams): TechnicalSynthesisResult {
  if (params.pathEfficiency === null || params.pathEfficiency <= 0 || params.pathEfficiency > 1) {
    return { incomplete: true, reason: "Rendement du trajet manquant ou invalide (doit être entre 0 exclu et 1)." };
  }
  if (params.usableCapacityRatio <= 0 || params.usableCapacityRatio > 1) {
    return { incomplete: true, reason: "Fraction utilisable de la batterie invalide." };
  }
  if (params.systemVoltage <= 0) {
    return { incomplete: true, reason: "Tension du parc batterie manquante." };
  }

  // Énergie côté batterie = énergie utile ÷ rendement, puis auxiliaires
  // ajoutés APRÈS (jamais divisés par le rendement une seconde fois : ils
  // sont déjà mesurés côté batterie), puis marge explicite en dernier.
  const batterySideEnergyWh = (usefulEnergyWhPerDay / params.pathEfficiency + params.auxiliaryLoadsWh) * params.marginRatio;
  const requiredUsableEnergyWh = batterySideEnergyWh * params.autonomyDays;
  const indicativeCapacityWh = requiredUsableEnergyWh / params.usableCapacityRatio;
  const indicativeCapacityAh = indicativeCapacityWh / params.systemVoltage;

  return { incomplete: false, batterySideEnergyWh, requiredUsableEnergyWh, indicativeCapacityWh, indicativeCapacityAh };
}

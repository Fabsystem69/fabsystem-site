import { z } from "zod";

// UI-8 FINAL : validation serveur du contrat réel de chaque moteur
// (mission §1 : "valider les inputs avec le contrat réel du moteur").
// Ces schémas ne réimplémentent aucune formule — ils valident uniquement
// la forme des données avant de les transmettre telles quelles à
// EngineRunner. Un seul schéma par moteur, indexé par l'id réel du moteur
// (lib/engines/*-engine.ts), pour éviter toute liste dupliquée.

const energyConsumerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  powerW: z.number().finite().nonnegative().optional(),
  currentA: z.number().finite().nonnegative().optional(),
  voltageV: z.number().finite().positive().optional(),
  dailyUsageHours: z.number().finite().min(0).max(24),
  quantity: z.number().finite().nonnegative().optional(),
});

export const energyEngineInputSchema = z.object({
  consumers: z.array(energyConsumerSchema).min(1),
});

export const batteryEngineInputSchema = z.object({
  technology: z.enum(["LEAD_ACID", "AGM", "GEL", "LIFEPO4"]),
  maxDepthOfDischarge: z.number().finite().gt(0).lte(1),
  desiredAutonomyDays: z.number().finite().positive(),
  systemVoltageV: z.number().finite().positive(),
});

export const alternatorEngineInputSchema = z.object({
  nominalCurrentA: z.number().finite().positive(),
  availableCurrentA: z.number().finite().positive(),
  referenceRpm: z.number().finite().positive(),
  efficiencyRatio: z.number().finite().gt(0).lte(1).optional(),
  rollingDurationHours: z.number().finite().min(0).max(24),
});

export const solarEngineInputSchema = z.object({
  panelPowerWp: z.number().finite().positive(),
  equivalentSunHours: z.number().finite().positive(),
  systemEfficiencyRatio: z.number().finite().gt(0).lte(1),
  shadingFactor: z.number().finite().gt(0).lte(1).optional(),
});

export const chargerEngineInputSchema = z.object({
  nominalPowerW: z.number().finite().positive(),
  maxCurrentA: z.number().finite().positive(),
  outputVoltageV: z.number().finite().positive(),
  systemEfficiencyRatio: z.number().finite().gt(0).lte(1),
  chargingDurationHours: z.number().finite().min(0).max(24),
});

export const globalEnergyBalanceEngineInputSchema = z.object({}).strict();

const circuitDefinitionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  circuitType: z.string().trim().min(1).max(60).optional(),
  consumerNames: z.array(z.string().trim().min(1)).min(1),
});

export const circuitEngineInputSchema = z.object({
  circuits: z.array(circuitDefinitionSchema).min(1),
});

const cableDefinitionSchema = z.object({
  circuitId: z.string().trim().min(1),
  oneWayLengthM: z.number().finite().positive(),
  maxVoltageDropPercentage: z.number().finite().positive(),
  conductorResistivityOhmMm2PerM: z.number().finite().positive(),
  availableSectionsMm2: z.array(z.number().finite().positive()).min(1),
});

export const cableEngineInputSchema = z.object({
  cables: z.array(cableDefinitionSchema).min(1),
});

const protectionCatalogEntrySchema = z.object({
  type: z.string().trim().min(1).max(60),
  ratingA: z.number().finite().positive(),
});

const protectionDefinitionSchema = z.object({
  circuitId: z.string().trim().min(1),
  minMarginRatio: z.number().finite().positive(),
  maxMarginRatio: z.number().finite().positive(),
  catalog: z.array(protectionCatalogEntrySchema).min(1),
});

export const protectionEngineInputSchema = z.object({
  protections: z.array(protectionDefinitionSchema).min(1),
});

const diagramDefinitionSchema = z.object({
  circuitId: z.string().trim().min(1),
});

export const diagramEngineInputSchema = z.object({
  circuits: z.array(diagramDefinitionSchema).min(1),
});

export const ENGINE_INPUT_SCHEMAS = {
  "energy.consumption": energyEngineInputSchema,
  "battery.sizing": batteryEngineInputSchema,
  "alternator.charging": alternatorEngineInputSchema,
  "solar.production": solarEngineInputSchema,
  "charger.recharging": chargerEngineInputSchema,
  "energyBalance.global": globalEnergyBalanceEngineInputSchema,
  "circuit.structure": circuitEngineInputSchema,
  "cable.sizing": cableEngineInputSchema,
  "protection.selection": protectionEngineInputSchema,
  "diagram.model": diagramEngineInputSchema,
} as const;

export type RegisteredEngineId = keyof typeof ENGINE_INPUT_SCHEMAS;

export function isRegisteredEngineId(value: string): value is RegisteredEngineId {
  return Object.prototype.hasOwnProperty.call(ENGINE_INPUT_SCHEMAS, value);
}

export function getEngineInputSchema(engineId: string) {
  if (!isRegisteredEngineId(engineId)) {
    return null;
  }
  return ENGINE_INPUT_SCHEMAS[engineId];
}

// Libellés humains + regroupement en deux chaînes réelles (mission §3),
// utilisés uniquement pour l'affichage — jamais pour dériver une règle
// métier (la structure réelle vient de lib/engines/index.ts).
export const ENGINE_LABELS: Record<RegisteredEngineId, string> = {
  "energy.consumption": "Énergie / consommations",
  "battery.sizing": "Batterie",
  "alternator.charging": "Alternateur",
  "solar.production": "Solaire",
  "charger.recharging": "Chargeur",
  "energyBalance.global": "Bilan énergétique",
  "circuit.structure": "Circuits",
  "cable.sizing": "Câbles",
  "protection.selection": "Protections",
  "diagram.model": "Schéma",
};

export const ENERGY_CHAIN: RegisteredEngineId[] = [
  "energy.consumption",
  "battery.sizing",
  "alternator.charging",
  "solar.production",
  "charger.recharging",
  "energyBalance.global",
];

export const CIRCUIT_CHAIN: RegisteredEngineId[] = [
  "circuit.structure",
  "cable.sizing",
  "protection.selection",
  "diagram.model",
];

// UI-12 — courtes descriptions déplacées ici depuis chaque module moteur
// (texte identique, non modifié) pour que la Vue Project les affiche dans
// l'en-tête de carte partagé (EngineModuleShell) sans dupliquer le texte à
// deux endroits. Purement éditorial, aucune règle métier.
export const ENGINE_DESCRIPTIONS: Record<RegisteredEngineId, string> = {
  "energy.consumption":
    "Listez vos appareils pour calculer le besoin énergétique quotidien de votre installation.",
  "battery.sizing": "Dimensionne la batterie à partir de votre consommation déjà retenue.",
  "alternator.charging": "Estime la recharge apportée par l'alternateur pendant le roulage.",
  "solar.production": "Estime la production et la couverture apportées par les panneaux solaires.",
  "charger.recharging": "Estime la recharge apportée par un chargeur secteur/quai.",
  "energyBalance.global":
    "Compare vos besoins journaliers aux sources de recharge déjà retenues.",
  "circuit.structure": "Regroupez vos consommateurs déjà retenus en circuits logiques.",
  "cable.sizing": "Dimensionne les conducteurs de chaque circuit déjà retenu.",
  "protection.selection": "Choisit la protection adaptée à chaque circuit déjà câblé.",
  "diagram.model": "Assemble les circuits déjà retenus (circuit, câble, protection) en un schéma.",
};

// UI-12 — regroupement visuel en deux familles (mission §5), affichage
// uniquement. La structure fonctionnelle réelle reste ENERGY_CHAIN /
// CIRCUIT_CHAIN, inchangées ci-dessus.
export const ENGINE_FAMILIES: { id: string; label: string; engineIds: RegisteredEngineId[] }[] = [
  { id: "energie", label: "Énergie", engineIds: ENERGY_CHAIN },
  { id: "distribution", label: "Distribution", engineIds: CIRCUIT_CHAIN },
];

// UI-12 — pour chaque moteur à entrée "plate" (clé fixe), la clé de valeur
// retenue la plus représentative à prévisualiser dans l'en-tête de carte
// repliée (mission §6 : "résultat important quand disponible"). Les
// moteurs de la chaîne Circuit utilisent des clés dynamiques
// (circuit.<id>, cable.<id>...) : ils sont prévisualisés par un simple
// comptage, géré directement dans la page (aucune clé fixe à lister ici).
export const ENGINE_PRIMARY_VALUE_KEY: Partial<Record<RegisteredEngineId, string>> = {
  "energy.consumption": "energy.dailyConsumption",
  "battery.sizing": "battery.autonomy",
  "alternator.charging": "alternator.rechargeableEnergy",
  "solar.production": "solar.dailyEnergy",
  "charger.recharging": "charger.rechargeableEnergy",
  "energyBalance.global": "energyBalance.balance",
};

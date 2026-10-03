// Source unique de la fiche de découverte papier (pure, sans dépendance
// serveur). Elle reflète le formulaire client « Mon van » : mêmes sections,
// mêmes libellés, mêmes choix (importés de lib/coaching-form-options.ts) et
// mêmes champs métier. Les `key` sont STABLES : la relecture IA d'une photo de
// fiche remplie s'appuie dessus. Ne jamais renommer une key ; en ajouter de
// nouvelles et incrémenter DISCOVERY_SHEET_VERSION si la structure ou les
// choix changent.
// `prismaField` = champ CoachingProject alimenté. Notation pointée pour
// l'installation existante : "existingInstallation.<clé>[.detail]".
// Champs de la fiche sans pendant dans le formulaire client (stockage réservé
// coach, jamais lu par /mon-compte) : preoccupations, questionsEnAttente,
// notesInternes ; ils ne sont jamais restitués au client (voir
// discovery-sheet-values.ts).

import {
  ASSET_TYPE_OPTIONS,
  CLIENT_LEVEL_OPTIONS,
  DAYS_WITHOUT_RECHARGE_OPTIONS,
  EMPTY_CHOICE_LABEL,
  PROJECT_STAGE_OPTIONS,
  SOLAR_PREFERENCE_OPTIONS,
  UNKNOWN_STATUS_LABEL,
  USAGE_PATTERN_OPTIONS,
} from "@/lib/coaching-form-options";
import {
  EXISTING_INSTALLATION_KEYS,
  EXISTING_INSTALLATION_LABELS,
  EXISTING_INSTALLATION_STATUSES,
  EXISTING_INSTALLATION_STATUS_LABELS,
  type ExistingInstallationKey,
} from "@/lib/crm/existing-installation";

export const DISCOVERY_SHEET_VERSION = "2026-10-v3";

// « Je ne sais pas » des questions tri-état et oui/non.
export const UNKNOWN_OPTION = UNKNOWN_STATUS_LABEL;

export type DiscoveryFieldKind =
  | "text"
  | "longtext"
  | "checkbox-group"
  | "yesno-unknown"
  | "table";

export type DiscoveryTableColumn = {
  readonly key: string;
  readonly label: string;
  readonly options?: readonly string[];
};

export type DiscoveryField = {
  readonly key: string;
  readonly label: string;
  readonly kind: DiscoveryFieldKind;
  readonly options?: readonly string[];
  readonly prismaField?: string;
  readonly lines?: number;
  readonly columns?: readonly DiscoveryTableColumn[];
  readonly hint?: string;
};

export type DiscoverySection = {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly coachOnly?: boolean;
  // Les sections d'un même groupe partagent une page imprimée.
  readonly pageGroup: number;
  readonly fields: readonly DiscoveryField[];
};

// Choix fermé à valeur vide possible : la dernière case est toujours
// « Je ne sais pas encore » (champ laissé vide, jamais une valeur inventée).
const withEmptyChoice = (options: readonly string[]): readonly string[] => [...options, EMPTY_CHOICE_LABEL];

const TRI_STATE_OPTIONS: readonly string[] = EXISTING_INSTALLATION_STATUSES.map(
  (status) => EXISTING_INSTALLATION_STATUS_LABELS[status],
);

const existingItem = (
  fieldKey: string,
  installationKey: ExistingInstallationKey,
): readonly DiscoveryField[] => [
  {
    key: fieldKey,
    label: EXISTING_INSTALLATION_LABELS[installationKey],
    kind: "checkbox-group",
    options: TRI_STATE_OPTIONS,
    prismaField: `existingInstallation.${installationKey}`,
  },
  {
    key: `${fieldKey}_detail`,
    label: "Détail (marque, capacité, puissance...)",
    kind: "text",
    prismaField: `existingInstallation.${installationKey}.detail`,
  },
];

// Clés de champ stables de la section 7 (existing_<clé de l'installation>).
const EXISTING_FIELD_KEYS: Record<ExistingInstallationKey, string> = {
  battery: "existing_battery",
  solar: "existing_solar",
  driving_charge: "existing_driving_charge",
  shore_power: "existing_shore_power",
  inverter: "existing_inverter",
};

export const DISCOVERY_SHEET_SECTIONS: readonly DiscoverySection[] = [
  {
    id: "identity",
    number: 1,
    pageGroup: 1,
    title: "Identité et coordonnées",
    fields: [
      { key: "contact_name", label: "Nom et prénom", kind: "text" },
      { key: "contact_phone", label: "Téléphone", kind: "text" },
      { key: "contact_email", label: "E-mail", kind: "text" },
      { key: "contact_whatsapp", label: "WhatsApp", kind: "text", prismaField: "whatsapp" },
    ],
  },
  {
    id: "vehicle",
    number: 2,
    pageGroup: 1,
    title: "Véhicule ou bateau",
    fields: [
      {
        key: "vehicle_type",
        label: "Votre support",
        kind: "checkbox-group",
        options: withEmptyChoice(ASSET_TYPE_OPTIONS.map((option) => option.label)),
        prismaField: "assetType",
      },
      { key: "vehicle_type_other", label: "Si autre, précisez", kind: "text" },
      { key: "vehicle_brand", label: "Marque", kind: "text", prismaField: "vehicleBrand" },
      { key: "vehicle_model", label: "Modèle", kind: "text", prismaField: "vehicleModel" },
      { key: "vehicle_year", label: "Année", kind: "text", prismaField: "vehicleYear" },
      { key: "vehicle_engine", label: "Motorisation", kind: "text", prismaField: "vehicleEngine" },
      { key: "vehicle_format", label: "Gabarit (L2H2...)", kind: "text", prismaField: "vehicleFormat" },
      { key: "vehicle_dimensions", label: "Dimensions utiles", kind: "text", prismaField: "vehicleDimensions" },
      { key: "registration_country", label: "Pays d'immatriculation", kind: "text", prismaField: "registrationCountry" },
      { key: "usage_country", label: "Pays d'usage", kind: "text", prismaField: "usageCountry" },
      { key: "homologation_notes", label: "Démarche d'homologation", kind: "longtext", prismaField: "homologationNotes", lines: 2 },
    ],
  },
  {
    id: "project_nature",
    number: 3,
    pageGroup: 2,
    title: "Nature du projet",
    fields: [
      {
        key: "project_nature",
        label: "Où en êtes-vous ?",
        kind: "checkbox-group",
        options: withEmptyChoice(PROJECT_STAGE_OPTIONS),
        prismaField: "projectStage",
        hint: "Neuf : Idée / Véhicule acheté / Aménagement en cours. Modification : Installation partielle ou existante à modifier. Dépannage : une panne à résoudre.",
      },
      {
        key: "client_level",
        label: "Votre niveau en électricité",
        kind: "checkbox-group",
        options: withEmptyChoice(CLIENT_LEVEL_OPTIONS.map((option) => option.label)),
        prismaField: "niveauClient",
      },
    ],
  },
  {
    id: "usage",
    number: 4,
    pageGroup: 2,
    title: "Usage prévu",
    fields: [
      {
        key: "usage_pattern",
        label: "Votre utilisation",
        kind: "checkbox-group",
        options: withEmptyChoice(USAGE_PATTERN_OPTIONS),
        prismaField: "usagePattern",
      },
      {
        key: "usage_seasons_regions",
        label: "Saisons, régions, températures",
        kind: "longtext",
        prismaField: "seasonsRegionsNotes",
        lines: 3,
      },
      { key: "usage_traveler_count", label: "Nombre de voyageurs", kind: "text", prismaField: "travelerCount" },
      {
        key: "usage_remote_work",
        label: "Télétravail (durée quotidienne)",
        kind: "longtext",
        prismaField: "remoteWorkNotes",
        lines: 2,
      },
      { key: "usage_parking_exposure", label: "Stationnement (soleil / ombre)", kind: "text", prismaField: "parkingExposure" },
    ],
  },
  {
    id: "goals",
    number: 5,
    pageGroup: 3,
    title: "Objectifs et difficultés rencontrées",
    fields: [
      { key: "goals_topics", label: "Sujets sur lesquels être accompagné", kind: "longtext", prismaField: "coachingTopics", lines: 4 },
      { key: "goals_main_objective", label: "Votre objectif principal", kind: "longtext", prismaField: "objectifs", lines: 3 },
      { key: "goals_three_priorities", label: "Vos trois priorités", kind: "longtext", prismaField: "threePriorities", lines: 4 },
      { key: "goals_concerns", label: "Préoccupations, difficultés rencontrées", kind: "longtext", prismaField: "preoccupations", lines: 4 },
    ],
  },
  {
    id: "devices",
    number: 6,
    pageGroup: 4,
    title: "Appareils à alimenter",
    fields: [
      {
        key: "devices_table",
        label: "Liste des appareils",
        kind: "table",
        lines: 14,
        prismaField: "devices",
        columns: [
          { key: "device_name", label: "Appareil" },
          { key: "device_quantity", label: "Qté" },
          { key: "device_daily_duration", label: "Durée par jour" },
          { key: "device_supply", label: "Alimentation", options: ["12V", "230V", "?"] },
          { key: "device_remark", label: "Remarque" },
        ],
      },
    ],
  },
  {
    id: "existing_install",
    number: 7,
    pageGroup: 5,
    title: "Installation existante (si connue)",
    fields: EXISTING_INSTALLATION_KEYS.flatMap((installationKey) =>
      existingItem(EXISTING_FIELD_KEYS[installationKey], installationKey),
    ),
  },
  {
    id: "autonomy",
    number: 8,
    pageGroup: 6,
    title: "Autonomie et recharge souhaitées",
    fields: [
      {
        key: "autonomy_days",
        label: "Jours souhaités sans recharge",
        kind: "checkbox-group",
        options: withEmptyChoice(DAYS_WITHOUT_RECHARGE_OPTIONS),
        prismaField: "daysWithoutRecharge",
      },
      { key: "autonomy_min_no_recharge", label: "Autonomie minimale sans recharge", kind: "text", prismaField: "minAutonomyNoRecharge" },
      { key: "autonomy_critical_devices", label: "Appareils indispensables si énergie limitée", kind: "longtext", prismaField: "criticalDevicesWhenLow", lines: 2 },
      { key: "energy_driving_habits", label: "Conduite : temps et fréquence", kind: "longtext", prismaField: "drivingHabits", lines: 2 },
      { key: "energy_shore_power_availability", label: "Disponibilité du secteur", kind: "text", prismaField: "shorePowerAvailability" },
      {
        key: "energy_solar_preference",
        label: "Solaire envisagé ?",
        kind: "checkbox-group",
        options: withEmptyChoice(SOLAR_PREFERENCE_OPTIONS),
        prismaField: "solarPreference",
      },
      { key: "energy_solar_mounting", label: "Fixe ou portable ?", kind: "text", prismaField: "solarMounting" },
      { key: "energy_solar_roof_space", label: "Espace et obstacles sur le toit", kind: "longtext", prismaField: "solarRoofSpaceNotes", lines: 2 },
      { key: "energy_other_sources", label: "Autres sources d'énergie envisagées", kind: "longtext", prismaField: "otherEnergySources", lines: 2 },
      { key: "energy_planned_equipment", label: "Évolutions futures envisagées", kind: "longtext", prismaField: "plannedEquipmentNotes", lines: 1 },
    ],
  },
  {
    id: "budget",
    number: 9,
    pageGroup: 7,
    title: "Budget indicatif et échéance",
    fields: [
      { key: "budget_material", label: "Budget matériel indicatif (€)", kind: "text", prismaField: "materialBudgetCents" },
      { key: "budget_labor", label: "Budget main-d'œuvre indicatif (€)", kind: "text", prismaField: "laborBudgetCents" },
      { key: "budget_who_does_work", label: "Qui réalisera les travaux ?", kind: "text", prismaField: "whoDoesTheWork" },
      { key: "budget_deadline", label: "Échéance de départ souhaitée", kind: "text", prismaField: "startDeadline" },
    ],
  },
  {
    id: "constraints",
    number: 10,
    pageGroup: 7,
    title: "Contraintes particulières",
    fields: [
      { key: "constraints_implantation", label: "Croquis, emplacements et volumes disponibles pour la batterie", kind: "longtext", prismaField: "implantationNotes", lines: 4 },
      { key: "constraints_ventilation", label: "Contraintes de ventilation, température, eau, accessibilité", kind: "longtext", prismaField: "ventilationConstraints", lines: 3 },
      { key: "constraints_outlets_lighting", label: "Position des prises, éclairages et commandes", kind: "longtext", prismaField: "outletsLightingNotes", lines: 3 },
      { key: "constraints_vehicle_electrical", label: "Tension, alternateur, contraintes constructeur (si connu)", kind: "longtext", prismaField: "vehicleElectricalNotes", lines: 2 },
      { key: "constraints_vehicle_electrical_source", label: "D'où vient cette information ?", kind: "text", prismaField: "vehicleElectricalSource" },
    ],
  },
  {
    id: "documents",
    number: 11,
    pageGroup: 8,
    title: "Photos et documents disponibles",
    fields: [
      {
        key: "documents_available",
        label: "Disponibles",
        kind: "checkbox-group",
        options: ["Photos du véhicule", "Photos de l'installation", "Schéma existant", "Factures / fiches produits", "Plan / croquis", "Aucun"],
      },
      { key: "documents_list", label: "Liste et remarques", kind: "longtext", lines: 3 },
    ],
  },
  {
    id: "questions",
    number: 12,
    pageGroup: 8,
    title: "Questions / informations à préciser",
    fields: [
      { key: "questions_open", label: "Questions ouvertes", kind: "longtext", prismaField: "questionsEnAttente", lines: 14 },
    ],
  },
  {
    id: "coach",
    number: 13,
    pageGroup: 9,
    title: "RÉSERVÉ COACH",
    coachOnly: true,
    fields: [
      { key: "coach_observations", label: "Observations", kind: "longtext", prismaField: "notesInternes", lines: 4 },
      { key: "coach_points_to_check", label: "Points à vérifier", kind: "longtext", lines: 3 },
      { key: "coach_decisions", label: "Décisions", kind: "longtext", lines: 3 },
      {
        key: "coach_next_actions",
        label: "Prochaines actions",
        kind: "table",
        lines: 6,
        prismaField: "actions",
        columns: [
          { key: "action_text", label: "Action" },
          { key: "action_who", label: "Qui", options: ["Moi", "Client"] },
          { key: "action_due", label: "Pour quand" },
        ],
      },
    ],
  },
];

export function getSheetFieldKeys(): readonly string[] {
  return DISCOVERY_SHEET_SECTIONS.flatMap((section) =>
    section.fields.flatMap((field) => [
      field.key,
      ...(field.columns ?? []).map((column) => `${field.key}.${column.key}`),
    ]),
  );
}

export function getSheetPageGroups(): readonly (readonly DiscoverySection[])[] {
  const groups = new Map<number, DiscoverySection[]>();
  for (const section of DISCOVERY_SHEET_SECTIONS) {
    groups.set(section.pageGroup, [...(groups.get(section.pageGroup) ?? []), section]);
  }
  return [...groups.entries()].sort(([a], [b]) => a - b).map(([, list]) => list);
}

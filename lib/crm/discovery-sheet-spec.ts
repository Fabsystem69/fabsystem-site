// Source unique de la fiche de découverte papier (pure, sans dépendance
// serveur). Les `key` sont STABLES : la relecture IA d'une photo de fiche
// remplie s'appuie dessus. Ne jamais renommer une key ; en ajouter de
// nouvelles et incrémenter DISCOVERY_SHEET_VERSION si la structure change.
// `prismaField` = champ CoachingProject alimenté (même vocabulaire que le
// formulaire client « Mon van »).

export const DISCOVERY_SHEET_VERSION = "2026-10-v1";

export const UNKNOWN_OPTION = "Je ne sais pas";

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

const PRESENT_ABSENT: readonly string[] = ["Présent", "Absent", UNKNOWN_OPTION];

const existingItem = (
  key: string,
  label: string,
  prismaField?: string,
): readonly DiscoveryField[] => [
  { key, label, kind: "checkbox-group", options: PRESENT_ABSENT, prismaField },
  { key: `${key}_detail`, label: "Détail (marque, capacité, puissance...)", kind: "text" },
];

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
        label: "Type",
        kind: "checkbox-group",
        options: ["Van", "Fourgon", "Camping-car", "Bateau", "Autre", UNKNOWN_OPTION],
        prismaField: "assetType",
      },
      { key: "vehicle_type_other", label: "Si autre, précisez", kind: "text" },
      { key: "vehicle_brand", label: "Marque", kind: "text", prismaField: "vehicleBrand" },
      { key: "vehicle_model", label: "Modèle", kind: "text", prismaField: "vehicleModel" },
      { key: "vehicle_year", label: "Année", kind: "text", prismaField: "vehicleYear" },
    ],
  },
  {
    id: "project_nature",
    number: 3,
    pageGroup: 1,
    title: "Nature du projet",
    fields: [
      {
        key: "project_nature",
        label: "Où en êtes-vous ?",
        kind: "checkbox-group",
        options: [
          "Idée",
          "Véhicule acheté",
          "Aménagement en cours",
          "Installation partielle",
          "Installation existante à modifier",
          "Dépannage",
          UNKNOWN_OPTION,
        ],
        prismaField: "projectStage",
        hint: "Neuf : Idée / Véhicule acheté / Aménagement en cours. Modification : Installation partielle ou existante à modifier.",
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
        label: "Fréquence d'utilisation",
        kind: "checkbox-group",
        options: ["Week-ends", "Vacances", "Longs voyages", "Vie à l'année", UNKNOWN_OPTION],
        prismaField: "usagePattern",
      },
      {
        key: "usage_seasons_regions",
        label: "Saisons, régions, températures",
        kind: "longtext",
        prismaField: "seasonsRegionsNotes",
        lines: 3,
      },
      { key: "usage_traveler_count", label: "Nombre de personnes", kind: "text", prismaField: "travelerCount" },
      {
        key: "usage_remote_work",
        label: "Télétravail (durée quotidienne)",
        kind: "yesno-unknown",
        prismaField: "remoteWorkNotes",
      },
      { key: "usage_remote_work_detail", label: "Précisions télétravail", kind: "text" },
    ],
  },
  {
    id: "goals",
    number: 5,
    pageGroup: 2,
    title: "Objectifs et difficultés rencontrées",
    fields: [
      { key: "goals_topics", label: "Sujets sur lesquels être accompagné", kind: "longtext", prismaField: "coachingTopics", lines: 4 },
      { key: "goals_three_priorities", label: "Trois priorités", kind: "longtext", prismaField: "threePriorities", lines: 4 },
      { key: "goals_concerns", label: "Préoccupations, difficultés rencontrées", kind: "longtext", prismaField: "preoccupations", lines: 4 },
    ],
  },
  {
    id: "devices",
    number: 6,
    pageGroup: 3,
    title: "Appareils à alimenter",
    fields: [
      {
        key: "devices_table",
        label: "Liste des appareils",
        kind: "table",
        lines: 10,
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
    pageGroup: 4,
    title: "Installation existante (si connue)",
    fields: [
      ...existingItem("existing_battery", "Batterie", "plannedEquipmentNotes"),
      ...existingItem("existing_solar", "Panneaux solaires", "solarPreference"),
      ...existingItem("existing_driving_charge", "Recharge en roulant", "drivingHabits"),
      ...existingItem("existing_shore_power", "Branchement secteur", "shorePowerAvailability"),
      ...existingItem("existing_inverter", "Convertisseur / chargeur", "otherEnergySources"),
    ],
  },
  {
    id: "autonomy",
    number: 8,
    pageGroup: 4,
    title: "Autonomie souhaitée",
    fields: [
      {
        key: "autonomy_days",
        label: "Jours sans recharge",
        kind: "checkbox-group",
        options: ["1", "2", "3", "4 à 7", "Plus de 7", UNKNOWN_OPTION],
        prismaField: "daysWithoutRecharge",
      },
      { key: "autonomy_critical_devices", label: "Appareils indispensables si énergie limitée", kind: "text", prismaField: "criticalDevicesWhenLow" },
    ],
  },
  {
    id: "budget",
    number: 9,
    pageGroup: 4,
    title: "Budget indicatif et échéance",
    fields: [
      { key: "budget_material", label: "Budget matériel (€)", kind: "text", prismaField: "materialBudgetCents" },
      { key: "budget_labor", label: "Budget main-d'œuvre (€)", kind: "text", prismaField: "laborBudgetCents" },
      { key: "budget_who_does_work", label: "Qui réalisera les travaux ?", kind: "text", prismaField: "whoDoesTheWork" },
      { key: "budget_deadline", label: "Échéance de départ souhaitée", kind: "text", prismaField: "startDeadline" },
    ],
  },
  {
    id: "constraints",
    number: 10,
    pageGroup: 5,
    title: "Contraintes particulières",
    fields: [
      { key: "constraints_implantation", label: "Emplacements et volumes disponibles (batterie...)", kind: "longtext", prismaField: "implantationNotes", lines: 4 },
      { key: "constraints_ventilation", label: "Ventilation, température, eau, accessibilité", kind: "longtext", prismaField: "ventilationConstraints", lines: 3 },
      { key: "constraints_outlets_lighting", label: "Prises, éclairages et commandes", kind: "longtext", prismaField: "outletsLightingNotes", lines: 3 },
      { key: "constraints_vehicle_electrical", label: "Électricité du véhicule (tension, alternateur...)", kind: "longtext", prismaField: "vehicleElectricalNotes", lines: 3 },
    ],
  },
  {
    id: "documents",
    number: 11,
    pageGroup: 5,
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
    pageGroup: 5,
    title: "Questions / informations à préciser",
    fields: [
      { key: "questions_open", label: "Questions ouvertes", kind: "longtext", prismaField: "questionsEnAttente", lines: 6 },
    ],
  },
  {
    id: "coach",
    number: 13,
    pageGroup: 6,
    title: "RÉSERVÉ COACH",
    coachOnly: true,
    fields: [
      { key: "coach_observations", label: "Observations", kind: "longtext", prismaField: "notesInternes", lines: 5 },
      { key: "coach_points_to_check", label: "Points à vérifier", kind: "longtext", lines: 4 },
      { key: "coach_decisions", label: "Décisions", kind: "longtext", lines: 4 },
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

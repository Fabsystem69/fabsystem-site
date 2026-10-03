// Catalogue des champs IMPORTABLES de la fiche de decouverte manuscrite, tire
// de lib/crm/discovery-sheet-spec.ts (module pur). Un champ est importable
// s'il appartient a une section non reservee coach ET alimente un champ du
// projet (prismaField). Les tableaux (appareils, actions) ont leur propre
// traitement ; la section coach est lue a part (`coach`).

import {
  ASSET_TYPE_OPTIONS,
  CLIENT_LEVEL_OPTIONS,
  EMPTY_CHOICE_LABEL,
  type ChoiceOption,
} from "@/lib/coaching-form-options";
import { DISCOVERY_SHEET_SECTIONS, type DiscoveryField } from "@/lib/crm/discovery-sheet-spec";
import {
  EXISTING_INSTALLATION_DETAIL_MAX,
  EXISTING_INSTALLATION_KEYS,
  EXISTING_INSTALLATION_STATUSES,
  EXISTING_INSTALLATION_STATUS_LABELS,
  type ExistingInstallationKey,
  type ExistingInstallationStatus,
} from "@/lib/crm/existing-installation";

export type SheetFieldTarget =
  | { kind: "scalar" }
  | { kind: "enum"; storedByLabel: ReadonlyMap<string, string> }
  | { kind: "budget"; column: "materialBudgetCents" | "laborBudgetCents" }
  | { kind: "installation-status"; item: ExistingInstallationKey }
  | { kind: "installation-detail"; item: ExistingInstallationKey }
  // Blocs reserves coach : jamais remplaces, uniquement completes.
  | { kind: "append" };

export type SheetFieldInfo = {
  key: string;
  label: string;
  sectionId: string;
  sectionTitle: string;
  prismaField: string;
  // Choix fermes autorises (libelles de la fiche), null = texte libre.
  options: readonly string[] | null;
  target: SheetFieldTarget;
};

export type SheetSectionToken = "vehicleInfoUpdatedAt" | "usagesUpdatedAt" | "implantationUpdatedAt";

const APPEND_FIELDS = new Set(["preoccupations", "questionsEnAttente"]);
const BUDGET_COLUMNS = new Set(["materialBudgetCents", "laborBudgetCents"]);
const ENUM_OPTIONS: Readonly<Record<string, readonly ChoiceOption[]>> = {
  assetType: ASSET_TYPE_OPTIONS,
  niveauClient: CLIENT_LEVEL_OPTIONS,
};

// Jeton de concurrence de la section qui contient chaque champ (comme
// updateVehicleInfo / updateUsagesInfo / updateImplantationInfo).
const VEHICLE_FIELDS = [
  "assetType", "vehicleBrand", "vehicleModel", "vehicleYear", "vehicleEngine", "vehicleFormat",
  "vehicleDimensions", "registrationCountry", "usageCountry", "homologationNotes", "projectStage",
  "niveauClient", "whoDoesTheWork", "coachingTopics", "objectifs", "threePriorities", "startDeadline",
  "materialBudgetCents", "laborBudgetCents",
];
const USAGES_FIELDS = [
  "travelerCount", "usagePattern", "remoteWorkNotes", "seasonsRegionsNotes", "parkingExposure",
  "daysWithoutRecharge", "minAutonomyNoRecharge", "criticalDevicesWhenLow", "drivingHabits",
  "shorePowerAvailability", "solarPreference", "solarMounting", "solarRoofSpaceNotes",
  "otherEnergySources", "plannedEquipmentNotes",
];
const IMPLANTATION_FIELDS = [
  "implantationNotes", "ventilationConstraints", "outletsLightingNotes", "vehicleElectricalNotes",
  "vehicleElectricalSource",
];

// Aucun champ de la fiche n'alimente la section « entretien » : son jeton
// (entretienUpdatedAt) n'est donc jamais touche par l'import.
export function sectionTokenFor(prismaField: string): SheetSectionToken | null {
  if (prismaField.startsWith("existingInstallation.")) return "implantationUpdatedAt";
  if (VEHICLE_FIELDS.includes(prismaField)) return "vehicleInfoUpdatedAt";
  if (USAGES_FIELDS.includes(prismaField)) return "usagesUpdatedAt";
  if (IMPLANTATION_FIELDS.includes(prismaField)) return "implantationUpdatedAt";
  return null;
}

function installationItemOf(prismaField: string): { item: ExistingInstallationKey; detail: boolean } | null {
  const match = prismaField.match(/^existingInstallation\.([a-z_]+?)(\.detail)?$/);
  const item = match?.[1] as ExistingInstallationKey | undefined;
  if (!item || !EXISTING_INSTALLATION_KEYS.includes(item)) return null;
  return { item, detail: match?.[2] !== undefined };
}

function targetFor(field: DiscoveryField, prismaField: string): SheetFieldTarget | null {
  const installation = installationItemOf(prismaField);
  if (installation) {
    return installation.detail
      ? { kind: "installation-detail", item: installation.item }
      : { kind: "installation-status", item: installation.item };
  }
  if (APPEND_FIELDS.has(prismaField)) return { kind: "append" };
  if (BUDGET_COLUMNS.has(prismaField)) {
    return { kind: "budget", column: prismaField as "materialBudgetCents" | "laborBudgetCents" };
  }
  const enumOptions = ENUM_OPTIONS[prismaField];
  if (enumOptions) return { kind: "enum", storedByLabel: new Map(enumOptions.map((option) => [option.label, option.value])) };
  // Tableaux (appareils, actions) : traites a part.
  if (field.kind === "table") return null;
  return { kind: "scalar" };
}

function build(): ReadonlyMap<string, SheetFieldInfo> {
  const entries = DISCOVERY_SHEET_SECTIONS.filter((section) => !section.coachOnly).flatMap((section) =>
    section.fields.flatMap((field) => {
      if (!field.prismaField) return [];
      const target = targetFor(field, field.prismaField);
      if (!target) return [];
      const info: SheetFieldInfo = {
        key: field.key,
        label: field.label,
        sectionId: section.id,
        sectionTitle: section.title,
        prismaField: field.prismaField,
        options: field.options ?? null,
        target,
      };
      return [[field.key, info] as const];
    }),
  );
  return new Map(entries);
}

const IMPORTABLE_FIELDS = build();

export function getImportableField(key: string): SheetFieldInfo | null {
  return IMPORTABLE_FIELDS.get(key) ?? null;
}

export function listImportableFields(): readonly SheetFieldInfo[] {
  return [...IMPORTABLE_FIELDS.values()];
}

// --- Normalisation -----------------------------------------------------------

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Libelle canonique d'une option, retrouve sans tenir compte de la casse ni
// des espaces ; null si la valeur n'est pas EXACTEMENT une option.
export function matchOption(options: readonly string[], value: string): string | null {
  const wanted = normalizeText(value);
  return options.find((option) => normalizeText(option) === wanted) ?? null;
}

// « Je ne sais pas encore » = champ laisse vide : jamais une valeur a ecrire.
export function isEmptyChoice(value: string): boolean {
  return normalizeText(value) === normalizeText(EMPTY_CHOICE_LABEL);
}

export function statusFromLabel(label: string): ExistingInstallationStatus | null {
  const matched = EXISTING_INSTALLATION_STATUSES.find(
    (status) => normalizeText(EXISTING_INSTALLATION_STATUS_LABELS[status]) === normalizeText(label),
  );
  return matched ?? null;
}

export function installationDetailTooLong(value: string): boolean {
  return value.trim().length > EXISTING_INSTALLATION_DETAIL_MAX;
}

// --- Budget ------------------------------------------------------------------

const MAX_BUDGET_CENTS = 10_000_000_000;

// « 1 500 », « 1500€ », « 1 500,50 € », « 2.000 euros » -> centimes ; null si
// ce n'est pas clairement un montant.
export function parseBudgetCents(value: string): number | null {
  const cleaned = value.replace(/\s/g, "").replace(/€|euros?|eur/gi, "");
  const thousands = /^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(cleaned);
  if (!thousands && !/^\d+(?:[.,]\d{1,2})?$/.test(cleaned)) return null;
  const normalized = (thousands ? cleaned.replace(/\./g, "") : cleaned).replace(",", ".");
  const cents = Math.round(Number(normalized) * 100);
  return Number.isFinite(cents) && cents >= 0 && cents <= MAX_BUDGET_CENTS ? cents : null;
}

// Meme format que l'affichage de discovery-sheet-values (« 1 500 € »).
export function formatBudgetEuros(cents: number): string {
  const whole = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const rest = cents % 100;
  return `${whole}${rest === 0 ? "" : `,${String(rest).padStart(2, "0")}`} €`;
}

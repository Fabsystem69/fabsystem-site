// Lecture des réponses de la fiche de découverte à partir d'un CoachingProject
// (pure : aucune base, aucun accès serveur). Utilisée par l'aperçu client avant
// transmission et par la comparaison de l'import de fiche manuscrite.
//
// Confidentialité : les sections `coachOnly` et les champs au stockage réservé
// coach (notesInternes, preoccupations, questionsEnAttente) n'ont AUCUN lecteur
// ici, donc ne sont jamais restitués au client.

import { ASSET_TYPE_OPTIONS, CLIENT_LEVEL_OPTIONS, labelForChoice } from "@/lib/coaching-form-options";
import {
  DISCOVERY_SHEET_SECTIONS,
  type DiscoveryField,
} from "@/lib/crm/discovery-sheet-spec";
import {
  EXISTING_INSTALLATION_KEYS,
  EXISTING_INSTALLATION_STATUS_LABELS,
  parseExistingInstallation,
  type ExistingInstallationKey,
} from "@/lib/crm/existing-installation";
import type { CoachingProject } from "@/lib/generated/prisma/client";

export type SheetAnswer = {
  sectionId: string;
  sectionTitle: string;
  fieldKey: string;
  label: string;
  display: string | null;
  isUnknown: boolean;
};

type SheetProjectScalars = Pick<
  CoachingProject,
  | "assetType" | "vehicleBrand" | "vehicleModel" | "vehicleYear" | "vehicleEngine" | "vehicleFormat"
  | "vehicleDimensions" | "registrationCountry" | "usageCountry" | "homologationNotes" | "projectStage"
  | "niveauClient" | "usagePattern" | "seasonsRegionsNotes" | "travelerCount" | "remoteWorkNotes"
  | "parkingExposure" | "coachingTopics" | "objectifs" | "threePriorities" | "daysWithoutRecharge"
  | "minAutonomyNoRecharge" | "criticalDevicesWhenLow" | "drivingHabits" | "shorePowerAvailability"
  | "solarPreference" | "solarMounting" | "solarRoofSpaceNotes" | "otherEnergySources"
  | "plannedEquipmentNotes" | "materialBudgetCents" | "laborBudgetCents" | "whoDoesTheWork"
  | "startDeadline" | "implantationNotes" | "ventilationConstraints" | "outletsLightingNotes"
  | "vehicleElectricalNotes" | "vehicleElectricalSource"
>;

export type SheetProjectSource = SheetProjectScalars & {
  existingInstallation: unknown;
  devices: { name: string; quantity: number; powerSupply: string }[];
  documents: { filename: string }[];
};

type Reading = { display: string | null; isUnknown: boolean };
type Reader = (project: SheetProjectSource) => Reading;

const NOT_ANSWERED: Reading = { display: null, isUnknown: false };
const UNKNOWN_TEXT = /^je ne sais pas/i;

function textReading(value: string | null | undefined): Reading {
  const text = value?.trim();
  if (!text) return NOT_ANSWERED;
  return { display: text, isUnknown: UNKNOWN_TEXT.test(text) };
}

function text(key: keyof SheetProjectScalars): Reader {
  return (project) => {
    const value = project[key];
    return textReading(typeof value === "string" ? value : null);
  };
}

function euros(cents: number | null): Reading {
  if (cents == null) return NOT_ANSWERED;
  const whole = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const rest = cents % 100;
  const decimals = rest === 0 ? "" : `,${String(rest).padStart(2, "0")}`;
  return { display: `${whole}${decimals} €`, isUnknown: false };
}

function installationReading(project: SheetProjectSource, key: ExistingInstallationKey): Reading {
  const item = parseExistingInstallation(project.existingInstallation)?.items[key];
  if (!item) return NOT_ANSWERED;
  const label = EXISTING_INSTALLATION_STATUS_LABELS[item.status];
  return { display: item.detail ? `${label} — ${item.detail}` : label, isUnknown: item.status === "UNKNOWN" };
}

function installationDetail(project: SheetProjectSource, key: ExistingInstallationKey): Reading {
  return textReading(parseExistingInstallation(project.existingInstallation)?.items[key]?.detail);
}

function listReading(items: string[]): Reading {
  return items.length === 0 ? NOT_ANSWERED : { display: items.join(", "), isUnknown: false };
}

// prismaField -> lecteur. Un champ sans lecteur n'est jamais restitué.
const READERS: Readonly<Record<string, Reader>> = {
  assetType: (p) => textReading(labelForChoice(ASSET_TYPE_OPTIONS, p.assetType)),
  niveauClient: (p) => textReading(labelForChoice(CLIENT_LEVEL_OPTIONS, p.niveauClient)),
  materialBudgetCents: (p) => euros(p.materialBudgetCents),
  laborBudgetCents: (p) => euros(p.laborBudgetCents),
  devices: (p) => listReading(p.devices.map((device) => `${device.name} × ${device.quantity}`)),
  ...Object.fromEntries(
    (
      [
        "vehicleBrand", "vehicleModel", "vehicleYear", "vehicleEngine", "vehicleFormat", "vehicleDimensions",
        "registrationCountry", "usageCountry", "homologationNotes", "projectStage", "usagePattern",
        "seasonsRegionsNotes", "travelerCount", "remoteWorkNotes", "parkingExposure", "coachingTopics",
        "objectifs", "threePriorities", "daysWithoutRecharge", "minAutonomyNoRecharge", "criticalDevicesWhenLow",
        "drivingHabits", "shorePowerAvailability", "solarPreference", "solarMounting", "solarRoofSpaceNotes",
        "otherEnergySources", "plannedEquipmentNotes", "whoDoesTheWork", "startDeadline", "implantationNotes",
        "ventilationConstraints", "outletsLightingNotes", "vehicleElectricalNotes", "vehicleElectricalSource",
      ] as const
    ).map((key) => [key, text(key)]),
  ),
  ...Object.fromEntries(
    EXISTING_INSTALLATION_KEYS.flatMap((key) => [
      [`existingInstallation.${key}`, (p: SheetProjectSource) => installationReading(p, key)],
      [`existingInstallation.${key}.detail`, (p: SheetProjectSource) => installationDetail(p, key)],
    ]),
  ),
};

// Champ sans prismaField mais lisible : les pièces jointes du dossier.
const KEY_READERS: Readonly<Record<string, Reader>> = {
  documents_list: (p) => listReading(p.documents.map((document) => document.filename)),
};

function readerFor(field: DiscoveryField): Reader | null {
  return KEY_READERS[field.key] ?? (field.prismaField ? (READERS[field.prismaField] ?? null) : null);
}

function isDetailField(field: DiscoveryField) {
  return field.prismaField?.endsWith(".detail") === true;
}

export function readSheetAnswers(project: SheetProjectSource): SheetAnswer[] {
  return DISCOVERY_SHEET_SECTIONS.filter((section) => !section.coachOnly).flatMap((section) =>
    section.fields.flatMap((field) => {
      const reader = readerFor(field);
      // Les détails sont déjà inclus dans la réponse de leur ligne.
      if (!reader || isDetailField(field)) return [];
      const { display, isUnknown } = reader(project);
      return [
        {
          sectionId: section.id,
          sectionTitle: section.title,
          fieldKey: field.key,
          label: field.label,
          display,
          isUnknown,
        },
      ];
    }),
  );
}

export function countUnanswered(answers: SheetAnswer[]): number {
  return answers.filter((answer) => answer.display === null).length;
}

// Valeur actuelle (texte) d'un champ, pour la comparer à une valeur proposée
// par l'import. Null = rien d'enregistré OU champ non lisible côté client.
export function readSheetValueByKey(project: SheetProjectSource, fieldKey: string): string | null {
  for (const section of DISCOVERY_SHEET_SECTIONS) {
    if (section.coachOnly) continue;
    const field = section.fields.find((candidate) => candidate.key === fieldKey);
    if (!field) continue;
    const statusKey = field.prismaField?.match(/^existingInstallation\.([a-z_]+)$/)?.[1];
    if (statusKey) {
      // Ligne tri-état : seule la case cochée est comparée (le détail a sa propre clé).
      const item = parseExistingInstallation(project.existingInstallation)?.items[statusKey as ExistingInstallationKey];
      return item ? EXISTING_INSTALLATION_STATUS_LABELS[item.status] : null;
    }
    const reader = readerFor(field);
    return reader ? reader(project).display : null;
  }
  return null;
}

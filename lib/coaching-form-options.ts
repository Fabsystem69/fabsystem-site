// Source unique des choix fermés du dossier coaching, partagée par le
// formulaire client « Mon van », l'édition admin du dossier et la fiche de
// découverte papier (lib/crm/discovery-sheet-spec.ts). Module pur.
//
// Règle : la valeur vide ("") signifie « Je ne sais pas encore » / « À définir ».
// Elle n'est jamais remplacée par une valeur inventée. Le client ne choisit
// jamais un dimensionnement ni une protection : ces décisions restent au coach.

import type { ClientLevel, ProjectAssetType } from "@/lib/generated/prisma/client";
import { PROJECT_ASSET_TYPE_LABELS } from "@/lib/project-labels";

export type ChoiceOption = { readonly value: string; readonly label: string };

// Libellé de la valeur vide dans les listes déroulantes et sur la fiche papier.
export const EMPTY_CHOICE_LABEL = "Je ne sais pas encore";

// Libellé des questions tri-état (Présent / Absent / Je ne sais pas).
export const UNKNOWN_STATUS_LABEL = "Je ne sais pas";

// Chaque libellé est aussi sa valeur : projectStage & co sont du texte libre en base.
function textOptions(labels: readonly string[]): readonly ChoiceOption[] {
  return labels.map((label) => ({ value: label, label }));
}

export const PROJECT_STAGE_OPTIONS = [
  "Idée",
  "Véhicule acheté",
  "Aménagement en cours",
  "Installation partielle",
  "Installation existante à modifier",
  "Dépannage",
] as const;

export const USAGE_PATTERN_OPTIONS = ["Week-ends", "Vacances", "Longs voyages", "Vie à l'année"] as const;

export const SOLAR_PREFERENCE_OPTIONS = ["Souhaité", "Non souhaité", "À étudier"] as const;

export const DAYS_WITHOUT_RECHARGE_OPTIONS = ["1", "2", "3", "4 à 7", "Plus de 7"] as const;

const ASSET_TYPE_ORDER: readonly ProjectAssetType[] = ["VAN", "MOTORHOME", "BOAT", "OTHER"];

export const ASSET_TYPE_OPTIONS: readonly ChoiceOption[] = ASSET_TYPE_ORDER.map((value) => ({
  value,
  label: PROJECT_ASSET_TYPE_LABELS[value],
}));

const CLIENT_LEVEL_FORM_LABELS: Record<ClientLevel, string> = {
  DEBUTANT: "Je débute",
  INTERMEDIAIRE: "J'ai quelques bases",
  AVANCE: "J'ai déjà pratiqué",
};

export const CLIENT_LEVEL_OPTIONS: readonly ChoiceOption[] = (
  ["DEBUTANT", "INTERMEDIAIRE", "AVANCE"] as const
).map((value) => ({ value, label: CLIENT_LEVEL_FORM_LABELS[value] }));

export const PROJECT_STAGE_CHOICES = textOptions(PROJECT_STAGE_OPTIONS);
export const USAGE_PATTERN_CHOICES = textOptions(USAGE_PATTERN_OPTIONS);
export const SOLAR_PREFERENCE_CHOICES = textOptions(SOLAR_PREFERENCE_OPTIONS);
export const DAYS_WITHOUT_RECHARGE_CHOICES = textOptions(DAYS_WITHOUT_RECHARGE_OPTIONS);

// Retrouve le libellé affiché d'une valeur stockée (valeur inconnue = telle quelle).
export function labelForChoice(options: readonly ChoiceOption[], value: string | null | undefined): string | null {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? value;
}

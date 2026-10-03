// Traduction PURE d'un commit d'import de fiche (champs coches) en ecritures
// sur le projet. Toute cle inconnue ou non editable, toute valeur invalide
// leve une erreur 400 AVANT la moindre ecriture.

import { badRequest } from "@/lib/http-errors";
import type { SheetCommit } from "@/lib/crm/sheet-import-contract";
import type { ExistingInstallationKey, ExistingInstallationStatus } from "@/lib/crm/existing-installation";
import {
  getImportableField,
  installationDetailTooLong,
  isEmptyChoice,
  matchOption,
  parseBudgetCents,
  sectionTokenFor,
  statusFromLabel,
  type SheetFieldInfo,
  type SheetSectionToken,
} from "@/lib/crm/sheet-import-fields";

export type InstallationFieldPatch = { status?: ExistingInstallationStatus; detail?: string };

export type FieldWrites = {
  // colonne CoachingProject -> valeur (texte, enum ou centimes)
  scalars: Readonly<Record<string, string | number>>;
  installation: Readonly<Partial<Record<ExistingInstallationKey, InstallationFieldPatch>>>;
  // Blocs coach a COMPLETER (jamais remplacer), par colonne.
  appends: Readonly<Record<string, string>>;
  tokens: readonly SheetSectionToken[];
  writtenFields: readonly string[];
};

const EMPTY_WRITES: FieldWrites = { scalars: {}, installation: {}, appends: {}, tokens: [], writtenFields: [] };

function invalid(info: SheetFieldInfo, why: string): never {
  throw badRequest(`Valeur invalide pour « ${info.label} » : ${why}`);
}

function choiceValue(info: SheetFieldInfo, value: string): string {
  const option = info.options ? matchOption(info.options, value) : null;
  if (option === null || isEmptyChoice(option)) invalid(info, "ce n'est pas l'un des choix de la fiche.");
  return option as string;
}

function applyField(writes: FieldWrites, info: SheetFieldInfo, rawValue: string): FieldWrites {
  const value = rawValue.trim();
  const target = info.target;
  const token = sectionTokenFor(info.prismaField);
  const withBase: FieldWrites = {
    ...writes,
    tokens: token && !writes.tokens.includes(token) ? [...writes.tokens, token] : writes.tokens,
    writtenFields: [...writes.writtenFields, info.key],
  };

  switch (target.kind) {
    case "scalar":
      return { ...withBase, scalars: { ...withBase.scalars, [info.prismaField]: info.options ? choiceValue(info, value) : value } };
    case "enum": {
      const option = choiceValue(info, value);
      // Seules les valeurs de l'enum Prisma sont ecrites, jamais un texte libre.
      return { ...withBase, scalars: { ...withBase.scalars, [info.prismaField]: target.storedByLabel.get(option) as string } };
    }
    case "budget": {
      const cents = parseBudgetCents(value);
      if (cents === null) invalid(info, "montant attendu en euros (ex. 1500).");
      return { ...withBase, scalars: { ...withBase.scalars, [target.column]: cents as number } };
    }
    case "installation-status": {
      const status = statusFromLabel(choiceValue(info, value));
      if (!status) invalid(info, "ce n'est pas l'un des choix de la fiche.");
      const previous = withBase.installation[target.item];
      return { ...withBase, installation: { ...withBase.installation, [target.item]: { ...previous, status: status as ExistingInstallationStatus } } };
    }
    case "installation-detail": {
      if (installationDetailTooLong(value)) invalid(info, "texte trop long.");
      const previous = withBase.installation[target.item];
      return { ...withBase, installation: { ...withBase.installation, [target.item]: { ...previous, detail: value } } };
    }
    case "append":
      return { ...withBase, appends: { ...withBase.appends, [info.prismaField]: value } };
  }
}

export function translateFields(fields: SheetCommit["fields"]): FieldWrites {
  const keys = fields.map((field) => field.fieldKey);
  const duplicate = keys.find((key, index) => keys.indexOf(key) !== index);
  if (duplicate) throw badRequest(`Champ en double dans la validation : ${duplicate}.`);

  return fields.reduce((writes, field) => {
    const info = getImportableField(field.fieldKey);
    if (!info) throw badRequest(`Champ non modifiable ou inconnu : ${field.fieldKey}.`);
    return applyField(writes, info, field.value);
  }, EMPTY_WRITES);
}

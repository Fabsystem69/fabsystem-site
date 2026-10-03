// Proposition d'import d'une fiche manuscrite (PURE : aucune base, aucun
// reseau). Compare la lecture de l'IA a l'etat du projet. Regle d'or : un
// champ vide, illisible ou invalide ne produit JAMAIS un changement et ne
// remplace rien ; une contradiction est signalee (decochee), jamais resolue.

import type {
  ExtractedField,
  ProposedChange,
  ProposedDevice,
  SheetExtraction,
  SheetProposal,
  UnreadField,
} from "@/lib/crm/sheet-import-contract";
import {
  formatBudgetEuros,
  getImportableField,
  installationDetailTooLong,
  isEmptyChoice,
  listImportableFields,
  matchOption,
  normalizeText,
  parseBudgetCents,
  type SheetFieldInfo,
} from "@/lib/crm/sheet-import-fields";
import { readSheetValueByKey, type SheetProjectSource } from "@/lib/crm/discovery-sheet-values";

type Outcome =
  | { type: "change"; change: ProposedChange }
  | { type: "same" }
  | { type: "unread"; unread: UnreadField };

const ILLEGIBLE_WARNING_MIN = 5;
const ILLEGIBLE_WARNING_RATIO = 0.4;
const MISSING_WARNING_RATIO = 0.5;

// Valeur lue -> forme canonique a proposer, ou raison du rejet.
function canonicalValue(info: SheetFieldInfo, raw: string): { value: string } | { reason: "INVALID_CHOICE" | "EMPTY" } {
  const value = raw.trim();
  if (info.target.kind === "budget") {
    const cents = parseBudgetCents(value);
    return cents === null ? { reason: "INVALID_CHOICE" } : { value: formatBudgetEuros(cents) };
  }
  if (info.options) {
    const option = matchOption(info.options, value);
    if (option === null) return { reason: "INVALID_CHOICE" };
    return isEmptyChoice(option) ? { reason: "EMPTY" } : { value: option };
  }
  if (info.target.kind === "installation-detail" && installationDetailTooLong(value)) {
    return { reason: "INVALID_CHOICE" };
  }
  return { value };
}

function sameValue(info: SheetFieldInfo, current: string, proposed: string): boolean {
  if (info.target.kind === "budget") {
    const currentCents = parseBudgetCents(current);
    return currentCents !== null && currentCents === parseBudgetCents(proposed);
  }
  return normalizeText(current) === normalizeText(proposed);
}

function unread(key: string, label: string, reason: UnreadField["reason"], current: string | null): Outcome {
  return { type: "unread", unread: { fieldKey: key, label, reason, current } };
}

function evaluateField(field: ExtractedField, project: SheetProjectSource): Outcome {
  const info = getImportableField(field.key);
  if (!info) return unread(field.key, field.key, "UNKNOWN_KEY", null);

  // Les blocs reserves coach ne sont jamais compares : ils sont completes.
  const current = info.target.kind === "append" ? null : readSheetValueByKey(project, field.key);
  if (field.state === "ILLEGIBLE") return unread(field.key, info.label, "ILLEGIBLE", current);
  if (field.state === "EMPTY" || !field.value?.trim()) return unread(field.key, info.label, "EMPTY", current);

  const canonical = canonicalValue(info, field.value);
  if ("reason" in canonical) return unread(field.key, info.label, canonical.reason, current);

  if (current !== null && sameValue(info, current, canonical.value)) return { type: "same" };

  return {
    type: "change",
    change: {
      fieldKey: field.key,
      sectionId: info.sectionId,
      sectionTitle: info.sectionTitle,
      label: info.label,
      kind: current === null ? "NEW" : "CHANGE",
      current,
      proposed: canonical.value,
      // Contradiction signalee, jamais resolue d'office.
      defaultChecked: current === null,
    },
  };
}

// Un detail d'installation sans case cochee (ni sur la fiche, ni deja
// enregistree) ne peut pas s'ecrire : on ne devine jamais « Present ».
function isOrphanDetail(change: ProposedChange, project: SheetProjectSource, proposedKeys: Set<string>): boolean {
  const info = getImportableField(change.fieldKey);
  if (info?.target.kind !== "installation-detail") return false;
  const statusKey = `existing_${info.target.item}`;
  return !proposedKeys.has(statusKey) && readSheetValueByKey(project, statusKey) === null;
}

function dedupeByKey(fields: readonly ExtractedField[]): ExtractedField[] {
  const seen = new Set<string>();
  return fields.filter((field) => (seen.has(field.key) ? false : (seen.add(field.key), true)));
}

function proposeDevices(extraction: SheetExtraction, project: SheetProjectSource): ProposedDevice[] {
  const known = new Set(project.devices.map((device) => normalizeText(device.name)));
  return extraction.devices.map((device) => {
    const name = normalizeText(device.name);
    const alreadyExists = known.has(name);
    known.add(name);
    return {
      name: device.name,
      quantity: device.quantity,
      powerSupply: device.powerSupply,
      duration: device.duration,
      remark: device.remark,
      alreadyExists,
    };
  });
}

function hasCoachContent(coach: SheetExtraction["coach"]): boolean {
  return Boolean(coach.observations) || coach.pointsToCheck.length + coach.decisions.length + coach.actions.length > 0;
}

function buildWarnings(
  fields: readonly ExtractedField[],
  unreadFields: readonly UnreadField[],
  extraction: SheetExtraction,
  recognizedCount: number,
): string[] {
  const importableCount = listImportableFields().length;
  const illegible = unreadFields.filter((item) => item.reason === "ILLEGIBLE").length;
  const unknown = unreadFields.filter((item) => item.reason === "UNKNOWN_KEY").length;
  const missing = importableCount - fields.length + unknown;
  const warnings: string[] = [];

  if (recognizedCount === 0 && extraction.devices.length === 0 && !hasCoachContent(extraction.coach)) {
    warnings.push("Aucun champ de la fiche n'a été reconnu : vérifiez que la photo montre bien la fiche de découverte.");
  }
  if (illegible >= ILLEGIBLE_WARNING_MIN || (fields.length > 0 && illegible / fields.length >= ILLEGIBLE_WARNING_RATIO)) {
    warnings.push(`${illegible} champs sont illisibles : reprenez la photo (plus de lumière, à plat) ou saisissez-les à la main.`);
  }
  if (recognizedCount > 0 && missing >= importableCount * MISSING_WARNING_RATIO) {
    warnings.push("La lecture ne couvre qu'une partie de la fiche : une page est peut-être manquante.");
  }
  if (unknown > 0) {
    warnings.push(`${unknown} champ(s) renvoyés par la lecture ne correspondent à aucun champ importable et sont ignorés.`);
  }
  return warnings;
}

export function buildSheetProposal(extraction: SheetExtraction, project: SheetProjectSource): SheetProposal {
  const fields = dedupeByKey(extraction.fields);
  const outcomes = fields.map((field) => evaluateField(field, project));

  const candidates = outcomes.flatMap((outcome) => (outcome.type === "change" ? [outcome.change] : []));
  const proposedKeys = new Set(candidates.map((change) => change.fieldKey));
  const orphans = candidates.filter((change) => isOrphanDetail(change, project, proposedKeys));
  const changes = candidates.filter((change) => !orphans.includes(change));

  const unreadFields: UnreadField[] = [
    ...outcomes.flatMap((outcome) => (outcome.type === "unread" ? [outcome.unread] : [])),
    ...orphans.map((change) => ({
      fieldKey: change.fieldKey,
      label: change.label,
      reason: "INVALID_CHOICE" as const,
      current: change.current,
    })),
  ];
  const sameCount = outcomes.filter((outcome) => outcome.type === "same").length;
  const recognizedCount = fields.filter((field) => getImportableField(field.key) !== null).length;

  const warnings = [
    ...buildWarnings(fields, unreadFields, extraction, recognizedCount),
    ...orphans.map(
      (change) => `« ${change.label} » : détail lu mais aucune case Présent / Absent / Je ne sais pas cochée. Rien n'est écrit pour ce détail.`,
    ),
  ];

  return {
    changes,
    sameCount,
    unread: unreadFields,
    devices: proposeDevices(extraction, project),
    coach: extraction.coach,
    uncertainties: extraction.uncertainties,
    warnings,
  };
}

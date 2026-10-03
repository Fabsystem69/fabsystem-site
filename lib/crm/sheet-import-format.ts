// Mise en forme PURE de l'import de fiche : evenement d'idempotence, ajout
// horodate aux blocs coach, note de trace interne.

import { formatIsoDateFr } from "@/lib/crm/meeting-notes-format";
import type { SheetCommit } from "@/lib/crm/sheet-import-contract";

export function ficheImportEventType(submissionKey: string) {
  return `FICHE_IMPORT:${submissionKey}`;
}

function formatDateTimeFr(date: Date) {
  const iso = date.toISOString();
  return `${formatIsoDateFr(iso.slice(0, 10))} ${iso.slice(11, 16)} UTC`;
}

export function importHeader(exchangeDate: string, now: Date) {
  return `— Fiche manuscrite du ${formatIsoDateFr(exchangeDate)} (importée le ${formatDateTimeFr(now)}) —`;
}

// Ajoute un bloc horodate APRES l'existant : jamais un remplacement.
export function appendBlock(existing: string | null | undefined, header: string, body: string) {
  const block = `${header}\n${body}`;
  return existing?.trim() ? `${existing.replace(/\s+$/, "")}\n\n${block}` : block;
}

export function bulletList(items: readonly string[]) {
  return items.map((item) => `• ${item}`).join("\n");
}

type NoteInput = {
  commit: SheetCommit;
  writtenFields: readonly { key: string; label: string; previous: string | null }[];
  createdDevices: readonly SheetCommit["devices"][number][];
  skippedDevices: readonly string[];
  actionCount: number;
};

function section(title: string, lines: readonly string[]) {
  return lines.length > 0 ? `${title} :\n${bulletList(lines)}` : null;
}

// Trace complete et interne (jamais lue par /mon-compte).
export function buildSheetImportNote({ commit, writtenFields, createdDevices, skippedDevices, actionCount }: NoteInput) {
  const photos = commit.photoCount > 0 ? `, ${commit.photoCount} photo(s) non conservée(s)` : "";
  return [
    `Fiche manuscrite importée${photos} — échange du ${formatIsoDateFr(commit.exchangeDate)} — ref:${commit.submissionKey}`,
    section(
      "Champs écrits (valeur précédente)",
      writtenFields.map((field) => `${field.label} [${field.key}] — avant : ${field.previous ?? "(vide)"}`),
    ),
    section(
      "Appareils créés",
      createdDevices.map((device) => {
        const extra = [device.duration ? `durée : ${device.duration}` : null, device.remark ? `remarque : ${device.remark}` : null].filter(Boolean);
        return `${device.name} × ${device.quantity}${extra.length ? ` (${extra.join(" ; ")})` : ""}`;
      }),
    ),
    section("Appareils déjà présents, ignorés", skippedDevices),
    section("Décisions", commit.coach.decisions),
    actionCount > 0 ? `Actions créées : ${actionCount}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

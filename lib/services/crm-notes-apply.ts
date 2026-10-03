import { badRequest } from "@/lib/http-errors";
import { logServerEvent } from "@/lib/server-log";
import { applyRequestSchema, type ApplyEntry } from "@/lib/crm/notes-contract";
import { createProspect, logProspectNote, updateProspect } from "@/lib/services/prospect";

export type ApplyEntryResult =
  | { name: string; outcome: "created" | "updated"; prospectId: string }
  | { name: string; outcome: "skipped" }
  | { name: string; outcome: "failed"; error: string };

// Midi UTC : la date calendaire reste la meme a Paris (UTC+1/+2), quel que
// soit le fuseau du serveur (Vercel = UTC).
export function toActionDate(value: string | null) {
  return value ? new Date(`${value}T12:00:00.000Z`) : null;
}

export function buildAppendedNote(entry: Pick<ApplyEntry, "besoinElectricite" | "notes">) {
  return [entry.besoinElectricite, entry.notes].filter(Boolean).join("\n") || null;
}

async function applyOne(entry: ApplyEntry): Promise<ApplyEntryResult> {
  if (entry.mode === "skip") {
    return { name: entry.name, outcome: "skipped" };
  }

  if (entry.mode === "append") {
    if (!entry.prospectId) throw badRequest("Prospect à compléter manquant.");

    const note = buildAppendedNote(entry);
    if (note) await logProspectNote({ prospectId: entry.prospectId, note });

    await updateProspect({
      prospectId: entry.prospectId,
      status: entry.status,
      ...(entry.nextAction ? { nextAction: entry.nextAction, nextActionAt: toActionDate(entry.nextActionDate) } : {}),
    });

    return { name: entry.name, outcome: "updated", prospectId: entry.prospectId };
  }

  const prospect = await createProspect({
    name: entry.name,
    phone: entry.phone,
    email: entry.email,
    source: entry.source,
    besoinElectricite: entry.besoinElectricite,
    nextAction: entry.nextAction,
    nextActionAt: toActionDate(entry.nextActionDate),
  });

  if (entry.notes) await logProspectNote({ prospectId: prospect.id, note: entry.notes });
  if (entry.status !== "NOUVEAU") await updateProspect({ prospectId: prospect.id, status: entry.status });

  return { name: entry.name, outcome: "created", prospectId: prospect.id };
}

// Chaque entree est appliquee independamment : une erreur sur une fiche
// n'empeche pas les autres et est renvoyee a l'interface, jamais avalee.
export async function applyCrmNoteEntries(rawEntries: unknown): Promise<ApplyEntryResult[]> {
  const parsed = applyRequestSchema.safeParse(rawEntries);
  if (!parsed.success) throw badRequest("Données de validation invalides.");

  const results: ApplyEntryResult[] = [];

  for (const entry of parsed.data) {
    try {
      results.push(await applyOne(entry));
    } catch (error) {
      logServerEvent("error", "crm_notes.apply.failed", { name: entry.name });
      results.push({
        name: entry.name,
        outcome: "failed",
        error: error instanceof Error ? error.message : "Erreur inconnue.",
      });
    }
  }

  return results;
}

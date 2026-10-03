"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/require-session";
import { applyCrmNoteEntries, type ApplyEntryResult } from "@/lib/services/crm-notes-apply";

export async function applyCrmNotesAction(entries: unknown): Promise<
  { ok: true; results: ApplyEntryResult[] } | { ok: false; error: string }
> {
  await requireSession();

  try {
    const results = await applyCrmNoteEntries(entries);
    revalidatePath("/dashboard/crm");
    revalidatePath("/dashboard/crm/prospects");
    return { ok: true, results };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Impossible d'enregistrer." };
  }
}

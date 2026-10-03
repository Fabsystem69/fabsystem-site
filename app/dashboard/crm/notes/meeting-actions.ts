"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/require-session";
import { applyMeetingNotes, type MeetingApplyResult } from "@/lib/services/meeting-notes-apply";

export async function applyMeetingNotesAction(
  commit: unknown
): Promise<{ ok: true; result: MeetingApplyResult } | { ok: false; error: string }> {
  await requireSession();

  try {
    const result = await applyMeetingNotes(commit);
    revalidatePath("/dashboard/crm");
    revalidatePath("/dashboard/crm/prospects");
    revalidatePath(result.targetHref);
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Impossible d'enregistrer." };
  }
}

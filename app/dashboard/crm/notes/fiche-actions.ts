"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/require-session";
import { applySheetImport, type SheetApplyResult } from "@/lib/services/sheet-import-apply";

export async function applySheetImportAction(
  commit: unknown
): Promise<{ ok: true; result: SheetApplyResult } | { ok: false; error: string }> {
  await requireSession();

  try {
    const result = await applySheetImport(commit);
    revalidatePath("/dashboard/crm");
    revalidatePath(result.targetHref);
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Impossible d'enregistrer." };
  }
}

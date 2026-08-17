"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import {
  activateTrialAccessCode,
  createTrialAccessCode,
  revokeTrialAccessCode,
} from "@/lib/services/trial-access-code";

function getErrorMessage(error: unknown) {
  if (isHttpError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur est survenue.";
}

function buildListRedirect(params: { error?: string; success?: string }) {
  const searchParams = new URLSearchParams();
  if (params.error) searchParams.set("error", params.error);
  if (params.success) searchParams.set("success", params.success);
  const query = searchParams.toString();
  return query ? `/dashboard/schema-unlock-codes?${query}` : "/dashboard/schema-unlock-codes";
}

function buildNewRedirect(params: { error?: string }) {
  const searchParams = new URLSearchParams();
  if (params.error) searchParams.set("error", params.error);
  const query = searchParams.toString();
  return query ? `/dashboard/schema-unlock-codes/new?${query}` : "/dashboard/schema-unlock-codes/new";
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createTrialAccessCodeAction(formData: FormData) {
  await requireSession();

  try {
    const durationDays = Number(getString(formData, "durationDays") || "7");
    const maxRedemptions = Number(getString(formData, "maxRedemptions") || "1");
    const expiresAtRaw = getString(formData, "expiresAt");

    await createTrialAccessCode({
      code: getString(formData, "code") || undefined,
      durationDays,
      maxRedemptions,
      expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
      reason: getString(formData, "reason") || null,
    });

    revalidatePath("/dashboard/schema-unlock-codes");
    redirect(buildListRedirect({ success: "Code promo créé." }));
  } catch (error) {
    redirect(buildNewRedirect({ error: getErrorMessage(error) }));
  }
}

export async function revokeTrialAccessCodeAction(formData: FormData) {
  await requireSession();

  try {
    await revokeTrialAccessCode(getString(formData, "codeId"));
    revalidatePath("/dashboard/schema-unlock-codes");
    redirect(buildListRedirect({ success: "Code désactivé." }));
  } catch (error) {
    redirect(buildListRedirect({ error: getErrorMessage(error) }));
  }
}

export async function activateTrialAccessCodeAction(formData: FormData) {
  await requireSession();

  try {
    await activateTrialAccessCode(getString(formData, "codeId"));
    revalidatePath("/dashboard/schema-unlock-codes");
    redirect(buildListRedirect({ success: "Code réactivé." }));
  } catch (error) {
    redirect(buildListRedirect({ error: getErrorMessage(error) }));
  }
}

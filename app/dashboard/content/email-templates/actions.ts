"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import { resetEmailTemplate, saveEmailTemplate } from "@/lib/services/email-templates";

function getErrorMessage(error: unknown) {
  if (isHttpError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur est survenue.";
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function buildEditRedirect(key: string, params: { error?: string; success?: string }) {
  const searchParams = new URLSearchParams();
  if (params.error) searchParams.set("error", params.error);
  if (params.success) searchParams.set("success", params.success);
  const query = searchParams.toString();
  return query
    ? `/dashboard/content/email-templates/${key}?${query}`
    : `/dashboard/content/email-templates/${key}`;
}

export async function saveEmailTemplateAction(formData: FormData) {
  await requireSession();

  const key = getString(formData, "key");
  const subject = getString(formData, "subject");
  const bodyText = getString(formData, "bodyText");

  let target: string;

  try {
    await saveEmailTemplate(key, { subject, bodyText });
    revalidatePath("/dashboard/content/email-templates");
    revalidatePath(`/dashboard/content/email-templates/${key}`);
    target = buildEditRedirect(key, { success: "Modèle enregistré." });
  } catch (error) {
    target = buildEditRedirect(key, { error: getErrorMessage(error) });
  }

  redirect(target);
}

export async function resetEmailTemplateAction(formData: FormData) {
  await requireSession();

  const key = getString(formData, "key");
  let target: string;

  try {
    await resetEmailTemplate(key);
    revalidatePath("/dashboard/content/email-templates");
    revalidatePath(`/dashboard/content/email-templates/${key}`);
    target = buildEditRedirect(key, { success: "Modèle réinitialisé au contenu par défaut." });
  } catch (error) {
    target = buildEditRedirect(key, { error: getErrorMessage(error) });
  }

  redirect(target);
}

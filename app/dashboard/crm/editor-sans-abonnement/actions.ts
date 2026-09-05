"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import { sendEditorCrmAutoReminders, sendEditorCrmMailing } from "@/lib/services/editor-crm";

const PAGE_PATH = "/dashboard/crm/editor-sans-abonnement";

function errorMessage(error: unknown) {
  if (isHttpError(error)) return error.message;
  return error instanceof Error ? error.message : "Une erreur est survenue.";
}

export async function sendEditorCrmMailingAction(formData: FormData) {
  await requireSession();

  const customerIds = formData.getAll("customerIds").map((value) => String(value));
  const subject = String(formData.get("subject") ?? "");
  const message = String(formData.get("message") ?? "");

  let target: string;
  try {
    const result = await sendEditorCrmMailing({ customerIds, subject, message });
    revalidatePath(PAGE_PATH);
    target = `${PAGE_PATH}?success=${encodeURIComponent(`Email envoyé à ${result.sentCount}/${result.totalRequested} destinataire(s).`)}`;
  } catch (error) {
    target = `${PAGE_PATH}?error=${encodeURIComponent(errorMessage(error))}`;
  }

  redirect(target);
}

export async function runEditorCrmAutoRemindersAction() {
  await requireSession();

  let target: string;
  try {
    const result = await sendEditorCrmAutoReminders();
    revalidatePath(PAGE_PATH);
    target = `${PAGE_PATH}?success=${encodeURIComponent(`Relance automatique lancée : ${result.sentCount}/${result.eligibleCount} email(s) envoyé(s).`)}`;
  } catch (error) {
    target = `${PAGE_PATH}?error=${encodeURIComponent(errorMessage(error))}`;
  }

  redirect(target);
}

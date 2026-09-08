"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import { sendCustomerMailing } from "@/lib/services/customer-mailing";
import { sendEditorCrmAutoReminders } from "@/lib/services/editor-crm";

const PAGE_PATH = "/dashboard/customers";

function errorMessage(error: unknown) {
  if (isHttpError(error)) return error.message;
  return error instanceof Error ? error.message : "Une erreur est survenue.";
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function sendCustomerMailingAction(formData: FormData) {
  await requireSession();

  const segment = getString(formData, "segment");
  const backTarget = segment ? `${PAGE_PATH}?segment=${encodeURIComponent(segment)}` : PAGE_PATH;
  const customerIds = formData.getAll("customerIds").map((value) => String(value));
  const subject = getString(formData, "subject");
  const message = getString(formData, "message");

  let target: string;
  try {
    const result = await sendCustomerMailing({ customerIds, subject, message });
    revalidatePath(PAGE_PATH);
    target = `${backTarget}${segment ? "&" : "?"}success=${encodeURIComponent(
      `Email envoyé à ${result.sentCount}/${result.totalRequested} destinataire(s).`
    )}`;
  } catch (error) {
    target = `${backTarget}${segment ? "&" : "?"}error=${encodeURIComponent(errorMessage(error))}`;
  }

  redirect(target);
}

export async function runEditorCrmAutoRemindersAction() {
  await requireSession();

  let target: string;
  try {
    const result = await sendEditorCrmAutoReminders();
    revalidatePath(PAGE_PATH);
    target = `${PAGE_PATH}?segment=editeur-sans-abonnement&success=${encodeURIComponent(
      `Relance automatique lancée : ${result.sentCount}/${result.eligibleCount} email(s) envoyé(s).`
    )}`;
  } catch (error) {
    target = `${PAGE_PATH}?segment=editeur-sans-abonnement&error=${encodeURIComponent(errorMessage(error))}`;
  }

  redirect(target);
}

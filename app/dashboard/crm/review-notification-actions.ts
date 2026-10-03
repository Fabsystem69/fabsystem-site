"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/require-session";
import { notifyReviewSubmission } from "@/lib/services/coaching-review-submission";

// Bouton « Renvoyer la notification » du CRM : reservé a l'Admin connecte.
// Idempotent : si la notification est deja partie entre-temps, rien n'est
// renvoye (marqueur REVIEW_NOTIFIED).
export async function resendReviewNotificationAction(formData: FormData) {
  await requireSession();
  const rawId = formData.get("projectId");
  const projectId = typeof rawId === "string" ? rawId : "";
  if (projectId) {
    await notifyReviewSubmission(projectId);
  }
  revalidatePath("/dashboard/crm");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { submitProjectForReview } from "@/lib/services/coaching-review-submission";
import { logServerEvent } from "@/lib/server-log";

function errorMessage(error: unknown) {
  if (isHttpError(error)) return error.message;
  return "La transmission a échoué. Votre fiche est conservée, vous pouvez réessayer.";
}

export async function submitProjectAction(formData: FormData) {
  const actor = await requireCustomerActor();
  const rawId = formData.get("projectId");
  const projectId = typeof rawId === "string" ? rawId : "";
  let target: string;
  try {
    const result = await submitProjectForReview(projectId, actor);
    const message =
      result.status === "submitted"
        ? "Projet transmis — Fabien l'a bien reçu."
        : "Votre projet avait déjà été transmis — Fabien l'étudie.";
    target = `/mon-compte/mon-van/${projectId}?success=${encodeURIComponent(message)}`;
  } catch (error) {
    logServerEvent("error", "customer project submission failed", { error, projectId });
    target = `/mon-compte/mon-van/${projectId}/transmettre?error=${encodeURIComponent(errorMessage(error))}`;
  }
  revalidatePath(`/mon-compte/mon-van/${projectId}`);
  redirect(target);
}

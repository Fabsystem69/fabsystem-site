"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import { updateProjectFollowUpReview } from "@/lib/services/project-follow-up-review";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function errorMessage(error: unknown) {
  if (isHttpError(error)) return error.message;
  return error instanceof Error ? error.message : "Impossible de mettre à jour le suivi.";
}

export async function updateProjectFollowUpReviewAction(formData: FormData) {
  await requireSession();

  const projectId = getString(formData, "projectId").trim();
  if (!projectId) redirect("/dashboard/projects");

  let target: string;
  try {
    await updateProjectFollowUpReview({
      projectId,
      stepKey: getString(formData, "stepKey"),
      status: getString(formData, "status"),
      adminNote: getString(formData, "adminNote"),
    });
    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath(`/mon-compte/projets/${projectId}/suivi`);
    target = `/dashboard/projects/${projectId}?success=${encodeURIComponent("Suivi mis à jour pour le client.")}`;
  } catch (error) {
    target = `/dashboard/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }

  redirect(target);
}

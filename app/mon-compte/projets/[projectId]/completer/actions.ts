"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isHttpError } from "@/lib/http-errors";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { setCableLengths } from "@/lib/services/project-schema";

export async function submitCableLengthsAction(formData: FormData) {
  const actor = await requireCustomerActor();
  const projectId = String(formData.get("projectId") ?? "");
  let target: string;

  try {
    const lengths: Record<string, number> = {};
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("length_") || typeof value !== "string") continue;
      const num = Number(value);
      if (Number.isFinite(num) && num > 0) lengths[key.slice("length_".length)] = num;
    }

    await setCableLengths(actor, projectId, lengths);
    revalidatePath(`/mon-compte/projets/${projectId}/completer`);
    revalidatePath("/mon-compte/projets");
    target = `/mon-compte/projets/${projectId}/completer?success=${encodeURIComponent("Distances enregistrées, merci !")}`;
  } catch (error) {
    const message = isHttpError(error) ? error.message : "Une erreur est survenue.";
    target = `/mon-compte/projets/${projectId}/completer?error=${encodeURIComponent(message)}`;
  }

  redirect(target);
}

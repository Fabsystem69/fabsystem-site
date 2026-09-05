"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { badRequest, forbidden, isHttpError } from "@/lib/http-errors";
import { uploadDossierDocument } from "@/lib/server/dossier-storage";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { addDossierDocument, assertDossierStorageQuota, getDossierForDetail } from "@/lib/services/dossier-client";

function errorMessage(error: unknown) {
  if (isHttpError(error)) return error.message;
  return error instanceof Error ? error.message : "Une erreur est survenue.";
}

export async function uploadOwnDossierDocumentAction(formData: FormData) {
  let target: string;
  try {
    const actor = await requireCustomerActor();
    const dossierId = String(formData.get("dossierId") ?? "");
    const dossier = await getDossierForDetail(dossierId);

    if (actor.role !== "customer" || dossier.customerId !== actor.customerId) {
      throw forbidden("Ce dossier ne vous appartient pas.");
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw badRequest("Fichier requis.");

    await assertDossierStorageQuota(dossierId, file.size);

    const buffer = Buffer.from(await file.arrayBuffer());
    const { bucket, path } = await uploadDossierDocument({
      dossierId,
      filename: file.name,
      contentType: file.type,
      buffer,
    });

    await addDossierDocument({
      dossierId,
      filename: file.name,
      bucket,
      path,
      contentType: file.type,
      sizeBytes: buffer.byteLength,
      uploadedBy: dossier.customer.email,
    });

    revalidatePath("/mon-compte/mon-accompagnement");
    revalidatePath(`/dashboard/accompagnements/${dossierId}`);
    target = "/mon-compte/mon-accompagnement?success=" + encodeURIComponent("Document envoyé.");
  } catch (error) {
    target = "/mon-compte/mon-accompagnement?error=" + encodeURIComponent(errorMessage(error));
  }
  redirect(target);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { badRequest, isHttpError } from "@/lib/http-errors";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { deleteDossierDocumentFile, uploadDossierDocument } from "@/lib/server/dossier-storage";
import {
  addDossierDocument,
  addDossierIteration,
  advanceDossierStep,
  assertDossierStorageQuota,
  createManualDossierClient,
  deleteDossierDocumentRecord,
  setDossierWhatsapp,
  updateDossierNotesInternes,
  updateDossierSimpleStatus,
} from "@/lib/services/dossier-client";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function errorMessage(error: unknown) {
  if (isHttpError(error)) return error.message;
  return error instanceof Error ? error.message : "Une erreur est survenue.";
}

export async function createManualDossierAction(formData: FormData) {
  await requireSession();

  let target: string;
  try {
    const email = getString(formData, "customerEmail").trim().toLowerCase();
    if (!email) throw badRequest("Email client requis.");

    const customer = await prisma.customer.findUnique({ where: { email }, select: { id: true } });
    if (!customer) throw badRequest(`Aucun client trouvé avec l'email ${email}.`);

    const dossier = await createManualDossierClient({
      customerId: customer.id,
      offre: getString(formData, "offre") as "DECOUVERTE" | "CONSEIL" | "GUIDE" | "CONCEPTION",
      whatsapp: getString(formData, "whatsapp") || null,
    });
    revalidatePath("/dashboard/accompagnements");
    target = `/dashboard/accompagnements/${dossier.id}`;
  } catch (error) {
    target = `/dashboard/accompagnements/new?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function updateDossierSimpleStatusAction(formData: FormData) {
  await requireSession();

  const dossierId = getString(formData, "dossierId");
  let target: string;
  try {
    await updateDossierSimpleStatus({
      dossierId,
      statutSimple: getString(formData, "statutSimple") as "A_VENIR" | "FAIT",
      compteRendu: getString(formData, "compteRendu"),
    });
    revalidatePath("/dashboard/accompagnements");
    revalidatePath(`/dashboard/accompagnements/${dossierId}`);
    target = `/dashboard/accompagnements/${dossierId}?success=${encodeURIComponent("Statut mis à jour.")}`;
  } catch (error) {
    target = `/dashboard/accompagnements/${dossierId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function advanceDossierStepAction(formData: FormData) {
  await requireSession();

  const dossierId = getString(formData, "dossierId");
  let target: string;
  try {
    await advanceDossierStep({
      dossierId,
      stepKey: getString(formData, "stepKey"),
      note: getString(formData, "note"),
    });
    revalidatePath("/dashboard/accompagnements");
    revalidatePath(`/dashboard/accompagnements/${dossierId}`);
    revalidatePath("/mon-compte/mon-accompagnement");
    target = `/dashboard/accompagnements/${dossierId}?success=${encodeURIComponent("Étape mise à jour.")}`;
  } catch (error) {
    target = `/dashboard/accompagnements/${dossierId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function addDossierIterationAction(formData: FormData) {
  await requireSession();

  const dossierId = getString(formData, "dossierId");
  let target: string;
  try {
    await addDossierIteration({ dossierId, note: getString(formData, "note") });
    revalidatePath(`/dashboard/accompagnements/${dossierId}`);
    revalidatePath("/mon-compte/mon-accompagnement");
    target = `/dashboard/accompagnements/${dossierId}?success=${encodeURIComponent("Itération ajoutée.")}`;
  } catch (error) {
    target = `/dashboard/accompagnements/${dossierId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function updateDossierNotesInternesAction(formData: FormData) {
  await requireSession();

  const dossierId = getString(formData, "dossierId");
  let target: string;
  try {
    await updateDossierNotesInternes({ dossierId, notesInternes: getString(formData, "notesInternes") });
    revalidatePath(`/dashboard/accompagnements/${dossierId}`);
    target = `/dashboard/accompagnements/${dossierId}?success=${encodeURIComponent("Notes internes enregistrées.")}`;
  } catch (error) {
    target = `/dashboard/accompagnements/${dossierId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function setDossierWhatsappAction(formData: FormData) {
  await requireSession();

  const dossierId = getString(formData, "dossierId");
  let target: string;
  try {
    await setDossierWhatsapp({ dossierId, whatsapp: getString(formData, "whatsapp") });
    revalidatePath(`/dashboard/accompagnements/${dossierId}`);
    target = `/dashboard/accompagnements/${dossierId}?success=${encodeURIComponent("Numéro WhatsApp mis à jour.")}`;
  } catch (error) {
    target = `/dashboard/accompagnements/${dossierId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function uploadDossierDocumentAction(formData: FormData) {
  await requireSession();

  const dossierId = getString(formData, "dossierId");
  let target: string;
  try {
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
      uploadedBy: "FabSystem",
    });

    revalidatePath(`/dashboard/accompagnements/${dossierId}`);
    revalidatePath("/mon-compte/mon-accompagnement");
    target = `/dashboard/accompagnements/${dossierId}?success=${encodeURIComponent("Document ajouté.")}`;
  } catch (error) {
    target = `/dashboard/accompagnements/${dossierId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function deleteDossierDocumentAction(formData: FormData) {
  await requireSession();

  const dossierId = getString(formData, "dossierId");
  const documentId = getString(formData, "documentId");
  let target: string;
  try {
    const document = await deleteDossierDocumentRecord(documentId);
    await deleteDossierDocumentFile(document.path).catch(() => {});
    revalidatePath(`/dashboard/accompagnements/${dossierId}`);
    target = `/dashboard/accompagnements/${dossierId}?success=${encodeURIComponent("Document retiré.")}`;
  } catch (error) {
    target = `/dashboard/accompagnements/${dossierId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { badRequest, isHttpError } from "@/lib/http-errors";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { deleteDossierDocumentFile, uploadDossierDocument } from "@/lib/server/dossier-storage";
import { parseLocalDateTimeInTimeZone } from "@/lib/timezone";
import { isProjectStarterId } from "@/lib/project-starter-contract";
import { createProjectForCustomerByAdmin } from "@/lib/services/project";
import type { ProjectAssetType, ProjectVoltage } from "@/lib/generated/prisma/client";
import {
  addDossierDocument,
  addDossierIteration,
  advanceDossierStep,
  assertDossierStorageQuota,
  createDossierAppointment,
  createManualDossierClient,
  deleteDossierAppointment,
  deleteDossierDocumentRecord,
  setDossierAppointmentSummary,
  setDossierDelivered,
  setDossierWhatsapp,
  updateDossierAppointment,
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

// Cas régulier de l'accompagnement (retour utilisateur) : l'admin construit
// le schéma directement pendant la prestation, plutôt que d'attendre que le
// client le crée lui-même. Redirige droit dans l'éditeur une fois créé —
// requireProjectActor() (voir app/api/projects/[projectId]/schema/route.ts)
// accepte une session admin, pas seulement le client propriétaire.
export async function createProjectForDossierAction(formData: FormData) {
  await requireSession();

  const dossierId = getString(formData, "dossierId");
  let target: string;
  try {
    const dossier = await prisma.dossierClient.findUnique({
      where: { id: dossierId },
      select: { customerId: true },
    });
    if (!dossier) throw badRequest("Dossier introuvable.");

    const name = getString(formData, "name").trim();
    if (!name) throw badRequest("Nom du schéma requis.");
    const starterRaw = getString(formData, "starter");

    const project = await createProjectForCustomerByAdmin(dossier.customerId, {
      name,
      assetType: getString(formData, "assetType") as ProjectAssetType,
      voltage: getString(formData, "voltage") as ProjectVoltage,
      starter: isProjectStarterId(starterRaw) ? starterRaw : undefined,
    });
    revalidatePath(`/dashboard/accompagnements/${dossierId}`);
    revalidatePath("/dashboard/projects");
    target = `/outils/schema/editeur?projectId=${project.id}`;
  } catch (error) {
    target = `/dashboard/accompagnements/${dossierId}?error=${encodeURIComponent(errorMessage(error))}`;
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

export async function setDossierDeliveredAction(formData: FormData) {
  await requireSession();

  const dossierId = getString(formData, "dossierId");
  const delivered = getString(formData, "delivered") === "true";
  let target: string;
  try {
    await setDossierDelivered({ dossierId, delivered });
    revalidatePath("/dashboard/accompagnements");
    revalidatePath(`/dashboard/accompagnements/${dossierId}`);
    revalidatePath("/mon-compte/mon-accompagnement");
    target = `/dashboard/accompagnements/${dossierId}?success=${encodeURIComponent(
      delivered ? "Dossier marqué comme livré." : "Marquage \"livré\" annulé."
    )}`;
  } catch (error) {
    target = `/dashboard/accompagnements/${dossierId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function createDossierAppointmentAction(formData: FormData) {
  await requireSession();

  const dossierId = getString(formData, "dossierId");
  let target: string;
  try {
    await createDossierAppointment({
      dossierId,
      scheduledAt: parseLocalDateTimeInTimeZone(getString(formData, "scheduledAt")),
      durationMinutes: Number(getString(formData, "durationMinutes")) || 30,
    });
    revalidatePath(`/dashboard/accompagnements/${dossierId}`);
    revalidatePath("/mon-compte/mon-accompagnement");
    target = `/dashboard/accompagnements/${dossierId}?success=${encodeURIComponent("Rendez-vous ajouté.")}`;
  } catch (error) {
    target = `/dashboard/accompagnements/${dossierId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function updateDossierAppointmentAction(formData: FormData) {
  await requireSession();

  const dossierId = getString(formData, "dossierId");
  const appointmentId = getString(formData, "appointmentId");
  let target: string;
  try {
    await updateDossierAppointment({
      appointmentId,
      scheduledAt: parseLocalDateTimeInTimeZone(getString(formData, "scheduledAt")),
      durationMinutes: Number(getString(formData, "durationMinutes")) || 30,
    });
    revalidatePath(`/dashboard/accompagnements/${dossierId}`);
    revalidatePath("/mon-compte/mon-accompagnement");
    target = `/dashboard/accompagnements/${dossierId}?success=${encodeURIComponent("Rendez-vous mis à jour.")}`;
  } catch (error) {
    target = `/dashboard/accompagnements/${dossierId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function setDossierAppointmentSummaryAction(formData: FormData) {
  await requireSession();

  const dossierId = getString(formData, "dossierId");
  const appointmentId = getString(formData, "appointmentId");
  let target: string;
  try {
    await setDossierAppointmentSummary({ appointmentId, compteRendu: getString(formData, "compteRendu") });
    revalidatePath(`/dashboard/accompagnements/${dossierId}`);
    revalidatePath("/mon-compte/mon-accompagnement");
    target = `/dashboard/accompagnements/${dossierId}?success=${encodeURIComponent("Compte-rendu enregistré.")}`;
  } catch (error) {
    target = `/dashboard/accompagnements/${dossierId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function deleteDossierAppointmentAction(formData: FormData) {
  await requireSession();

  const dossierId = getString(formData, "dossierId");
  const appointmentId = getString(formData, "appointmentId");
  let target: string;
  try {
    await deleteDossierAppointment(appointmentId);
    revalidatePath(`/dashboard/accompagnements/${dossierId}`);
    revalidatePath("/mon-compte/mon-accompagnement");
    target = `/dashboard/accompagnements/${dossierId}?success=${encodeURIComponent("Rendez-vous supprimé.")}`;
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

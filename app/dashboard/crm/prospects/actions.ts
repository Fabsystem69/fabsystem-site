"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import {
  convertProspectToClient,
  createProspect,
  logProspectNote,
  updateProspect,
  updateProspectMessageTemplate,
} from "@/lib/services/prospect";
import type { ProspectSource, ProspectStatus } from "@/lib/generated/prisma/client";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getOptionalDate(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value ? new Date(value) : null;
}

function errorMessage(error: unknown) {
  if (isHttpError(error)) return error.message;
  return error instanceof Error ? error.message : "Une erreur est survenue.";
}

export async function createProspectAction(formData: FormData) {
  await requireSession();

  let target: string;
  try {
    const prospect = await createProspect({
      name: getString(formData, "name"),
      phone: getString(formData, "phone") || null,
      email: getString(formData, "email") || null,
      source: getString(formData, "source") as ProspectSource,
      facebookLink: getString(formData, "facebookLink") || null,
      besoinElectricite: getString(formData, "besoinElectricite") || null,
      notesInternes: getString(formData, "notesInternes") || null,
      nextAction: getString(formData, "nextAction") || null,
      nextActionAt: getOptionalDate(formData, "nextActionAt"),
    });
    revalidatePath("/dashboard/crm/prospects");
    revalidatePath("/dashboard/crm");
    target = `/dashboard/crm/prospects/${prospect.id}`;
  } catch (error) {
    target = `/dashboard/crm/prospects/new?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function updateProspectAction(formData: FormData) {
  await requireSession();

  const prospectId = getString(formData, "prospectId");
  let target: string;
  try {
    await updateProspect({
      prospectId,
      name: getString(formData, "name"),
      phone: getString(formData, "phone") || null,
      email: getString(formData, "email") || null,
      source: (getString(formData, "source") || undefined) as ProspectSource | undefined,
      facebookLink: getString(formData, "facebookLink") || null,
      besoinElectricite: getString(formData, "besoinElectricite") || null,
      notesInternes: getString(formData, "notesInternes") || null,
      status: (getString(formData, "status") || undefined) as ProspectStatus | undefined,
      nextAction: getString(formData, "nextAction") || null,
      nextActionAt: getOptionalDate(formData, "nextActionAt"),
    });
    revalidatePath("/dashboard/crm/prospects");
    revalidatePath(`/dashboard/crm/prospects/${prospectId}`);
    revalidatePath("/dashboard/crm");
    target = `/dashboard/crm/prospects/${prospectId}?success=${encodeURIComponent("Prospect mis à jour.")}`;
  } catch (error) {
    target = `/dashboard/crm/prospects/${prospectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function logProspectNoteAction(formData: FormData) {
  await requireSession();

  const prospectId = getString(formData, "prospectId");
  let target: string;
  try {
    await logProspectNote({ prospectId, note: getString(formData, "note") });
    revalidatePath(`/dashboard/crm/prospects/${prospectId}`);
    target = `/dashboard/crm/prospects/${prospectId}?success=${encodeURIComponent("Note ajoutée.")}`;
  } catch (error) {
    target = `/dashboard/crm/prospects/${prospectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function convertProspectAction(formData: FormData) {
  await requireSession();

  const prospectId = getString(formData, "prospectId");
  let target: string;
  try {
    const result = await convertProspectToClient({
      prospectId,
      email: getString(formData, "email"),
      projectTitle: getString(formData, "projectTitle"),
    });
    revalidatePath("/dashboard/crm/prospects");
    revalidatePath("/dashboard/crm/clients");
    revalidatePath("/dashboard/crm");
    target = `/dashboard/crm/projects/${result.projectId}?success=${encodeURIComponent("Prospect converti en client.")}`;
  } catch (error) {
    target = `/dashboard/crm/prospects/${prospectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function updateProspectMessageTemplateAction(formData: FormData) {
  await requireSession();

  let target: string;
  try {
    await updateProspectMessageTemplate({
      templateId: getString(formData, "templateId"),
      label: getString(formData, "label"),
      body: getString(formData, "body"),
    });
    revalidatePath("/dashboard/crm/prospects/templates");
    target = `/dashboard/crm/prospects/templates?success=${encodeURIComponent("Modèle enregistré.")}`;
  } catch (error) {
    target = `/dashboard/crm/prospects/templates?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

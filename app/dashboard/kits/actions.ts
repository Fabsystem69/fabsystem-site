"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import {
  addKitItem,
  createKit,
  deleteKit,
  deleteKitItem,
  updateKit,
} from "@/lib/services/kit";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getLines(formData: FormData, key: string) {
  return getString(formData, key)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function errorMessage(error: unknown) {
  if (isHttpError(error)) return error.message;
  return error instanceof Error ? error.message : "Une erreur est survenue.";
}

export async function createKitAction(formData: FormData) {
  await requireSession();

  let target: string;
  try {
    const kit = await createKit({ name: getString(formData, "name") });
    revalidatePath("/dashboard/kits");
    target = `/dashboard/kits/${kit.id}/edit`;
  } catch (error) {
    target = `/dashboard/kits/new?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function updateKitAction(formData: FormData) {
  await requireSession();

  const kitId = getString(formData, "kitId");
  let target: string;
  try {
    await updateKit(kitId, {
      name: getString(formData, "name"),
      photoControls: getLines(formData, "photoControls"),
      powerControls: getLines(formData, "powerControls"),
      checklist: getLines(formData, "checklist"),
    });
    revalidatePath("/dashboard/kits");
    revalidatePath(`/dashboard/kits/${kitId}/edit`);
    target = `/dashboard/kits/${kitId}/edit?success=${encodeURIComponent("Kit mis à jour.")}`;
  } catch (error) {
    target = `/dashboard/kits/${kitId}/edit?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function deleteKitAction(formData: FormData) {
  await requireSession();

  const kitId = getString(formData, "kitId");
  let target: string;
  try {
    await deleteKit(kitId);
    revalidatePath("/dashboard/kits");
    target = "/dashboard/kits?success=" + encodeURIComponent("Kit supprimé.");
  } catch (error) {
    target = `/dashboard/kits/${kitId}/edit?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function addKitItemAction(formData: FormData) {
  await requireSession();

  const kitId = getString(formData, "kitId");
  let target: string;
  try {
    await addKitItem(kitId, {
      priority: getString(formData, "priority"),
      block: getString(formData, "block"),
      name: getString(formData, "name"),
      why: getString(formData, "why"),
      budgetCents: Math.round(Number.parseFloat(getString(formData, "budgetEuros") || "0") * 100),
      href: getString(formData, "href"),
    });
    revalidatePath(`/dashboard/kits/${kitId}/edit`);
    target = `/dashboard/kits/${kitId}/edit?success=${encodeURIComponent("Article ajouté.")}`;
  } catch (error) {
    target = `/dashboard/kits/${kitId}/edit?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function deleteKitItemAction(formData: FormData) {
  await requireSession();

  const kitId = getString(formData, "kitId");
  const kitItemId = getString(formData, "kitItemId");
  try {
    await deleteKitItem(kitItemId);
    revalidatePath(`/dashboard/kits/${kitId}/edit`);
  } catch (error) {
    redirect(`/dashboard/kits/${kitId}/edit?error=${encodeURIComponent(errorMessage(error))}`);
  }
  redirect(`/dashboard/kits/${kitId}/edit?success=${encodeURIComponent("Article supprimé.")}`);
}

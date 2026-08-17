"use server";

import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { updateOwnCustomerProfile } from "@/lib/services/customer-profile";
import { setOwnCustomerPassword } from "@/lib/services/customer-password-auth";

function getErrorMessage(error: unknown) {
  if (isHttpError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur est survenue.";
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildProfileRedirect(params: { error?: string; success?: string }) {
  const searchParams = new URLSearchParams();
  if (params.error) searchParams.set("error", params.error);
  if (params.success) searchParams.set("success", params.success);
  const query = searchParams.toString();
  return query ? `/mon-compte/profil?${query}` : "/mon-compte/profil";
}

export async function updateOwnProfileAction(formData: FormData) {
  const actor = await requireCustomerActor();

  try {
    await updateOwnCustomerProfile(actor, {
      firstName: getString(formData, "firstName"),
      lastName: getString(formData, "lastName"),
      phone: getString(formData, "phone"),
      address: getString(formData, "address"),
      assetType:
        getString(formData, "assetType") === "VEHICLE" || getString(formData, "assetType") === "BOAT"
          ? (getString(formData, "assetType") as "VEHICLE" | "BOAT")
          : "OTHER",
      assetBrand: getString(formData, "assetBrand"),
      assetModel: getString(formData, "assetModel"),
      registration: getString(formData, "registration"),
      electricalSkillLevel:
        getString(formData, "electricalSkillLevel") === "DEBUTANT" ||
        getString(formData, "electricalSkillLevel") === "INTERMEDIAIRE" ||
        getString(formData, "electricalSkillLevel") === "AVANCE"
          ? (getString(formData, "electricalSkillLevel") as "DEBUTANT" | "INTERMEDIAIRE" | "AVANCE")
          : undefined,
    });
  } catch (error) {
    redirect(buildProfileRedirect({ error: getErrorMessage(error) }));
  }

  redirect(buildProfileRedirect({ success: "Profil mis à jour." }));
}

export async function updateOwnPasswordAction(formData: FormData) {
  const actor = await requireCustomerActor();
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (password !== confirmPassword) {
    redirect(buildProfileRedirect({ error: "Les mots de passe ne correspondent pas." }));
  }

  try {
    await setOwnCustomerPassword(actor, password);
  } catch (error) {
    redirect(buildProfileRedirect({ error: getErrorMessage(error) }));
  }

  redirect(buildProfileRedirect({ success: "Mot de passe mis à jour." }));
}

"use server";

import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireCustomerActor } from "@/lib/server/project-actor";
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
  return typeof value === "string" ? value : "";
}

export async function setPasswordAction(formData: FormData) {
  const actor = await requireCustomerActor();
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (password !== confirmPassword) {
    redirect("/mon-compte/definir-mot-de-passe?error=Les+mots+de+passe+ne+correspondent+pas.");
  }

  try {
    await setOwnCustomerPassword(actor, password);
  } catch (error) {
    redirect(
      `/mon-compte/definir-mot-de-passe?error=${encodeURIComponent(getErrorMessage(error))}`
    );
  }

  redirect("/mon-compte");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import { grantResourceToCustomer, revokeResourceGrant } from "@/lib/services/customer-resource-grants";

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

function buildCustomerRedirect(customerId: string, params: { error?: string; success?: string }) {
  const searchParams = new URLSearchParams();

  if (params.error) searchParams.set("error", params.error);
  if (params.success) searchParams.set("success", params.success);

  const query = searchParams.toString();
  return query ? `/dashboard/customers/${customerId}?${query}` : `/dashboard/customers/${customerId}`;
}

function buildNewResourceRedirect(customerId: string, params: { error?: string }) {
  const searchParams = new URLSearchParams();

  if (params.error) searchParams.set("error", params.error);

  const query = searchParams.toString();
  return query
    ? `/dashboard/customers/${customerId}/resources/new?${query}`
    : `/dashboard/customers/${customerId}/resources/new`;
}

export async function grantResourceAction(formData: FormData) {
  await requireSession();

  const customerId = getString(formData, "customerId");
  const [productId, assetId] = getString(formData, "resource").split(":");
  const note = getString(formData, "note");

  let redirectTarget: string;

  try {
    if (!productId || !assetId) {
      throw new Error("Choisissez une ressource.");
    }
    await grantResourceToCustomer({ customerId, productId, assetId, note: note || undefined });
    revalidatePath(`/dashboard/customers/${customerId}`);
    redirectTarget = buildCustomerRedirect(customerId, { success: "Ressource offerte au client." });
  } catch (error) {
    redirectTarget = buildNewResourceRedirect(customerId, { error: getErrorMessage(error) });
  }

  redirect(redirectTarget);
}

export async function revokeResourceGrantAction(formData: FormData) {
  await requireSession();

  const customerId = getString(formData, "customerId");
  const grantId = getString(formData, "grantId");

  let redirectTarget: string;

  try {
    await revokeResourceGrant(grantId);
    revalidatePath(`/dashboard/customers/${customerId}`);
    redirectTarget = buildCustomerRedirect(customerId, { success: "Ressource revoquee." });
  } catch (error) {
    redirectTarget = buildCustomerRedirect(customerId, { error: getErrorMessage(error) });
  }

  redirect(redirectTarget);
}

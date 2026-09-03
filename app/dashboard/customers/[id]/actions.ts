"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import { getRequiredBaseUrl } from "@/lib/server/env";
import { requestMagicLoginLink } from "@/lib/services/customer-auth";
import { createCustomerAuthRequestLinkService } from "@/lib/services/customer-auth-request-link";
import { sendCustomerMagicLoginEmail } from "@/lib/services/customer-email";
import { grantResourceToCustomer, revokeResourceGrant } from "@/lib/services/customer-resource-grants";
import { prisma } from "@/lib/prisma";

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

export async function inviteCustomerToPortalAction(formData: FormData) {
  await requireSession();
  const customerId = getString(formData, "customerId");
  let redirectTarget: string;

  try {
    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { email: true, name: true } });
    if (!customer?.email) throw new Error("Ce client doit avoir une adresse email avant l'invitation.");
    const service = createCustomerAuthRequestLinkService({ requestMagicLoginLink, sendCustomerMagicLoginEmail });
    await service.requestLink({ email: customer.email, name: customer.name ?? undefined, baseUrl: getRequiredBaseUrl() });
    redirectTarget = buildCustomerRedirect(customerId, { success: `Invitation envoyée à ${customer.email}.` });
  } catch (error) {
    redirectTarget = buildCustomerRedirect(customerId, { error: getErrorMessage(error) });
  }

  redirect(redirectTarget);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import { getRequiredBaseUrl } from "@/lib/server/env";
import { refundOrderInFull } from "@/lib/services/admin-refunds";
import { requestMagicLoginLink } from "@/lib/services/customer-auth";
import { createCustomerAuthRequestLinkService } from "@/lib/services/customer-auth-request-link";
import { sendCustomerMagicLoginEmail } from "@/lib/services/customer-email";
import {
  increaseDownloadGrantLimit,
  resetDownloadGrantCount,
  revokeDownloadGrant,
} from "@/lib/services/download-grant";

const DOWNLOAD_GRANT_LIMIT_INCREMENT = 5;

function getErrorMessage(error: unknown) {
  if (isHttpError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur est survenue.";
}

function buildOrderRedirect(orderId: string, params: { error?: string; success?: string }) {
  const searchParams = new URLSearchParams();

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.success) {
    searchParams.set("success", params.success);
  }

  const query = searchParams.toString();
  return query
    ? `/dashboard/orders/${orderId}?${query}`
    : `/dashboard/orders/${orderId}`;
}

// redirect() de next/navigation lance une exception interne pour fonctionner : elle
// ne doit jamais etre appelee a l'interieur d'un try/catch, sinon le catch l'avale et
// affiche le digest NEXT_REDIRECT comme si c'etait une erreur metier. Chaque action
// calcule donc sa destination puis appelle redirect() une seule fois, hors try/catch.

export async function refundOrderInFullAction(formData: FormData) {
  await requireSession();

  const orderId = formData.get("orderId");
  const confirmationText = formData.get("confirmationText");

  const normalizedOrderId = typeof orderId === "string" ? orderId.trim() : "";
  const normalizedConfirmationText =
    typeof confirmationText === "string" ? confirmationText : "";

  if (!normalizedOrderId) {
    redirect(buildOrderRedirect("unknown", { error: "Commande introuvable." }));
  }

  let redirectTarget: string;

  try {
    const result = await refundOrderInFull({
      orderId: normalizedOrderId,
      confirmationText: normalizedConfirmationText,
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${normalizedOrderId}`);

    const successMessage = result.alreadyRefunded
      ? "Commande deja remboursee."
      : `Commande ${result.orderNumber} remboursee.`;

    redirectTarget = buildOrderRedirect(normalizedOrderId, { success: successMessage });
  } catch (error) {
    redirectTarget = buildOrderRedirect(normalizedOrderId, { error: getErrorMessage(error) });
  }

  redirect(redirectTarget);
}

function getGrantActionFields(formData: FormData) {
  const orderId = formData.get("orderId");
  const grantId = formData.get("grantId");

  return {
    orderId: typeof orderId === "string" ? orderId.trim() : "",
    grantId: typeof grantId === "string" ? grantId.trim() : "",
  };
}

export async function resetDownloadGrantCountAction(formData: FormData) {
  await requireSession();

  const { orderId, grantId } = getGrantActionFields(formData);

  if (!orderId || !grantId) {
    redirect(buildOrderRedirect(orderId || "unknown", { error: "Grant introuvable." }));
  }

  let redirectTarget: string;

  try {
    await resetDownloadGrantCount(grantId);
    revalidatePath(`/dashboard/orders/${orderId}`);
    redirectTarget = buildOrderRedirect(orderId, {
      success: "Compteur de telechargement reinitialise.",
    });
  } catch (error) {
    redirectTarget = buildOrderRedirect(orderId, { error: getErrorMessage(error) });
  }

  redirect(redirectTarget);
}

export async function addDownloadsToGrantAction(formData: FormData) {
  await requireSession();

  const { orderId, grantId } = getGrantActionFields(formData);

  if (!orderId || !grantId) {
    redirect(buildOrderRedirect(orderId || "unknown", { error: "Grant introuvable." }));
  }

  let redirectTarget: string;

  try {
    await increaseDownloadGrantLimit(grantId, DOWNLOAD_GRANT_LIMIT_INCREMENT);
    revalidatePath(`/dashboard/orders/${orderId}`);
    redirectTarget = buildOrderRedirect(orderId, {
      success: `${DOWNLOAD_GRANT_LIMIT_INCREMENT} telechargements supplementaires ajoutes.`,
    });
  } catch (error) {
    redirectTarget = buildOrderRedirect(orderId, { error: getErrorMessage(error) });
  }

  redirect(redirectTarget);
}

export async function revokeDownloadGrantAction(formData: FormData) {
  await requireSession();

  const { orderId, grantId } = getGrantActionFields(formData);

  if (!orderId || !grantId) {
    redirect(buildOrderRedirect(orderId || "unknown", { error: "Grant introuvable." }));
  }

  let redirectTarget: string;

  try {
    await revokeDownloadGrant(grantId);
    revalidatePath(`/dashboard/orders/${orderId}`);
    redirectTarget = buildOrderRedirect(orderId, { success: "Acces au telechargement revoque." });
  } catch (error) {
    redirectTarget = buildOrderRedirect(orderId, { error: getErrorMessage(error) });
  }

  redirect(redirectTarget);
}

export async function resendMagicLinkAction(formData: FormData) {
  await requireSession();

  const orderId = formData.get("orderId");
  const customerEmail = formData.get("customerEmail");

  const normalizedOrderId = typeof orderId === "string" ? orderId.trim() : "";
  const normalizedEmail = typeof customerEmail === "string" ? customerEmail.trim() : "";

  if (!normalizedOrderId || !normalizedEmail) {
    redirect(buildOrderRedirect(normalizedOrderId || "unknown", { error: "Client introuvable." }));
  }

  let redirectTarget: string;

  try {
    const service = createCustomerAuthRequestLinkService({
      requestMagicLoginLink,
      sendCustomerMagicLoginEmail,
    });
    await service.requestLink({
      email: normalizedEmail,
      baseUrl: getRequiredBaseUrl(),
    });
    redirectTarget = buildOrderRedirect(normalizedOrderId, {
      success: `Lien de connexion renvoye a ${normalizedEmail}.`,
    });
  } catch (error) {
    redirectTarget = buildOrderRedirect(normalizedOrderId, { error: getErrorMessage(error) });
  }

  redirect(redirectTarget);
}

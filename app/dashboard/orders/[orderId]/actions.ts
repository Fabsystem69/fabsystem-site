"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import { refundOrderInFull } from "@/lib/services/admin-refunds";

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

    redirect(buildOrderRedirect(normalizedOrderId, { success: successMessage }));
  } catch (error) {
    redirect(buildOrderRedirect(normalizedOrderId, { error: getErrorMessage(error) }));
  }
}

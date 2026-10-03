"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { sendPurchaseLinkEmail } from "@/lib/services/purchase-link-email";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function buildRedirect(params: Record<string, string>) {
  return `/dashboard/purchase-links?${new URLSearchParams(params).toString()}`;
}

export async function sendPurchaseLinkAction(formData: FormData) {
  await requireSession();

  let target: string;

  try {
    const result = await sendPurchaseLinkEmail({
      productSlug: readString(formData, "productSlug"),
      customerEmail: readString(formData, "customerEmail"),
      customerName: readString(formData, "customerName") || undefined,
      personalNote: readString(formData, "personalNote") || undefined,
    });

    target = buildRedirect({
      success: `Mail envoyé à ${readString(formData, "customerEmail").trim()} (${result.productName}).`,
    });
  } catch (error) {
    console.error("purchase_link.email.failed", error);
    target = buildRedirect({
      error: error instanceof Error ? error.message : "Impossible d'envoyer le mail.",
    });
  }

  redirect(target);
}

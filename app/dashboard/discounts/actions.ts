"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import {
  activateDiscountCode,
  createCoachingEbookDiscountCode,
  disableDiscountCode,
} from "@/lib/services/discounts";

function getErrorMessage(error: unknown) {
  if (isHttpError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur est survenue.";
}

function buildDiscountsRedirect(params: { error?: string; success?: string }) {
  const searchParams = new URLSearchParams();

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.success) {
    searchParams.set("success", params.success);
  }

  const query = searchParams.toString();
  return query ? `/dashboard/discounts?${query}` : "/dashboard/discounts";
}

function buildDiscountsNewRedirect(params: { error?: string; success?: string }) {
  const searchParams = new URLSearchParams();

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.success) {
    searchParams.set("success", params.success);
  }

  const query = searchParams.toString();
  return query ? `/dashboard/discounts/new?${query}` : "/dashboard/discounts/new";
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createCoachingDiscountAction(formData: FormData) {
  await requireSession();

  try {
    await createCoachingEbookDiscountCode({
      customerEmail: getRequiredString(formData, "customerEmail"),
      productId: getRequiredString(formData, "productId"),
      reason: getRequiredString(formData, "reason") || undefined,
    });
    revalidatePath("/dashboard/discounts");
    redirect(buildDiscountsRedirect({ success: "Code coaching créé." }));
  } catch (error) {
    redirect(buildDiscountsNewRedirect({ error: getErrorMessage(error) }));
  }
}

export async function disableDiscountCodeAction(formData: FormData) {
  await requireSession();

  try {
    await disableDiscountCode(getRequiredString(formData, "discountCodeId"));
    revalidatePath("/dashboard/discounts");
    redirect(buildDiscountsRedirect({ success: "Code désactivé." }));
  } catch (error) {
    redirect(buildDiscountsRedirect({ error: getErrorMessage(error) }));
  }
}

export async function activateDiscountCodeAction(formData: FormData) {
  await requireSession();

  try {
    await activateDiscountCode(getRequiredString(formData, "discountCodeId"));
    revalidatePath("/dashboard/discounts");
    redirect(buildDiscountsRedirect({ success: "Code réactivé." }));
  } catch (error) {
    redirect(buildDiscountsRedirect({ error: getErrorMessage(error) }));
  }
}

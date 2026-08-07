"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import {
  activateDiscountCode,
  createDiscountCode,
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

function getOptionalString(formData: FormData, key: string) {
  const value = getRequiredString(formData, key).trim();
  return value || undefined;
}

function getOptionalEuros(formData: FormData, key: string) {
  const raw = getOptionalString(formData, key);

  if (!raw) {
    return undefined;
  }

  const euros = Number(raw.replace(",", "."));
  return Number.isFinite(euros) ? Math.round(euros * 100) : undefined;
}

function getOptionalInt(formData: FormData, key: string) {
  const raw = getOptionalString(formData, key);

  if (!raw) {
    return undefined;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getOptionalDate(formData: FormData, key: string) {
  const raw = getOptionalString(formData, key);
  return raw ? new Date(`${raw}T23:59:59`) : undefined;
}

export async function createDiscountCodeAction(formData: FormData) {
  await requireSession();

  try {
    const type = getRequiredString(formData, "type") === "PERCENTAGE" ? "PERCENTAGE" : "FIXED_AMOUNT";

    await createDiscountCode({
      type,
      amountOffCents: type === "FIXED_AMOUNT" ? getOptionalEuros(formData, "amountOffEuros") : undefined,
      percentOff: type === "PERCENTAGE" ? getOptionalInt(formData, "percentOff") : undefined,
      productId: getOptionalString(formData, "productId"),
      customerEmail: getOptionalString(formData, "customerEmail"),
      unlimitedRedemptions: formData.get("unlimitedRedemptions") === "on",
      maxRedemptions: getOptionalInt(formData, "maxRedemptions"),
      expiresAt: getOptionalDate(formData, "expiresAt"),
      codePrefix: getOptionalString(formData, "codePrefix"),
      reason: getOptionalString(formData, "reason"),
    });
    revalidatePath("/dashboard/discounts");
    redirect(buildDiscountsRedirect({ success: "Code de réduction créé." }));
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

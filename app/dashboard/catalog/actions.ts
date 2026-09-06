"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import { getEnumFormValue } from "@/lib/form-enum";
import { ProductStatus, ProductType, PurchaseMode } from "@/lib/generated/prisma/client";
import {
  activateProduct,
  archiveProduct,
  createProductWithPrice,
  draftProduct,
  updateActiveProductPrice,
  updateProductDetails,
} from "@/lib/services/catalog";
import { prisma } from "@/lib/prisma";
import { seedPrestationsOffers } from "@/lib/services/prestations-offers-seed";

function getErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Donnees de formulaire invalides.";
  }

  if (isHttpError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur est survenue.";
}

function getProductId(formData: FormData) {
  const productId = formData.get("productId");

  if (typeof productId !== "string" || !productId.trim()) {
    throw new Error("Product ID is required");
  }

  return productId.trim();
}

function buildCatalogRedirect(params: { error?: string; success?: string }) {
  const searchParams = new URLSearchParams();

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.success) {
    searchParams.set("success", params.success);
  }

  const query = searchParams.toString();
  return query ? `/dashboard/catalog?${query}` : "/dashboard/catalog";
}

function buildCatalogNewRedirect(params: { error?: string; success?: string }) {
  const searchParams = new URLSearchParams();

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.success) {
    searchParams.set("success", params.success);
  }

  const query = searchParams.toString();
  return query ? `/dashboard/catalog/new?${query}` : "/dashboard/catalog/new";
}

function buildCatalogEditRedirect(productId: string, params: { error?: string; success?: string }) {
  const searchParams = new URLSearchParams();

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.success) {
    searchParams.set("success", params.success);
  }

  const query = searchParams.toString();
  return query ? `/dashboard/catalog/${productId}/edit?${query}` : `/dashboard/catalog/${productId}/edit`;
}

async function runCatalogAction(
  formData: FormData,
  action: (productId: string) => Promise<unknown>,
  successMessage: string
) {
  await requireSession();

  let target: string;

  try {
    await action(getProductId(formData));
    revalidatePath("/dashboard/catalog");
    target = buildCatalogRedirect({ success: successMessage });
  } catch (error) {
    target = buildCatalogRedirect({ error: getErrorMessage(error) });
  }

  redirect(target);
}

export async function archiveProductAction(formData: FormData) {
  return runCatalogAction(formData, archiveProduct, "Produit archive.");
}

export async function activateProductAction(formData: FormData) {
  return runCatalogAction(formData, activateProduct, "Produit active.");
}

export async function draftProductAction(formData: FormData) {
  return runCatalogAction(formData, draftProduct, "Produit passe en brouillon.");
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getProductFormPayload(formData: FormData) {
  const includedEditorAccessDaysRaw = getRequiredString(formData, "includedEditorAccessDays").trim();
  return {
    name: getRequiredString(formData, "name"),
    slug: getRequiredString(formData, "slug"),
    shortDescription: getRequiredString(formData, "shortDescription"),
    description: getRequiredString(formData, "description"),
    featuredImage: "",
    productType: getEnumFormValue(ProductType, formData, "productType"),
    purchaseMode: getEnumFormValue(PurchaseMode, formData, "purchaseMode"),
    status: getEnumFormValue(ProductStatus, formData, "status"),
    includedEditorAccessDays: includedEditorAccessDaysRaw ? Number(includedEditorAccessDaysRaw) : null,
  };
}

export async function createProductAction(formData: FormData) {
  await requireSession();

  let target: string;

  try {
    const payload = getProductFormPayload(formData);
    const amountEuros = Number(getRequiredString(formData, "amountEuros"));
    const created = await createProductWithPrice({
      ...payload,
      amountEuros,
      currency: "EUR",
    });

    revalidatePath("/dashboard/catalog");
    target = buildCatalogEditRedirect(created.id, { success: "Produit cree." });
  } catch (error) {
    target = buildCatalogNewRedirect({ error: getErrorMessage(error) });
  }

  redirect(target);
}

export async function updateProductAction(formData: FormData) {
  await requireSession();

  const productId = getProductId(formData);
  let target: string;

  try {
    await updateProductDetails(productId, getProductFormPayload(formData));
    revalidatePath("/dashboard/catalog");
    revalidatePath(`/dashboard/catalog/${productId}/edit`);
    target = buildCatalogEditRedirect(productId, { success: "Produit mis a jour." });
  } catch (error) {
    target = buildCatalogEditRedirect(productId, { error: getErrorMessage(error) });
  }

  redirect(target);
}

export async function seedPrestationsOffersAction() {
  await requireSession();

  let target: string;

  try {
    const result = await seedPrestationsOffers(prisma);
    revalidatePath("/dashboard/catalog");
    target = buildCatalogRedirect({
      success: `${result.seeded.length} offre(s) d'accompagnement synchronisee(s) (${result.seeded
        .map((s) => s.slug)
        .join(", ")}), ${result.archivedLegacyProducts} ancien(s) pack(s) archive(s).`,
    });
  } catch (error) {
    target = buildCatalogRedirect({ error: getErrorMessage(error) });
  }

  redirect(target);
}

export async function updateProductPriceAction(formData: FormData) {
  await requireSession();

  const productId = getProductId(formData);
  let target: string;

  try {
    const amountEuros = Number(getRequiredString(formData, "amountEuros"));
    await updateActiveProductPrice(productId, {
      amountEuros,
      currency: "EUR",
    });
    revalidatePath("/dashboard/catalog");
    revalidatePath(`/dashboard/catalog/${productId}/edit`);
    target = buildCatalogEditRedirect(productId, { success: "Prix mis a jour." });
  } catch (error) {
    target = buildCatalogEditRedirect(productId, { error: getErrorMessage(error) });
  }

  redirect(target);
}

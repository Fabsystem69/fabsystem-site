"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import { getEnumFormValue } from "@/lib/form-enum";
import { DigitalAssetProvider, DigitalAssetStatus } from "@/lib/generated/prisma/client";
import {
  createDigitalAsset,
  linkAssetToProduct,
  setDigitalAssetStatus,
  unlinkAssetFromProduct,
  updateDigitalAsset,
} from "@/lib/services/catalog";
import { migrateEbookAssetsToVercelBlob } from "@/lib/services/ebook-migration";

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

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getRequiredId(formData: FormData, key: string, label: string) {
  const value = getRequiredString(formData, key).trim();

  if (!value) {
    throw new Error(`${label} is required`);
  }

  return value;
}

function buildAssetsRedirect(pathname: string, params: { error?: string; success?: string }) {
  const searchParams = new URLSearchParams();

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.success) {
    searchParams.set("success", params.success);
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function getAssetFormPayload(formData: FormData) {
  return {
    provider: getEnumFormValue(DigitalAssetProvider, formData, "provider"),
    bucket: getRequiredString(formData, "bucket"),
    path: getRequiredString(formData, "path"),
    filename: getRequiredString(formData, "filename"),
    status: getEnumFormValue(DigitalAssetStatus, formData, "status"),
  };
}

export async function createDigitalAssetAction(formData: FormData) {
  await requireSession();

  try {
    const asset = await createDigitalAsset(getAssetFormPayload(formData));
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/catalog/assets");
    redirect(
      buildAssetsRedirect(`/dashboard/catalog/assets/${asset.id}/edit`, {
        success: "Asset cree.",
      })
    );
  } catch (error) {
    redirect(
      buildAssetsRedirect("/dashboard/catalog/assets/new", {
        error: getErrorMessage(error),
      })
    );
  }
}

export async function updateDigitalAssetAction(formData: FormData) {
  await requireSession();

  const assetId = getRequiredId(formData, "assetId", "Asset ID");

  try {
    await updateDigitalAsset(assetId, getAssetFormPayload(formData));
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/catalog/assets");
    revalidatePath(`/dashboard/catalog/assets/${assetId}/edit`);
    redirect(
      buildAssetsRedirect(`/dashboard/catalog/assets/${assetId}/edit`, {
        success: "Asset mis a jour.",
      })
    );
  } catch (error) {
    redirect(
      buildAssetsRedirect(`/dashboard/catalog/assets/${assetId}/edit`, {
        error: getErrorMessage(error),
      })
    );
  }
}

async function runAssetStatusAction(
  formData: FormData,
  status: "ACTIVE" | "ARCHIVED",
  successMessage: string
) {
  await requireSession();

  const assetId = getRequiredId(formData, "assetId", "Asset ID");
  const productId = getRequiredString(formData, "productId").trim();

  try {
    await setDigitalAssetStatus(assetId, status);
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/catalog/assets");
    revalidatePath(`/dashboard/catalog/assets/${assetId}/edit`);
    if (productId) {
      revalidatePath(`/dashboard/catalog/${productId}/edit`);
      redirect(
        buildAssetsRedirect(`/dashboard/catalog/${productId}/edit`, {
          success: successMessage,
        })
      );
    }

    redirect(
      buildAssetsRedirect("/dashboard/catalog/assets", {
        success: successMessage,
      })
    );
  } catch (error) {
    if (productId) {
      redirect(
        buildAssetsRedirect(`/dashboard/catalog/${productId}/edit`, {
          error: getErrorMessage(error),
        })
      );
    }

    redirect(
      buildAssetsRedirect("/dashboard/catalog/assets", {
        error: getErrorMessage(error),
      })
    );
  }
}

export async function activateDigitalAssetAction(formData: FormData) {
  return runAssetStatusAction(formData, "ACTIVE", "Asset active.");
}

export async function archiveDigitalAssetAction(formData: FormData) {
  return runAssetStatusAction(formData, "ARCHIVED", "Asset archive.");
}

export async function linkAssetToProductAction(formData: FormData) {
  await requireSession();

  const productId = getRequiredId(formData, "productId", "Product ID");

  try {
    const assetId = getRequiredId(formData, "assetId", "Asset ID");
    await linkAssetToProduct(productId, assetId);
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/catalog/assets");
    revalidatePath(`/dashboard/catalog/${productId}/edit`);
    redirect(
      buildAssetsRedirect(`/dashboard/catalog/${productId}/edit`, {
        success: "Asset lie au produit.",
      })
    );
  } catch (error) {
    redirect(
      buildAssetsRedirect(`/dashboard/catalog/${productId}/edit`, {
        error: getErrorMessage(error),
      })
    );
  }
}

export async function migrateEbookAssetsAction() {
  await requireSession();

  let target: string;

  try {
    const results = await migrateEbookAssetsToVercelBlob();
    const migrated = results.filter((r) => r.status === "migrated").length;
    const failed = results.length - migrated;
    revalidatePath("/dashboard/catalog/assets");

    if (results.length === 0) {
      target = buildAssetsRedirect("/dashboard/catalog/assets", {
        success: "Aucun asset sur Supabase a migrer.",
      });
    } else if (failed === 0) {
      target = buildAssetsRedirect("/dashboard/catalog/assets", {
        success: `${migrated} asset(s) migre(s) vers Vercel Blob.`,
      });
    } else {
      const failedDetails = results
        .filter((r) => r.status !== "migrated")
        .map((r) => `${r.filename} (${r.status})`)
        .join(", ");
      target = buildAssetsRedirect("/dashboard/catalog/assets", {
        error: `${migrated} migre(s), ${failed} echec(s) : ${failedDetails}`,
      });
    }
  } catch (error) {
    target = buildAssetsRedirect("/dashboard/catalog/assets", {
      error: getErrorMessage(error),
    });
  }

  redirect(target);
}

export async function unlinkAssetFromProductAction(formData: FormData) {
  await requireSession();

  const productId = getRequiredId(formData, "productId", "Product ID");

  try {
    const assetId = getRequiredId(formData, "assetId", "Asset ID");
    await unlinkAssetFromProduct(productId, assetId);
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/catalog/assets");
    revalidatePath(`/dashboard/catalog/${productId}/edit`);
    redirect(
      buildAssetsRedirect(`/dashboard/catalog/${productId}/edit`, {
        success: "Asset delie du produit.",
      })
    );
  } catch (error) {
    redirect(
      buildAssetsRedirect(`/dashboard/catalog/${productId}/edit`, {
        error: getErrorMessage(error),
      })
    );
  }
}

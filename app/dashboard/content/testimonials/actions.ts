"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import {
  createTestimonial,
  deleteTestimonial,
  setTestimonialDisplayOrder,
  setTestimonialFeatured,
  setTestimonialPublished,
  updateTestimonial,
  type CreateTestimonialInput,
} from "@/lib/services/testimonials";

const CUSTOMER_TYPES = ["VAN", "CAMPING_CAR", "BOAT", "OTHER"] as const;

function getErrorMessage(error: unknown) {
  if (isHttpError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur est survenue.";
}

function buildListRedirect(params: { error?: string; success?: string }) {
  const searchParams = new URLSearchParams();

  if (params.error) searchParams.set("error", params.error);
  if (params.success) searchParams.set("success", params.success);

  const query = searchParams.toString();
  return query ? `/dashboard/content/testimonials?${query}` : "/dashboard/content/testimonials";
}

function buildNewRedirect(params: { error?: string; success?: string }) {
  const searchParams = new URLSearchParams();

  if (params.error) searchParams.set("error", params.error);
  if (params.success) searchParams.set("success", params.success);

  const query = searchParams.toString();
  return query
    ? `/dashboard/content/testimonials/new?${query}`
    : "/dashboard/content/testimonials/new";
}

function buildEditRedirect(id: string, params: { error?: string; success?: string }) {
  const searchParams = new URLSearchParams();

  if (params.error) searchParams.set("error", params.error);
  if (params.success) searchParams.set("success", params.success);

  const query = searchParams.toString();
  return query
    ? `/dashboard/content/testimonials/${id}/edit?${query}`
    : `/dashboard/content/testimonials/${id}/edit`;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getCustomerType(formData: FormData): CreateTestimonialInput["customerType"] {
  const value = getString(formData, "customerType");
  return (CUSTOMER_TYPES as readonly string[]).includes(value)
    ? (value as CreateTestimonialInput["customerType"])
    : "OTHER";
}

export async function createTestimonialAction(formData: FormData) {
  await requireSession();

  let redirectTarget: string;

  try {
    await createTestimonial({
      displayName: getString(formData, "displayName"),
      customerType: getCustomerType(formData),
      vehicleModel: getString(formData, "vehicleModel") || undefined,
      region: getString(formData, "region") || undefined,
      rating: Number(getString(formData, "rating")),
      quote: getString(formData, "quote"),
      relatedOffer: getString(formData, "relatedOffer") || undefined,
      isVerifiedPurchase: formData.get("isVerifiedPurchase") === "on",
    });
    revalidatePath("/dashboard/content/testimonials");
    redirectTarget = buildListRedirect({
      success: "Temoignage cree (non publie par defaut).",
    });
  } catch (error) {
    redirectTarget = buildNewRedirect({ error: getErrorMessage(error) });
  }

  redirect(redirectTarget);
}

export async function updateTestimonialAction(formData: FormData) {
  await requireSession();

  const id = getString(formData, "id");
  let redirectTarget: string;

  try {
    await updateTestimonial(id, {
      displayName: getString(formData, "displayName"),
      customerType: getCustomerType(formData),
      vehicleModel: getString(formData, "vehicleModel") || undefined,
      region: getString(formData, "region") || undefined,
      rating: Number(getString(formData, "rating")),
      quote: getString(formData, "quote"),
      relatedOffer: getString(formData, "relatedOffer") || undefined,
      isVerifiedPurchase: formData.get("isVerifiedPurchase") === "on",
    });
    revalidatePath("/dashboard/content/testimonials");
    redirectTarget = buildListRedirect({ success: "Temoignage mis a jour." });
  } catch (error) {
    redirectTarget = buildEditRedirect(id, { error: getErrorMessage(error) });
  }

  redirect(redirectTarget);
}

export async function setTestimonialPublishedAction(formData: FormData) {
  await requireSession();

  const id = getString(formData, "id");
  const isPublished = getString(formData, "isPublished") === "true";
  let redirectTarget: string;

  try {
    await setTestimonialPublished(id, isPublished);
    revalidatePath("/dashboard/content/testimonials");
    revalidatePath("/prestations");
    redirectTarget = buildListRedirect({
      success: isPublished ? "Temoignage publie." : "Temoignage masque.",
    });
  } catch (error) {
    redirectTarget = buildListRedirect({ error: getErrorMessage(error) });
  }

  redirect(redirectTarget);
}

export async function setTestimonialFeaturedAction(formData: FormData) {
  await requireSession();

  const id = getString(formData, "id");
  const isFeatured = getString(formData, "isFeatured") === "true";
  let redirectTarget: string;

  try {
    await setTestimonialFeatured(id, isFeatured);
    revalidatePath("/dashboard/content/testimonials");
    revalidatePath("/prestations");
    redirectTarget = buildListRedirect({
      success: isFeatured ? "Temoignage mis en avant." : "Mise en avant retiree.",
    });
  } catch (error) {
    redirectTarget = buildListRedirect({ error: getErrorMessage(error) });
  }

  redirect(redirectTarget);
}

export async function setTestimonialDisplayOrderAction(formData: FormData) {
  await requireSession();

  const id = getString(formData, "id");
  const displayOrder = Number(getString(formData, "displayOrder"));
  let redirectTarget: string;

  try {
    await setTestimonialDisplayOrder(id, displayOrder);
    revalidatePath("/dashboard/content/testimonials");
    revalidatePath("/prestations");
    redirectTarget = buildListRedirect({ success: "Ordre d'affichage mis a jour." });
  } catch (error) {
    redirectTarget = buildListRedirect({ error: getErrorMessage(error) });
  }

  redirect(redirectTarget);
}

export async function deleteTestimonialAction(formData: FormData) {
  await requireSession();

  const id = getString(formData, "id");
  let redirectTarget: string;

  try {
    await deleteTestimonial(id);
    revalidatePath("/dashboard/content/testimonials");
    redirectTarget = buildListRedirect({ success: "Temoignage supprime." });
  } catch (error) {
    redirectTarget = buildListRedirect({ error: getErrorMessage(error) });
  }

  redirect(redirectTarget);
}

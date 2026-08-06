import { z } from "zod";
import type { AssetType } from "@/lib/generated/prisma/client";

const optionalTrimmedString = z.string().trim().optional().or(z.literal(""));

export const customerInputSchema = z.object({
  name: z.string().trim().min(1),
  // Customer.email est NOT NULL + unique en base (migration
  // normalize-customer-for-client-auth) : ne jamais accepter un email vide ici,
  // sous peine de faire planter Prisma au lieu de renvoyer une erreur de
  // validation propre.
  email: z.string().trim().min(1).email(),
  phone: optionalTrimmedString,
  address: optionalTrimmedString,
  assetType: z.enum(["VEHICLE", "BOAT", "OTHER"]).default("OTHER"),
  assetBrand: optionalTrimmedString,
  assetModel: optionalTrimmedString,
  registration: optionalTrimmedString,
  odometerKm: z.coerce.number().int().min(0).optional().nullable().or(z.literal("")),
  engineHours: z.coerce.number().int().min(0).optional().nullable().or(z.literal("")),
});

function normalizeNullableNumber(value: number | "" | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeCustomerData(data: z.infer<typeof customerInputSchema>) {
  return {
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    address: data.address || null,
    assetType: data.assetType as AssetType,
    assetBrand: data.assetBrand || null,
    assetModel: data.assetModel || null,
    registration: data.registration ? data.registration.trim().toUpperCase() : null,
    odometerKm: normalizeNullableNumber(data.odometerKm),
    engineHours: normalizeNullableNumber(data.engineHours),
  };
}

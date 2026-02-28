import type { AssetType } from "@/lib/generated/prisma/client";

export type CustomerAssetFields = {
  assetType: AssetType;
  assetBrand: string | null;
  assetModel: string | null;
  registration: string | null;
  odometerKm: number | null;
  engineHours: number | null;
};

function joinNonEmpty(parts: Array<string | null | undefined>) {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(" ");
}

export function getCustomerAssetLabel(assetType: AssetType) {
  if (assetType === "VEHICLE") {
    return "Véhicule";
  }

  if (assetType === "BOAT") {
    return "Bateau";
  }

  return "Équipement";
}

export function formatCustomerAssetSummary(customer: CustomerAssetFields) {
  const brandModel = joinNonEmpty([customer.assetBrand, customer.assetModel]);
  const parts: string[] = [];

  if (brandModel) {
    parts.push(brandModel);
  }

  if (customer.registration) {
    parts.push(
      customer.assetType === "BOAT"
        ? `HIN: ${customer.registration}`
        : `Immat: ${customer.registration}`
    );
  }

  if (customer.assetType === "BOAT" && customer.engineHours !== null) {
    parts.push(`Heures: ${customer.engineHours}`);
  } else if (customer.odometerKm !== null) {
    parts.push(`Km: ${customer.odometerKm}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return `${getCustomerAssetLabel(customer.assetType)}: ${parts.join(" — ")}`;
}

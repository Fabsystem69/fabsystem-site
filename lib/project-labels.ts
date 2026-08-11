// Libellés d'affichage pour les enums Project (prisma/schema.prisma).
// Module pur, aucune règle métier : uniquement de la traduction FR pour
// l'UI. Les identifiants techniques (ProjectAssetType, ProjectVoltage,
// ProjectStatus) restent ceux du backend, jamais recréés ici.
import type {
  ProjectAssetType,
  ProjectStatus,
  ProjectVoltage,
} from "@/lib/generated/prisma/client";

export const PROJECT_ASSET_TYPE_LABELS: Record<ProjectAssetType, string> = {
  BOAT: "Bateau",
  VAN: "Van",
  MOTORHOME: "Camping-car",
  OTHER: "Autre",
};

export const PROJECT_VOLTAGE_LABELS: Record<ProjectVoltage, string> = {
  V12: "12 V",
  V24: "24 V",
  UNKNOWN: "Je ne sais pas",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: "Actif",
  ARCHIVED: "Archivé",
  DELETE_SCHEDULED: "Suppression programmée",
};

export function getProjectAssetTypeLabel(assetType: ProjectAssetType) {
  return PROJECT_ASSET_TYPE_LABELS[assetType];
}

export function getProjectVoltageLabel(voltage: ProjectVoltage) {
  return PROJECT_VOLTAGE_LABELS[voltage];
}

export function getProjectStatusLabel(status: ProjectStatus) {
  return PROJECT_STATUS_LABELS[status];
}

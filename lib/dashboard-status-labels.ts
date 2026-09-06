// Libellés d'affichage pour les enums e-commerce / codes promo (prisma/schema.prisma).
// Même principe que lib/project-labels.ts : traduction FR pure pour l'UI du
// dashboard, les identifiants techniques back-end restent ceux du modèle.
import type {
  DigitalAssetStatus,
  DiscountCodeStatus,
  DossierOffre,
  DossierStatutSimple,
  DownloadGrantStatus,
  EditorSubscriptionStatus,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  TrialAccessCodeStatus,
} from "@/lib/generated/prisma/client";
import type { AdminBadgeTone } from "@/components/dashboard/ui";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Brouillon",
  PENDING_PAYMENT: "Paiement en attente",
  PAID: "Payée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

export const ORDER_STATUS_TONES: Record<OrderStatus, AdminBadgeTone> = {
  DRAFT: "neutral",
  PENDING_PAYMENT: "warning",
  PAID: "success",
  CANCELLED: "neutral",
  REFUNDED: "info",
};

export function getOrderStatusLabel(status: OrderStatus) {
  return ORDER_STATUS_LABELS[status];
}

export function getOrderStatusTone(status: OrderStatus) {
  return ORDER_STATUS_TONES[status];
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "En attente",
  SUCCEEDED: "Réussi",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
  PARTIALLY_REFUNDED: "Partiellement remboursé",
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, AdminBadgeTone> = {
  PENDING: "warning",
  SUCCEEDED: "success",
  FAILED: "danger",
  REFUNDED: "info",
  PARTIALLY_REFUNDED: "info",
};

export function getPaymentStatusLabel(status: PaymentStatus) {
  return PAYMENT_STATUS_LABELS[status];
}

export function getPaymentStatusTone(status: PaymentStatus) {
  return PAYMENT_STATUS_TONES[status];
}

export const DOWNLOAD_GRANT_STATUS_LABELS: Record<DownloadGrantStatus, string> = {
  ACTIVE: "Actif",
  REVOKED: "Révoqué",
  EXPIRED: "Expiré",
};

export const DOWNLOAD_GRANT_STATUS_TONES: Record<DownloadGrantStatus, AdminBadgeTone> = {
  ACTIVE: "success",
  REVOKED: "danger",
  EXPIRED: "neutral",
};

export function getDownloadGrantStatusLabel(status: DownloadGrantStatus) {
  return DOWNLOAD_GRANT_STATUS_LABELS[status];
}

export function getDownloadGrantStatusTone(status: DownloadGrantStatus) {
  return DOWNLOAD_GRANT_STATUS_TONES[status];
}

export const DISCOUNT_CODE_STATUS_LABELS: Record<DiscountCodeStatus, string> = {
  ACTIVE: "Actif",
  DISABLED: "Désactivé",
  EXPIRED: "Expiré",
};

export const DISCOUNT_CODE_STATUS_TONES: Record<DiscountCodeStatus, AdminBadgeTone> = {
  ACTIVE: "success",
  DISABLED: "neutral",
  EXPIRED: "danger",
};

export function getDiscountCodeStatusLabel(status: DiscountCodeStatus) {
  return DISCOUNT_CODE_STATUS_LABELS[status];
}

export function getDiscountCodeStatusTone(status: DiscountCodeStatus) {
  return DISCOUNT_CODE_STATUS_TONES[status];
}

export const TRIAL_ACCESS_CODE_STATUS_LABELS: Record<TrialAccessCodeStatus, string> = {
  ACTIVE: "Actif",
  REVOKED: "Révoqué",
};

export const TRIAL_ACCESS_CODE_STATUS_TONES: Record<TrialAccessCodeStatus, AdminBadgeTone> = {
  ACTIVE: "success",
  REVOKED: "neutral",
};

export function getTrialAccessCodeStatusLabel(status: TrialAccessCodeStatus) {
  return TRIAL_ACCESS_CODE_STATUS_LABELS[status];
}

export function getTrialAccessCodeStatusTone(status: TrialAccessCodeStatus) {
  return TRIAL_ACCESS_CODE_STATUS_TONES[status];
}

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  ARCHIVED: "Archivé",
};

export const PRODUCT_STATUS_TONES: Record<ProductStatus, AdminBadgeTone> = {
  DRAFT: "warning",
  ACTIVE: "success",
  ARCHIVED: "neutral",
};

export function getProductStatusLabel(status: ProductStatus) {
  return PRODUCT_STATUS_LABELS[status];
}

export function getProductStatusTone(status: ProductStatus) {
  return PRODUCT_STATUS_TONES[status];
}

export const DIGITAL_ASSET_STATUS_LABELS: Record<DigitalAssetStatus, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  ARCHIVED: "Archivé",
};

export const DIGITAL_ASSET_STATUS_TONES: Record<DigitalAssetStatus, AdminBadgeTone> = {
  DRAFT: "warning",
  ACTIVE: "success",
  ARCHIVED: "neutral",
};

export function getDigitalAssetStatusLabel(status: DigitalAssetStatus) {
  return DIGITAL_ASSET_STATUS_LABELS[status];
}

export function getDigitalAssetStatusTone(status: DigitalAssetStatus) {
  return DIGITAL_ASSET_STATUS_TONES[status];
}

export const DOSSIER_OFFRE_LABELS: Record<DossierOffre, string> = {
  DECOUVERTE: "Appel découverte",
  CONSEIL: "Appel conseil",
  GUIDE: "Accompagnement guidé",
  CONCEPTION: "Conception complète",
};

export function getDossierOffreLabel(offre: DossierOffre) {
  return DOSSIER_OFFRE_LABELS[offre];
}

export const DOSSIER_STATUT_SIMPLE_LABELS: Record<DossierStatutSimple, string> = {
  A_VENIR: "À venir",
  FAIT: "Fait",
};

export const DOSSIER_STATUT_SIMPLE_TONES: Record<DossierStatutSimple, AdminBadgeTone> = {
  A_VENIR: "warning",
  FAIT: "success",
};

export function getDossierStatutSimpleLabel(statut: DossierStatutSimple) {
  return DOSSIER_STATUT_SIMPLE_LABELS[statut];
}

export function getDossierStatutSimpleTone(statut: DossierStatutSimple) {
  return DOSSIER_STATUT_SIMPLE_TONES[statut];
}

// Code couleur d'anciennete (CDC v3 §3.2, seuils de depart a affiner avec
// l'usage) : vert <7j, orange 7-14j, rouge >14j sans activite.
export function getDossierActivityTone(derniereActivite: Date, now: Date = new Date()): AdminBadgeTone {
  const days = (now.getTime() - derniereActivite.getTime()) / (24 * 60 * 60 * 1000);
  if (days < 7) return "success";
  if (days < 14) return "warning";
  return "danger";
}

export const EDITOR_SUBSCRIPTION_STATUS_LABELS: Record<EditorSubscriptionStatus, string> = {
  ACTIVE: "Actif",
  TRIALING: "Période d'essai",
  PAST_DUE: "Paiement en retard",
  UNPAID: "Impayé",
  INCOMPLETE: "Incomplet",
  CANCELED: "Annulé",
};

export const EDITOR_SUBSCRIPTION_STATUS_TONES: Record<EditorSubscriptionStatus, AdminBadgeTone> = {
  ACTIVE: "success",
  TRIALING: "info",
  PAST_DUE: "warning",
  UNPAID: "danger",
  INCOMPLETE: "warning",
  CANCELED: "neutral",
};

export function getEditorSubscriptionStatusLabel(status: EditorSubscriptionStatus) {
  return EDITOR_SUBSCRIPTION_STATUS_LABELS[status];
}

export function getEditorSubscriptionStatusTone(status: EditorSubscriptionStatus) {
  return EDITOR_SUBSCRIPTION_STATUS_TONES[status];
}

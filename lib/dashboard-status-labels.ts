// Libellés d'affichage pour les enums e-commerce / codes promo (prisma/schema.prisma).
// Même principe que lib/project-labels.ts : traduction FR pure pour l'UI du
// dashboard, les identifiants techniques back-end restent ceux du modèle.
import type {
  ClientLevel,
  CoachingActionStatus,
  CoachingCalcMethod,
  CoachingCircuitReviewStatus,
  CoachingDataOrigin,
  CoachingDevicePhase,
  CoachingDevicePriority,
  CoachingDeviceState,
  CoachingMaterialCategory,
  CoachingMeasurementPoint,
  CoachingPaymentStatus,
  CoachingPowerSupply,
  CoachingProjectStatus,
  CoachingProposalStatus,
  CoachingSchemaStatus,
  CoachingSessionStatus,
  DigitalAssetStatus,
  DiscountCodeStatus,
  DossierOffre,
  DossierStatutSimple,
  DownloadGrantStatus,
  EditorSubscriptionStatus,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  ProspectSource,
  ProspectStatus,
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

// --- CRM coaching (prospects Facebook -> clients -> projets) ---------------

export const PROSPECT_SOURCE_LABELS: Record<ProspectSource, string> = {
  MESSENGER: "Messenger",
  PAGE_FACEBOOK: "Page Facebook",
  GROUPE_FACEBOOK: "Groupe Facebook",
  COMMENTAIRE: "Commentaire",
  PUBLICITE: "Publicité",
  AUTRE: "Autre",
};

export function getProspectSourceLabel(source: ProspectSource) {
  return PROSPECT_SOURCE_LABELS[source];
}

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  NOUVEAU: "Nouveau",
  EN_DISCUSSION: "En discussion",
  COACHING_PROPOSE: "Coaching proposé",
  RESERVE: "Réservé",
  GAGNE: "Gagné",
  SANS_SUITE: "Sans suite",
};

export const PROSPECT_STATUS_TONES: Record<ProspectStatus, AdminBadgeTone> = {
  NOUVEAU: "info",
  EN_DISCUSSION: "warning",
  COACHING_PROPOSE: "warning",
  RESERVE: "success",
  GAGNE: "success",
  SANS_SUITE: "neutral",
};

export function getProspectStatusLabel(status: ProspectStatus) {
  return PROSPECT_STATUS_LABELS[status];
}

export function getProspectStatusTone(status: ProspectStatus) {
  return PROSPECT_STATUS_TONES[status];
}

export const CLIENT_LEVEL_LABELS: Record<ClientLevel, string> = {
  DEBUTANT: "Débutant",
  INTERMEDIAIRE: "Intermédiaire",
  AVANCE: "Avancé",
};

export function getClientLevelLabel(level: ClientLevel) {
  return CLIENT_LEVEL_LABELS[level];
}

export const COACHING_PROJECT_STATUS_LABELS: Record<CoachingProjectStatus, string> = {
  A_DEMARRER: "À démarrer",
  EN_COURS: "En cours",
  EN_ATTENTE: "En attente",
  TERMINE: "Terminé",
};

export const COACHING_PROJECT_STATUS_TONES: Record<CoachingProjectStatus, AdminBadgeTone> = {
  A_DEMARRER: "info",
  EN_COURS: "warning",
  EN_ATTENTE: "neutral",
  TERMINE: "success",
};

export function getCoachingProjectStatusLabel(status: CoachingProjectStatus) {
  return COACHING_PROJECT_STATUS_LABELS[status];
}

export function getCoachingProjectStatusTone(status: CoachingProjectStatus) {
  return COACHING_PROJECT_STATUS_TONES[status];
}

export const COACHING_SESSION_STATUS_LABELS: Record<CoachingSessionStatus, string> = {
  PREVUE: "Prévue",
  REALISEE: "Réalisée",
  ANNULEE: "Annulée",
};

export const COACHING_SESSION_STATUS_TONES: Record<CoachingSessionStatus, AdminBadgeTone> = {
  PREVUE: "info",
  REALISEE: "success",
  ANNULEE: "neutral",
};

export function getCoachingSessionStatusLabel(status: CoachingSessionStatus) {
  return COACHING_SESSION_STATUS_LABELS[status];
}

export function getCoachingSessionStatusTone(status: CoachingSessionStatus) {
  return COACHING_SESSION_STATUS_TONES[status];
}

export const COACHING_ACTION_STATUS_LABELS: Record<CoachingActionStatus, string> = {
  A_FAIRE: "À faire",
  FAIT: "Fait",
};

export function getCoachingActionStatusLabel(status: CoachingActionStatus) {
  return COACHING_ACTION_STATUS_LABELS[status];
}

export const COACHING_PROPOSAL_STATUS_LABELS: Record<CoachingProposalStatus, string> = {
  BROUILLON: "Brouillon",
  ENVOYEE: "Envoyée",
  ACCEPTEE: "Acceptée",
  REFUSEE: "Refusée",
};

export const COACHING_PROPOSAL_STATUS_TONES: Record<CoachingProposalStatus, AdminBadgeTone> = {
  BROUILLON: "neutral",
  ENVOYEE: "info",
  ACCEPTEE: "success",
  REFUSEE: "danger",
};

export function getCoachingProposalStatusLabel(status: CoachingProposalStatus) {
  return COACHING_PROPOSAL_STATUS_LABELS[status];
}

export function getCoachingProposalStatusTone(status: CoachingProposalStatus) {
  return COACHING_PROPOSAL_STATUS_TONES[status];
}

export const COACHING_PAYMENT_STATUS_LABELS: Record<CoachingPaymentStatus, string> = {
  EN_ATTENTE: "En attente",
  PARTIEL: "Partiel",
  PAYE: "Payé",
};

export const COACHING_PAYMENT_STATUS_TONES: Record<CoachingPaymentStatus, AdminBadgeTone> = {
  EN_ATTENTE: "warning",
  PARTIEL: "warning",
  PAYE: "success",
};

export function getCoachingPaymentStatusLabel(status: CoachingPaymentStatus) {
  return COACHING_PAYMENT_STATUS_LABELS[status];
}

export function getCoachingPaymentStatusTone(status: CoachingPaymentStatus) {
  return COACHING_PAYMENT_STATUS_TONES[status];
}

// --- Dossier van (appareils / bilan de consommation) -----------------------

export const COACHING_DEVICE_STATE_LABELS: Record<CoachingDeviceState, string> = {
  ENVISAGE: "Envisagé",
  CHOISI: "Choisi",
  ACHETE: "Acheté",
  INSTALLE: "Installé",
};

export function getCoachingDeviceStateLabel(state: CoachingDeviceState) {
  return COACHING_DEVICE_STATE_LABELS[state];
}

export const COACHING_DEVICE_PHASE_LABELS: Record<CoachingDevicePhase, string> = {
  ACTUEL: "Actuel",
  FUTUR: "Évolution future",
};

export function getCoachingDevicePhaseLabel(phase: CoachingDevicePhase) {
  return COACHING_DEVICE_PHASE_LABELS[phase];
}

export const COACHING_DEVICE_PRIORITY_LABELS: Record<CoachingDevicePriority, string> = {
  INDISPENSABLE: "Indispensable",
  SOUHAITABLE: "Souhaitable",
  OPTIONNEL: "Optionnel",
};

export function getCoachingDevicePriorityLabel(priority: CoachingDevicePriority) {
  return COACHING_DEVICE_PRIORITY_LABELS[priority];
}

export const COACHING_POWER_SUPPLY_LABELS: Record<CoachingPowerSupply, string> = {
  DC12: "DC 12 V",
  DC24: "DC 24 V",
  DC_AUTRE: "DC autre",
  USB: "USB",
  AC230: "AC 230 V",
  INCONNU: "Inconnu",
};

export function getCoachingPowerSupplyLabel(powerSupply: CoachingPowerSupply) {
  return COACHING_POWER_SUPPLY_LABELS[powerSupply];
}

export const COACHING_MEASUREMENT_POINT_LABELS: Record<CoachingMeasurementPoint, string> = {
  APPAREIL: "Côté appareil",
  ENTREE_ADAPTATEUR: "Entrée de l'adaptateur",
  COTE_BATTERIE: "Côté batterie",
};

export function getCoachingMeasurementPointLabel(point: CoachingMeasurementPoint) {
  return COACHING_MEASUREMENT_POINT_LABELS[point];
}

export const COACHING_DATA_ORIGIN_LABELS: Record<CoachingDataOrigin, string> = {
  MESUREE: "Mesurée",
  DOC_FABRICANT: "Documentation fabricant",
  ESTIMATION_CLIENT: "Estimation client",
  ESTIMATION_COACH: "Estimation coach",
};

export function getCoachingDataOriginLabel(origin: CoachingDataOrigin) {
  return COACHING_DATA_ORIGIN_LABELS[origin];
}

export const COACHING_CALC_METHOD_LABELS: Record<CoachingCalcMethod, string> = {
  PUISSANCE_TEMPS: "Puissance × temps effectif",
  ENERGIE_JOUR: "Énergie quotidienne connue",
  RECHARGE_CYCLE: "Recharge / cycle",
};

export function getCoachingCalcMethodLabel(method: CoachingCalcMethod) {
  return COACHING_CALC_METHOD_LABELS[method];
}

// --- Dossier van (matériel / circuits / révisions de schéma) ---------------

export const COACHING_MATERIAL_CATEGORY_LABELS: Record<CoachingMaterialCategory, string> = {
  BATTERIE: "Batterie",
  BMS: "BMS",
  PANNEAU_SOLAIRE: "Panneau solaire",
  REGULATEUR: "Régulateur",
  CHARGEUR_MOTEUR: "Chargeur moteur",
  CHARGEUR_SECTEUR: "Chargeur secteur",
  CONVERTISSEUR: "Convertisseur",
  DISTRIBUTION: "Distribution",
  PROTECTION: "Protection",
  AUTRE: "Autre",
};

export function getCoachingMaterialCategoryLabel(category: CoachingMaterialCategory) {
  return COACHING_MATERIAL_CATEGORY_LABELS[category];
}

export const COACHING_CIRCUIT_REVIEW_STATUS_LABELS: Record<CoachingCircuitReviewStatus, string> = {
  A_FAIRE: "À faire",
  A_REVOIR: "À revoir",
  VALIDE: "Validé",
};

export const COACHING_CIRCUIT_REVIEW_STATUS_TONES: Record<CoachingCircuitReviewStatus, AdminBadgeTone> = {
  A_FAIRE: "neutral",
  A_REVOIR: "warning",
  VALIDE: "success",
};

export function getCoachingCircuitReviewStatusLabel(status: CoachingCircuitReviewStatus) {
  return COACHING_CIRCUIT_REVIEW_STATUS_LABELS[status];
}

export function getCoachingCircuitReviewStatusTone(status: CoachingCircuitReviewStatus) {
  return COACHING_CIRCUIT_REVIEW_STATUS_TONES[status];
}

// Libellés volontairement neutres : le statut d'un schéma ne vaut jamais
// certification réglementaire (retour utilisateur explicite).
export const COACHING_SCHEMA_STATUS_LABELS: Record<CoachingSchemaStatus, string> = {
  BROUILLON: "Brouillon",
  A_REVOIR: "À revoir",
  REVU_POUR_REALISATION: "Revu pour réalisation",
  MIS_A_JOUR_SELON_INSTALLATION: "Mis à jour selon l'installation réelle",
};

export const COACHING_SCHEMA_STATUS_TONES: Record<CoachingSchemaStatus, AdminBadgeTone> = {
  BROUILLON: "neutral",
  A_REVOIR: "warning",
  REVU_POUR_REALISATION: "success",
  MIS_A_JOUR_SELON_INSTALLATION: "info",
};

export function getCoachingSchemaStatusLabel(status: CoachingSchemaStatus) {
  return COACHING_SCHEMA_STATUS_LABELS[status];
}

export function getCoachingSchemaStatusTone(status: CoachingSchemaStatus) {
  return COACHING_SCHEMA_STATUS_TONES[status];
}

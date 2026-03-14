import type { ElectronicInvoiceFormat } from "@/lib/einvoice/schema";

export type ElectronicInvoiceMissingDataItem = {
  key: string;
  label: string;
  currentState: "missing" | "partial";
  owner: "seller" | "buyer" | "invoice" | "payment" | "tax" | "delivery";
  formats: ElectronicInvoiceFormat[];
  description: string;
};

export const ELECTRONIC_INVOICE_MISSING_DATA_CHECKLIST: ElectronicInvoiceMissingDataItem[] =
  [
    {
      key: "buyer.legalIdentifiers",
      label: "Identifiants légaux client",
      currentState: "missing",
      owner: "buyer",
      formats: ["factur-x", "cii", "ubl-2.1"],
      description:
        "Ajouter SIREN / SIRET, identifiant TVA ou tout identifiant acheteur requis côté client.",
    },
    {
      key: "buyer.structuredAddress",
      label: "Adresse client structurée",
      currentState: "partial",
      owner: "buyer",
      formats: ["factur-x", "cii", "ubl-2.1"],
      description:
        "Le client n'a aujourd'hui qu'un champ d'adresse libre, sans pays ni découpage rue / code postal / ville.",
    },
    {
      key: "buyer.electronicAddress",
      label: "Adresse électronique de routage",
      currentState: "missing",
      owner: "buyer",
      formats: ["factur-x", "cii", "ubl-2.1"],
      description:
        "Prévoir un identifiant de routage type Peppol / EAS ou autre adresse électronique B2B.",
    },
    {
      key: "seller.bankCoordinates",
      label: "Coordonnées bancaires vendeur",
      currentState: "missing",
      owner: "seller",
      formats: ["factur-x", "cii", "ubl-2.1"],
      description:
        "Ajouter IBAN / BIC et, si utile, un code de moyen de paiement normalisé.",
    },
    {
      key: "invoice.currency",
      label: "Devise persistée",
      currentState: "partial",
      owner: "invoice",
      formats: ["factur-x", "cii", "ubl-2.1"],
      description:
        "La devise est maintenant stockée sur `Invoice`, mais l'UI ne la saisit pas encore et les scénarios multi-devise restent à cadrer.",
    },
    {
      key: "payment.meansCode",
      label: "Moyen de paiement normalisé",
      currentState: "partial",
      owner: "payment",
      formats: ["factur-x", "cii", "ubl-2.1"],
      description:
        "Le projet stocke un `paymentMethod` libre, mais pas encore de code métier standardisé.",
    },
    {
      key: "invoice.orderReferences",
      label: "Références de commande",
      currentState: "partial",
      owner: "invoice",
      formats: ["factur-x", "cii", "ubl-2.1"],
      description:
        "Les références client / projet / service sont désormais prévues sur `Invoice`, mais pas encore exposées dans l'UI et il manque encore les références de commande/contrat/livraison structurées.",
    },
    {
      key: "delivery.deliveryReference",
      label: "Références de livraison / prestation",
      currentState: "partial",
      owner: "delivery",
      formats: ["factur-x", "cii", "ubl-2.1"],
      description:
        "Le projet a une `serviceDate`, un `serviceType` et un `deliveryMode`, mais pas de période ni de référence de livraison.",
    },
    {
      key: "tax.breakdown",
      label: "Ventilation TVA détaillée",
      currentState: "missing",
      owner: "tax",
      formats: ["factur-x", "cii", "ubl-2.1"],
      description:
        "Le modèle stocke seulement `tax` au niveau facture. Il manque une ventilation par taux / catégorie / raison d'exonération structurée.",
    },
    {
      key: "lines.unitCode",
      label: "Code unité de ligne",
      currentState: "missing",
      owner: "invoice",
      formats: ["factur-x", "cii", "ubl-2.1"],
      description:
        "Les lignes ont quantité et prix, mais pas d'unité normalisée (HUR, EA, etc.).",
    },
  ];

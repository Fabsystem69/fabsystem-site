import type { Prisma } from "@/lib/generated/prisma/client";
import { site } from "@/lib/site";
import type {
  ElectronicInvoiceAddress,
  ElectronicInvoiceData,
  ElectronicInvoiceParty,
  ElectronicInvoiceTaxSummaryLine,
  IsoDateString,
} from "@/lib/einvoice/schema";

const VAT_EXEMPTION_NOTE = "TVA non applicable – article 293 B du CGI";

const SELLER_ADDRESS: ElectronicInvoiceAddress = {
  formatted: "48 rue Rey Loras, Bât. E\n69250 Neuville-sur-Saône\nFrance",
  streetLine1: "48 rue Rey Loras, Bât. E",
  streetLine2: null,
  postalCode: "69250",
  city: "Neuville-sur-Saône",
  countryCode: "FR",
};

export const electronicInvoiceInclude = {
  customer: true,
  items: {
    orderBy: {
      position: "asc" as const,
    },
  },
  sourceQuote: {
    select: {
      id: true,
      number: true,
    },
  },
} satisfies Prisma.InvoiceInclude;

export type InvoiceForElectronicInvoice = Prisma.InvoiceGetPayload<{
  include: typeof electronicInvoiceInclude;
}>;

function toIsoDate(value: Date | null | undefined): IsoDateString | null {
  if (!value) {
    return null;
  }

  return value.toISOString().slice(0, 10) as IsoDateString;
}

function parseAddress(address: string | null): ElectronicInvoiceAddress | null {
  if (!address?.trim()) {
    return null;
  }

  const lines = address
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  const streetLine1 = lines[0] ?? null;
  const remainingLines = lines.slice(1);
  const lastLine = remainingLines.at(-1) ?? null;
  const localityMatch = lastLine?.match(/^(\d{4,5})\s+(.+)$/);
  const streetLine2 = localityMatch
    ? remainingLines.slice(0, -1).join(", ") || null
    : remainingLines.join(", ") || null;

  return {
    formatted: lines.join("\n"),
    streetLine1,
    streetLine2,
    postalCode: localityMatch?.[1] ?? null,
    city: localityMatch?.[2] ?? null,
    // Customer.country is not stored yet, so the mapper keeps the country empty.
    countryCode: null,
  };
}

function buildPaymentDescription(issueDate: Date, dueDate: Date | null) {
  if (!dueDate) {
    return "Paiement à réception";
  }

  const diffMs = dueDate.getTime() - issueDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "Paiement immédiat";
  }

  return `Paiement à ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
}

function buildSeller(): ElectronicInvoiceParty {
  return {
    displayName: site.name,
    legalName: "Fabien Lages",
    address: SELLER_ADDRESS,
    email: site.email,
    phone: site.phone,
    identifiers: {
      siren: "100271980",
      siret: "10027198000011",
      vatNumber: null,
      legalRegistrationId: "APE 4321A",
      // No seller routing endpoint is configured yet.
      electronicAddress: null,
      electronicAddressScheme: null,
    },
  };
}

function buildBuyer(invoice: InvoiceForElectronicInvoice): ElectronicInvoiceParty {
  return {
    displayName: invoice.customer.name,
    // The current customer model stores one generic name only.
    legalName: null,
    address: parseAddress(invoice.customer.address),
    email: invoice.customer.email,
    phone: invoice.customer.phone,
    identifiers: {
      // Legal identifiers are not stored on Customer yet.
      siren: null,
      siret: null,
      vatNumber: null,
      legalRegistrationId: null,
      electronicAddress: null,
      electronicAddressScheme: null,
    },
  };
}

function buildTaxSummary(invoice: InvoiceForElectronicInvoice): ElectronicInvoiceTaxSummaryLine[] {
  return [
    {
      taxType: "VAT",
      category: invoice.tax === 0 ? "exempt" : "unknown",
      standardCode: null,
      ratePercent: invoice.tax === 0 ? 0 : null,
      taxableAmountCents: invoice.subtotal,
      taxAmountCents: invoice.tax,
      exemptionReason: invoice.tax === 0 ? VAT_EXEMPTION_NOTE : null,
    },
  ];
}

export function mapInvoiceToElectronicInvoiceData(
  invoice: InvoiceForElectronicInvoice
): ElectronicInvoiceData {
  const issueDate = toIsoDate(invoice.issueDate);

  if (!issueDate) {
    throw new Error("Invoice issue date is required for electronic invoice mapping.");
  }

  return {
    document: {
      id: invoice.id,
      invoiceNumber: invoice.number,
      issueDate,
      dueDate: toIsoDate(invoice.dueDate),
      currency: invoice.currency,
      languageCode: "fr",
      status: invoice.status,
    },
    seller: buildSeller(),
    buyer: buildBuyer(invoice),
    paymentTerms: {
      description: buildPaymentDescription(invoice.issueDate, invoice.dueDate),
      dueDate: toIsoDate(invoice.dueDate),
      paymentMethodText: invoice.paymentMethod,
      paymentReference: invoice.paymentRef,
      // Standardized payment means are not stored yet.
      meansCode: null,
      iban: null,
      bic: null,
    },
    totals: {
      lineExtensionTotalCents: invoice.subtotal,
      taxExclusiveTotalCents: invoice.subtotal,
      taxTotalCents: invoice.tax,
      taxInclusiveTotalCents: invoice.total,
      payableAmountCents: invoice.total,
    },
    taxSummary: buildTaxSummary(invoice),
    lines: invoice.items.map((item) => ({
      id: item.id,
      position: item.position,
      description: item.description,
      quantity: item.quantity,
      // No unit code is modeled yet for invoice lines.
      unitCode: null,
      unitPriceCents: item.unitPrice,
      lineExtensionTotalCents: item.lineTotal,
      tax: {
        taxType: "VAT",
        category: invoice.tax === 0 ? "exempt" : "unknown",
        standardCode: null,
        ratePercent: invoice.tax === 0 ? 0 : null,
        // Per-line tax amounts are not modeled yet.
        taxAmountCents: invoice.tax === 0 ? 0 : null,
        exemptionReason: invoice.tax === 0 ? VAT_EXEMPTION_NOTE : null,
      },
      serviceDate: toIsoDate(invoice.serviceDate),
      notes: null,
    })),
    references: {
      sourceInvoiceId: invoice.id,
      sourceQuoteId: invoice.sourceQuoteId,
      sourceQuoteNumber: invoice.sourceQuote?.number ?? null,
      customerReference: invoice.customerReference,
      purchaseOrderReference: null,
      contractReference: null,
      customerAccountReference: invoice.customerReference,
      projectReference: invoice.projectReference,
      serviceReference: invoice.serviceReference,
      deliveryReference: null,
    },
    service: {
      serviceType: invoice.serviceType,
      deliveryMode: invoice.deliveryMode,
      serviceDate: toIsoDate(invoice.serviceDate),
      periodStartDate: toIsoDate(invoice.serviceDate),
      periodEndDate: toIsoDate(invoice.serviceDate),
      location: null,
    },
    legalNotes: {
      generalNote: invoice.notes,
      vatExemptionNote: invoice.tax === 0 ? VAT_EXEMPTION_NOTE : null,
      paymentTermsNote: buildPaymentDescription(invoice.issueDate, invoice.dueDate),
      latePaymentPenaltyNote: null,
    },
    metadata: {
      source: "prisma-invoice",
      sourceInvoiceStatus: invoice.status,
      exportedAt: new Date().toISOString(),
    },
  };
}

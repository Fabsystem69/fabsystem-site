export type IsoDateString = `${number}-${number}-${number}`;

export type CurrencyCode = "EUR" | (string & {});
export type CountryCode = "FR" | (string & {});

export type ElectronicInvoiceFormat = "factur-x" | "cii" | "ubl-2.1";

export type ElectronicInvoiceDocumentStatus =
  | "DRAFT"
  | "SENT"
  | "PAID"
  | "CANCELLED";

export type ElectronicInvoiceServiceType =
  | "INTERVENTION"
  | "FORMATION"
  | "AUDIT"
  | "CONSEIL";

export type ElectronicInvoiceDeliveryMode = "ONSITE" | "REMOTE";

/**
 * Address shape kept intentionally broader than the current Prisma model.
 * `formatted` preserves the source value while structured fields can be filled later.
 */
export type ElectronicInvoiceAddress = {
  formatted: string | null;
  streetLine1: string | null;
  streetLine2: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: CountryCode | null;
};

export type ElectronicInvoicePartyIdentifiers = {
  siren: string | null;
  siret: string | null;
  vatNumber: string | null;
  legalRegistrationId: string | null;
  electronicAddress: string | null;
  electronicAddressScheme: string | null;
};

/**
 * Canonical party model shared by seller and buyer across all target formats.
 */
export type ElectronicInvoiceParty = {
  displayName: string;
  legalName: string | null;
  address: ElectronicInvoiceAddress | null;
  email: string | null;
  phone: string | null;
  identifiers: ElectronicInvoicePartyIdentifiers;
};

export type ElectronicInvoiceDocument = {
  id: string;
  invoiceNumber: string;
  issueDate: IsoDateString;
  dueDate: IsoDateString | null;
  currency: CurrencyCode;
  languageCode: string;
  status: ElectronicInvoiceDocumentStatus;
};

export type ElectronicInvoicePaymentTerms = {
  description: string | null;
  dueDate: IsoDateString | null;
  paymentMethodText: string | null;
  paymentReference: string | null;
  meansCode: string | null;
  iban: string | null;
  bic: string | null;
};

export type ElectronicInvoiceTotals = {
  lineExtensionTotalCents: number;
  taxExclusiveTotalCents: number;
  taxTotalCents: number;
  taxInclusiveTotalCents: number;
  payableAmountCents: number;
};

export type ElectronicInvoiceTaxSummaryLine = {
  taxType: "VAT";
  category: "standard" | "exempt" | "unknown";
  standardCode: string | null;
  ratePercent: number | null;
  taxableAmountCents: number;
  taxAmountCents: number;
  exemptionReason: string | null;
};

export type ElectronicInvoiceLineTax = {
  taxType: "VAT";
  category: "standard" | "exempt" | "unknown";
  standardCode: string | null;
  ratePercent: number | null;
  taxAmountCents: number | null;
  exemptionReason: string | null;
};

export type ElectronicInvoiceLine = {
  id: string;
  position: number;
  description: string;
  quantity: number;
  unitCode: string | null;
  unitPriceCents: number;
  lineExtensionTotalCents: number;
  tax: ElectronicInvoiceLineTax;
  serviceDate: IsoDateString | null;
  notes: string | null;
};

export type ElectronicInvoiceReferences = {
  sourceInvoiceId: string;
  sourceQuoteId: string | null;
  sourceQuoteNumber: string | null;
  customerReference: string | null;
  purchaseOrderReference: string | null;
  contractReference: string | null;
  customerAccountReference: string | null;
  projectReference: string | null;
  serviceReference: string | null;
  deliveryReference: string | null;
};

export type ElectronicInvoiceServiceDetails = {
  serviceType: ElectronicInvoiceServiceType | null;
  deliveryMode: ElectronicInvoiceDeliveryMode | null;
  serviceDate: IsoDateString | null;
  periodStartDate: IsoDateString | null;
  periodEndDate: IsoDateString | null;
  location: string | null;
};

export type ElectronicInvoiceLegalNotes = {
  generalNote: string | null;
  vatExemptionNote: string | null;
  paymentTermsNote: string | null;
  latePaymentPenaltyNote: string | null;
};

export type ElectronicInvoiceMetadata = {
  source: "prisma-invoice";
  sourceInvoiceStatus: ElectronicInvoiceDocumentStatus;
  exportedAt: string;
};

/**
 * Neutral invoice payload used as the single source for future Factur-X, CII and UBL exports.
 */
export type ElectronicInvoiceData = {
  document: ElectronicInvoiceDocument;
  seller: ElectronicInvoiceParty;
  buyer: ElectronicInvoiceParty;
  paymentTerms: ElectronicInvoicePaymentTerms;
  totals: ElectronicInvoiceTotals;
  taxSummary: ElectronicInvoiceTaxSummaryLine[];
  lines: ElectronicInvoiceLine[];
  references: ElectronicInvoiceReferences;
  service: ElectronicInvoiceServiceDetails;
  legalNotes: ElectronicInvoiceLegalNotes;
  metadata: ElectronicInvoiceMetadata;
};

export type ElectronicInvoiceValidationLevel = "error" | "warning";

export type ElectronicInvoiceValidationIssue = {
  level: ElectronicInvoiceValidationLevel;
  code: string;
  field: string;
  message: string;
};

export type ElectronicInvoiceValidationResult = {
  isValid: boolean;
  issues: ElectronicInvoiceValidationIssue[];
  errors: ElectronicInvoiceValidationIssue[];
  warnings: ElectronicInvoiceValidationIssue[];
};

export type ElectronicInvoiceExportDraft = {
  format: ElectronicInvoiceFormat;
  implemented: false;
  filename: string;
  targetMimeType: string;
  targetProfile: string;
  blockers: string[];
  notes: string[];
};

import type {
  ElectronicInvoiceData,
  ElectronicInvoiceValidationLevel,
  ElectronicInvoiceValidationIssue,
  ElectronicInvoiceValidationResult,
} from "@/lib/einvoice/schema";

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function isFiniteAmount(value: number) {
  return Number.isFinite(value);
}

function hasCompleteAddress(data: ElectronicInvoiceData["seller"] | ElectronicInvoiceData["buyer"]) {
  return Boolean(
    data.address &&
      hasText(data.address.formatted) &&
      hasText(data.address.streetLine1) &&
      hasText(data.address.postalCode) &&
      hasText(data.address.city) &&
      data.address.countryCode
  );
}

function issue(
  level: ElectronicInvoiceValidationLevel,
  code: string,
  field: string,
  message: string
): ElectronicInvoiceValidationIssue {
  return {
    level,
    code,
    field,
    message,
  };
}

export function validateElectronicInvoiceData(
  data: ElectronicInvoiceData
): ElectronicInvoiceValidationResult {
  const issues: ElectronicInvoiceValidationIssue[] = [];

  if (!hasText(data.document.invoiceNumber)) {
    issues.push(
      issue(
        "error",
        "document.invoice_number_missing",
        "document.invoiceNumber",
        "Le numéro de facture est obligatoire."
      )
    );
  }

  if (!data.document.issueDate) {
    issues.push(
      issue(
        "error",
        "document.issue_date_missing",
        "document.issueDate",
        "La date d'émission est obligatoire."
      )
    );
  }

  if (!hasText(data.document.currency)) {
    issues.push(
      issue(
        "error",
        "document.currency_missing",
        "document.currency",
        "La devise est obligatoire."
      )
    );
  }

  if (!hasText(data.seller.displayName)) {
    issues.push(
      issue(
        "error",
        "seller.name_missing",
        "seller.displayName",
        "Le nom vendeur est obligatoire."
      )
    );
  }

  if (!hasCompleteAddress(data.seller)) {
    issues.push(
      issue(
        "warning",
        "seller.address_incomplete",
        "seller.address",
        "L'adresse vendeur est absente ou incomplète."
      )
    );
  }

  if (!hasText(data.seller.identifiers.siret)) {
    issues.push(
      issue(
        "warning",
        "seller.siret_missing",
        "seller.identifiers.siret",
        "Le SIRET vendeur manque pour plusieurs flux B2B."
      )
    );
  }

  if (!hasText(data.buyer.displayName)) {
    issues.push(
      issue(
        "error",
        "buyer.name_missing",
        "buyer.displayName",
        "Le nom client est obligatoire."
      )
    );
  }

  if (!hasCompleteAddress(data.buyer)) {
    issues.push(
      issue(
        "warning",
        "buyer.address_incomplete",
        "buyer.address",
        "L'adresse client est absente ou incomplète."
      )
    );
  }

  if (data.lines.length === 0) {
    issues.push(issue("error", "lines.empty", "lines", "Au moins une ligne est requise."));
  }

  if (!isFiniteAmount(data.totals.payableAmountCents)) {
    issues.push(
      issue(
        "error",
        "totals.grand_total_missing",
        "totals.payableAmountCents",
        "Le montant total payable (grand total) est obligatoire."
      )
    );
  }

  const lineExtensionTotal = data.lines.reduce(
    (sum, line) => sum + line.lineExtensionTotalCents,
    0
  );

  for (const line of data.lines) {
    if (!hasText(line.description)) {
      issues.push(
        issue(
          "error",
          "lines.description_missing",
          `lines.${line.position}.description`,
          "Chaque ligne doit avoir une description."
        )
      );
    }

    if (line.quantity <= 0) {
      issues.push(
        issue(
          "error",
          "lines.quantity_invalid",
          `lines.${line.position}.quantity`,
          "La quantité doit être strictement positive."
        )
      );
    }

    if (line.lineExtensionTotalCents !== line.quantity * line.unitPriceCents) {
      issues.push(
        issue(
          "error",
          "lines.total_mismatch",
          `lines.${line.position}.lineExtensionTotalCents`,
          "Le total de ligne n'est pas cohérent avec quantité x prix unitaire."
        )
      );
    }
  }

  if (lineExtensionTotal !== data.totals.lineExtensionTotalCents) {
    issues.push(
      issue(
        "error",
        "totals.line_extension_mismatch",
        "totals.lineExtensionTotalCents",
        "Le total des lignes ne correspond pas au total facture."
      )
    );
  }

  if (data.totals.taxExclusiveTotalCents !== data.totals.lineExtensionTotalCents) {
    issues.push(
      issue(
        "warning",
        "totals.tax_exclusive_mismatch",
        "totals.taxExclusiveTotalCents",
        "Le total HT diffère du total des lignes."
      )
    );
  }

  if (
    data.totals.taxInclusiveTotalCents !==
    data.totals.taxExclusiveTotalCents + data.totals.taxTotalCents
  ) {
    issues.push(
      issue(
        "error",
        "totals.tax_inclusive_mismatch",
        "totals.taxInclusiveTotalCents",
        "Le total TTC n'est pas cohérent avec HT + taxe."
      )
    );
  }

  if (data.totals.payableAmountCents !== data.totals.taxInclusiveTotalCents) {
    issues.push(
      issue(
        "error",
        "totals.grand_total_incoherent",
        "totals.payableAmountCents",
        "Le montant total payable (grand total) est incohérent avec le total TTC."
      )
    );
  }

  if (data.taxSummary.length === 0) {
    issues.push(
      issue(
        "warning",
        "tax.empty",
        "taxSummary",
        "Une synthèse TVA devra être fournie pour les exports finaux."
      )
    );
  }

  if (!data.paymentTerms.dueDate) {
    issues.push(
      issue(
        "warning",
        "payment.due_date_missing",
        "paymentTerms.dueDate",
        "La date d'échéance est absente."
      )
    );
  }

  if (!hasText(data.paymentTerms.paymentMethodText)) {
    issues.push(
      issue(
        "warning",
        "payment.method_missing",
        "paymentTerms.paymentMethodText",
        "Le mode de paiement est absent."
      )
    );
  }

  if (!hasText(data.paymentTerms.paymentReference)) {
    issues.push(
      issue(
        "warning",
        "payment.reference_missing",
        "paymentTerms.paymentReference",
        "La référence de paiement est absente."
      )
    );
  }

  if (!hasText(data.references.customerReference)) {
    issues.push(
      issue(
        "warning",
        "references.customer_reference_missing",
        "references.customerReference",
        "La référence client est absente."
      )
    );
  }

  if (!hasText(data.references.projectReference)) {
    issues.push(
      issue(
        "warning",
        "references.project_reference_missing",
        "references.projectReference",
        "La référence projet est absente."
      )
    );
  }

  if (!hasText(data.references.serviceReference)) {
    issues.push(
      issue(
        "warning",
        "references.service_reference_missing",
        "references.serviceReference",
        "La référence prestation est absente."
      )
    );
  }

  const errors = issues.filter((currentIssue) => currentIssue.level === "error");
  const warnings = issues.filter((currentIssue) => currentIssue.level === "warning");

  return {
    isValid: errors.length === 0,
    issues,
    errors,
    warnings,
  };
}

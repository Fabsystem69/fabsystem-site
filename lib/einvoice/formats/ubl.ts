import type {
  ElectronicInvoiceData,
  ElectronicInvoiceExportDraft,
} from "@/lib/einvoice/schema";
import { validateElectronicInvoiceData } from "@/lib/einvoice/validators";

export function prepareUblExport(
  data: ElectronicInvoiceData
): ElectronicInvoiceExportDraft {
  const validation = validateElectronicInvoiceData(data);

  return {
    format: "ubl-2.1",
    implemented: false,
    filename: `${data.document.invoiceNumber}.ubl-2.1.placeholder.json`,
    targetMimeType: "application/xml",
    targetProfile: "UBL 2.1 Invoice / EN 16931",
    blockers: validation.issues.map((issue) => `${issue.field}: ${issue.message}`),
    notes: [
      "Placeholder uniquement: aucun XML UBL 2.1 conforme n'est encore généré.",
      "Le travail ultérieur portera surtout sur les identifiants parties, les références d'achat et la ventilation TVA.",
    ],
  };
}

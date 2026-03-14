import type {
  ElectronicInvoiceData,
  ElectronicInvoiceExportDraft,
} from "@/lib/einvoice/schema";
import { validateElectronicInvoiceData } from "@/lib/einvoice/validators";

export function prepareFacturXExport(
  data: ElectronicInvoiceData
): ElectronicInvoiceExportDraft {
  const validation = validateElectronicInvoiceData(data);

  return {
    format: "factur-x",
    implemented: false,
    filename: `${data.document.invoiceNumber}.factur-x.placeholder.json`,
    targetMimeType: "application/pdf",
    targetProfile: "Factur-X / EN 16931 (profil à confirmer)",
    blockers: validation.issues.map((issue) => `${issue.field}: ${issue.message}`),
    notes: [
      "Placeholder uniquement: aucun PDF/A-3 avec XML embarqué n'est encore généré.",
      "L'étape suivante sera de produire un XML CII canonique puis de l'attacher au PDF facture existant.",
    ],
  };
}

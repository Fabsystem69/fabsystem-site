import type {
  ElectronicInvoiceData,
  ElectronicInvoiceExportDraft,
} from "@/lib/einvoice/schema";
import { validateElectronicInvoiceData } from "@/lib/einvoice/validators";

export function prepareCiiExport(
  data: ElectronicInvoiceData
): ElectronicInvoiceExportDraft {
  const validation = validateElectronicInvoiceData(data);

  return {
    format: "cii",
    implemented: false,
    filename: `${data.document.invoiceNumber}.cii.placeholder.json`,
    targetMimeType: "application/xml",
    targetProfile: "UN/CEFACT CII D16B / EN 16931",
    blockers: validation.issues.map((issue) => `${issue.field}: ${issue.message}`),
    notes: [
      "Placeholder uniquement: aucun XML CII conforme n'est encore sérialisé.",
      "Le mapping canonique actuel sert de base de travail avant le choix du profil exact et des codes normatifs.",
    ],
  };
}

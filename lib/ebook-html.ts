import "server-only";
import { getEbookMasterHtml } from "@/lib/ebook-blob";

export type EbookFormat = "desktop" | "pocket";

export type EbookBuyer = {
  name: string;
  email: string;
};

// Chemins des fichiers maîtres dans Vercel Blob — uploadés une fois via
// scripts/upload-ebook-master.mjs, jamais présents dans le dépôt.
const MASTER_HTML_PATHNAME: Record<EbookFormat, string> = {
  desktop: "ebooks/_master/bureau.html",
  pocket: "ebooks/_master/poche.html",
};

// Marqueurs à placer dans le HTML maître (pied de page + couverture).
const NAME_PLACEHOLDER = "{{EBOOK_BUYER_NAME}}";
const EMAIL_PLACEHOLDER = "{{EBOOK_BUYER_EMAIL}}";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function renderEbookHtml(format: EbookFormat, buyer: EbookBuyer) {
  const master = await getEbookMasterHtml(MASTER_HTML_PATHNAME[format]);

  return master
    .split(NAME_PLACEHOLDER)
    .join(escapeHtml(buyer.name))
    .split(EMAIL_PLACEHOLDER)
    .join(escapeHtml(buyer.email));
}

"use client";

import { useState } from "react";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";

// Liste de matériel en texte brut, à copier-coller dans un email de demande
// de devis fournisseur (partenariat Solaris Store, retour utilisateur :
// "simplifier toute la démarche") — volontairement pas de nom de fournisseur
// dans l'UI, pour rester valable si d'autres partenariats du même genre
// s'ajoutent plus tard.
export function MaterialListDialog({ text, onClose }: { text: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  useEscapeToClose(onClose);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Liste de matériel — demande de devis</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              À copier dans un email pour demander un devis à votre fournisseur.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-slate-500" aria-label="Fermer">
            ×
          </button>
        </div>

        <textarea
          readOnly
          value={text}
          rows={12}
          className="mt-4 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 outline-none"
        />

        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700">
            Fermer
          </button>
          <button type="button" onClick={copy} className="rounded-xl bg-amber-500 px-4 py-2.5 font-semibold text-white hover:bg-amber-600">
            {copied ? "Copié ✓" : "Copier"}
          </button>
        </div>
      </div>
    </div>
  );
}

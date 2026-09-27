"use client";

import { useState } from "react";
import { AdminButton } from "@/components/dashboard/ui";

// Bouton "Copier" pour coller directement dans Messenger (retour
// utilisateur) — jamais d'ouverture d'app tierce, juste le presse-papiers.
export function CopyTemplateButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible (permission refusée, contexte non
      // sécurisé) : rester silencieux plutôt que planter la page.
    }
  }

  return (
    <AdminButton type="button" variant={copied ? "success" : "secondary"} size="sm" onClick={copy}>
      {copied ? "Copié !" : "Copier"}
    </AdminButton>
  );
}

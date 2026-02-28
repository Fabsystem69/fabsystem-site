"use client";

import { useState } from "react";

type QuoteSignatureLinkButtonProps = {
  quoteId: string;
  disabled?: boolean;
};

export function QuoteSignatureLinkButton({
  quoteId,
  disabled = false,
}: QuoteSignatureLinkButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/internal/quotes/${quoteId}/signature-link`, {
        method: "POST",
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        link?: string;
      };

      if (!response.ok || !body.link) {
        throw new Error(body.error || "Impossible de générer le lien.");
      }

      await navigator.clipboard.writeText(body.link);
      setMessage("Lien de signature copié.");
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCopy}
        disabled={disabled || loading}
        className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 disabled:opacity-60"
      >
        {loading ? "Génération..." : "Copier lien de signature"}
      </button>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

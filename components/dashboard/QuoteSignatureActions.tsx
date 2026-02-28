"use client";

import { useState } from "react";

type QuoteSignatureActionsProps = {
  quoteId: string;
  disabled?: boolean;
};

export function QuoteSignatureActions({
  quoteId,
  disabled = false,
}: QuoteSignatureActionsProps) {
  const [loading, setLoading] = useState<"link" | "email" | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ensureUrl() {
    if (url) {
      return url;
    }

    const response = await fetch(`/api/internal/quotes/${quoteId}/signature-link`, {
      method: "POST",
    });
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      url?: string;
    };

    if (!response.ok || !body.url) {
      throw new Error(body.error || "Impossible de générer le lien.");
    }

    setUrl(body.url);
    return body.url;
  }

  async function handleCopy() {
    setLoading("link");
    setMessage(null);
    setError(null);

    try {
      const nextUrl = await ensureUrl();
      await navigator.clipboard.writeText(nextUrl);
      setMessage("Lien copié.");
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : "Erreur");
    } finally {
      setLoading(null);
    }
  }

  async function handleOpen() {
    setLoading("link");
    setMessage(null);
    setError(null);

    try {
      const nextUrl = await ensureUrl();
      window.open(nextUrl, "_blank", "noopener,noreferrer");
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "Erreur");
    } finally {
      setLoading(null);
    }
  }

  async function handleSend() {
    setLoading("email");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/internal/quotes/${quoteId}/send-signature-email`,
        {
          method: "POST",
        }
      );
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body.error || "Impossible d'envoyer l'email.");
      }

      setMessage("Email envoyé au client.");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Erreur");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopy}
          disabled={disabled || loading !== null}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 disabled:opacity-60"
        >
          {loading === "link" ? "Génération..." : "Copier lien de signature"}
        </button>
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled || loading !== null}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 disabled:opacity-60"
        >
          Ouvrir lien
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || loading !== null}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading === "email" ? "Envoi..." : "Envoyer au client"}
        </button>
      </div>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

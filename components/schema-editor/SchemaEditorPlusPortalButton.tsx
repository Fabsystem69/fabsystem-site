"use client";

import { useState } from "react";

export function SchemaEditorPlusPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/schema-editor-plus/portal", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error ?? "Impossible d'ouvrir la gestion d'abonnement.");
      window.location.assign(data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d'ouvrir la gestion d'abonnement.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void openPortal()} disabled={loading} className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50 disabled:opacity-60">
        {loading ? "Ouverture…" : "Gérer mon abonnement"}
      </button>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

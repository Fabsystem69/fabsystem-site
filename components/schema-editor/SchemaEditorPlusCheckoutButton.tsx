"use client";

import { useState } from "react";

export function SchemaEditorPlusCheckoutButton({
  plan,
  children,
  className,
}: {
  plan: "monthly" | "yearly";
  children: React.ReactNode;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/schema-editor-plus/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error ?? "Impossible de démarrer le paiement.");
      window.location.assign(data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de démarrer le paiement.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void startCheckout()} disabled={loading} className={className}>
        {loading ? "Redirection sécurisée…" : children}
      </button>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

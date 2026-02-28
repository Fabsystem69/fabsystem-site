"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type QuoteDeleteButtonProps = {
  quoteId: string;
  disabled?: boolean;
};

export function QuoteDeleteButton({
  quoteId,
  disabled = false,
}: QuoteDeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm("Supprimer définitivement ce devis ?");

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/internal/quotes/${quoteId}`, {
        method: "DELETE",
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Impossible de supprimer le devis.");
      }

      router.push("/dashboard/quotes");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={disabled || loading}
        className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Suppression..." : "Supprimer"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

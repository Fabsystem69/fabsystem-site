"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type InvoiceDeleteButtonProps = {
  invoiceId: string;
  disabled?: boolean;
};

export function InvoiceDeleteButton({
  invoiceId,
  disabled = false,
}: InvoiceDeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm("Supprimer définitivement cette facture ?");

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/internal/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Impossible de supprimer la facture.");
      }

      router.push("/dashboard/invoices");
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

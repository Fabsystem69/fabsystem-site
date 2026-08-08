"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PendingOrderPurgeButtonProps = {
  orderId: string;
  orderNumber: string;
  className?: string;
};

export function PendingOrderPurgeButton({
  orderId,
  orderNumber,
  className = "",
}: PendingOrderPurgeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Supprimer définitivement la commande ${orderNumber} (paiement jamais abouti) ?`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/internal/orders/${orderId}/purge`, {
        method: "DELETE",
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Impossible de supprimer cette commande.");
      }

      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className={`inline-flex h-8 items-center rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-400 transition-colors duration-150 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {loading ? "Suppression…" : "Supprimer"}
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

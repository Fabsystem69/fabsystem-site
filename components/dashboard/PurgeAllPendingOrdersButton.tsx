"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PurgeAllPendingOrdersButtonProps = {
  purgeableCount: number;
};

export function PurgeAllPendingOrdersButton({ purgeableCount }: PurgeAllPendingOrdersButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handlePurgeAll() {
    // Confirmation obligatoire avant toute suppression groupee : deux etapes
    // (le nombre exact, puis un rappel explicite qu'il s'agit d'une action
    // irreversible) pour eviter un clic accidentel.
    const confirmed = window.confirm(
      `Supprimer définitivement les ${purgeableCount} commande(s) en attente de paiement depuis plus de 5 jours ?\n\nCette action est irréversible.`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/internal/orders/purge-pending", {
        method: "POST",
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        deletedCount?: number;
        skipped?: Array<{ orderNumber: string; reason: string }>;
      };

      if (!response.ok) {
        throw new Error(body.error || "La purge a échoué.");
      }

      const skippedCount = body.skipped?.length ?? 0;
      setResult(
        skippedCount > 0
          ? `${body.deletedCount ?? 0} commande(s) supprimée(s), ${skippedCount} ignorée(s) (non éligibles).`
          : `${body.deletedCount ?? 0} commande(s) supprimée(s).`
      );
      router.refresh();
    } catch (purgeError) {
      setError(purgeError instanceof Error ? purgeError.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handlePurgeAll}
        disabled={loading || purgeableCount === 0}
        className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 text-sm font-semibold text-red-400 transition-colors duration-150 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Purge en cours…" : `Tout purger (${purgeableCount})`}
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      {result ? <p className="text-xs text-neutral-400">{result}</p> : null}
    </div>
  );
}

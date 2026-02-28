"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  normalizePaymentTermsDays,
  PAYMENT_TERMS_STORAGE_KEY,
} from "@/lib/payment-terms";

type QuoteConvertButtonProps = {
  quoteId: string;
  existingInvoiceId?: string | null;
};

export function QuoteConvertButton({
  quoteId,
  existingInvoiceId,
}: QuoteConvertButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (existingInvoiceId) {
    return (
      <Link
        href={`/dashboard/invoices/${existingInvoiceId}`}
        className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
      >
        Ouvrir la facture
      </Link>
    );
  }

  async function handleConvert() {
    setLoading(true);
    setError(null);

    try {
      const storedValue =
        typeof window === "undefined"
          ? null
          : window.localStorage.getItem(PAYMENT_TERMS_STORAGE_KEY);
      const paymentTermsDays = normalizePaymentTermsDays(storedValue);
      const response = await fetch(`/api/internal/quotes/${quoteId}/convert-to-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentTermsDays }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        invoiceId?: string;
      };

      if (!response.ok || !body.invoiceId) {
        throw new Error(body.error || "Impossible de transformer le devis.");
      }

      router.push(`/dashboard/invoices/${body.invoiceId}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible de transformer le devis."
      );
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleConvert}
        disabled={loading}
        className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 disabled:opacity-60"
      >
        {loading ? "Conversion..." : "Transformer en facture"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateForInput } from "@/lib/format";

type InvoicePaymentFormProps = {
  invoiceId: string;
  initialStatus: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  initialPaidAt: string | Date | null;
  initialPaymentMethod: string | null;
  initialPaymentRef: string | null;
};

export function InvoicePaymentForm({
  invoiceId,
  initialStatus,
  initialPaidAt,
  initialPaymentMethod,
  initialPaymentRef,
}: InvoicePaymentFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [paidAt, setPaidAt] = useState(formatDateForInput(initialPaidAt));
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod ?? "");
  const [paymentRef, setPaymentRef] = useState(initialPaymentRef ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/internal/invoices/${invoiceId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paidAt: paidAt ? new Date(paidAt).toISOString() : null,
          paymentMethod: paymentMethod.trim() || null,
          paymentRef: paymentRef.trim() || null,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Impossible d'enregistrer l'encaissement.");
      }

      setMessage("Encaissement mis à jour.");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible d'enregistrer l'encaissement."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-neutral-900">Encaissement</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as "DRAFT" | "SENT" | "PAID" | "CANCELLED")
          }
          className="h-11 rounded-md border border-neutral-300 px-3 text-base"
        >
          <option value="DRAFT">DRAFT</option>
          <option value="SENT">SENT</option>
          <option value="PAID">PAID</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <input
          type="date"
          value={paidAt}
          onChange={(event) => setPaidAt(event.target.value)}
          className="h-11 rounded-md border border-neutral-300 px-3 text-base"
        />
        <select
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
          className="h-11 rounded-md border border-neutral-300 px-3 text-base"
        >
          <option value="">Mode de paiement</option>
          <option value="Virement">Virement</option>
          <option value="CB">CB</option>
          <option value="Espèces">Espèces</option>
          <option value="Chèque">Chèque</option>
        </select>
        <input
          value={paymentRef}
          onChange={(event) => setPaymentRef(event.target.value)}
          placeholder="Référence paiement"
          className="h-11 rounded-md border border-neutral-300 px-3 text-base"
        />
      </div>
      {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Enregistrement..." : "Enregistrer l'encaissement"}
      </button>
    </form>
  );
}

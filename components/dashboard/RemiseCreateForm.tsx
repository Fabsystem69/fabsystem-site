"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCustomerDisplayName, formatDateForInput } from "@/lib/format";

export type RemiseCustomerOption = {
  id: string;
  name: string | null;
  email: string;
};

export type RemiseInvoiceOption = {
  id: string;
  number: string;
};

type RemiseCreateFormProps = {
  customers: RemiseCustomerOption[];
  invoices: RemiseInvoiceOption[];
};

function parseEuroToCents(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return 0;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount * 100);
}

export function RemiseCreateForm({ customers, invoices }: RemiseCreateFormProps) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [status, setStatus] = useState<"DRAFT" | "SENT" | "APPLIED">("DRAFT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amountCents = parseEuroToCents(amount);
    if (amountCents <= 0) {
      setError("Le montant doit être supérieur à 0.");
      return;
    }

    if (!date) {
      setError("La date est obligatoire.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/internal/remises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          invoiceId: invoiceId || null,
          amount: amountCents,
          reason: reason.trim() || null,
          date: new Date(date).toISOString(),
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }

      router.push("/dashboard/invoices?tab=remises");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "h-11 w-full rounded-md border border-neutral-300 px-3 text-base focus:border-neutral-500 focus:outline-none";
  const labelClass = "mb-2 block text-sm font-medium text-neutral-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">
          Informations générales
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="customerId" className={labelClass}>
              Client <span className="text-red-500">*</span>
            </label>
            <select
              id="customerId"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setInvoiceId("");
              }}
              className={inputClass}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatCustomerDisplayName(c)}{c.name ? ` — ${c.email}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className={labelClass}>
              Montant (€) <span className="text-red-500">*</span>
            </label>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="date" className={labelClass}>
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="status" className={labelClass}>
              Statut
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "DRAFT" | "SENT" | "APPLIED")
              }
              className={inputClass}
            >
              <option value="DRAFT">Brouillon</option>
              <option value="SENT">Envoyée</option>
              <option value="APPLIED">Appliquée</option>
            </select>
          </div>

          <div>
            <label htmlFor="invoiceId" className={labelClass}>
              Facture liée (optionnel)
            </label>
            <select
              id="invoiceId"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Aucune —</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.number}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="reason" className={labelClass}>
              Motif
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Motif de la remise…"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Enregistrement…" : "Créer la remise"}
        </button>
      </div>
    </form>
  );
}

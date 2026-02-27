"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type CustomerOption = {
  id: string;
  name: string;
  email: string | null;
};

type Line = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

type QuoteCreateFormProps = {
  customers: CustomerOption[];
};

function createLine(): Line {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unitPrice: "0",
  };
}

function parseEuroToCents(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) {
    return 0;
  }

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  return Math.round(amount * 100);
}

function formatEuroFromCents(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value / 100);
}

export function QuoteCreateForm({ customers }: QuoteCreateFormProps) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState("");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([createLine()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => {
      const quantity = Number.parseInt(line.quantity || "0", 10);
      const unitPrice = parseEuroToCents(line.unitPrice);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return sum;
      }

      return sum + quantity * unitPrice;
    }, 0);
    const taxCents = parseEuroToCents(tax);

    return {
      subtotal,
      tax: taxCents,
      total: subtotal + taxCents,
    };
  }, [lines, tax]);

  function updateLine(id: string, field: keyof Line, value: string) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  }

  function removeLine(id: string) {
    setLines((current) => (current.length > 1 ? current.filter((line) => line.id !== id) : current));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const items = lines
      .map((line) => ({
        description: line.description.trim(),
        quantity: Number.parseInt(line.quantity || "0", 10),
        unitPrice: parseEuroToCents(line.unitPrice),
      }))
      .filter((line) => line.description && Number.isFinite(line.quantity) && line.quantity > 0);

    if (!customerId) {
      setError("Sélectionne un client.");
      setLoading(false);
      return;
    }

    if (items.length === 0) {
      setError("Ajoute au moins une ligne valide.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/internal/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          issueDate: new Date(issueDate).toISOString(),
          validUntil: validUntil ? new Date(validUntil).toISOString() : null,
          notes: notes.trim() || null,
          tax: totals.tax,
          items,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(json.error || "Impossible de créer le devis.");
      }

      router.push("/dashboard/quotes");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-neutral-900">Nouveau devis</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
                {customer.email ? ` (${customer.email})` : ""}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={issueDate}
            onChange={(event) => setIssueDate(event.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={validUntil}
            onChange={(event) => setValidUntil(event.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            value={tax}
            onChange={(event) => setTax(event.target.value)}
            inputMode="decimal"
            placeholder="TVA / taxe (€)"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          placeholder="Notes"
          className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-neutral-900">Lignes</h2>
          <button
            type="button"
            onClick={() => setLines((current) => [...current, createLine()])}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-900"
          >
            Ajouter une ligne
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {lines.map((line, index) => (
            <div
              key={line.id}
              className="grid gap-3 rounded-md border border-neutral-200 p-3 sm:grid-cols-[1.5fr_120px_140px_100px]"
            >
              <input
                value={line.description}
                onChange={(event) =>
                  updateLine(line.id, "description", event.target.value)
                }
                placeholder={`Description ligne ${index + 1}`}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="1"
                value={line.quantity}
                onChange={(event) => updateLine(line.id, "quantity", event.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                value={line.unitPrice}
                onChange={(event) => updateLine(line.id, "unitPrice", event.target.value)}
                inputMode="decimal"
                placeholder="Prix unitaire (€)"
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeLine(line.id)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="space-y-2 text-sm text-neutral-700">
          <p>Sous-total: {formatEuroFromCents(totals.subtotal)}</p>
          <p>Taxe: {formatEuroFromCents(totals.tax)}</p>
          <p className="text-base font-semibold text-neutral-900">
            Total: {formatEuroFromCents(totals.total)}
          </p>
        </div>
        {error ? (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Création..." : "Créer le devis"}
        </button>
      </section>
    </form>
  );
}

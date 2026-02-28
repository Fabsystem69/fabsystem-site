"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ItemTemplateCombobox } from "@/components/dashboard/ItemTemplateCombobox";
import { formatDateForInput, formatEuroFromCents } from "@/lib/format";

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

export type QuoteFormInitialData = {
  id: string;
  customerId: string;
  issueDate: string | Date;
  validUntil: string | Date | null;
  notes: string | null;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
};

type QuoteCreateFormProps = {
  customers: CustomerOption[];
  initialData?: QuoteFormInitialData;
};

function createLine(): Line {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unitPrice: "0",
  };
}

function centsToEuroInput(value: number) {
  return (value / 100).toFixed(2).replace(".", ",");
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

function createInitialLines(initialData?: QuoteFormInitialData): Line[] {
  if (!initialData || initialData.items.length === 0) {
    return [createLine()];
  }

  return initialData.items.map((item) => ({
    id: item.id,
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: centsToEuroInput(item.unitPrice),
  }));
}

export function QuoteCreateForm({
  customers,
  initialData,
}: QuoteCreateFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialData);
  const [customerId, setCustomerId] = useState(
    initialData?.customerId ?? customers[0]?.id ?? ""
  );
  const [issueDate, setIssueDate] = useState(
    formatDateForInput(initialData?.issueDate ?? new Date())
  );
  const [validUntil, setValidUntil] = useState(
    formatDateForInput(initialData?.validUntil)
  );
  const [status, setStatus] = useState<
    "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED"
  >(initialData?.status ?? "DRAFT");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [lines, setLines] = useState<Line[]>(() => createInitialLines(initialData));
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

    return {
      subtotal,
      total: subtotal,
    };
  }, [lines]);

  function updateLine(id: string, field: keyof Line, value: string) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  }

  function applyTemplate(id: string, template: { label: string; defaultUnitPriceCents: number | null }) {
    setLines((current) =>
      current.map((line) =>
        line.id === id
          ? {
              ...line,
              description: template.label,
              unitPrice:
                template.defaultUnitPriceCents !== null
                  ? centsToEuroInput(template.defaultUnitPriceCents)
                  : line.unitPrice,
            }
          : line
      )
    );
  }

  function removeLine(id: string) {
    setLines((current) =>
      current.length > 1 ? current.filter((line) => line.id !== id) : current
    );
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
      const endpoint = isEdit ? `/api/internal/quotes/${initialData?.id}` : "/api/internal/quotes";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          issueDate: new Date(issueDate).toISOString(),
          validUntil: validUntil ? new Date(validUntil).toISOString() : null,
          notes: notes.trim() || null,
          status,
          items,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as { error?: string; quote?: { id: string } };

      if (!res.ok) {
        throw new Error(json.error || "Impossible d'enregistrer le devis.");
      }

      const destination = isEdit
        ? `/dashboard/quotes/${initialData?.id}`
        : json.quote?.id
          ? `/dashboard/quotes/${json.quote.id}`
          : "/dashboard/quotes";

      router.push(destination);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Erreur d'enregistrement."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-28 md:pb-6">
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          {isEdit ? "Modifier le devis" : "Nouveau devis"}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            className="h-11 rounded-md border border-neutral-300 px-3 text-base"
          >
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
                {customer.email ? ` (${customer.email})` : ""}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED"
              )
            }
            className="h-11 rounded-md border border-neutral-300 px-3 text-base"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="SENT">SENT</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <input
            type="date"
            value={issueDate}
            onChange={(event) => setIssueDate(event.target.value)}
            className="h-11 rounded-md border border-neutral-300 px-3 text-base"
          />
          <input
            type="date"
            value={validUntil}
            onChange={(event) => setValidUntil(event.target.value)}
            className="h-11 rounded-md border border-neutral-300 px-3 text-base"
          />
        </div>
        <p className="mt-3 text-sm text-neutral-600">
          TVA non applicable – article 293 B du CGI
        </p>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          placeholder="Notes"
          className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-3 text-base"
        />
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Lignes</h2>
          <button
            type="button"
            onClick={() => setLines((current) => [...current, createLine()])}
            className="h-11 rounded-md border border-neutral-300 px-4 text-base font-semibold text-neutral-900"
          >
            Ajouter une ligne
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {lines.map((line, index) => (
            <div
              key={line.id}
              className="grid gap-3 rounded-xl border border-neutral-200 p-3 sm:grid-cols-[1.5fr_120px_140px_100px]"
            >
              <div className="sm:col-span-1">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500 sm:hidden">
                  Description
                </label>
                <ItemTemplateCombobox
                  value={line.description}
                  onChange={(value) => updateLine(line.id, "description", value)}
                  onTemplateSelect={(template) => applyTemplate(line.id, template)}
                  placeholder={`Description ligne ${index + 1}`}
                />
              </div>
              <input
                type="number"
                min="1"
                value={line.quantity}
                onChange={(event) => updateLine(line.id, "quantity", event.target.value)}
                className="h-11 rounded-md border border-neutral-300 px-3 text-base"
              />
              <input
                value={line.unitPrice}
                onChange={(event) => updateLine(line.id, "unitPrice", event.target.value)}
                inputMode="decimal"
                placeholder="Prix unitaire (€)"
                className="h-11 rounded-md border border-neutral-300 px-3 text-base"
              />
              <button
                type="button"
                onClick={() => removeLine(line.id)}
                className="h-11 rounded-md border border-neutral-300 px-3 text-base text-neutral-700"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="space-y-2 text-sm text-neutral-700">
          <p>Total HT: {formatEuroFromCents(totals.subtotal)}</p>
          <p className="text-base font-semibold text-neutral-900">
            Total TTC: {formatEuroFromCents(totals.total)}
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
          className="mt-4 hidden rounded-md bg-neutral-900 px-4 py-3 text-base font-semibold text-white disabled:opacity-60 md:inline-flex"
        >
          {loading ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer le devis"}
        </button>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 p-4 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl gap-3">
          <button
            type="button"
            onClick={() => setLines((current) => [...current, createLine()])}
            className="h-11 flex-1 rounded-md border border-neutral-300 px-4 text-base font-semibold text-neutral-900"
          >
            Ajouter
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-11 flex-[1.3] rounded-md bg-neutral-900 px-4 text-base font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </div>
    </form>
  );
}

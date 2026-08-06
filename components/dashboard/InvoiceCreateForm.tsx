"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ItemTemplateCombobox } from "@/components/dashboard/ItemTemplateCombobox";
import {
  QuotePicklistCombobox,
  type QuotePicklistOption,
} from "@/components/dashboard/QuotePicklistCombobox";
import { formatCustomerDisplayName, formatDateForInput, formatEuroFromCents } from "@/lib/format";
import {
  addDays,
  normalizePaymentTermsDays,
  PAYMENT_TERMS_STORAGE_KEY,
} from "@/lib/payment-terms";

export type InvoiceCustomerOption = {
  id: string;
  name: string | null;
  email: string;
};

type Line = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

export type InvoiceFormInitialData = {
  id: string;
  customerId: string;
  sourceQuoteId?: string | null;
  issueDate: string | Date;
  dueDate: string | Date | null;
  currency: string;
  customerReference: string | null;
  projectReference: string | null;
  serviceReference: string | null;
  serviceDate: string | Date | null;
  serviceType: "INTERVENTION" | "FORMATION" | "AUDIT" | "CONSEIL";
  deliveryMode: "ONSITE" | "REMOTE";
  paidAt: string | Date | null;
  paymentMethod: string | null;
  paymentRef: string | null;
  notes: string | null;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
};

type InvoiceCreateFormProps = {
  customers: InvoiceCustomerOption[];
  initialData?: InvoiceFormInitialData;
};

type QuoteDetailsResponse = {
  quote?: {
    id: string;
    customerId: string;
    number: string;
    notes: string | null;
    serviceDate: string | Date | null;
    serviceType: "INTERVENTION" | "FORMATION" | "AUDIT" | "CONSEIL";
    deliveryMode: "ONSITE" | "REMOTE";
    items: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
  error?: string;
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

function createInitialLines(initialData?: InvoiceFormInitialData): Line[] {
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

function buildDueDate(issueDateValue: string, paymentTermsDays: 0 | 30) {
  const baseDate = issueDateValue ? new Date(issueDateValue) : new Date();
  return formatDateForInput(addDays(baseDate, paymentTermsDays));
}

export function InvoiceCreateForm({
  customers,
  initialData,
}: InvoiceCreateFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialData);
  const [customerId, setCustomerId] = useState(
    initialData?.customerId ?? customers[0]?.id ?? ""
  );
  const [sourceQuoteId, setSourceQuoteId] = useState(initialData?.sourceQuoteId ?? null);
  const [sourceQuoteLabel, setSourceQuoteLabel] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [issueDate, setIssueDate] = useState(
    formatDateForInput(initialData?.issueDate ?? new Date())
  );
  const [paymentTermsDays, setPaymentTermsDays] = useState<0 | 30>(30);
  const [dueDateTouched, setDueDateTouched] = useState(Boolean(initialData?.dueDate));
  const [dueDate, setDueDate] = useState(
    formatDateForInput(initialData?.dueDate) ||
      buildDueDate(
        formatDateForInput(initialData?.issueDate ?? new Date()),
        30
      )
  );
  const [serviceDate, setServiceDate] = useState(
    formatDateForInput(initialData?.serviceDate)
  );
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(
      initialData?.serviceDate ||
        initialData?.paymentMethod ||
        initialData?.paymentRef ||
        initialData?.customerReference ||
        initialData?.projectReference ||
        initialData?.serviceReference ||
        (initialData?.currency && initialData.currency !== "EUR")
    )
  );
  const [serviceType, setServiceType] = useState<
    "INTERVENTION" | "FORMATION" | "AUDIT" | "CONSEIL"
  >(initialData?.serviceType ?? "INTERVENTION");
  const [deliveryMode, setDeliveryMode] = useState<"ONSITE" | "REMOTE">(
    initialData?.deliveryMode ?? "ONSITE"
  );
  const [currency, setCurrency] = useState(initialData?.currency ?? "EUR");
  const [customerReference, setCustomerReference] = useState(
    initialData?.customerReference ?? ""
  );
  const [projectReference, setProjectReference] = useState(
    initialData?.projectReference ?? ""
  );
  const [serviceReference, setServiceReference] = useState(
    initialData?.serviceReference ?? ""
  );
  const [status, setStatus] = useState<
    "DRAFT" | "SENT" | "PAID" | "CANCELLED"
  >(initialData?.status ?? "DRAFT");
  const [paymentMethod, setPaymentMethod] = useState(
    initialData?.paymentMethod ?? ""
  );
  const [paymentRef, setPaymentRef] = useState(initialData?.paymentRef ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [lines, setLines] = useState<Line[]>(() => createInitialLines(initialData));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedValue = window.localStorage.getItem(PAYMENT_TERMS_STORAGE_KEY);
    const nextValue = normalizePaymentTermsDays(storedValue);
    setPaymentTermsDays(nextValue);

    if (!dueDateTouched && !initialData?.dueDate) {
      setDueDate(buildDueDate(issueDate, nextValue));
    }
  }, [dueDateTouched, initialData?.dueDate, issueDate]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        PAYMENT_TERMS_STORAGE_KEY,
        String(paymentTermsDays)
      );
    }

    if (!dueDateTouched) {
      setDueDate(buildDueDate(issueDate, paymentTermsDays));
    }
  }, [dueDateTouched, issueDate, paymentTermsDays]);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => {
      const quantity = Number.parseInt(line.quantity || "0", 10);
      const unitPrice = parseEuroToCents(line.unitPrice);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return sum;
      }

      return sum + quantity * unitPrice;
    }, 0);

    return { subtotal, total: subtotal };
  }, [lines]);

  function updateLine(id: string, field: keyof Line, value: string) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  }

  function applyTemplate(
    id: string,
    template: { label: string; defaultUnitPriceCents: number | null }
  ) {
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

  async function handleQuoteSelect(quoteOption: QuotePicklistOption) {
    setQuoteLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/internal/quotes/${quoteOption.id}`);
      const body = (await response.json().catch(() => ({}))) as QuoteDetailsResponse;

      if (!response.ok || !body.quote) {
        throw new Error(body.error || "Impossible de charger le devis.");
      }

      setSourceQuoteId(body.quote.id);
      setSourceQuoteLabel(`${quoteOption.number} — ${quoteOption.customerName}`);
      setCustomerId(body.quote.customerId);
      setServiceType(body.quote.serviceType);
      setDeliveryMode(body.quote.deliveryMode);
      setServiceDate(formatDateForInput(body.quote.serviceDate));
      setShowAdvanced(Boolean(body.quote.serviceDate));
      setNotes(body.quote.notes ?? "");
      setLines(
        body.quote.items.length > 0
          ? body.quote.items.map((item) => ({
              id: item.id,
              description: item.description,
              quantity: String(item.quantity),
              unitPrice: centsToEuroInput(item.unitPrice),
            }))
          : [createLine()]
      );
    } catch (quoteError) {
      setError(
        quoteError instanceof Error
          ? quoteError.message
          : "Impossible de charger le devis."
      );
    } finally {
      setQuoteLoading(false);
    }
  }

  function clearSourceQuote() {
    setSourceQuoteId(null);
    setSourceQuoteLabel(null);
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
      .filter(
        (line) => line.description && Number.isFinite(line.quantity) && line.quantity > 0
      );

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
      const endpoint = isEdit
        ? `/api/internal/invoices/${initialData?.id}`
        : "/api/internal/invoices";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          sourceQuoteId,
          issueDate: new Date(issueDate).toISOString(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          currency: currency.trim().toUpperCase() || "EUR",
          customerReference: customerReference.trim() || null,
          projectReference: projectReference.trim() || null,
          serviceReference: serviceReference.trim() || null,
          serviceDate: serviceDate ? new Date(serviceDate).toISOString() : null,
          serviceType,
          deliveryMode,
          paymentMethod: paymentMethod.trim() || null,
          paymentRef: paymentRef.trim() || null,
          notes: notes.trim() || null,
          status,
          items,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        invoiceId?: string;
        invoice?: { id: string };
      };

      if (!res.ok) {
        throw new Error(json.error || "Impossible d'enregistrer la facture.");
      }

      const destination = isEdit
        ? `/dashboard/invoices/${initialData?.id}`
        : json.invoice?.id
          ? `/dashboard/invoices/${json.invoice.id}`
          : "/dashboard/invoices";

      router.push(destination);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Erreur d'enregistrement."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-28 md:pb-6">
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          {isEdit ? "Modifier la facture" : "Nouvelle facture"}
        </h2>
        <div className="mt-4 grid gap-3">
          {!isEdit ? (
            <div className="grid gap-2">
              <label className="text-sm font-medium text-neutral-700">
                Basé sur le devis
              </label>
              <QuotePicklistCombobox
                disabled={quoteLoading}
                onSelect={handleQuoteSelect}
              />
              {sourceQuoteId && sourceQuoteLabel ? (
                <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                  <p>Prérempli depuis {sourceQuoteLabel}.</p>
                  <button
                    type="button"
                    onClick={clearSourceQuote}
                    className="font-medium text-neutral-900 underline underline-offset-2"
                  >
                    Retirer le devis
                  </button>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  Optionnel: sélectionne un devis pour préremplir le client, les lignes et les notes.
                </p>
              )}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-neutral-700">Client</span>
              <select
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                className="h-11 rounded-md border border-neutral-300 px-3 text-base"
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {formatCustomerDisplayName(customer)}
                    {customer.name ? ` (${customer.email})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-neutral-700">Statut</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as "DRAFT" | "SENT" | "PAID" | "CANCELLED"
                  )
                }
                className="h-11 rounded-md border border-neutral-300 px-3 text-base"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="SENT">SENT</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-neutral-700">
                Type de prestation
              </span>
              <select
                value={serviceType}
                onChange={(event) =>
                  setServiceType(
                    event.target.value as
                      | "INTERVENTION"
                      | "FORMATION"
                      | "AUDIT"
                      | "CONSEIL"
                  )
                }
                className="h-11 rounded-md border border-neutral-300 px-3 text-base"
              >
                <option value="INTERVENTION">Intervention</option>
                <option value="FORMATION">Formation</option>
                <option value="AUDIT">Audit</option>
                <option value="CONSEIL">Conseil</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-neutral-700">Mode</span>
              <select
                value={deliveryMode}
                onChange={(event) =>
                  setDeliveryMode(event.target.value as "ONSITE" | "REMOTE")
                }
                className="h-11 rounded-md border border-neutral-300 px-3 text-base"
              >
                <option value="ONSITE">Sur site</option>
                <option value="REMOTE">Visio</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-neutral-700">
                Date d&apos;émission
              </span>
              <input
                type="date"
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
                className="h-11 rounded-md border border-neutral-300 px-3 text-base"
              />
              <span className="text-sm text-neutral-500">
                Date affichée sur la facture.
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-neutral-700">Échéance</span>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => {
                  setDueDate(event.target.value);
                  setDueDateTouched(true);
                }}
                className="h-11 rounded-md border border-neutral-300 px-3 text-base"
              />
              <span className="text-sm text-neutral-500">
                Date limite de paiement (par défaut: émission + {paymentTermsDays} jour
                {paymentTermsDays > 1 ? "s" : ""}).
              </span>
            </label>
          </div>

          <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-sm font-medium text-neutral-700">
              Conditions de paiement mémorisées
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentTermsDays(0);
                  setDueDateTouched(false);
                }}
                className={`rounded-full px-3 py-2 text-sm font-medium ${
                  paymentTermsDays === 0
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-300 bg-white text-neutral-700"
                }`}
              >
                Paiement immédiat (0j)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentTermsDays(30);
                  setDueDateTouched(false);
                }}
                className={`rounded-full px-3 py-2 text-sm font-medium ${
                  paymentTermsDays === 30
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-300 bg-white text-neutral-700"
                }`}
              >
                30 jours
              </button>
            </div>
          </div>

          <details
            open={showAdvanced}
            onToggle={(event) =>
              setShowAdvanced((event.currentTarget as HTMLDetailsElement).open)
            }
            className="rounded-lg border border-neutral-200 bg-neutral-50 p-3"
          >
            <summary className="cursor-pointer text-sm font-medium text-neutral-700">
              Avancé
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 sm:max-w-[140px]">
                <span className="text-sm font-medium text-neutral-700">Devise</span>
                <input
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                  placeholder="EUR"
                  maxLength={3}
                  className="h-11 rounded-md border border-neutral-300 px-3 text-base"
                />
                <span className="text-sm text-neutral-500">
                  Code ISO, par défaut EUR.
                </span>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-neutral-700">
                  Date de prestation
                </span>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(event) => setServiceDate(event.target.value)}
                  className="h-11 rounded-md border border-neutral-300 px-3 text-base"
                />
                <span className="text-sm text-neutral-500">
                  Optionnel: date de réalisation de la prestation.
                </span>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-neutral-700">
                  Mode de paiement
                </span>
                <input
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  placeholder="Virement, CB, chèque…"
                  className="h-11 rounded-md border border-neutral-300 px-3 text-base"
                />
                <span className="text-sm text-neutral-500">
                  Optionnel: libellé libre stocké sur la facture.
                </span>
              </label>

              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-neutral-700">
                    Réf. client
                  </span>
                  <input
                    value={customerReference}
                    onChange={(event) => setCustomerReference(event.target.value)}
                    placeholder="Commande ou compte client"
                    className="h-11 rounded-md border border-neutral-300 px-3 text-base"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-neutral-700">
                    Réf. projet
                  </span>
                  <input
                    value={projectReference}
                    onChange={(event) => setProjectReference(event.target.value)}
                    placeholder="Projet, dossier…"
                    className="h-11 rounded-md border border-neutral-300 px-3 text-base"
                  />
                </label>

                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-sm font-medium text-neutral-700">
                    Réf. prestation
                  </span>
                  <input
                    value={serviceReference}
                    onChange={(event) => setServiceReference(event.target.value)}
                    placeholder="Intervention, ticket, mission…"
                    className="h-11 rounded-md border border-neutral-300 px-3 text-base"
                  />
                </label>
              </div>

              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium text-neutral-700">
                  Référence de paiement
                </span>
                <input
                  value={paymentRef}
                  onChange={(event) => setPaymentRef(event.target.value)}
                  placeholder="Référence virement, chèque, mandat…"
                  className="h-11 rounded-md border border-neutral-300 px-3 text-base"
                />
                <span className="text-sm text-neutral-500">
                  Optionnel: utile pour le rapprochement et les futurs exports.
                </span>
              </label>
            </div>
          </details>
        </div>

        <p className="mt-4 text-sm text-neutral-600">
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
          disabled={loading || quoteLoading}
          className="mt-4 hidden rounded-md bg-neutral-900 px-4 py-3 text-base font-semibold text-white disabled:opacity-60 md:inline-flex"
        >
          {loading
            ? "Enregistrement..."
            : isEdit
              ? "Enregistrer les modifications"
              : "Créer la facture"}
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
            disabled={loading || quoteLoading}
            className="h-11 flex-[1.3] rounded-md bg-neutral-900 px-4 text-base font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </div>
    </form>
  );
}

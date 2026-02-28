"use client";

import { useEffect, useRef, useState } from "react";

export type QuotePicklistOption = {
  id: string;
  number: string;
  customerName: string;
};

type QuotePicklistComboboxProps = {
  disabled?: boolean;
  onSelect: (quote: QuotePicklistOption) => void;
};

export function QuotePicklistCombobox({
  disabled,
  onSelect,
}: QuotePicklistComboboxProps) {
  const blurTimeoutRef = useRef<number | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<QuotePicklistOption[]>([]);

  useEffect(() => {
    if (disabled) {
      setQuotes([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/internal/quotes/picklist?query=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        const body = (await response.json().catch(() => ({}))) as {
          quotes?: QuotePicklistOption[];
        };

        if (!response.ok) {
          setQuotes([]);
          return;
        }

        setQuotes(body.quotes ?? []);
      } catch {
        if (!controller.signal.aborted) {
          setQuotes([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, query.trim() ? 120 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [disabled, query]);

  function handleSelect(quote: QuotePicklistOption) {
    setQuery(`${quote.number} — ${quote.customerName}`);
    onSelect(quote);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        value={query}
        disabled={disabled}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimeoutRef.current = window.setTimeout(() => setOpen(false), 120);
        }}
        placeholder="Basé sur le devis…"
        autoComplete="off"
        className="h-11 w-full rounded-md border border-neutral-300 px-3 text-base disabled:bg-neutral-100"
      />
      {open && !disabled && (quotes.length > 0 || loading) ? (
        <div className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-lg">
          {loading ? (
            <p className="px-3 py-2 text-sm text-neutral-500">Chargement...</p>
          ) : (
            quotes.map((quote) => (
              <button
                key={quote.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (blurTimeoutRef.current) {
                    window.clearTimeout(blurTimeoutRef.current);
                  }
                  handleSelect(quote);
                }}
                className="flex w-full flex-col gap-1 border-b border-neutral-100 px-3 py-2 text-left last:border-b-0 hover:bg-neutral-50"
              >
                <span className="text-sm font-medium text-neutral-900">
                  {quote.number}
                </span>
                <span className="text-xs text-neutral-500">{quote.customerName}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

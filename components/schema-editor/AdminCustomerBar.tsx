"use client";

import { useEffect, useRef, useState } from "react";
import { searchCustomersApi, type ActingCustomer } from "@/features/schemas/adminCustomerApi";
import { useAdminCustomerStore } from "@/features/schemas/store/useAdminCustomerStore";

const SEARCH_DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

// Bandeau Admin de Ouvrir / Sauvegarder : affiche le client pour lequel on
// travaille ("comme si j'étais sur son compte") et permet d'en choisir un
// autre, par exemple pour rattacher un schéma travaillé en local.
export function AdminCustomerBar({ darkMode, onChange }: { darkMode: boolean; onChange: (customer: ActingCustomer) => void }) {
  const actingCustomer = useAdminCustomerStore((s) => s.actingCustomer);
  const setActingCustomer = useAdminCustomerStore((s) => s.setActingCustomer);
  const [picking, setPicking] = useState(actingCustomer === null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ActingCustomer[]>([]);
  const requestId = useRef(0);
  const trimmedQuery = query.trim();
  const searchable = trimmedQuery.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!searchable) return;
    const id = ++requestId.current;
    const timeout = setTimeout(() => {
      void searchCustomersApi(trimmedQuery).then((customers) => {
        if (requestId.current === id) setResults(customers);
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchable, trimmedQuery]);

  function pick(customer: ActingCustomer) {
    setActingCustomer(customer);
    setPicking(false);
    setQuery("");
    setResults([]);
    onChange(customer);
  }

  const muted = darkMode ? "text-neutral-400" : "text-slate-500";
  const accent = darkMode ? "text-amber-300" : "text-amber-700";

  return (
    <div className={`rounded-lg border px-3 py-2 ${darkMode ? "border-amber-500/40 bg-amber-500/10" : "border-amber-200 bg-amber-50"}`}>
      {actingCustomer && !picking ? (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className={muted}>
            Compte client : <strong className={accent}>{actingCustomer.label}</strong>
          </span>
          <button type="button" onClick={() => setPicking(true)} className={`font-semibold hover:underline ${accent}`}>
            Changer
          </button>
        </div>
      ) : (
        <div>
          <label className={`block text-xs font-semibold ${accent}`}>
            Pour quel client ?
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom ou email…"
              autoFocus
              className={`mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm font-normal outline-none ${
                darkMode ? "border-neutral-700 bg-neutral-950 text-neutral-100" : "border-slate-300 bg-white text-slate-800"
              }`}
            />
          </label>
          {searchable && results.length > 0 ? (
            <ul className="mt-1.5 max-h-48 space-y-0.5 overflow-y-auto">
              {results.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => pick(customer)}
                    className={`block w-full truncate rounded-md px-2 py-1 text-left text-sm ${darkMode ? "hover:bg-neutral-800" : "hover:bg-white"}`}
                  >
                    {customer.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : searchable ? (
            <p className={`mt-1.5 text-xs ${muted}`}>Aucun client trouvé.</p>
          ) : null}
          {actingCustomer ? (
            <button type="button" onClick={() => setPicking(false)} className={`mt-1.5 text-xs font-semibold hover:underline ${muted}`}>
              Garder {actingCustomer.label}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

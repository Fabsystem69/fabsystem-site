"use client";

import { useEffect, useRef, useState } from "react";

interface ProjectSearchResult {
  id: string;
  name: string;
  customerName: string;
}

// Retour utilisateur : "menu admin dans l'éditeur pour reprendre
// directement" — évite de repasser par le dashboard pour ouvrir un autre
// schéma client pendant une session d'accompagnement. Navigation en plein
// rechargement (pas de router.push) : /outils/schema/editeur repart d'un
// état propre pour le nouveau projectId, comme un lien classique.
export function AdminProjectSwitcher({ darkMode }: { darkMode: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProjectSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/internal/projects/search?q=${encodeURIComponent(q)}`)
        .then((res) => (res.ok ? res.json() : { projects: [] }))
        .then((data) => {
          if (requestId.current !== id) return;
          setResults(Array.isArray(data.projects) ? data.projects : []);
        })
        .catch(() => {
          if (requestId.current === id) setResults([]);
        })
        .finally(() => {
          if (requestId.current === id) setLoading(false);
        });
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="px-3 pb-2 pt-1">
      <label className={`mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] ${darkMode ? "text-neutral-500" : "text-slate-400"}`}>
        Reprendre un schéma client
      </label>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Nom, email ou schéma…"
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
          darkMode
            ? "border-neutral-700 bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 focus:border-amber-500"
            : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-amber-400"
        }`}
      />
      {loading ? (
        <p className={`mt-2 text-xs ${darkMode ? "text-neutral-500" : "text-slate-400"}`}>Recherche…</p>
      ) : results.length > 0 ? (
        <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
          {results.map((project) => (
            <li key={project.id}>
              <a
                href={`/outils/schema/editeur?projectId=${project.id}`}
                className={`block rounded-lg px-2.5 py-1.5 text-sm transition-base ${darkMode ? "hover:bg-neutral-800" : "hover:bg-slate-100"}`}
              >
                <span className="block truncate font-medium">{project.name}</span>
                <span className={`block truncate text-xs ${darkMode ? "text-neutral-500" : "text-slate-500"}`}>{project.customerName}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : query.trim().length >= 2 ? (
        <p className={`mt-2 text-xs ${darkMode ? "text-neutral-500" : "text-slate-400"}`}>Aucun résultat.</p>
      ) : null}
    </div>
  );
}

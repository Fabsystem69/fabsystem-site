"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { applyCrmNotesAction } from "@/app/dashboard/crm/notes/actions";
import { MAX_NOTE_IMAGES, type ApplyEntry, type ExtractedEntry } from "@/lib/crm/notes-contract";
import { resizeImageToBase64 } from "@/lib/crm/resize-image";
import type { ApplyEntryResult } from "@/lib/services/crm-notes-apply";
import { NotesVracEntryCard, type ReviewMatch } from "./NotesVracEntryCard";

type ExtractResponse = {
  entries?: { entry: ExtractedEntry; matches: ReviewMatch[] }[];
  warnings?: string[];
  error?: string;
};

type ReviewItem = { entry: ApplyEntry; matches: ReviewMatch[] };

const OUTCOME_LABEL = { created: "Créé", updated: "Mis à jour", skipped: "Ignoré", failed: "Échec" } as const;

function toReviewItem(item: { entry: ExtractedEntry; matches: ReviewMatch[] }): ReviewItem {
  const [best] = item.matches;
  const entry: ApplyEntry = best
    ? { ...item.entry, mode: "append", prospectId: best.id }
    : { ...item.entry, mode: "create" };
  return { entry, matches: item.matches };
}

export function NotesVracForm() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [results, setResults] = useState<ApplyEntryResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, startSaving] = useTransition();

  async function analyze() {
    setAnalyzing(true);
    setError(null);
    setResults([]);

    try {
      const images = await Promise.all(files.map(resizeImageToBase64));
      const response = await fetch("/api/dashboard/crm/notes-extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, images }),
      });
      const body = (await response.json().catch(() => null)) as ExtractResponse | null;

      if (!response.ok || !body?.entries) throw new Error(body?.error || "Analyse impossible.");

      setItems(body.entries.map(toReviewItem));
      setWarnings(body.warnings ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analyse impossible.");
    } finally {
      setAnalyzing(false);
    }
  }

  function save() {
    setError(null);
    startSaving(async () => {
      const outcome = await applyCrmNotesAction(items.map((item) => item.entry));
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      setResults(outcome.results);
      setItems([]);
      setText("");
      setFiles([]);
    });
  }

  const updateItem = (index: number, entry: ApplyEntry) =>
    setItems((current) => current.map((item, position) => (position === index ? { ...item, entry } : item)));

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Notes en vrac
          <textarea
            rows={6}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Marc, Sprinter 2019, veut Victron 3000, budget 2k, rappeler jeudi…"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-base normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Photos de notes manuscrites (max {MAX_NOTE_IMAGES})
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, MAX_NOTE_IMAGES))}
            className="text-sm normal-case tracking-normal text-neutral-300"
          />
        </label>
        {files.length > 0 ? <p className="text-xs text-neutral-400">{files.length} photo(s) prête(s).</p> : null}
        <button
          type="button"
          onClick={analyze}
          disabled={analyzing || (!text.trim() && files.length === 0)}
          className="h-11 rounded-lg bg-brand-400 px-4 text-sm font-bold text-neutral-900 hover:bg-brand-300 disabled:opacity-50"
        >
          {analyzing ? "Analyse en cours…" : "Analyser mes notes"}
        </button>
      </section>

      {error ? <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{error}</p> : null}

      {warnings.length > 0 ? (
        <ul className="grid gap-1 rounded-lg border border-amber-900 bg-amber-950/30 p-3 text-sm text-amber-300">
          {warnings.map((warning) => (
            <li key={warning}>⚠ {warning}</li>
          ))}
        </ul>
      ) : null}

      {items.length > 0 ? (
        <section className="grid gap-4">
          <h2 className="text-base font-semibold text-white">Vérifiez avant d&apos;enregistrer</h2>
          {items.map((item, index) => (
            <NotesVracEntryCard key={index} entry={item.entry} matches={item.matches} onChange={(entry) => updateItem(index, entry)} />
          ))}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="h-11 rounded-lg bg-brand-400 px-4 text-sm font-bold text-neutral-900 hover:bg-brand-300 disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Valider et enregistrer dans le CRM"}
          </button>
        </section>
      ) : null}

      {results.length > 0 ? (
        <section className="grid gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm">
          {results.map((result, index) => (
            <p key={index} className={result.outcome === "failed" ? "text-red-300" : "text-neutral-200"}>
              {OUTCOME_LABEL[result.outcome]} — {result.name}
              {result.outcome === "failed" ? ` : ${result.error}` : null}
              {"prospectId" in result ? (
                <>
                  {" "}
                  <Link href={`/dashboard/crm/prospects/${result.prospectId}`} className="underline underline-offset-2">
                    Ouvrir
                  </Link>
                </>
              ) : null}
            </p>
          ))}
        </section>
      ) : null}
    </div>
  );
}

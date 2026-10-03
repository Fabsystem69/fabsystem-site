"use client";

import { PROSPECT_SOURCES, PROSPECT_STATUSES, type ApplyEntry } from "@/lib/crm/notes-contract";

export type ReviewMatch = { id: string; name: string; phone: string | null; email: string | null; status: string };

const fieldClass =
  "h-10 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-brand-400";
const areaClass =
  "w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-400";
const labelClass = "grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500";

export function NotesVracEntryCard({
  entry,
  matches,
  onChange,
}: {
  entry: ApplyEntry;
  matches: ReviewMatch[];
  onChange: (next: ApplyEntry) => void;
}) {
  const patch = (changes: Partial<ApplyEntry>) => onChange({ ...entry, ...changes });
  const text = (value: string | null) => value ?? "";
  const orNull = (value: string) => (value.trim() ? value : null);

  return (
    <article
      className={`grid gap-3 rounded-2xl border p-4 ${entry.mode === "skip" ? "border-neutral-800 opacity-60" : "border-neutral-700"} bg-neutral-900/60`}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Action
          <select
            className={fieldClass}
            value={entry.mode === "append" ? `append:${entry.prospectId}` : entry.mode}
            onChange={(event) => {
              const value = event.target.value;
              if (value.startsWith("append:")) patch({ mode: "append", prospectId: value.slice(7) });
              else patch({ mode: value as "create" | "skip", prospectId: undefined });
            }}
          >
            <option value="create">Créer un nouveau prospect</option>
            {matches.map((match) => (
              <option key={match.id} value={`append:${match.id}`}>
                Compléter « {match.name} » ({match.status})
              </option>
            ))}
            <option value="skip">Ignorer</option>
          </select>
        </label>
        <label className={labelClass}>
          Nom
          <input className={fieldClass} value={entry.name} onChange={(event) => patch({ name: event.target.value })} />
        </label>
      </div>

      {matches.length > 0 && entry.mode === "create" ? (
        <p className="text-xs text-amber-400">Une fiche existante ressemble à celle-ci : vérifiez avant de créer un doublon.</p>
      ) : null}

      {entry.mode !== "skip" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Téléphone
              <input className={fieldClass} value={text(entry.phone)} onChange={(event) => patch({ phone: orNull(event.target.value) })} />
            </label>
            <label className={labelClass}>
              Email
              <input className={fieldClass} value={text(entry.email)} onChange={(event) => patch({ email: orNull(event.target.value) })} />
            </label>
            <label className={labelClass}>
              Source
              <select className={fieldClass} value={entry.source} onChange={(event) => patch({ source: event.target.value as ApplyEntry["source"] })}>
                {PROSPECT_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Statut
              <select className={fieldClass} value={entry.status} onChange={(event) => patch({ status: event.target.value as ApplyEntry["status"] })}>
                {PROSPECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            Besoin électrique
            <textarea className={areaClass} rows={2} value={text(entry.besoinElectricite)} onChange={(event) => patch({ besoinElectricite: orNull(event.target.value) })} />
          </label>
          <label className={labelClass}>
            Notes
            <textarea className={areaClass} rows={3} value={text(entry.notes)} onChange={(event) => patch({ notes: orNull(event.target.value) })} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Prochaine action
              <input className={fieldClass} value={text(entry.nextAction)} onChange={(event) => patch({ nextAction: orNull(event.target.value) })} />
            </label>
            <label className={labelClass}>
              Date
              <input type="date" className={fieldClass} value={text(entry.nextActionDate)} onChange={(event) => patch({ nextActionDate: orNull(event.target.value) })} />
            </label>
          </div>
        </>
      ) : null}
    </article>
  );
}

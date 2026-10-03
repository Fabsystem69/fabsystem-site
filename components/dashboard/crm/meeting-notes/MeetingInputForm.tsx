"use client";

import { MAX_NOTE_IMAGES } from "@/lib/crm/notes-contract";
import type { MeetingTargetOption } from "@/lib/services/meeting-notes-targets";

const fieldClass =
  "h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-white outline-none focus:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-60";
const labelClass = "grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500";

export const targetValueOf = (target: { kind: string; id: string }) => `${target.kind}:${target.id}`;

// Saisie : dossier (obligatoire, jamais devine), date, texte et photos.
export function MeetingInputForm({
  targets,
  targetValue,
  locked,
  exchangeDate,
  text,
  fileCount,
  analyzing,
  canAnalyze,
  onTargetChange,
  onDateChange,
  onTextChange,
  onFilesChange,
  onAnalyze,
}: {
  targets: MeetingTargetOption[];
  targetValue: string;
  locked: boolean;
  exchangeDate: string;
  text: string;
  fileCount: number;
  analyzing: boolean;
  canAnalyze: boolean;
  onTargetChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onFilesChange: (files: File[]) => void;
  onAnalyze: () => void;
}) {
  const group = (kind: MeetingTargetOption["kind"], title: string) => {
    const items = targets.filter((target) => target.kind === kind);
    return items.length > 0 ? (
      <optgroup label={title}>
        {items.map((target) => (
          <option key={targetValueOf(target)} value={targetValueOf(target)}>
            {target.label}
            {target.sublabel ? ` — ${target.sublabel}` : ""}
          </option>
        ))}
      </optgroup>
    ) : null;
  };

  return (
    <section className="grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
      <label className={labelClass}>
        Dossier concerné (obligatoire)
        <select className={fieldClass} value={targetValue} disabled={locked} onChange={(event) => onTargetChange(event.target.value)}>
          <option value="">— Choisir un dossier —</option>
          {group("coaching_project", "Clients coaching")}
          {group("prospect", "Prospects")}
        </select>
      </label>

      <label className={labelClass}>
        Date de l&apos;échange
        <input type="date" className={fieldClass} value={exchangeDate} onChange={(event) => onDateChange(event.target.value)} />
        <span className="text-xs normal-case tracking-normal text-neutral-400">
          Sert à résoudre « vendredi », « la semaine prochaine » dans vos notes.
        </span>
      </label>

      <label className={labelClass}>
        Notes de l&apos;échange
        <textarea
          rows={8}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="Ce qui s'est dit, décidé, à faire…"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-base normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400"
        />
      </label>

      <label className={labelClass}>
        Photos de notes manuscrites (max {MAX_NOTE_IMAGES}, non conservées)
        <input
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={(event) => onFilesChange(Array.from(event.target.files ?? []).slice(0, MAX_NOTE_IMAGES))}
          className="min-h-11 text-sm normal-case tracking-normal text-neutral-300"
        />
      </label>
      {fileCount > 0 ? <p className="text-xs text-neutral-400">{fileCount} photo(s) prête(s).</p> : null}

      <button
        type="button"
        onClick={onAnalyze}
        disabled={!canAnalyze || analyzing}
        className="h-12 rounded-lg bg-brand-400 px-4 text-sm font-bold text-neutral-900 hover:bg-brand-300 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
      >
        {analyzing ? "Analyse en cours…" : "Analyser"}
      </button>
      <p className="text-xs text-neutral-500">Rien n&apos;est enregistré avant votre validation. Aucun message n&apos;est envoyé au client.</p>
    </section>
  );
}

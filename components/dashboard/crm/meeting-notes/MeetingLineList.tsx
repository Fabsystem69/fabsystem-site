"use client";

import { newLine, type ReviewLine } from "./meeting-review-state";

const areaClass =
  "w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-base text-white outline-none focus:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400";

// Liste editable : une case "inclure" et un texte modifiable par ligne.
export function MeetingLineList({
  title,
  hint,
  lines,
  onChange,
  warn = false,
}: {
  title: string;
  hint?: string;
  lines: ReviewLine[];
  onChange: (next: ReviewLine[]) => void;
  warn?: boolean;
}) {
  const patch = (id: string, changes: Partial<ReviewLine>) =>
    onChange(lines.map((line) => (line.id === id ? { ...line, ...changes } : line)));

  return (
    <fieldset
      className={`grid gap-2 rounded-2xl border p-4 ${warn ? "border-amber-900 bg-amber-950/30" : "border-neutral-800 bg-neutral-900/60"}`}
    >
      <legend className={`px-1 text-xs font-semibold uppercase tracking-wide ${warn ? "text-amber-400" : "text-neutral-500"}`}>
        {warn ? "⚠ " : ""}
        {title}
      </legend>
      {hint ? <p className={`text-xs ${warn ? "text-amber-300" : "text-neutral-400"}`}>{hint}</p> : null}
      {lines.length === 0 ? <p className="text-sm text-neutral-500">Rien à relire ici.</p> : null}
      {lines.map((line) => (
        <div key={line.id} className={`flex items-start gap-2 ${line.include ? "" : "opacity-60"}`}>
          <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
            <input
              type="checkbox"
              checked={line.include}
              onChange={(event) => patch(line.id, { include: event.target.checked })}
              aria-label={`Inclure : ${line.text || "ligne vide"}`}
              className="h-5 w-5 accent-brand-400"
            />
          </label>
          <textarea
            rows={2}
            value={line.text}
            onChange={(event) => patch(line.id, { text: event.target.value })}
            aria-label={`${title} — texte`}
            className={areaClass}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...lines, newLine()])}
        className="h-11 justify-self-start rounded-lg border border-neutral-700 px-3 text-sm text-neutral-200 hover:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        + Ajouter une ligne
      </button>
    </fieldset>
  );
}

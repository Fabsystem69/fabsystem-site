"use client";

import type { ChangeLine } from "./sheet-review-state";

const inputClass =
  "min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-base text-white outline-none focus:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400";

type Group = { sectionId: string; title: string; lines: ChangeLine[] };

function groupBySection(changes: readonly ChangeLine[]): Group[] {
  return changes.reduce<Group[]>((groups, line) => {
    const existing = groups.find((group) => group.sectionId === line.sectionId);
    return existing
      ? groups.map((group) => (group === existing ? { ...group, lines: [...group.lines, line] } : group))
      : [...groups, { sectionId: line.sectionId, title: line.sectionTitle, lines: [line] }];
  }, []);
}

function ChangeRow({ line, onChange }: { line: ChangeLine; onChange: (next: ChangeLine) => void }) {
  const contradiction = line.kind === "CHANGE";
  const inputId = `change-${line.id}`;
  return (
    <li className={`grid gap-2 rounded-xl border p-3 ${contradiction ? "border-amber-700 bg-amber-950/20" : "border-neutral-700 bg-neutral-900/60"} ${line.include ? "" : "opacity-70"}`}>
      <div className="flex items-start gap-2">
        <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            checked={line.include}
            onChange={(event) => onChange({ ...line, include: event.target.checked })}
            aria-label={`Enregistrer : ${line.label}`}
            className="h-5 w-5 accent-brand-400"
          />
        </label>
        <div className="grid min-w-0 flex-1 gap-1 pt-2">
          <label htmlFor={inputId} className="text-sm font-semibold text-white">
            {line.label}
          </label>
          <span
            className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${contradiction ? "bg-amber-900/60 text-amber-300" : "bg-emerald-900/50 text-emerald-300"}`}
          >
            {contradiction ? "Contredit l'existant" : "Nouveau"}
          </span>
        </div>
      </div>
      <p className={`text-sm ${contradiction ? "font-semibold text-amber-200" : "text-neutral-400"}`}>
        Actuellement : {line.current ? line.current : "vide"}
      </p>
      <textarea id={inputId} rows={2} value={line.value} onChange={(event) => onChange({ ...line, value: event.target.value })} className={inputClass} />
    </li>
  );
}

export function SheetChangeSections({ changes, onChange }: { changes: readonly ChangeLine[]; onChange: (next: ChangeLine[]) => void }) {
  const update = (next: ChangeLine) => onChange(changes.map((line) => (line.id === next.id ? next : line)));

  if (changes.length === 0) return <p className="text-sm text-neutral-400">Aucune réponse nouvelle ou différente détectée sur la fiche.</p>;

  return (
    <div className="grid gap-5">
      {groupBySection(changes).map((group) => (
        <section key={group.sectionId} aria-labelledby={`section-${group.sectionId}`} className="grid gap-2">
          <h3 id={`section-${group.sectionId}`} className="text-sm font-bold uppercase tracking-wide text-brand-300">
            {group.title}
          </h3>
          <ul className="grid gap-2">
            {group.lines.map((line) => (
              <ChangeRow key={line.id} line={line} onChange={update} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

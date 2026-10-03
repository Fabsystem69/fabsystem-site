"use client";

import { ACTION_RESPONSIBLES } from "@/lib/crm/meeting-notes-contract";
import { newActionLine, type ActionLine, type SheetReviewState, type TextLine } from "./sheet-review-state";

const fieldClass =
  "h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-white outline-none focus:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400";
const areaClass =
  "w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-base normal-case tracking-normal text-white outline-none focus:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400";
const labelClass = "grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500";
const RESPONSIBLES = { COACH: "Fabien", CLIENT: "Client" } as const;

function TextLines({ title, lines, onChange }: { title: string; lines: readonly TextLine[]; onChange: (next: TextLine[]) => void }) {
  if (lines.length === 0) return null;
  const update = (next: TextLine) => onChange(lines.map((line) => (line.id === next.id ? next : line)));
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</legend>
      {lines.map((line) => (
        <div key={line.id} className="flex items-start gap-2">
          <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
            <input type="checkbox" checked={line.include} onChange={(event) => update({ ...line, include: event.target.checked })} aria-label={`Inclure : ${line.text}`} className="h-5 w-5 accent-brand-400" />
          </label>
          <textarea rows={2} aria-label={title} value={line.text} onChange={(event) => update({ ...line, text: event.target.value })} className={areaClass} />
        </div>
      ))}
    </fieldset>
  );
}

function ActionRow({ action, onChange, onRemove }: { action: ActionLine; onChange: (next: ActionLine) => void; onRemove: () => void }) {
  const patch = (changes: Partial<ActionLine>) => onChange({ ...action, ...changes });
  const suggestion = action.origin === "SUGGESTION";
  return (
    <li className={`grid gap-3 rounded-xl border p-3 ${suggestion ? "border-dashed border-sky-800 bg-sky-950/20" : "border-neutral-700 bg-neutral-900/60"} ${action.include ? "" : "opacity-60"}`}>
      <div className="flex items-center gap-2">
        <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
          <input type="checkbox" checked={action.include} onChange={(event) => patch({ include: event.target.checked })} aria-label={`Inclure l'action : ${action.label || "sans libellé"}`} className="h-5 w-5 accent-brand-400" />
        </label>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${suggestion ? "bg-sky-900/60 text-sky-300" : "bg-neutral-800 text-neutral-300"}`}>
          {suggestion ? "suggestion IA" : "dans vos notes"}
        </span>
        <button type="button" onClick={onRemove} className="ml-auto h-11 rounded-lg px-3 text-sm text-red-300 hover:bg-red-950/40 focus-visible:ring-2 focus-visible:ring-red-400">
          Supprimer
        </button>
      </div>
      <label className={labelClass}>
        Action
        <textarea rows={2} value={action.label} onChange={(event) => patch({ label: event.target.value })} className={areaClass} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Responsable
          <select className={fieldClass} value={action.responsible} onChange={(event) => patch({ responsible: event.target.value as ActionLine["responsible"] })}>
            {ACTION_RESPONSIBLES.map((responsible) => (
              <option key={responsible} value={responsible}>
                {RESPONSIBLES[responsible]}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Échéance
          <input type="date" className={fieldClass} value={action.dueDate ?? ""} onChange={(event) => patch({ dueDate: event.target.value || null })} />
        </label>
      </div>
    </li>
  );
}

export function SheetCoachSection({ state, onChange }: { state: SheetReviewState; onChange: (next: SheetReviewState) => void }) {
  const patch = (changes: Partial<SheetReviewState>) => onChange({ ...state, ...changes });
  return (
    <section className="grid gap-4 rounded-2xl border border-neutral-700 bg-neutral-900/40 p-4" aria-labelledby="coach-title">
      <div>
        <h3 id="coach-title" className="text-sm font-bold uppercase tracking-wide text-brand-300">
          Réservé coach (reste privé)
        </h3>
        <p className="mt-1 text-xs text-neutral-400">Ces éléments ne sont jamais visibles du client.</p>
      </div>
      <label className={labelClass}>
        Observations
        <textarea rows={4} value={state.observations} onChange={(event) => patch({ observations: event.target.value })} className={areaClass} />
      </label>
      <TextLines title="Points à vérifier" lines={state.pointsToCheck} onChange={(pointsToCheck) => patch({ pointsToCheck })} />
      <TextLines title="Décisions" lines={state.decisions} onChange={(decisions) => patch({ decisions })} />
      <div className="grid gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Actions</h4>
        <ul className="grid gap-2">
          {state.actions.map((action) => (
            <ActionRow
              key={action.id}
              action={action}
              onChange={(next) => patch({ actions: state.actions.map((item) => (item.id === next.id ? next : item)) })}
              onRemove={() => patch({ actions: state.actions.filter((item) => item.id !== action.id) })}
            />
          ))}
        </ul>
        <button type="button" onClick={() => patch({ actions: [...state.actions, newActionLine()] })} className="h-11 rounded-lg border border-neutral-700 px-4 text-sm text-neutral-200 hover:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400">
          Ajouter une action
        </button>
      </div>
    </section>
  );
}

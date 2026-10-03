"use client";

import { ACTION_RESPONSIBLES } from "@/lib/crm/meeting-notes-contract";
import { formatIsoDateFr } from "@/lib/crm/meeting-notes-format";
import type { ReviewAction } from "./meeting-review-state";

const fieldClass =
  "h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-white outline-none focus:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400";
const labelClass = "grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500";
const RESPONSIBLE_LABELS = { COACH: "Fabien", CLIENT: "Client" } as const;

export function MeetingActionRow({
  action,
  onChange,
  onRemove,
}: {
  action: ReviewAction;
  onChange: (next: ReviewAction) => void;
  onRemove: () => void;
}) {
  const patch = (changes: Partial<ReviewAction>) => onChange({ ...action, ...changes });
  const suggestion = action.origin === "SUGGESTION";
  const dueFr = formatIsoDateFr(action.dueDate);

  return (
    <li
      className={`grid gap-3 rounded-xl border p-3 ${suggestion ? "border-dashed border-sky-800 bg-sky-950/20" : "border-neutral-700 bg-neutral-900/60"} ${action.include ? "" : "opacity-60"}`}
    >
      <div className="flex items-center gap-2">
        <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            checked={action.include}
            onChange={(event) => patch({ include: event.target.checked })}
            aria-label={`Inclure l'action : ${action.label || "sans libellé"}`}
            className="h-5 w-5 accent-brand-400"
          />
        </label>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${suggestion ? "bg-sky-900/60 text-sky-300" : "bg-neutral-800 text-neutral-300"}`}
        >
          {suggestion ? "suggestion IA" : "dans vos notes"}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto h-11 rounded-lg px-3 text-sm text-red-300 hover:bg-red-950/40 focus-visible:ring-2 focus-visible:ring-red-400"
        >
          Supprimer
        </button>
      </div>

      <label className={labelClass}>
        Action
        <textarea
          rows={2}
          value={action.label}
          onChange={(event) => patch({ label: event.target.value })}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-base normal-case tracking-normal text-white outline-none focus:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Responsable
          <select
            className={fieldClass}
            value={action.responsible}
            onChange={(event) => patch({ responsible: event.target.value as ReviewAction["responsible"] })}
          >
            {ACTION_RESPONSIBLES.map((responsible) => (
              <option key={responsible} value={responsible}>
                {RESPONSIBLE_LABELS[responsible]}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Échéance
          <input type="date" className={fieldClass} value={action.dueDate ?? ""} onChange={(event) => patch({ dueDate: event.target.value || null })} />
        </label>
      </div>

      {action.dueDateText ? (
        <p className="text-xs text-neutral-400">
          écrit dans vos notes : « {action.dueDateText} » → {dueFr ?? "aucune date retenue"}
        </p>
      ) : null}
    </li>
  );
}

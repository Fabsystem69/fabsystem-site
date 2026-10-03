"use client";

import { MeetingActionRow } from "./MeetingActionRow";
import { MeetingLineList } from "./MeetingLineList";
import { CHANNELS, newAction, type ReviewState } from "./meeting-review-state";

const fieldClass =
  "h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-white outline-none focus:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400";
const labelClass = "grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500";

// Relecture editable : rien n'est enregistre tant que le bouton unique
// n'est pas active.
export function MeetingReviewPanel({
  review,
  warnings,
  targetLabel,
  error,
  submitting,
  onChange,
  onSubmit,
}: {
  review: ReviewState;
  warnings: string[];
  targetLabel: string;
  error: string | null;
  submitting: boolean;
  onChange: (next: ReviewState) => void;
  onSubmit: () => void;
}) {
  const patch = (changes: Partial<ReviewState>) => onChange({ ...review, ...changes });
  const channelOptions = CHANNELS.includes(review.channel as (typeof CHANNELS)[number]) ? CHANNELS : [review.channel, ...CHANNELS];

  return (
    <section className="grid gap-4" aria-label="Relecture de la proposition">
      <h2 className="text-base font-semibold text-white">Vérifiez avant d&apos;enregistrer — {targetLabel}</h2>

      {warnings.length > 0 ? (
        <ul className="grid gap-1 rounded-lg border border-amber-900 bg-amber-950/30 p-3 text-sm text-amber-300">
          {warnings.map((warning) => (
            <li key={warning}>⚠ {warning}</li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
        <label className={labelClass}>
          Résumé
          <textarea
            rows={6}
            value={review.summary}
            onChange={(event) => patch({ summary: event.target.value })}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-base normal-case tracking-normal text-white outline-none focus:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Canal
            <select className={fieldClass} value={review.channel} onChange={(event) => patch({ channel: event.target.value })}>
              {channelOptions.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Durée (min) — comptée dans le temps d&apos;accompagnement
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={480}
              className={fieldClass}
              value={review.durationMinutes}
              onChange={(event) => patch({ durationMinutes: event.target.value })}
            />
          </label>
        </div>
      </div>

      <MeetingLineList title="Informations ajoutées" lines={review.newInfo} onChange={(newInfo) => patch({ newInfo })} />
      <MeetingLineList title="Décisions" lines={review.decisions} onChange={(decisions) => patch({ decisions })} />

      <fieldset className="grid gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Actions</legend>
        <p className="text-xs text-neutral-400">
          Les suggestions IA sont décochées : cochez seulement celles que vous voulez vraiment suivre.
        </p>
        {review.actions.length === 0 ? <p className="text-sm text-neutral-500">Aucune action détectée.</p> : null}
        <ul className="grid gap-3">
          {review.actions.map((action) => (
            <MeetingActionRow
              key={action.id}
              action={action}
              onChange={(next) => patch({ actions: review.actions.map((item) => (item.id === action.id ? next : item)) })}
              onRemove={() => patch({ actions: review.actions.filter((item) => item.id !== action.id) })}
            />
          ))}
        </ul>
        <button
          type="button"
          onClick={() => patch({ actions: [...review.actions, newAction()] })}
          className="h-11 justify-self-start rounded-lg border border-neutral-700 px-3 text-sm text-neutral-200 hover:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          + Ajouter une action
        </button>
      </fieldset>

      <MeetingLineList
        title="À reprendre au prochain RDV"
        lines={review.nextMeetingTopics}
        onChange={(nextMeetingTopics) => patch({ nextMeetingTopics })}
      />
      <MeetingLineList
        title="Points à clarifier"
        hint="Ce que l'IA n'a pas pu lire ou comprendre avec certitude."
        warn
        lines={review.uncertainties}
        onChange={(uncertainties) => patch({ uncertainties })}
      />

      {error ? (
        <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="h-12 rounded-lg bg-brand-400 px-4 text-sm font-bold text-neutral-900 hover:bg-brand-300 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
      >
        {submitting ? "Enregistrement…" : "Valider et enregistrer"}
      </button>
      <p className="text-xs text-neutral-500">Aucun message n&apos;est envoyé au client.</p>
    </section>
  );
}

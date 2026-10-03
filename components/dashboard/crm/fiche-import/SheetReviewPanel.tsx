"use client";

import { SheetChangeSections } from "./SheetChangeSections";
import { SheetCoachSection } from "./SheetCoachSection";
import { SheetDevicesTable } from "./SheetDevicesTable";
import { SheetUnreadBlock } from "./SheetUnreadBlock";
import type { SheetReviewState } from "./sheet-review-state";

// Relecture : Fabien corrige, coche, puis valide en un seul geste.
export function SheetReviewPanel({
  review,
  projectLabel,
  error,
  submitting,
  onChange,
  onSubmit,
}: {
  review: SheetReviewState;
  projectLabel: string;
  error: string | null;
  submitting: boolean;
  onChange: (next: SheetReviewState) => void;
  onSubmit: () => void;
}) {
  const notices = [...review.warnings, ...review.uncertainties];
  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!submitting) onSubmit();
      }}
    >
      <h2 className="text-lg font-bold text-white">Relecture de la fiche{projectLabel ? ` — ${projectLabel}` : ""}</h2>

      {notices.length > 0 ? (
        <ul className="grid gap-1 rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-200" aria-label="Avertissements">
          {notices.map((notice, index) => (
            <li key={`${index}-${notice}`}>{notice}</li>
          ))}
        </ul>
      ) : null}

      <SheetChangeSections changes={review.changes} onChange={(changes) => onChange({ ...review, changes })} />
      <SheetUnreadBlock unread={review.unread} sameCount={review.sameCount} />

      <section className="grid gap-2" aria-labelledby="devices-title">
        <h3 id="devices-title" className="text-sm font-bold uppercase tracking-wide text-brand-300">
          Appareils
        </h3>
        <SheetDevicesTable devices={review.devices} onChange={(devices) => onChange({ ...review, devices })} />
      </section>

      <SheetCoachSection state={review} onChange={onChange} />

      {error ? (
        <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="h-12 rounded-lg bg-brand-400 px-4 text-sm font-bold text-neutral-900 hover:bg-brand-300 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
      >
        {submitting ? "Enregistrement…" : "Valider et enregistrer"}
      </button>
      <p className="text-xs text-neutral-500">Seules les lignes cochées sont enregistrées. Aucun message n&apos;est envoyé au client.</p>
    </form>
  );
}

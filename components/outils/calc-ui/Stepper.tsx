"use client";

// Extrait de MpptCalculator.tsx pour réutilisation (retour utilisateur :
// compteur +/- pour un nombre entier discret, pas un slider continu — "tu
// mets des slide bar quand y'en pas besoin").
export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-neutral-700">{label}</label>
      <div className="flex items-center gap-3 rounded-lg border border-neutral-300 px-3 py-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-base font-bold leading-none text-neutral-600 hover:border-brand-400 hover:text-brand-700"
        >
          −
        </button>
        <span className="flex-1 text-center text-sm font-bold text-neutral-950">
          {value}
          {unit ? ` ${unit}` : ""}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-base font-bold leading-none text-neutral-600 hover:border-brand-400 hover:text-brand-700"
        >
          +
        </button>
      </div>
    </div>
  );
}

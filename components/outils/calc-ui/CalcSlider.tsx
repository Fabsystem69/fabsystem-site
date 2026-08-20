"use client";

// Retour utilisateur (comparatif Wireframe) : leurs valeurs numériques
// (capacité batterie, durée de conduite…) sont des sliders avec la valeur
// affichée en gros en dessous, plus rapide à ajuster et plus visuel qu'un
// champ texte brut. Le champ numérique classique reste utilisé quand une
// valeur précise/décimale compte vraiment (ex. puissance exacte d'un
// appareil) — le slider convient aux réglages "à la louche" avec une plage
// raisonnable.
export function CalcSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  helpText,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  helpText?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-neutral-700">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-500"
      />
      <p className="mt-1 text-sm font-bold text-neutral-900">
        {value.toLocaleString("fr-FR")}
        {unit ? ` ${unit}` : ""}
      </p>
      {helpText ? <p className="mt-0.5 text-xs text-neutral-400">{helpText}</p> : null}
    </div>
  );
}

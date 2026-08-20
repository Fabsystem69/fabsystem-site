"use client";

// Retour utilisateur : "je vais t'envoyer les screen de tout les outils
// pour essayer de viser le même UX" (comparatif Wireframe) — leurs choix
// courts (12V/24V/48V, Continu/Non-continu…) sont des boutons pilules,
// scannables d'un coup d'œil, plutôt qu'un <select> qu'il faut ouvrir pour
// voir les options. Remplace les `<select>` à 2-4 options des calculateurs
// publics — un vrai `<select>` reste pertinent pour les listes longues
// (ex. la liste des câbles), pas remplacé partout.
export function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex gap-2" role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={opt.value === value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            opt.value === value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

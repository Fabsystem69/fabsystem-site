"use client";

import { useState } from "react";
import type { PrestationsCategorie } from "@/lib/prestations-packs";

// Services V2 — sélecteur d'univers pour "Je confie"
// (docs/refonte-site-public/services/04-JE-CONFIE.md §7-10). Catégories
// d'intervention reprises mot pour mot du CDC (exemples de savoir-faire,
// jamais des forfaits) — aucune invention. Même principe d'état
// sélectionné que le sélecteur "On fait ensemble" (contraste renforcé,
// jamais la couleur seule) mais implémenté séparément : ce composant n'a
// pas de prix ni d'ajout panier, un composant partagé aurait donc
// mélangé deux responsabilités différentes.
const CATEGORIES: { id: PrestationsCategorie; label: string }[] = [
  { id: "bateau", label: "Bateau" },
  { id: "van", label: "Van aménagé" },
  { id: "camping-car", label: "Camping-car" },
];

const INTERVENTIONS: Record<PrestationsCategorie, string[]> = {
  bateau: [
    "Diagnostic & recherche de panne",
    "Refit électrique",
    "Tableaux & distribution",
    "Batteries & lithium",
    "Solaire & recharge",
    "12 V / 230 V",
    "Équipements de bord",
  ],
  van: [
    "Installation électrique complète",
    "Évolution d'une installation existante",
    "Batteries & lithium",
    "Solaire",
    "Recharge alternateur / secteur",
    "Convertisseur & 230 V",
    "Ajout d'équipements",
  ],
  "camping-car": [
    "Diagnostic électrique",
    "Modification & fiabilisation",
    "Batteries & lithium",
    "Solaire & autonomie",
    "Recharge",
    "Convertisseur & 230 V",
    "Ajout d'équipements",
  ],
};

export function JeConfieUnivers({ initialCategory }: { initialCategory?: PrestationsCategorie }) {
  const [category, setCategory] = useState<PrestationsCategorie>(initialCategory ?? "bateau");

  return (
    <div>
      <div role="tablist" aria-label="Choisir votre type de véhicule" className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={category === cat.id}
            onClick={() => setCategory(cat.id)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
              category === cat.id
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <ul className="mt-5 flex flex-wrap gap-2">
        {INTERVENTIONS[category].map((item) => (
          <li
            key={item}
            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Section } from "@/components/layout/Section";
import { ProductCard } from "./ProductCard";
import type { BoutiqueGuideEntry } from "./types";
import type { PrestationsCategorie } from "@/lib/prestations-packs";

type UniversOption = "tous" | PrestationsCategorie;

const UNIVERS_OPTIONS: { id: UniversOption; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "bateau", label: "Bateau" },
  { id: "van", label: "Van" },
  { id: "camping-car", label: "Camping-car" },
];

// Textes repris mot pour mot de Boutique/02-UNIVERS.md §7-9. "camping-car"
// n'a aujourd'hui aucun guide réel : l'état "Guide en préparation" de §10
// s'applique systématiquement pour cet univers (voir EBOOK_SLUG_BY_CATEGORIE
// dans lib/prestations-packs.ts, où camping-car vaut null).
const UNIVERS_CONTENT: Record<
  PrestationsCategorie,
  { title: string; accroche: string; texte: string; reperes: string[] }
> = {
  bateau: {
    title: "Bateau",
    accroche: "Comprendre et fiabiliser l'existant",
    texte:
      "Une installation de bord évolue souvent au fil des années. Comprenez ce qui est déjà là, identifiez les points importants et faites évoluer votre installation proprement.",
    reperes: ["Diagnostic", "Refit", "Lithium", "Solaire"],
  },
  van: {
    title: "Van",
    accroche: "Concevoir sur de bonnes bases",
    texte:
      "Vous partez souvent d'une page blanche. Architecture, dimensionnement, protections et câblage : construisez une installation cohérente dès le départ.",
    reperes: ["Conception", "Dimensionnement", "Câblage", "Protections"],
  },
  "camping-car": {
    title: "Camping-car",
    accroche: "Comprendre avant de faire évoluer",
    texte:
      "Votre camping-car possède généralement déjà son architecture électrique. Comprenez son fonctionnement avant d'ajouter du lithium, du solaire, de la recharge ou de nouveaux équipements.",
    reperes: ["Évolution", "Lithium", "Solaire", "Équipements"],
  },
};

export function GuidesEtUnivers({ entries }: { entries: BoutiqueGuideEntry[] }) {
  const [univers, setUnivers] = useState<UniversOption>("tous");

  const filtered = univers === "tous" ? entries : entries.filter((e) => e.univers === univers);
  const content = univers === "tous" ? null : UNIVERS_CONTENT[univers];

  return (
    <>
      <Section tone="light">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Choisissez votre univers
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
          Les besoins ne sont pas les mêmes selon votre installation. Commencez par votre type de
          projet.
        </p>

        <div
          role="tablist"
          aria-label="Filtrer les guides par univers"
          className="mt-6 flex flex-wrap gap-2"
        >
          {UNIVERS_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={univers === option.id}
              onClick={() => setUnivers(option.id)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                univers === option.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {content ? (
          <div className="mt-6 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              {content.accroche}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700 sm:text-base">
              {content.texte}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {content.reperes.map((repere) => (
                <li
                  key={repere}
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600"
                >
                  {repere}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>

      <Section id="guides-disponibles" tone="muted" className="scroll-mt-16">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Les guides disponibles
        </h2>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-card border border-neutral-200 bg-white p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-neutral-950">
              {univers === "camping-car" ? "Guide Camping-car en préparation" : "Guide en préparation"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              {univers === "camping-car"
                ? "Le guide Camping-car est en cours de préparation."
                : "Aucun guide n'est disponible pour cet univers pour le moment."}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((entry) => (
              <ProductCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

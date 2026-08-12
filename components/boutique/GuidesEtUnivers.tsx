"use client";

import { useState } from "react";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { ProductCard } from "./ProductCard";
import type { BoutiqueGuideEntry } from "./types";
import type { PrestationsCategorie } from "@/lib/prestations-packs";

// UI-10 §8.4 : carte éditoriale "à venir", visuellement alignée sur
// ProductCard mais explicitement non achetable (pas de prix, pas de CTA
// d'achat, pas de lien vers une fiche produit) — aucune ligne Product
// n'existe en base pour Camping-car, cette carte ne doit jamais en laisser
// croire l'existence.
function ComingSoonCard() {
  return (
    <article className="flex h-full flex-col rounded-card border border-dashed border-neutral-300 bg-neutral-50 p-6">
      <div className="mb-4 flex h-60 w-full items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white">
        <span className="text-sm font-medium text-neutral-400">Visuel à venir</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">Camping-car</Badge>
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Guide
        </span>
      </div>
      <h3 className="mt-2 text-xl font-semibold text-neutral-950">Guide Camping-car</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-700">
        Comprendre et faire évoluer une installation camping-car existante — lithium, solaire,
        équipements.
      </p>
      <p className="mt-4 text-sm font-semibold text-neutral-500">Bientôt disponible</p>
    </article>
  );
}

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
    <Section id="guides-disponibles" tone="muted" className="scroll-mt-24">
      <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
        Les guides disponibles
      </h2>

      <div className="mt-6 border-t border-neutral-200 pt-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Choisissez votre univers
        </p>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-neutral-600">
          Les besoins ne sont pas les mêmes selon votre installation. Commencez par votre type de
          projet.
        </p>

        <div
          role="tablist"
          aria-label="Filtrer les guides par univers"
          className="mt-4 flex flex-wrap gap-2"
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
          <div className="mt-5 max-w-2xl">
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
      </div>

      {filtered.length === 0 && univers !== "camping-car" && univers !== "tous" ? (
        <div className="mt-6 rounded-card border border-neutral-200 bg-white p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-neutral-950">Guide en préparation</h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            Aucun guide n&apos;est disponible pour cet univers pour le moment.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((entry) => (
            <ProductCard key={entry.id} entry={entry} />
          ))}
          {/* Camping-car n'a aucun Product réel en base : montré comme une
              carte "à venir" plutôt que masqué, pour que les trois univers
              restent visibles ensemble (mission §8.4). */}
          {univers === "tous" || univers === "camping-car" ? <ComingSoonCard /> : null}
        </div>
      )}
    </Section>
  );
}

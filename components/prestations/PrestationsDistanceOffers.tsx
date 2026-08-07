"use client";

import { useState } from "react";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import {
  buildPrestationsPackSlug,
  getPrestationsPackPriceCents,
  type PrestationsCategorie,
  type PrestationsPalier,
} from "@/lib/prestations-packs";

type PrestationsDistanceOffersProps = {
  // slug pack -> productId reel en base (voir lib/services/prestations-packs-catalog.ts).
  // Un pack absent de cette map n'a pas encore ete cree dans le catalogue :
  // le bouton retombe alors sur un lien vers /boutique plutot que de casser.
  packProductIdBySlug: Record<string, string>;
};

const categories: { id: PrestationsCategorie; label: string }[] = [
  { id: "van", label: "Van aménagé" },
  { id: "camping-car", label: "Camping-car" },
  { id: "bateau", label: "Bateau" },
];

const vocab: Record<PrestationsCategorie, string[]> = {
  van: [
    "Batterie auxiliaire",
    "Solaire",
    "DC-DC",
    "Frigo",
    "Éclairage",
    "Convertisseur",
    "Tableau 12 V",
    "Autonomie",
    "VASP",
  ],
  "camping-car": [
    "Installation existante",
    "Chargeur d'origine",
    "Centrale électrique",
    "Lithium retrofit",
    "Solaire",
    "Compatibilité avec l'existant",
    "Intégration propre",
  ],
  bateau: [
    "Charge quai",
    "230 V",
    "Isolateur galvanique",
    "Corrosion",
    "Pompes de cale",
    "Guindeau",
    "VHF",
    "Sondeur",
    "NMEA",
    "12/24 V",
    "Humidité",
    "Sécurité navigation",
  ],
};

const paliers: {
  id: PrestationsPalier;
  name: string;
  subtitle: string;
  highlights: string[];
  avoids: string[];
  steps: string;
  cta: string;
  badge?: string;
  theme: {
    border: string;
    ring: string;
    bg: string;
    accent: string;
    badgeBg: string;
  };
}[] = [
  {
    id: "amarrage",
    name: "AMARRAGE",
    subtitle: "Faire le point avant de repartir dans la mauvaise direction.",
    highlights: [
      "Idéal pour un doute précis",
      "Installation existante à vérifier",
      "Liste de matériel à valider rapidement",
      "Photos ou schéma à analyser",
      "Priorités d'action",
      "Mail de synthèse après l'échange",
    ],
    avoids: [
      "Brancher sans comprendre",
      "Acheter du matériel inutile",
      "Continuer avec une erreur évidente",
      "Découvrir trop tard un problème de sécurité",
    ],
    steps: "Étapes 1 → 2",
    cta: "Faire le point",
    theme: {
      border: "border-brand-400/60",
      ring: "",
      bg: "bg-neutral-900",
      accent: "text-brand-400",
      badgeBg: "bg-brand-400 text-neutral-900",
    },
  },
  {
    id: "cap",
    name: "CAP",
    subtitle: "Définir la bonne architecture avant d'acheter ou de câbler.",
    highlights: [
      "Logique complète de l'installation",
      "Choix des grandes fonctions",
      "Batterie / charge / solaire",
      "Protections principales",
      "Sections principales",
      "Cohérence matériel",
      "Ordre de priorité",
    ],
    avoids: [
      "Acheter les mauvais composants",
      "Mélanger du matériel incompatible",
      "Surdimensionner ou sous-dimensionner",
      "Devoir reprendre l'installation après achat",
    ],
    steps: "Étapes 1 → 3",
    cta: "Éviter les mauvais achats",
    theme: {
      border: "border-teal-700/60",
      ring: "",
      bg: "bg-neutral-900",
      accent: "text-teal-400",
      badgeBg: "bg-teal-700 text-white",
    },
  },
  {
    id: "passerelle",
    name: "PASSERELLE",
    subtitle: "Avancer étape par étape avec FabSystem à vos côtés.",
    highlights: [
      "Accompagnement du projet dans la durée",
      "Architecture validée",
      "Choix matériel validé",
      "Points d'étape en visio (Teams)",
      "Échanges WhatsApp pendant le projet",
      "Contrôle des photos avant branchement",
      "Vérification avant mise sous tension",
      "Accompagnement jusqu'aux premiers essais",
    ],
    avoids: [
      "Rester bloqué seul",
      "Se tromper au moment du câblage",
      "Brancher sans contrôle",
      "Refaire une partie du chantier",
      "Accumuler les petites erreurs coûteuses",
    ],
    steps: "Étapes 1 → 5",
    cta: "Avancer avec méthode",
    badge: "Le plus choisi",
    theme: {
      border: "border-brand-400",
      ring: "ring-2 ring-brand-400/40",
      bg: "bg-neutral-900",
      accent: "text-amber-400",
      badgeBg: "bg-brand-400 text-neutral-900",
    },
  },
  {
    id: "grand-large",
    name: "GRAND LARGE",
    subtitle: "Sécuriser tout le projet jusqu'aux premiers essais.",
    highlights: [
      "Conception plus poussée par FabSystem",
      "Schéma préparé ou fortement structuré",
      "Liste matériel détaillée",
      "Accompagnement prioritaire",
      "WhatsApp inclus",
      "Revue photos pendant le chantier",
      "Préparation mise sous tension",
      "Aide aux premiers essais",
      "Contrôle de cohérence final",
    ],
    avoids: [
      "Partir d'une page blanche",
      "Prendre seul les décisions critiques",
      "Oublier un élément important",
      "Découvrir une incohérence en fin de projet",
      "Perdre du temps et de l'argent sur des corrections",
    ],
    steps: "Étapes 1 → 5 (conception renforcée)",
    cta: "Sécuriser mon projet",
    theme: {
      border: "border-neutral-400/40",
      ring: "",
      bg: "bg-neutral-950",
      accent: "text-neutral-300",
      badgeBg: "bg-neutral-300 text-neutral-900",
    },
  },
];

function formatPrice(cents: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(cents / 100) + " €";
}

const PACK_ADD_TO_CART_CLASS =
  "inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-brand-400 px-4 py-2 text-sm font-bold text-neutral-900 transition hover:bg-brand-300";

const PACK_FALLBACK_LINK_CLASS =
  "inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-white/30 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10";

export function PrestationsDistanceOffers({ packProductIdBySlug }: PrestationsDistanceOffersProps) {
  const [category, setCategory] = useState<PrestationsCategorie>("van");

  return (
    <div>
      {/* Sélecteur de catégorie */}
      <div
        role="tablist"
        aria-label="Choisir votre type de véhicule"
        className="flex flex-wrap gap-2"
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={category === cat.id}
            onClick={() => setCategory(cat.id)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
              category === cat.id
                ? "border-brand-400 bg-brand-400 text-neutral-900"
                : "border-white/20 text-white/80 hover:border-white/40 hover:text-white"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Vocabulaire adapté à la catégorie */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {vocab[category].map((word) => (
          <span
            key={word}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60"
          >
            {word}
          </span>
        ))}
      </div>

      {/* Paliers */}
      <div className="mt-8 grid gap-5 lg:grid-cols-4">
        {paliers.map((palier) => {
          const slug = buildPrestationsPackSlug(palier.id, category);
          const productId = packProductIdBySlug[slug];

          return (
            <article
              key={palier.id}
              className={`relative flex h-full flex-col rounded-2xl border ${palier.theme.border} ${palier.theme.bg} ${palier.theme.ring} p-5 shadow-lg shadow-black/30`}
            >
              {palier.badge ? (
                <span
                  className={`absolute -top-3 left-5 rounded-full px-3 py-0.5 text-xs font-bold ${palier.theme.badgeBg}`}
                >
                  {palier.badge}
                </span>
              ) : null}

              <h3 className={`text-base font-bold tracking-wide ${palier.theme.accent}`}>
                {palier.name}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-white/70">{palier.subtitle}</p>

              <p className="mt-4 text-2xl font-bold text-white">
                {formatPrice(getPrestationsPackPriceCents(category, palier.id))}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-white/40">
                Tarif de lancement
              </p>

              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-white/80">
                {palier.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className={`mt-0.5 ${palier.theme.accent}`}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  Ce que vous évitez
                </p>
                <ul className="mt-2 space-y-1 text-xs text-white/60">
                  {palier.avoids.map((item) => (
                    <li key={item}>— {item}</li>
                  ))}
                </ul>
              </div>

              <p className="mt-4 text-xs font-medium text-white/50">{palier.steps}</p>

              <div className="mt-5">
                {productId ? (
                  <AddToCartButton
                    productId={productId}
                    label={palier.cta}
                    className={PACK_ADD_TO_CART_CLASS}
                    successMessage={`${palier.name} ajouté au panier.`}
                  />
                ) : (
                  <Link href="/boutique" className={PACK_FALLBACK_LINK_CLASS}>
                    Voir en boutique
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-white/40">
        Tarif de lancement réservé aux premiers projets accompagnés par FabSystem.
      </p>
    </div>
  );
}

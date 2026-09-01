import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { CalculateursIndex } from "@/components/outils/CalculateursIndex";
import { BasiquesAtelier } from "@/components/outils/BasiquesAtelier";
import { Guides } from "@/components/outils/Guides";
import { Accompagnement } from "@/components/outils/Accompagnement";

// Outils V2 — Hub public (docs/refonte-site-public/Outils/00-ARCHITECTURE.md,
// 01-HUB-PUBLIC.md). Ordre : Hero → Calculateurs (index de cartes
// uniquement — chaque carte mène à sa page dédiée /outils/<id>, aucun
// formulaire complet ici, voir UI-7.1) → Les basiques de l'atelier
// (passerelle vers Les Bases, pas de duplication de contenu) → Guides →
// Accompagnement. "Schéma électrique" (éditeur /outils/schema) est un
// outil réel au même titre que les calculateurs depuis son lancement ;
// "Mes projets" n'existe toujours pas.
// La section Guides lit le catalogue réel (même fonctions que /boutique)
// pour un prix toujours à jour : comme /boutique et /formations, la page
// doit donc être rendue à la requête, jamais figée au build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Outils & Calculateurs électricité embarquée — bateau, van, camping-car",
  description:
    "Calculateurs gratuits : section de câble 12V, bilan de consommation et autonomie, banque de batteries, régulateur MPPT, table AWG/mm² avec usages typiques bateau. Dimensionnez votre installation électrique embarquée.",
  alternates: { canonical: "/outils" },
  openGraph: {
    title: "Calculateurs électricité embarquée | FabSystem",
    description:
      "Calculez la section de câble, le bilan de consommation et l'autonomie, et votre banque de batteries pour votre bateau, van ou camping-car.",
    url: "https://www.fabsystem.fr/outils",
    images: [
      {
        url: "/hero-fabsystem.png",
        width: 1200,
        height: 630,
        alt: "FabSystem - Outils et calculateurs d'électricité embarquée",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calculateurs électricité embarquée | FabSystem",
    description:
      "Calculez la section de câble, le bilan de consommation et l'autonomie pour votre bateau, van ou camping-car.",
    images: ["/hero-fabsystem.png"],
  },
};

export default function OutilsPage() {
  return (
    <main className="bg-white text-neutral-900">
      <PageIntro
        eyebrow="Les outils FabSystem"
        title="Calculez, dimensionnez, vérifiez."
        description="Des outils simples et gratuits pour préparer une installation électrique fiable."
      />
      <CalculateursIndex />
      <BasiquesAtelier />
      <Guides />
      <Accompagnement />
    </main>
  );
}

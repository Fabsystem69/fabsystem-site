import type { Metadata } from "next";
import { PublicHero } from "@/components/public/PublicHero";
import { CalculateursIndex } from "@/components/outils/CalculateursIndex";
import { BasiquesAtelier } from "@/components/outils/BasiquesAtelier";
import { Guides } from "@/components/outils/Guides";
import { Accompagnement } from "@/components/outils/Accompagnement";

// Outils V2 — Hub public (docs/refonte-site-public/Outils/00-ARCHITECTURE.md,
// 01-HUB-PUBLIC.md). Ordre : Hero → Calculateurs (index de cartes
// uniquement — chaque carte mène à sa page dédiée /outils/<id>, aucun
// formulaire complet ici, voir UI-7.1) → Les basiques de l'atelier
// (passerelle vers Les Bases, pas de duplication de contenu) → Guides →
// Accompagnement. Aucune section "Schéma électrique" ni "Mes projets" :
// ni l'un ni l'autre n'existe réellement aujourd'hui (voir
// docs/audits/UI-7-OUTILS.md, "Outils disponibles").
// La section Guides lit le catalogue réel (même fonctions que /boutique)
// pour un prix toujours à jour : comme /boutique et /formations, la page
// doit donc être rendue à la requête, jamais figée au build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Outils & Calculateurs électricité embarquée — bateau, van, camping-car",
  description:
    "Calculateurs gratuits : section de câble 12V, bilan de consommation, autonomie batterie, régulateur MPPT, table AWG/mm² avec usages typiques bateau. Dimensionnez votre installation électrique embarquée.",
  alternates: { canonical: "/outils" },
  openGraph: {
    title: "Calculateurs électricité embarquée | FabSystem",
    description:
      "Calculez la section de câble, le bilan de consommation et l'autonomie batterie pour votre bateau, van ou camping-car.",
    url: "https://www.fabsystem.fr/outils",
  },
};

export default function OutilsPage() {
  return (
    <main className="bg-white text-neutral-900">
      <PublicHero
        eyebrow="Les outils FabSystem"
        title="Préparez votre installation électrique."
        description="Calculez et dimensionnez votre installation 12/24 V avec des outils simples et gratuits."
        primaryAction={{ href: "#calculateurs", label: "Voir les calculateurs" }}
        scrollTargetId="calculateurs"
      />
      <CalculateursIndex />
      <BasiquesAtelier />
      <Guides />
      <Accompagnement />
    </main>
  );
}

import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { TroisUnivers } from "@/components/home/TroisUnivers";
import { Parcours } from "@/components/home/Parcours";
import { OutilsGratuits } from "@/components/home/OutilsGratuits";
import { LesBases } from "@/components/home/LesBases";
import { Accompagnement } from "@/components/home/Accompagnement";
import { Boutique } from "@/components/home/Boutique";
import { Confiance } from "@/components/home/Confiance";
import { CtaFinal } from "@/components/home/CtaFinal";

// Home V2 (UI-3), conforme à docs/refonte-site-public/home/00-HOME-ARCHITECTURE.md
// §5 : Header (global, SiteChrome) → Hero → Trois univers → Parcours →
// Outils gratuits → Les bases → Accompagnement → Boutique → Confiance
// (conditionnelle) → CTA final → Footer (global). Aucune section
// supprimée, aucune fusionnée. Catalogue et témoignages lus en base à
// chaque requête (jamais de rendu figé au build), comme /boutique.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Électricité embarquée bateau, van et camping-car",
  description:
    "Diagnostic, conseil et installation en électricité embarquée pour bateaux, vans et camping-cars. Apprenez seul, avancez accompagné ou confiez votre installation à FabSystem.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <main>
      <Hero />
      <TroisUnivers />
      <Parcours />
      <OutilsGratuits />
      <LesBases />
      <Accompagnement />
      <Boutique />
      <Confiance />
      <CtaFinal />
    </main>
  );
}

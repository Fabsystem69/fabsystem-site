import type { Metadata } from "next";
import { PublicHero } from "@/components/public/PublicHero";
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
      <PublicHero
        title={
          <>
            L&apos;électricité embarquée,
            <br />
            sans naviguer à vue.
          </>
        }
        description="Bateau, van ou camping-car : apprenez à faire vous-même, avancez avec Fabien ou confiez votre installation."
        primaryAction={{ href: "#parcours", label: "Comment Fabien peut m'aider" }}
        secondaryAction={{ href: "/outils", label: "Découvrir les outils gratuits", variant: "secondary" }}
        scrollTargetId="apres-hero"
      />
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

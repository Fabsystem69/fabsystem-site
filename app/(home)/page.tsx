import type { Metadata } from "next";
import { HomeUniverseProvider } from "@/components/home/HomeUniverseProvider";
import { PublicHero } from "@/components/public/PublicHero";
import { TroisUnivers } from "@/components/home/TroisUnivers";
import { Parcours } from "@/components/home/Parcours";
import { OutilsGratuits } from "@/components/home/OutilsGratuits";
import { LesBases } from "@/components/home/LesBases";
import { Accompagnement } from "@/components/home/Accompagnement";
import { Confiance } from "@/components/home/Confiance";
import { CtaFinal } from "@/components/home/CtaFinal";

// Home V2 : le sélecteur d'univers reste présent, mais il devient un
// configurateur compact placé juste après le bloc "Comment souhaitez-vous
// avancer ?". Il ne redirige plus immédiatement : il préconfigure les CTA
// de la home via le provider client dédié, tout en laissant la page
// d'accueil en place.
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
        scrollTargetId="parcours"
      />
      <HomeUniverseProvider>
        <Parcours />
        <TroisUnivers />
        <OutilsGratuits />
        <LesBases />
        <Accompagnement />
        <Confiance />
        <CtaFinal />
      </HomeUniverseProvider>
    </main>
  );
}

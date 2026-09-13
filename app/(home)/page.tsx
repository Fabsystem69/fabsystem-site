import type { Metadata } from "next";
import { HomeUniverseProvider } from "@/components/home/HomeUniverseProvider";
import { PublicHero } from "@/components/public/PublicHero";
import { Parcours } from "@/components/home/Parcours";
import { OutilsGratuits } from "@/components/home/OutilsGratuits";
import { LesBases } from "@/components/home/LesBases";
import { Confiance } from "@/components/home/Confiance";
import { Accompagnement } from "@/components/home/Accompagnement";
import { CtaFinal } from "@/components/home/CtaFinal";
import { SchemaEditorSpotlight } from "@/components/home/SchemaEditorSpotlight";
import { MethodeFabSystem } from "@/components/home/MethodeFabSystem";

// Home V2 : le sélecteur d'univers est intégré au bloc parcours. Il ne
// redirige pas : il préconfigure les CTA de la page d'accueil.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Électricité embarquée bateau, van et camping-car",
  description:
    "Méthode, formations, outils, schémas et accompagnement en électricité embarquée pour bateaux, vans et camping-cars.",
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
            avec une méthode claire.
          </>
        }
        description="Bateau, van ou camping-car : commencez par comprendre, dimensionner et dessiner, puis choisissez seulement l'aide dont vous avez besoin."
        primaryAction={{ href: "/commencer-ici", label: "Commencer ici" }}
        secondaryAction={{ href: "/outils", label: "Découvrir les outils gratuits", variant: "secondary" }}
        scrollTargetId="methode"
      />
      <MethodeFabSystem />
      <HomeUniverseProvider>
        <Parcours />
        <SchemaEditorSpotlight />
        <OutilsGratuits />
        <LesBases />
        <Accompagnement />
        <Confiance />
        <CtaFinal />
      </HomeUniverseProvider>
    </main>
  );
}

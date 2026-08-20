import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import InverterSizeCalculator from "@/components/outils/calculators/InverterSizeCalculator";

export const metadata: Metadata = {
  title: "Dimensionnement onduleur",
  description:
    "Calculez la puissance d'onduleur nécessaire selon vos appareils 230V, avec prise en compte des appels de démarrage, du fusible et de la section de câble DC. Gratuit, sans compte.",
  alternates: { canonical: "/outils/onduleur" },
};

export default function InverterSizePage() {
  return (
    <CalculatorPageShell
      title="Dimensionnement onduleur"
      description="Listez vos appareils 230V pour calculer la puissance d'onduleur nécessaire, avec la pointe de démarrage, le fusible et le câble DC associés."
      intro={
        <>
          <p>
            Un onduleur doit couvrir deux choses différentes : la puissance que vos appareils consomment en continu, et l&apos;appel de courant au démarrage de ceux qui ont un compresseur ou un moteur (un frigo, par exemple, peut demander 2 à 3 fois sa puissance affichée pendant une fraction de seconde). Une bouilloire de 1500W et un frigo de 90W n&apos;ont pas du tout le même comportement au démarrage — c&apos;est pour ça que chaque appareil ci-dessous a sa propre case « Moteur ».
          </p>
          <p>
            Le calcul donne aussi le fusible et la section de câble côté batterie (souvent le circuit le plus exposé de l&apos;installation), et une estimation de combien de temps votre batterie tiendra avec ces appareils branchés.
          </p>
        </>
      }
      relatedTools={[
        { href: "/outils/fusible", label: "Calibrer le fusible DC" },
        { href: "/outils/section-cable", label: "Section de câble" },
        { href: "/outils/soc-batterie", label: "État de charge batterie" },
        { href: "/outils/bilan-consommation", label: "Bilan de consommation" },
      ]}
    >
      <InverterSizeCalculator />
    </CalculatorPageShell>
  );
}

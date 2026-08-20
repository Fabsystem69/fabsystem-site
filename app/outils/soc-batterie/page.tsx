import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import SocBatterieCalculator from "@/components/outils/calculators/SocBatterieCalculator";

export const metadata: Metadata = {
  title: "État de charge batterie (SoC)",
  description:
    "Calculateur d'état de charge batterie AGM, Gel et Lithium LiFePO₄ à partir de la tension mesurée (12/24/48V), avec recherche inverse SoC → tension. Gratuit, sans compte.",
  alternates: { canonical: "/outils/soc-batterie" },
};

export default function SocBatteriePage() {
  return (
    <CalculatorPageShell
      title="État de charge batterie"
      description="Estimez le pourcentage de charge de votre batterie AGM, Gel ou Lithium LiFePO₄ à partir de la tension mesurée au repos."
      intro={
        <p>
          La tension à vide d&apos;une batterie ne reflète son état de charge réel qu&apos;au repos, sans charge ni consommation depuis au moins 30 minutes — mesurez juste après avoir roulé ou débranché un chargeur et le résultat sera faussé. Le lithium LiFePO₄ a en plus une courbe très plate : une petite erreur de mesure change beaucoup le pourcentage estimé.
        </p>
      }
      relatedTools={[
        { href: "/outils/bilan-consommation", label: "Calculer l'autonomie batterie" },
        { href: "/outils/batterie", label: "Dimensionner ma banque de batteries" },
        { href: "/outils/charge-secteur", label: "Estimer le temps de charge secteur" },
      ]}
    >
      <SocBatterieCalculator />
    </CalculatorPageShell>
  );
}

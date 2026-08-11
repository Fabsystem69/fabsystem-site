import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import AutonomieBatterieCalculator from "@/components/outils/calculators/AutonomieBatterieCalculator";

export const metadata: Metadata = {
  title: "Autonomie batterie",
  description:
    "Estimez combien de temps votre installation tient sur batterie selon votre consommation et votre production solaire. Gratuit, sans compte.",
  alternates: { canonical: "/outils/autonomie-batterie" },
};

export default function AutonomieBatteriePage() {
  return (
    <CalculatorPageShell
      title="Autonomie batterie"
      description="Estimez combien de temps votre installation tient sur batterie selon votre consommation, avec ou sans solaire."
      relatedTools={[
        { href: "/outils/bilan-consommation", label: "Faire ou refaire mon bilan de consommation" },
        { href: "/outils/mppt", label: "Dimensionner mon régulateur MPPT" },
      ]}
    >
      <AutonomieBatterieCalculator />
    </CalculatorPageShell>
  );
}

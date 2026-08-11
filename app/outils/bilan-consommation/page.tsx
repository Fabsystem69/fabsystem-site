import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import BilanConsommationCalculator from "@/components/outils/calculators/BilanConsommationCalculator";

export const metadata: Metadata = {
  title: "Bilan de consommation",
  description:
    "Listez vos appareils pour calculer votre consommation journalière et la capacité batterie recommandée. Gratuit, sans compte.",
  alternates: { canonical: "/outils/bilan-consommation" },
};

export default function BilanConsommationPage() {
  return (
    <CalculatorPageShell
      title="Bilan de consommation"
      description="Listez vos appareils pour calculer la consommation journalière et la capacité batterie recommandée."
      relatedTool={{ href: "/outils/autonomie-batterie", label: "Dimensionner mon autonomie batterie" }}
    >
      <BilanConsommationCalculator />
    </CalculatorPageShell>
  );
}

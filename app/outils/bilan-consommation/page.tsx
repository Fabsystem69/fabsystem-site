import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import BilanConsommationCalculator from "@/components/outils/calculators/BilanConsommationCalculator";

export const metadata: Metadata = {
  title: "Bilan de consommation",
  description:
    "Listez vos appareils, votre banque de batteries et vos sources de charge (solaire, DC-DC, secteur) pour calculer votre consommation journalière et votre autonomie. Gratuit, sans compte.",
  alternates: { canonical: "/outils/bilan-consommation" },
};

export default function BilanConsommationPage() {
  return (
    <CalculatorPageShell
      title="Bilan de consommation"
      description="Listez vos appareils, votre banque de batteries et vos sources de charge pour obtenir votre consommation journalière et votre autonomie réelle."
      intro={
        <>
          <p>
            Avant de dimensionner un solaire, un onduleur ou un chargeur, il faut savoir ce que vous consommez vraiment sur une journée. Listez vos appareils avec leur puissance et leur temps d&apos;usage quotidien : le total vous donne votre besoin en Wh/j, la base de tout le reste.
          </p>
          <p>
            Renseignez ensuite votre banque de batteries (chimie, tension, capacité) et activez vos sources de recharge (solaire, DC-DC/alternateur, secteur) pour voir en direct combien de jours d&apos;autonomie vous avez, avec ou sans recharge.
          </p>
        </>
      }
      relatedTools={[
        { href: "/outils/batterie", label: "Dimensionner ma banque de batteries" },
        { href: "/outils/soc-batterie", label: "État de charge batterie" },
        { href: "/outils/mppt", label: "Dimensionner mon régulateur MPPT" },
      ]}
    >
      <BilanConsommationCalculator />
    </CalculatorPageShell>
  );
}

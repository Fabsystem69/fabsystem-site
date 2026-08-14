import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import ChargeSecteurCalculator from "@/components/outils/calculators/ChargeSecteurCalculator";

export const metadata: Metadata = {
  title: "Chargeur secteur 230V",
  description:
    "Dimensionnez votre chargeur secteur 230V pour batterie AGM, Gel ou Lithium et vérifiez la compatibilité avec la borne (camping, port). Gratuit, sans compte.",
  alternates: { canonical: "/outils/charge-secteur" },
};

export default function ChargeSecteurPage() {
  return (
    <CalculatorPageShell
      title="Chargeur secteur"
      description="Dimensionnez le courant de charge et la puissance de votre chargeur secteur 230V, et vérifiez qu'il est compatible avec la borne de camping ou de port disponible."
      relatedTools={[{ href: "/outils/soc-batterie", label: "Estimer l'état de charge batterie" }]}
    >
      <ChargeSecteurCalculator />
    </CalculatorPageShell>
  );
}

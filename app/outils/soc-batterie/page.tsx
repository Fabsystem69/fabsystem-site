import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import SocBatterieCalculator from "@/components/outils/calculators/SocBatterieCalculator";

export const metadata: Metadata = {
  title: "État de charge batterie (SoC)",
  description:
    "Calculateur d'état de charge batterie AGM, Gel et Lithium LiFePO₄ à partir de la tension mesurée. Gratuit, sans compte.",
  alternates: { canonical: "/outils/soc-batterie" },
};

export default function SocBatteriePage() {
  return (
    <CalculatorPageShell
      title="État de charge batterie"
      description="Estimez le pourcentage de charge de votre batterie AGM, Gel ou Lithium LiFePO₄ à partir de la tension mesurée au repos."
      relatedTools={[{ href: "/outils/autonomie-batterie", label: "Calculer l'autonomie batterie" }]}
    >
      <SocBatterieCalculator />
    </CalculatorPageShell>
  );
}

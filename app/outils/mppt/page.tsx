import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import MpptCalculator from "@/components/outils/calculators/MpptCalculator";

export const metadata: Metadata = {
  title: "Dimensionnement régulateur MPPT",
  description:
    "Calculez la puissance MPPT nécessaire selon vos panneaux solaires et votre batterie. Gratuit, sans compte.",
  alternates: { canonical: "/outils/mppt" },
};

export default function MpptPage() {
  return (
    <CalculatorPageShell
      title="Régulateur MPPT"
      description="Calculez la puissance MPPT nécessaire selon vos panneaux solaires et votre batterie."
      relatedTools={[
        { href: "/outils/section-cable", label: "Vérifier une section de câble" },
        { href: "/outils/bilan-consommation", label: "Vérifier mon autonomie batterie" },
      ]}
    >
      <MpptCalculator />
    </CalculatorPageShell>
  );
}

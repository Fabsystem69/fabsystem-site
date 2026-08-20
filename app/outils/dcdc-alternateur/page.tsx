import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import DcdcChargerSizeCalculator from "@/components/outils/calculators/DcdcChargerSizeCalculator";

export const metadata: Metadata = {
  title: "Chargeur DC-DC / alternateur",
  description:
    "Dimensionnez votre chargeur DC-DC (batterie à batterie) selon votre alternateur et votre banc de batteries, et estimez la recharge par trajet. Gratuit, sans compte.",
  alternates: { canonical: "/outils/dcdc-alternateur" },
};

export default function DcdcChargerSizePage() {
  return (
    <CalculatorPageShell
      title="Chargeur DC-DC / alternateur"
      description="Dimensionnez le chargeur DC-DC adapté à votre alternateur et à votre batterie servitude, et estimez la recharge obtenue par trajet."
      relatedTools={[{ href: "/outils/autonomie-batterie", label: "Estimer l'autonomie batterie" }]}
    >
      <DcdcChargerSizeCalculator />
    </CalculatorPageShell>
  );
}

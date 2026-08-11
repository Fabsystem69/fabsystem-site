import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import AwgCalculator from "@/components/outils/calculators/AwgCalculator";

export const metadata: Metadata = {
  title: "AWG ↔ mm²",
  description:
    "Convertisseur AWG/mm² et sections recommandées par équipement bateau (guindeau, frigo, pilote…). Gratuit, sans compte.",
  alternates: { canonical: "/outils/awg" },
};

export default function AwgPage() {
  return (
    <CalculatorPageShell
      title="AWG ↔ mm²"
      description="Convertisseur AWG/mm² et sections recommandées par équipement bateau (guindeau, frigo, pilote…)."
      relatedTools={[{ href: "/outils/section-cable", label: "Dimensionner une section de câble" }]}
    >
      <AwgCalculator />
    </CalculatorPageShell>
  );
}

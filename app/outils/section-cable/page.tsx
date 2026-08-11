import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import SectionCableCalculator from "@/components/outils/calculators/SectionCableCalculator";

export const metadata: Metadata = {
  title: "Calculateur de section de câble",
  description:
    "Dimensionnez vos câbles 12V/24V selon l'intensité, la longueur et la chute de tension admissible. Gratuit, sans compte.",
  alternates: { canonical: "/outils/section-cable" },
};

export default function SectionCablePage() {
  return (
    <CalculatorPageShell
      title="Section de câble"
      description="Dimensionnez vos câbles 12V/24V selon l'intensité, la longueur et la chute de tension admissible."
      relatedTools={[{ href: "/outils/awg", label: "Convertir en AWG" }]}
    >
      <SectionCableCalculator />
    </CalculatorPageShell>
  );
}

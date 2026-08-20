import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import InverterSizeCalculator from "@/components/outils/calculators/InverterSizeCalculator";

export const metadata: Metadata = {
  title: "Dimensionnement onduleur",
  description:
    "Calculez la puissance d'onduleur nécessaire selon vos appareils 230V, avec prise en compte des appels de démarrage, du fusible et de la section de câble DC. Gratuit, sans compte.",
  alternates: { canonical: "/outils/onduleur" },
};

export default function InverterSizePage() {
  return (
    <CalculatorPageShell
      title="Dimensionnement onduleur"
      description="Listez vos appareils 230V pour calculer la puissance d'onduleur nécessaire, avec la pointe de démarrage, le fusible et le câble DC associés."
      relatedTools={[{ href: "/outils/fusible", label: "Calibrer le fusible DC" }]}
    >
      <InverterSizeCalculator />
    </CalculatorPageShell>
  );
}

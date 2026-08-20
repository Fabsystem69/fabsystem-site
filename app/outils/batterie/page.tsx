import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import BatteryBankCalculator from "@/components/outils/calculators/BatteryBankCalculator";

export const metadata: Metadata = {
  title: "Banque de batteries",
  description:
    "Dimensionnez votre banque de batteries : nombre d'unités, câblage série/parallèle, câbles inter-batteries et fusible principal. Gratuit, sans compte.",
  alternates: { canonical: "/outils/batterie" },
};

export default function BatteryBankPage() {
  return (
    <CalculatorPageShell
      title="Banque de batteries"
      description="Choisissez votre batterie et le nombre d'unités pour obtenir la configuration de câblage série/parallèle, l'énergie disponible et les protections nécessaires."
      intro={
        <>
          <p>
            Câbler des batteries en série augmente la tension, en parallèle augmente la capacité (Ah) — les deux options n&apos;ont pas le même comportement, et mélanger des batteries différentes (âge, marque, capacité) dans une même banque peut les endommager. Cet outil part du nombre de batteries que vous avez pour vous proposer les configurations de câblage possibles, pas l&apos;inverse.
          </p>
          <p>
            Vous obtenez aussi la section de câble inter-batteries, le fusible principal, et une comparaison rapide entre tout-parallèle et tout-série pour le même nombre d&apos;unités.
          </p>
        </>
      }
      relatedTools={[
        { href: "/outils/soc-batterie", label: "État de charge batterie" },
        { href: "/outils/bilan-consommation", label: "Estimer l'autonomie batterie" },
        { href: "/outils/fusible", label: "Calibrer le fusible DC" },
        { href: "/outils/section-cable", label: "Section de câble" },
      ]}
    >
      <BatteryBankCalculator />
    </CalculatorPageShell>
  );
}

import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import SectionCableCalculator from "@/components/outils/calculators/SectionCableCalculator";

export const metadata: Metadata = {
  title: "Section de câble",
  description:
    "Dimensionnez vos câbles 12/24/48V selon l'ampacité (courant admissible) et la chute de tension, avec dérating (isolant, température, regroupement) et équivalent AWG. Gratuit, sans compte.",
  alternates: { canonical: "/outils/section-cable" },
};

export default function SectionCablePage() {
  return (
    <CalculatorPageShell
      title="Section de câble"
      description="Dimensionnez vos câbles selon l'ampacité et la chute de tension, avec l'équivalent AWG et une table de référence marine."
      intro={
        <>
          <p>
            Un câble trop fin pour son courant chauffe et peut prendre feu — c&apos;est l&apos;ampacité (le courant maximal qu&apos;il supporte sans surchauffer) qui protège de ça, pas seulement la chute de tension. Ce calculateur vérifie les deux et retient toujours la section la plus grande des deux exigences.
          </p>
          <p>
            La température ambiante, le regroupement avec d&apos;autres câbles et le type d&apos;isolant réduisent la capacité réelle du câble — réglez-les pour un résultat fidèle à votre installation.
          </p>
        </>
      }
      relatedTools={[
        { href: "/outils/fusible", label: "Calibrer le fusible" },
        { href: "/outils/onduleur", label: "Dimensionner mon onduleur" },
        { href: "/outils/batterie", label: "Dimensionner ma banque de batteries" },
      ]}
    >
      <SectionCableCalculator />
    </CalculatorPageShell>
  );
}

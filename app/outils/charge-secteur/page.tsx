import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import ChargeSecteurCalculator from "@/components/outils/calculators/ChargeSecteurCalculator";

export const metadata: Metadata = {
  title: "Chargeur secteur 230V",
  description:
    "Estimez le temps de charge de votre banque de batteries depuis une borne secteur 230V (camping, port), dimensionnez le chargeur et vérifiez sa compatibilité avec la borne disponible. Gratuit, sans compte.",
  alternates: { canonical: "/outils/charge-secteur" },
};

export default function ChargeSecteurPage() {
  return (
    <CalculatorPageShell
      title="Chargeur secteur"
      description="Estimez le temps de charge de votre banque de batteries depuis une borne secteur, et vérifiez la compatibilité du chargeur avec la borne disponible."
      intro={
        <p>
          Un chargeur ne débite pas son courant nominal jusqu&apos;à 100% : il charge à courant constant (phase bulk) jusqu&apos;à un certain seuil, puis le courant diminue progressivement en approchant la pleine charge (phase absorption) — le temps total dépend de votre état de charge de départ, pas seulement de la capacité de la batterie.
        </p>
      }
      relatedTools={[
        { href: "/outils/soc-batterie", label: "Estimer l'état de charge batterie" },
        { href: "/outils/batterie", label: "Dimensionner ma banque de batteries" },
        { href: "/outils/bilan-consommation", label: "Bilan de consommation" },
      ]}
    >
      <ChargeSecteurCalculator />
    </CalculatorPageShell>
  );
}

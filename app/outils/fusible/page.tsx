import type { Metadata } from "next";
import { CalculatorPageShell } from "@/components/outils/CalculatorPageShell";
import FuseSizeCalculator from "@/components/outils/calculators/FuseSizeCalculator";

export const metadata: Metadata = {
  title: "Calibre de fusible",
  description:
    "Déterminez le calibre et le format (Lame, MIDI, MEGA, ANL, Classe T) du fusible adapté à votre circuit 12V/24V/48V. Gratuit, sans compte.",
  alternates: { canonical: "/outils/fusible" },
};

export default function FuseSizePage() {
  return (
    <CalculatorPageShell
      title="Calibre de fusible"
      description="Déterminez le calibre et le format de fusible adapté à votre circuit, à partir du courant réel ou de la puissance de l'appareil."
      relatedTools={[{ href: "/outils/section-cable", label: "Vérifier la section de câble" }]}
    >
      <FuseSizeCalculator />
    </CalculatorPageShell>
  );
}

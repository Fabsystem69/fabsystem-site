import type { Metadata } from "next";
import { PublicHero } from "@/components/public/PublicHero";
import { Modules } from "@/components/lesbases/Modules";
import { QuizSection } from "@/components/lesbases/QuizSection";
import { BonsGestes } from "@/components/lesbases/BonsGestes";
import { Indispensables } from "@/components/lesbases/Indispensables";
import { PasserelleBoutique } from "@/components/lesbases/PasserelleBoutique";
import { PasserelleServices } from "@/components/lesbases/PasserelleServices";
import { Section } from "@/components/layout/Section";

// Les Bases V2 — Hub public (docs/refonte-site-public/les-bases/
// 00-ARCHITECTURE.md §3). Ordre imposé : Hero → Modules → Quiz → Bons
// gestes/Indispensables → Aller plus loin (Boutique) → passerelle Services
// discrète → Footer global. La Passerelle Boutique lit le catalogue réel
// (mêmes fonctions que /boutique) pour un prix toujours dynamique — voir
// components/lesbases/PasserelleBoutique.tsx.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Les bases",
  description:
    "Les fondamentaux de l'électricité embarquée, expliqués simplement et gratuitement : modules, quiz, bons gestes et indispensables.",
  alternates: {
    canonical: "/formations",
  },
};

export default function FormationsPage() {
  return (
    <main className="bg-white text-neutral-900">
      <PublicHero
        eyebrow="Les bases"
        title="Comprendre avant de se lancer."
        description="Les fondamentaux de l'électricité embarquée, expliqués simplement et gratuitement."
        primaryAction={{ href: "#modules", label: "Commencer par les modules" }}
        scrollTargetId="modules"
      />
      <Modules />
      <QuizSection />

      <Section id="bons-gestes" tone="muted" className="scroll-mt-16">
        <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
          <BonsGestes />
          <Indispensables />
        </div>
      </Section>

      <PasserelleBoutique />
      <PasserelleServices />
    </main>
  );
}

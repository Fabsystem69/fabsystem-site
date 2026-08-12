import Image from "next/image";
import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import ServiceAssurance from "@/components/ServiceAssurance";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "FabSystem : diagnostic et sécurisation d’installations électriques embarquées (bateau, van, camping-car).",
  alternates: {
    canonical: "/a-propos",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AProposPage() {
  return (
    <main className="bg-white">
      <PageIntro
        title="FabSystem, spécialiste en électricité embarquée"
        description="Fabien accompagne les propriétaires et les professionnels qui recherchent une installation électrique embarquée plus lisible, plus sûre et plus durable."
      />
      <div className="mx-auto max-w-6xl px-6 pt-4">
        <ServiceAssurance />
      </div>

      <section id="apres-hero" className="mx-auto max-w-6xl px-6 py-4 sm:py-5">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
            <div className="mx-auto w-full max-w-xs overflow-hidden rounded-2xl border border-neutral-200">
              <Image
                src="/fab-bateau.png"
                alt="Fabien Lages"
                width={1200}
                height={720}
                className="h-auto w-full object-cover"
                priority
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
                Expertise
              </h2>
              <p className="text-sm leading-relaxed text-neutral-700">
                Fabien Lages intervient sur des systèmes électriques embarqués
                qui exigent à la fois compréhension globale, précision
                technique et capacité d&apos;adaptation au réel.
                L&apos;activité s&apos;articule autour du diagnostic
                électrique, de l&apos;installation, de l&apos;optimisation et
                de la formation technique.
              </p>
              <p className="text-sm leading-relaxed text-neutral-700">
                La méthode repose sur la rigueur, la sécurité et la
                conformité. Chaque intervention vise à clarifier
                l&apos;architecture, fiabiliser les protections, améliorer
                l&apos;usage et conserver une vision long terme : une
                installation doit rester lisible, documentée, évolutive et
                adaptée à l&apos;usage réel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Positionnement + Conclusion fusionnés en une seule section sans
          traitement "carte" répété (UI-9A : trois cartes blanches
          empilées de structure identique) — simple bloc de texte sur fond
          neutre, aucune bordure supplémentaire. */}
      <section className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <div className="max-w-3xl space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
            Positionnement
          </h2>
          <p className="text-sm leading-relaxed text-neutral-700">
            FabSystem s&apos;adresse à celles et ceux qui attendent un regard
            structuré, une expertise technique solide et une exécution
            sérieuse. L&apos;intervention peut concerner une remise à
            niveau, une sécurisation, une refonte partielle ou un
            accompagnement plus global sur des installations sensibles.
          </p>
          <p className="text-sm leading-relaxed text-neutral-700">
            Le positionnement est volontairement clair : apporter des
            réponses fiables, défendables techniquement et adaptées aux
            contraintes du terrain, sans approximation ni sur-promesse.
            FabSystem s&apos;engage à construire des installations embarquées
            sûres, cohérentes et durables, avec une exigence professionnelle
            constante.
          </p>
        </div>
      </section>
    </main>
  );
}

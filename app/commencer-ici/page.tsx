import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/public/PageIntro";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Méthode FabSystem : commencer en électricité embarquée",
  description:
    "La méthode FabSystem pour apprendre, dimensionner, schématiser et fiabiliser une installation électrique embarquée de bateau, van ou camping-car.",
  alternates: {
    canonical: "/commencer-ici",
  },
  openGraph: {
    title: "Méthode FabSystem : commencer en électricité embarquée",
    description:
      "Un parcours clair pour comprendre, calculer, dessiner puis vérifier votre installation électrique embarquée.",
    url: "https://www.fabsystem.fr/commencer-ici",
    type: "website",
  },
};

const methodSteps = [
  {
    number: "01",
    title: "Comprendre le système",
    text: "Avant les achats, clarifiez les blocs : production, stockage, recharge, distribution, protections et usages réels.",
    links: [
      { href: "/formations", label: "Les bases" },
      { href: "/formations/lire-schema", label: "Lire un schéma" },
    ],
  },
  {
    number: "02",
    title: "Dimensionner sans deviner",
    text: "Transformez votre besoin en ordres de grandeur : consommation, autonomie, sections, fusibles, solaire, recharge secteur ou alternateur.",
    links: [
      { href: "/outils/bilan-consommation", label: "Bilan conso" },
      { href: "/outils/section-cable", label: "Section de câble" },
      { href: "/outils/fusible", label: "Fusible" },
    ],
  },
  {
    number: "03",
    title: "Dessiner une architecture lisible",
    text: "Un schéma sert d'abord à révéler les oublis, les incohérences et les points à vérifier avant de tirer le premier câble.",
    links: [
      { href: "/schemas-electriques", label: "Exemples de schémas" },
      { href: "/outils/schema", label: "Éditeur FabSystem" },
    ],
  },
  {
    number: "04",
    title: "Fiabiliser avant de réaliser",
    text: "Vérifiez les protections, les longueurs, les contraintes terrain et les limites de vos choix. Quand le doute devient coûteux, faites relire.",
    links: [
      { href: "/boutique", label: "Guides pratiques" },
      { href: "/prestations/accompagnement", label: "Accompagnement" },
    ],
  },
] as const;

const entryPoints = [
  {
    title: "Je débute",
    text: "Commencez par les bases, puis faites un premier bilan de consommation avant de regarder les exemples de schémas.",
    href: "/formations",
    label: "Commencer par les bases",
  },
  {
    title: "J'ai déjà une idée de matériel",
    text: "Passez par les calculateurs, puis ouvrez un exemple proche pour repérer les points à adapter.",
    href: "/outils",
    label: "Utiliser les outils",
  },
  {
    title: "Mon projet est déjà engagé",
    text: "Regroupez les informations, dessinez l'existant ou le prévu, puis demandez une relecture si une décision bloque.",
    href: "/outils/schema",
    label: "Dessiner mon schéma",
  },
] as const;

const ecosystemLinks = [
  {
    href: "/formations",
    title: "Formations gratuites",
    text: "Les bases, la lecture de schéma, les batteries, la distribution et les gestes de contrôle.",
  },
  {
    href: "/outils",
    title: "Outils et calculateurs",
    text: "Des calculateurs simples pour passer du flou à des valeurs vérifiables.",
  },
  {
    href: "/schemas-electriques",
    title: "Schémas commentés",
    text: "Des architectures concrètes à comparer avant de construire la vôtre.",
  },
  {
    href: "/outils/schema",
    title: "Éditeur de schéma",
    text: "Un outil de travail pour poser, adapter et conserver votre architecture.",
  },
  {
    href: "/boutique",
    title: "Guides pratiques",
    text: "Des méthodes plus complètes quand vous voulez avancer hors ligne ou dans l'ordre du chantier.",
  },
  {
    href: "/prestations",
    title: "Accompagnement",
    text: "Une aide ciblée quand votre cas réel sort des exemples ou engage des choix importants.",
  },
] as const;

export default function CommencerIciPage() {
  return (
    <main className="bg-white text-neutral-900">
      <PageIntro
        eyebrow="Méthode FabSystem"
        title="Commencer ici : comprendre, calculer, dessiner, vérifier."
        description="FabSystem aide les particuliers à rendre leur électricité embarquée plus lisible. Le site est construit comme une méthode progressive, pas comme un catalogue à parcourir au hasard."
      />

      <Section tone="light" className="pb-8 pt-6 sm:pb-10">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Badge tone="info">Bateau</Badge>
              <Badge tone="info">Van</Badge>
              <Badge tone="info">Camping-car</Badge>
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Une installation fiable commence rarement par une liste d&apos;achats.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
              Elle commence par une question plus utile : que doit faire le système, dans quelles
              limites, avec quelles sources de charge, et quels risques faut-il éliminer avant le
              montage ? La méthode FabSystem remet ces décisions dans l&apos;ordre.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button href="#parcours" variant="primary">
                Voir la méthode
              </Button>
              <Button href="/outils/bilan-consommation" variant="secondary">
                Faire un premier bilan
              </Button>
            </div>
          </div>

          <aside className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Règle simple
            </p>
            <p className="mt-3 text-lg font-bold leading-snug text-neutral-950">
              On ne vend pas une solution avant d&apos;avoir compris le problème.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              C&apos;est pour cela que les contenus gratuits, les calculateurs et les exemples occupent
              une place centrale. Les guides et l&apos;accompagnement viennent ensuite, lorsque vous avez
              besoin d&apos;un cadre plus complet ou d&apos;une relecture de votre cas réel.
            </p>
          </aside>
        </div>
      </Section>

      <Section id="parcours" tone="muted" className="scroll-mt-24 py-8 sm:py-10">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Le parcours
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
            Quatre étapes pour avancer proprement
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">
            Vous pouvez rester sur les ressources gratuites à chaque étape. Les offres payantes ne
            sont là que pour gagner du temps, structurer la réalisation ou sécuriser une décision.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {methodSteps.map((step) => (
            <article key={step.number} className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-brand-600">{step.number}</p>
              <h3 className="mt-2 text-lg font-bold tracking-tight text-neutral-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.text}</p>
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
                {step.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-semibold text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900"
                  >
                    {link.label} →
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="light" className="py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Votre point d&apos;entrée
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
              Choisissez selon votre maturité, pas selon une offre.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Un projet peut démarrer par une formation, un calcul, un schéma ou une demande d&apos;aide.
              Le bon départ est celui qui réduit l&apos;incertitude maintenant.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {entryPoints.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-5 transition-colors hover:border-neutral-300 hover:bg-white"
              >
                <h3 className="text-base font-bold text-neutral-950">{entry.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{entry.text}</p>
                <p className="mt-4 text-sm font-semibold text-neutral-900">{entry.label} →</p>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="muted" className="py-8 sm:py-10">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Écosystème utile
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
            Les ressources se répondent entre elles
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">
            FabSystem vise à devenir une bibliothèque de terrain pour l&apos;électricité embarquée
            francophone : chaque page doit aider à mieux comprendre la suivante.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ecosystemLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm transition-colors hover:border-neutral-300"
            >
              <h3 className="text-base font-bold text-neutral-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.text}</p>
            </Link>
          ))}
        </div>
      </Section>
    </main>
  );
}

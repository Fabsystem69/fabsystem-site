import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { VoltaGuide } from "@/components/volta/VoltaGuide";

// Les Bases V2 — Modules (docs/refonte-site-public/les-bases/01-HERO-MODULES.md
// §2-6). Les modules et leurs données (titre, résumé, durée) sont ceux
// réellement publiés sous app/formations/<slug>/page.tsx — repris tels
// quels, aucune durée inventée pour cette refonte. Aucune progression
// affichée : le projet n'a aujourd'hui aucune persistance réelle de
// progression par module (vérifié : aucun localStorage/cookie/DB dans
// ModuleStepper), donc chaque carte reste à l'état standard conformément à
// 01-HERO-MODULES.md §2 ("Ne jamais simuler une progression").
//
// Desktop : 6 cartes en grille 3 × 2. Mobile : empilement vertical simple
// plutôt que le carrousel manuel décrit en §5 — ce dernier n'est
// qu'autorisé ("peuvent être présentés"), pas imposé ; un empilement reste
// pleinement lisible, accessible sans JS et cohérent avec la contrainte de
// performance de cette mission ("pas de JS client pour de simples contenus
// éditoriaux") — voir Arbitrages du rapport.
const MODULES = [
  {
    order: 1,
    title: "Les bases du 12V embarqué",
    description:
      "Loi d'Ohm, puissance, résistance des câbles. Tout ce qu'il faut savoir pour dimensionner correctement son installation.",
    duration: "~30 min",
    href: "/formations/bases-12v",
  },
  {
    order: 2,
    title: "Lire un schéma électrique",
    description:
      "Décoder un schéma de distribution, identifier les fusibles, les barres omnibus et les points de masse.",
    duration: "~20 min",
    href: "/formations/lire-schema",
  },
  {
    order: 3,
    title: "Les batteries : AGM, GEL, Lithium",
    description:
      "Série, parallèle, différences de technologie et câblage correct d'un banc de batteries.",
    duration: "~25 min",
    href: "/formations/types-batteries",
  },
  {
    order: 4,
    title: "Construire une distribution 12V propre",
    description:
      "Ordre logique des composants, fusible principal, sectionneur, shunt, busbars et départs par circuit.",
    duration: "~25 min",
    href: "/formations/distribution-12v",
  },
  {
    order: 5,
    title: "Bien recharger ses batteries",
    description:
      "Comprendre les sources de charge, les phases de recharge et les différences entre AGM, GEL et lithium.",
    duration: "~25 min",
    href: "/formations/recharger-batteries",
  },
  {
    order: 6,
    title: "Utiliser un multimètre sans se tromper",
    description:
      "Mesurer une tension, tester une continuité et diagnostiquer une panne simple sans prendre de risque inutile.",
    duration: "~20 min",
    href: "/formations/multimetre",
  },
] as const;

const GUIDES = [
  {
    href: "/installation-electrique-van",
    badge: "Guide pratique",
    meta: "Van & Fourgon aménagés",
    imageSrc: "/articles/installation-electrique-van-guide.webp",
    imageAlt: "Illustration de planification d'une installation electrique de van",
    title: "Bien dimensionner une installation van avant d'acheter",
    description:
      "Un article de synthèse pour remettre les priorités dans le bon ordre : besoins réels, batterie, recharge, convertisseur 230V, câbles et protections.",
    highlights: [
      "Éviter de surdimensionner ou sous-dimensionner dès le départ",
      "Relier les modules de base à un vrai projet de van",
      "Revenir ensuite aux outils et aux schémas avec une logique claire",
    ],
  },
  {
    href: "/installation-van-batterie-tout-en-un-aferiy-p280",
    badge: "Cas concret",
    meta: "AFERIY P280",
    imageSrc: "/articles/aferiy-p280-architecture-van.webp",
    imageAlt: "Illustration d'un van amenage autour d'une AFERIY P280",
    title: "Monter un van simple autour d'une batterie tout-en-un",
    description:
      "Un cas d'usage concret autour de l'AFERIY P280 : double XT90, sortie XT60 12V, panneau 200W et deux prises AC à traiter avec sérieux.",
    highlights: [
      "Voir comment structurer le 12V fixe à partir d'une sortie XT60",
      "Comprendre où une station tout-en-un simplifie vraiment le projet",
      "Garder une vraie prudence sur les prises 230V fixes dans le van",
    ],
  },
  {
    href: "/installation-electrique-van-victron-legere",
    badge: "Cas concret",
    meta: "Victron leger",
    imageSrc: "/articles/installation-electrique-van-victron-legere.jpg",
    imageAlt: "Illustration d'une architecture Victron legere pour van",
    title: "Construire un van propre autour d'une batterie classique",
    description:
      "Une base autour d'une LiFePO4 150Ah, d'un SmartSolar 75/15, d'un MultiPlus 12/800, d'un SmartShunt et d'un Orion 18A optionnel.",
    highlights: [
      "Garder le 12V comme base de vie a bord et le 230V pour les petits chargeurs",
      "Voir comment structurer une architecture Victron lisible sans surdimensionnement",
      "Repartir ensuite du schema et du projet cloud pour adapter le montage a votre van",
    ],
  },
] as const;

export function Modules() {
  return (
    <Section id="modules" tone="light" className="scroll-mt-24">
      <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
        Commencez par les fondamentaux
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
        Des modules courts et clairs pour comprendre l&apos;essentiel, étape par étape.
      </p>

      <VoltaGuide variant="tip" pose="neutre" className="mt-6 max-w-2xl">
        Suivez les 6 modules dans l&apos;ordre : chacun s&apos;appuie sur le précédent, des bases du
        12 V jusqu&apos;aux mesures de diagnostic.
      </VoltaGuide>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((module) => (
          <article
            key={module.href}
            className="flex flex-col rounded-card border border-t-4 border-neutral-200 border-t-brand-400 bg-white p-5 shadow-card"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                {module.order}
              </span>
              <Badge tone="success">Gratuit</Badge>
            </div>

            <h3 className="mt-3 text-base font-semibold text-neutral-950">{module.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-700">
              {module.description}
            </p>

            <p className="mt-4 text-xs font-medium text-neutral-500">{module.duration}</p>

            <div className="mt-3">
              <Button href={module.href} variant="secondary" className="w-full">
                Accéder au module →
              </Button>
            </div>
          </article>
        ))}
      </div>

      <article className="mt-8 rounded-[28px] border border-neutral-200 bg-neutral-950 p-5 text-white sm:p-6">
        <div className="max-w-3xl">
          <div className="flex flex-wrap gap-2">
            <Badge tone="info">Articles & cas concrets</Badge>
            <Badge tone="neutral">À lire après les 6 modules</Badge>
          </div>
          <h3 className="mt-3 text-xl font-bold tracking-tight text-white">
            Trois lectures pour passer des bases a un vrai projet
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-white/72 sm:text-base">
            Une fois les fondamentaux compris, ces trois lectures vous aident à passer d&apos;une notion
            théorique à une vraie logique de projet.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {GUIDES.map((guide) => (
            <article
              key={guide.href}
              className="overflow-hidden rounded-[24px] border border-white/10 bg-white text-neutral-900 shadow-[0_18px_42px_rgba(0,0,0,0.16)]"
            >
              <Link href={guide.href} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                  <Image
                    src={guide.imageSrc}
                    alt={guide.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-brand-400 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-950">
                        {guide.badge}
                      </span>
                      <span className="rounded-full bg-white/14 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                        {guide.meta}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="p-5">
                <h4 className="text-lg font-bold tracking-tight text-neutral-950">{guide.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">{guide.description}</p>

                <ul className="mt-4 space-y-2">
                  {guide.highlights.slice(0, 2).map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-relaxed text-neutral-700">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  <Button href={guide.href} variant="secondary" className="w-full">
                    Lire l&apos;article →
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </article>
    </Section>
  );
}

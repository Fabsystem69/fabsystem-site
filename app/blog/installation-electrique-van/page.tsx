import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VoltaGuide } from "@/components/volta/VoltaGuide";

export const metadata: Metadata = {
  // Titre raccourci (audit : 104 caracteres avec le suffixe " | FabSystem",
  // tronque dans les resultats Google) tout en gardant l'intention de
  // recherche "installation electrique van".
  title: "Installation électrique van : le guide complet",
  description:
    "Comment planifier l'installation électrique de votre van : batterie, recharge par alternateur ou solaire, convertisseur 230V, câbles, fusibles et points de vigilance.",
  alternates: {
    canonical: "/installation-electrique-van",
  },
  keywords: [
    "installation électrique van",
    "batterie van",
    "schéma électrique van",
    "convertisseur 230V van",
    "fusible principal van",
    "câblage batterie van",
  ],
  openGraph: {
    title: "Installation électrique de van : bien dimensionner avant d'acheter",
    description:
      "Batterie, recharge, protections, convertisseur 230V et câblage : un guide clair pour préparer une installation cohérente dans un van.",
    url: "https://www.fabsystem.fr/installation-electrique-van",
    type: "article",
    images: [
      {
        url: "/articles/installation-electrique-van-guide.webp",
        width: 1600,
        height: 893,
        alt: "Illustration de planification d'une installation électrique de van",
      },
    ],
  },
};

const outlineItems = [
  { id: "besoins", label: "Besoins réels" },
  { id: "batterie", label: "Batterie & autonomie" },
  { id: "recharge", label: "Sources de recharge" },
  { id: "convertisseur", label: "230V & convertisseur" },
  { id: "securite", label: "Câbles & protections" },
  { id: "conformite", label: "Technique & homologation" },
] as const;

const repereItems = [
  {
    title: "Usage classique 12V",
    text: "Un premier repère fréquent tourne autour de 50 Ah par jour, à confirmer avec votre matériel réel.",
  },
  {
    title: "Usages plus gourmands",
    text: "Avec cuisson, chauffe-eau ou gros appareils en 230V, vous pouvez rapidement dépasser 75 Ah par jour.",
  },
  {
    title: "Autonomie confortable",
    text: "Pour 4 à 5 jours avec des usages classiques, une base LiFePO4 de 200 Ah ou plus est souvent cohérente.",
  },
  {
    title: "Recharge roulage",
    text: "Un chargeur DC-DC de 30 A à 60 A compense déjà une bonne partie d'une conso quotidienne typique.",
  },
] as const;

const besoinItems = [
  "Frigo 12V, éclairage LED, pompe à eau, chauffage stationnaire, prises USB, recharge d'ordinateur.",
  "Appareils en 230V : machine à café, plaque à induction, bouilloire, chauffe-eau électrique.",
  "Temps passé à l'arrêt, fréquence de roulage, accès ou non au secteur et saison d'utilisation.",
] as const;

const rechargeItems = [
  {
    title: "Alternateur via DC-DC",
    text:
      "C'est aujourd'hui la solution la plus propre dans beaucoup de vans récents. Elle encadre mieux la charge qu'un simple coupleur, surtout avec du lithium.",
  },
  {
    title: "Solaire",
    text:
      "Très utile si vous restez souvent à l'arrêt, mais la production réelle dépend de la saison, de l'ombre, de la météo et du fait que le panneau reste à plat sur le toit.",
  },
  {
    title: "Secteur",
    text:
      "Un chargeur 230V reste pratique si vous passez ponctuellement à la maison, en camping ou sur une borne équipée.",
  },
] as const;

const safetyItems = [
  "La section de câble doit être choisie selon l'intensité réelle, la longueur aller-retour et la chute de tension acceptable.",
  "Le fusible protège d'abord le câble. Il doit être placé très tôt, au plus près de la batterie sur la ligne positive principale.",
  "Le suivi de batterie est nettement plus fiable avec un shunt qu'avec une seule estimation Bluetooth.",
] as const;

const faqItems = [
  {
    question: "Combien d'Ah par jour faut-il prévoir dans un van ?",
    answer:
      "Pour un usage 12V classique, un premier repère autour de 50 Ah par jour aide à démarrer la réflexion. Ce chiffre monte vite dès qu'on ajoute du 230V énergivore, de longues périodes à l'arrêt ou davantage d'équipements.",
  },
  {
    question: "Faut-il forcément un chargeur DC-DC pour recharger par l'alternateur ?",
    answer:
      "Dans beaucoup de configurations actuelles, oui, c'est la solution la plus propre et la plus compatible avec les batteries lithium. Le choix exact dépend du véhicule, de l'alternateur et de la batterie installée.",
  },
  {
    question: "Un gros convertisseur suffit-il pour faire du 230V dans un van ?",
    answer:
      "Non. Le convertisseur n'est qu'un maillon. Il faut aussi vérifier le courant côté batterie, le BMS, les sections de câble, les protections et la capacité réelle de recharge.",
  },
] as const;

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Installation électrique de van : comment bien dimensionner batterie, recharge et protections",
  description:
    "Un guide clair pour planifier l'installation électrique d'un van : usages, batterie, recharge, convertisseur 230V, câbles et fusibles.",
  mainEntityOfPage: "https://www.fabsystem.fr/installation-electrique-van",
  datePublished: "2026-08-16",
  dateModified: "2026-08-16",
  author: {
    "@type": "Organization",
    name: "FabSystem",
  },
  publisher: {
    "@type": "Organization",
    name: "FabSystem",
    logo: {
      "@type": "ImageObject",
      url: "https://www.fabsystem.fr/favicon.png",
    },
  },
  about: [
    "Installation électrique de van",
    "Batterie LiFePO4",
    "Recharge DC-DC",
    "Convertisseur 230V",
    "Fusibles et protections",
  ],
  image: ["https://www.fabsystem.fr/articles/installation-electrique-van-guide.webp"],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.fabsystem.fr" },
    { "@type": "ListItem", position: 2, name: "Les bases", item: "https://www.fabsystem.fr/formations" },
    {
      "@type": "ListItem",
      position: 3,
      name: "Installation électrique de van",
      item: "https://www.fabsystem.fr/installation-electrique-van",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function InstallationElectriqueVanPage() {
  return (
    <main className="bg-white text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PageIntro
        eyebrow="Guide Les bases"
        title="Installation électrique de van : comment bien la planifier"
        description="Avant d'acheter une batterie, un panneau solaire ou un convertisseur, commencez par vos usages réels. C'est ce qui permet de dimensionner une installation cohérente, sûre et évolutive."
      />

      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[3fr_2fr]">
          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <Badge tone="info">Guide pratique</Badge>
              <Badge tone="success">Débutant à avancé</Badge>
              <Badge tone="neutral">Van aménagé</Badge>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-700 sm:text-base">
              Le bon ordre est simple : commencez par vos besoins, puis dimensionnez la batterie,
              les sources de recharge, le 230V et enfin les protections. C&apos;est cette logique qui
              évite les achats inutiles et les montages incohérents.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button href="/outils/bilan-consommation" variant="primary">
                Chiffrer mes besoins
              </Button>
              <Button href="/schemas-electriques/schema-vito-280ah-van" variant="secondary">
                Voir un schéma van type
              </Button>
            </div>

            <VoltaGuide variant="tip" pose="confiante" title="Le conseil de Volta" className="mt-5">
              Ne copiez pas une installation vue sur internet sans refaire les calculs pour votre
              propre van. Deux véhicules peuvent se ressembler et pourtant demander des choix très
              différents côté batterie, recharge et protections.
            </VoltaGuide>
          </div>

          <aside className="rounded-[28px] border border-neutral-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Repères de départ
            </p>
            <div className="mt-4 space-y-3">
              {repereItems.map((item) => (
                <div key={item.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-700">{item.text}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-6">
          <figure className="overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-50">
            <Image
              src="/articles/installation-electrique-van-guide.webp"
              alt="Illustration d'une méthode de planification électrique de van : besoins, batterie, recharge, 230V et sécurisation."
              width={1600}
              height={893}
              priority
              sizes="(max-width: 1024px) 100vw, 1200px"
              className="h-auto w-full"
            />
            <figcaption className="flex flex-col gap-3 border-t border-neutral-200 bg-white px-5 py-4 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Une vue d&apos;ensemble pour garder le bon ordre de décision avant d&apos;acheter les composants.
              </span>
              <Link
                href="/schemas-electriques/schema-vito-280ah-van"
                className="font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-700"
              >
                Ouvrir un schéma van de référence →
              </Link>
            </figcaption>
          </figure>
        </div>
      </section>

      <nav aria-label="Sommaire de l'article" className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-2 px-6 py-3">
          {outlineItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm font-semibold text-neutral-600 underline underline-offset-4 decoration-neutral-300 hover:text-neutral-950 hover:decoration-neutral-900"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <article className="mx-auto max-w-4xl px-6 py-10 sm:py-12">
        <section id="besoins" className="scroll-mt-24 border-b border-neutral-200 pb-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              1
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Commencer par vos besoins réels
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Le premier travail n&apos;est pas de choisir une batterie. C&apos;est de lister ce que vous
                allez vraiment utiliser au quotidien. Un van qui alimente un frigo 12V, quelques
                éclairages LED et des prises USB ne se dimensionne pas du tout comme un van qui doit
                aussi faire tourner une plaque à induction, une bouilloire ou un chauffe-eau
                électrique.
              </p>
              <div className="mt-4 space-y-3">
                {besoinItems.map((item) => (
                  <div key={item} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm leading-relaxed text-neutral-700">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  Repère simple
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                  Pour un usage classique en 12V, un ordre de grandeur autour de <strong>50 Ah par
                  jour</strong> est souvent utile pour démarrer. Avec davantage de 230V ou des usages
                  plus réguliers, vous pouvez rapidement monter à <strong>75 Ah par jour ou plus</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="batterie" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              2
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Choisir la batterie selon l&apos;autonomie visée
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                La batterie détermine votre autonomie quand vous ne roulez pas et que le solaire ne
                suffit pas. Si vous visez 4 à 5 jours d&apos;autonomie avec des usages classiques en 12V,
                une <strong>LiFePO4 de 200 Ah ou plus</strong> constitue souvent une base confortable.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-sm font-semibold text-neutral-950">Ce qu&apos;une bonne marge apporte</p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    Plus de confort à l&apos;arrêt, moins de décharges profondes et souvent une meilleure
                    durée de vie de la batterie.
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-sm font-semibold text-neutral-950">Ce qu&apos;il faut vérifier aussi</p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    Le BMS, les intensités admissibles, la recharge disponible et la cohérence du
                    câblage principal.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Dès que vous prévoyez des appareils très gourmands, un simple calcul rapide ne suffit
                plus. Il faut vérifier l&apos;ensemble de la chaîne : batterie, BMS, câbles, protections
                et capacité réelle à recharger ce que vous consommez.
              </p>
            </div>
          </div>
        </section>

        <section id="recharge" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              3
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Prévoir les bonnes sources de recharge
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Une installation fiable repose rarement sur une seule source de recharge. L&apos;idée
                n&apos;est pas d&apos;additionner les gadgets, mais de choisir des sources adaptées à votre
                manière de voyager.
              </p>
              <div className="mt-4 space-y-3">
                {rechargeItems.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-700">{item.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Bon réflexe
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                  Plus vous êtes souvent à l&apos;arrêt, plus le solaire devient utile. Plus vous roulez
                  régulièrement, plus le duo alternateur + DC-DC prend de l&apos;importance.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="convertisseur" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              4
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Dimensionner le 230V avec prudence
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Dès que vous voulez alimenter du 230V dans le van, il faut raisonner en puissance,
                mais aussi en intensité côté batterie. Un appareil de <strong>1 300 W</strong> demande
                déjà un convertisseur correctement dimensionné, avec une marge de sécurité, et fait
                surtout circuler un courant important côté 12V.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-sm font-semibold text-neutral-950">Ce que beaucoup sous-estiment</p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    Le convertisseur n&apos;est pas le sujet principal. Le vrai enjeu, ce sont les
                    intensités côté batterie et la capacité du reste de l&apos;installation à les tenir.
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-sm font-semibold text-neutral-950">À vérifier systématiquement</p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    BMS, câble principal, fusible principal, qualité des connexions et capacité de
                    recharge derrière.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
                En clair : un gros convertisseur ne suffit jamais à lui seul. Toute l&apos;installation
                doit être pensée pour supporter durablement ce niveau de puissance.
              </p>
            </div>
          </div>
        </section>

        <section id="securite" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              5
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Sécuriser l&apos;installation dès le départ
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                C&apos;est le point le plus important. Une installation mal protégée peut provoquer des
                chutes de tension, des dysfonctionnements, un échauffement anormal ou, dans le pire
                des cas, un départ de feu.
              </p>
              <div className="mt-4 space-y-3">
                {safetyItems.map((item) => (
                  <div key={item} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm leading-relaxed text-neutral-700">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Exemple fréquent sur petite ou moyenne installation
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                  Sur une liaison batterie très courte, on voit souvent un <strong>câble principal en
                  25 mm²</strong> avec un <strong>fusible principal autour de 80 à 100 A</strong>. Ce
                  n&apos;est qu&apos;un repère, pas une règle universelle : il faut toujours confirmer selon la
                  longueur réelle, le courant attendu et le matériel raccordé.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="conformite" className="scroll-mt-24 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              6
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Ne pas confondre technique et homologation
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Le dimensionnement électrique, la sécurité de pose et l&apos;homologation VASP sont liés,
                mais ce ne sont pas exactement les mêmes sujets. Vous pouvez avoir une installation
                qui fonctionne sans avoir traité correctement la partie administrative ou
                réglementaire.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  "Dimensionnement électrique",
                  "Sécurité de pose",
                  "Conformité pour l'homologation",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm font-semibold text-neutral-800">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="text-sm leading-relaxed text-neutral-700 sm:text-base">
                  En résumé : partez de vos usages, puis dimensionnez la batterie, les sources de
                  recharge, le convertisseur et les protections dans cet ordre. Les valeurs de cet
                  article donnent une base de réflexion sérieuse, mais elles ne remplacent pas un
                  dimensionnement complet ni une vérification avant réalisation.
                </p>
              </div>
            </div>
          </div>
        </section>
      </article>

      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-4xl px-6 py-10 sm:py-12">
          <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">Questions fréquentes</h2>
          <div className="mt-5 space-y-3">
            {faqItems.map((item) => (
              <div key={item.question} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-neutral-950 sm:text-base">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
          <div className="rounded-[28px] border border-neutral-200 bg-neutral-950 p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Passer à l&apos;action
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Besoin d&apos;un schéma ou d&apos;un dimensionnement plus précis ?
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-300 sm:text-base">
              Vous pouvez commencer par les outils gratuits et les exemples de schémas, puis me
              contacter si votre projet demande une validation plus fine ou un accompagnement pas à
              pas.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                {
                  title: "Créer votre schéma",
                  text: "Préparez une première base pour visualiser les composants et les liaisons.",
                  href: "/outils/schema",
                },
                {
                  title: "Voir des schémas types",
                  text: "Partez d'exemples concrets avec explications et impression PDF.",
                  href: "/schemas-electriques",
                },
                {
                  title: "Être accompagné",
                  text: "Pour un van plus spécifique, un gros 230V ou une validation complète.",
                  href: "/prestations/accompagnement",
                },
              ].map((item) => (
                <div key={item.href} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-300">{item.text}</p>
                  <Link
                    href={item.href}
                    className="mt-4 inline-flex text-sm font-semibold text-brand-300 underline underline-offset-4 hover:text-brand-200"
                  >
                    Ouvrir →
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button href="/contact" variant="primary">
                Demander un avis sur mon projet
              </Button>
              <Button href="/formations" variant="secondary" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                Retour aux bases
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

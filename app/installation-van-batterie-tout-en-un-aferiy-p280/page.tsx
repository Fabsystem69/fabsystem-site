import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { LightProjectKit } from "@/components/project-follow-up/LightProjectKit";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VoltaGuide } from "@/components/volta/VoltaGuide";
import { getCustomerSessionFromCookieOrAnonymous } from "@/lib/server/customer-session";

export const metadata: Metadata = {
  title:
    "Installation électrique de van avec batterie tout-en-un : mon montage autour de l'AFERIY P280",
  description:
    "Comment concevoir une installation électrique de van simple et évolutive avec une batterie tout-en-un AFERIY P280, un panneau solaire flexible 200W, la recharge alternateur officielle DC060, du 12V pour les usages quotidiens et du 230V pour deux prises AC.",
  alternates: {
    canonical: "/installation-van-batterie-tout-en-un-aferiy-p280",
  },
  keywords: [
    "AFERIY P280 van",
    "AFERIY DC060 van",
    "batterie tout-en-un van",
    "installation électrique van AFERIY",
    "XT90 XT60 van",
    "schéma AFERIY P280",
    "prise 230V van",
  ],
  openGraph: {
    title: "Van + AFERIY P280 : une architecture simple mais sérieuse",
    description:
      "Un guide concret pour organiser un van autour d'une AFERIY P280 : solaire 200W, recharge alternateur officielle DC060 ou quai, réseau 12V fixe et deux prises AC.",
    url: "https://www.fabsystem.fr/installation-van-batterie-tout-en-un-aferiy-p280",
    type: "article",
    images: [
      {
        url: "/articles/aferiy-p280-architecture-van.webp",
        width: 1600,
        height: 893,
        alt: "Illustration d'un van aménagé autour d'une AFERIY P280",
      },
    ],
  },
};

const outlineItems = [
  { id: "interet", label: "Pourquoi cette base" },
  { id: "hypotheses", label: "Hypothèses" },
  { id: "architecture", label: "Architecture retenue" },
  { id: "liste", label: "Matériel & câbles" },
  { id: "solaire", label: "Solaire 200W" },
  { id: "xt60", label: "Réseau 12V XT60" },
  { id: "ac", label: "Deux prises 230V" },
  { id: "avis", label: "Budget & avis" },
  { id: "kit", label: "Kit imprimable" },
  { id: "sources", label: "Sources" },
] as const;

const repereItems = [
  { title: "Capacité batterie", text: "2048 Wh LiFePO4 annoncés par AFERIY." },
  { title: "Sortie AC", text: "2800 W pur sinus avec 3 prises 220-240 V." },
  {
    title: "Entrées XT90",
    text: "2 ports XT90 annoncés en 11,5-55 V / 20 A max / 600 W max par port.",
  },
  { title: "Sortie 12V fixe", text: "XT60 12V / 25A, soit environ 300 W." },
  {
    title: "Recharge roulage",
    text: "Le DC060 officiel AFERIY est documenté comme compatible P280, avec charge simultanée solaire + DC-DC sur ce modèle.",
  },
] as const;

const architectureItems = [
  "Panneau solaire flexible 200W vers le premier XT90.",
  "Recharge alternateur via le DC060 officiel AFERIY vers le second XT90.",
  "Prise de quai ou secteur directement sur l'entrée AC de la station.",
  "Sortie XT60 12V / 25A vers un fusible principal puis un petit tableau 12V.",
  "Sortie AC vers un tableau 230V puis deux prises fixes à traiter avec sérieux.",
] as const;

const planningAssumptions = [
  "VW T5 ou T6 avec cuisine latérale gauche.",
  "AFERIY P280 placée sous la banquette arrière 3/4.",
  "Tableau de commande sur le flanc du meuble cuisine.",
  "Frigo Dometic NRX 50E dans le meuble principal.",
  "Pompe sous évier ou réservoir, douchette à l'arrière et prise de quai sur le flanc arrière gauche.",
  "Prix TTC indicatifs relevés le 16 août 2026, avec une marge réaliste de +/- 15 à 20 %.",
] as const;

const materialSections = [
  {
    title: "Production et recharge",
    items: [
      "AFERIY P280 : ~859 €",
      "AFERIY DC060 580W : ~179 €",
      "Panneau flexible 200W ETFE type Eco-Worthy : ~130 €",
      "Rallonge solaire MC4 5 m : ~30 €",
      "Passe-toit étanche : ~19 €",
      "Mastic collage / étanchéité : ~35 à 55 €",
    ],
  },
  {
    title: "Distribution 12V",
    items: [
      "Protection principale XT60 vers tableau : ~20 à 30 €",
      "Blue Sea WeatherDeck 6 positions : ~163 €",
      "Prise USB encastrable USB-A + USB-C : ~20 €",
      "Kit ruban LED 12V / 3 à 5 m : ~35 à 40 €",
      "Consommables électriques : ~50 à 80 €",
    ],
  },
  {
    title: "Usages de bord",
    items: [
      "Dometic NRX 50E : ~499 €",
      "Pompe Shurflo 10 L/min 12V 30 PSI : ~100 €",
      "Filtre Shurflo : ~15 €",
      "Vase d'expansion 0,75 L : ~20 €",
      "Robinet compact : ~25 à 35 €",
      "Douchette arrière : ~45 à 80 €",
      "Tuyau alimentaire 12 mm + raccords : ~54 à 64 €",
    ],
  },
  {
    title: "230V et quai",
    items: [
      "Prise quai P17 / CEE 16 A : ~14 €",
      "2 prises 230V fixes : ~45 à 55 € la paire",
      "Interrupteur différentiel 30 mA type A : ~60 à 65 €",
      "Disjoncteur 2P 16 A : ~23 €",
      "Petit coffret DIN IP65 4 modules : ~20 à 30 €",
    ],
  },
] as const;

const cableRuns = [
  { title: "Solaire toit -> P280", text: "1 rallonge MC4 de 5 m." },
  { title: "P280 XT60 -> tableau 12V", text: "2 m rouge + 2 m noir en 6 mm2." },
  { title: "Tableau -> frigo", text: "3 m rouge + 3 m noir en 4 mm2." },
  { title: "Tableau -> pompe", text: "2,5 m rouge + 2,5 m noir en 4 mm2." },
  { title: "Tableau -> prise USB", text: "2 m rouge + 2 m noir en 2,5 mm2." },
  { title: "Tableau -> éclairage LED", text: "5 m rouge + 5 m noir en 1,5 mm2." },
  { title: "230V P280 -> coffret -> prises", text: "Environ 10 m de 3G2,5 mm2 au total." },
  {
    title: "DC060 -> zone banquette",
    text: "Le kit AFERIY inclut déjà 5 m de câble d'entrée et les adaptateurs utiles.",
  },
] as const;

const dailyLoads = [
  "Réfrigérateur 12V",
  "Pompe à eau",
  "Ports USB",
  "Éclairage LED",
] as const;

const branchPlan = [
  { title: "Frigo", text: "15 A" },
  { title: "Pompe", text: "10 A" },
  { title: "USB", text: "10 A" },
  { title: "LED", text: "5 A" },
  { title: "Réserve", text: "10 à 15 A" },
  { title: "Protection principale XT60 -> tableau", text: "25 A max" },
] as const;

const acRules = [
  "Les deux prises 230V fixes sont alimentées uniquement par la sortie AC de la P280.",
  "La prise de quai sert uniquement à recharger la P280.",
  "Je ne mets pas le quai et la P280 en parallèle sans inverseur de source dédié.",
] as const;

const safetyNotes = [
  "La sortie XT60 plafonne à 25A : elle convient bien à un petit réseau de bord, pas à de gros consommateurs 12V.",
  "Deux prises 230V fixes dans le mobilier ne doivent pas être traitées comme un simple prolongateur intégré.",
  "La protection 230V et la logique neutre / terre méritent une vraie validation avant toute installation fixe.",
] as const;

const budgetRows = [
  { title: "Base complète avec P280", text: "~2 400 à 2 600 €" },
  { title: "Base hors P280", text: "~1 550 à 1 750 €" },
  { title: "Option recharge alternateur officielle", text: "+ ~179 € avec le DC060" },
] as const;

const sourceLinks = [
  {
    label: "AFERIY P280 — fiche produit officielle",
    href: "https://fr.aferiy.com/products/aferiy-p280-station-denergie-portable-2800w-2048wh",
  },
  {
    label: "AFERIY DC060 — fiche produit officielle",
    href: "https://fr.aferiy.com/products/aferiy-dc060-dc-dc-battery-charger",
  },
  {
    label: "Eco-Worthy 200W flexible — fiche produit",
    href: "https://fr.eco-worthy.com/collections/components/products/panneau-solaire-mono-flexible-200w",
  },
  {
    label: "Blue Sea WeatherDeck 4376 — fiche technique officielle",
    href: "https://www.bluesea.com/products/4376/WeatherDeck_12V_DC_Waterproof_Circuit_Breaker__Panel_-_Gray_6_Positions",
  },
  {
    label: "Victron — Ground, earth and electrical safety",
    href: "https://www.victronenergy.com/media/pg/The_Wiring_Unlimited_book/en/ground%2C-earth-and-electrical-safety.html",
  },
] as const;

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Installation électrique de van avec batterie tout-en-un : mon montage autour de l'AFERIY P280",
  description:
    "Guide concret pour organiser un van autour d'une AFERIY P280 avec solaire 200W, recharge alternateur officielle DC060 ou quai, réseau 12V via XT60 et deux prises AC.",
  mainEntityOfPage:
    "https://www.fabsystem.fr/installation-van-batterie-tout-en-un-aferiy-p280",
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
  image: [
    "https://www.fabsystem.fr/articles/aferiy-p280-architecture-van.webp",
    "https://www.fabsystem.fr/articles/aferiy-p280-produit.webp",
  ],
  about: [
    "AFERIY P280",
    "AFERIY DC060",
    "van aménagé",
    "station électrique tout-en-un",
    "XT90 solaire",
    "XT60 12V",
  ],
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
      name: "Installation van batterie tout-en-un AFERIY P280",
      item: "https://www.fabsystem.fr/installation-van-batterie-tout-en-un-aferiy-p280",
    },
  ],
};

export default async function InstallationVanAferiyP280Page() {
  const session = await getCustomerSessionFromCookieOrAnonymous();
  const convertToProjectParams = new URLSearchParams({
    name: "Van VW T5/T6 - installation AFERIY P280",
    assetType: "VAN",
    voltage: "V12",
    starter: "aferiy-p280-guide",
  });
  const projectCtaHref = session
    ? `/mon-compte/projets/nouveau?${convertToProjectParams.toString()}`
    : null;

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

      <PageIntro
        eyebrow="Guide Les bases"
        title="Installation électrique de van avec batterie tout-en-un : comment je m'y prendrais avec l'AFERIY P280"
        description="Une architecture plus simple qu'un montage classique batterie + MPPT + convertisseur + chargeur séparés, avec une recharge alternateur propre via le DC060 officiel, à condition de rester lucide sur les limites du solaire 200W et du 230V fixe."
      />

      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[1.25fr_0.95fr]">
          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <Badge tone="info">Cas concret</Badge>
              <Badge tone="success">Montage compact</Badge>
              <Badge tone="neutral">AFERIY P280 + DC060</Badge>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-700 sm:text-base">
              Si l&apos;objectif est d&apos;éviter d&apos;empiler batterie, MPPT, convertisseur et chargeur
              secteur dans tous les sens, une station tout-en-un peut être une base très crédible.
              Ici, la P280 devient le centre du système : le 12V du quotidien sort en XT60, le
              solaire et la recharge alternateur officielle entrent en XT90, la recharge secteur
              reste directe en AC IN, et le 230V de sortie reste séparé.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button href="/schemas-electriques/schema-aferiy-p280-van" variant="primary">
                Voir le schéma AFERIY P280
              </Button>
              <Button href="/outils/schema?template=station-aferiy-p280" variant="secondary">
                L&apos;ouvrir dans l&apos;éditeur
              </Button>
            </div>

            <VoltaGuide variant="tip" pose="action" title="Le conseil de Volta" className="mt-5">
              Une station tout-en-un simplifie beaucoup le schéma, mais elle ne dispense pas de
              réfléchir aux protections, aux limites de courant et à la partie 230V fixe.
            </VoltaGuide>
          </div>

          <div className="grid gap-6">
            <figure className="overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-50">
              <Image
                src="/articles/aferiy-p280-architecture-van.webp"
                alt="Illustration d'un van aménagé autour d'une AFERIY P280 avec panneau solaire, réseau 12V et prises AC."
                width={1600}
                height={893}
                priority
                sizes="(max-width: 1024px) 100vw, 520px"
                className="h-[220px] w-full object-cover sm:h-[280px] lg:h-[250px]"
              />
              <figcaption className="border-t border-neutral-200 bg-white px-5 py-4 text-sm leading-relaxed text-neutral-600">
                L&apos;architecture logique ici : un XT90 pour le solaire, un XT90 pour le DC060,
                une entrée AC pour le quai ou le secteur, un XT60 pour un petit réseau 12V fixe, et
                une sortie AC séparée pour deux prises 230V.
              </figcaption>
            </figure>

            <figure className="rounded-[28px] border border-neutral-200 bg-white p-5">
              <div className="grid items-center gap-4 sm:grid-cols-[160px_1fr] lg:grid-cols-1">
                <Image
                  src="/articles/aferiy-p280-produit.webp"
                  alt="Photo produit officielle de l'AFERIY P280"
                  width={1000}
                  height={1000}
                  sizes="(max-width: 1024px) 40vw, 220px"
                  className="mx-auto h-auto w-full max-w-[220px] rounded-2xl border border-neutral-200 bg-neutral-50"
                />
                <figcaption className="text-sm leading-relaxed text-neutral-600">
                  La photo aide à repérer la machine, mais le vrai sujet côté schéma reste
                  l&apos;organisation des deux entrées XT90, de la sortie XT60 et de la distribution aval.
                </figcaption>
              </div>
            </figure>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-6">
          <aside className="rounded-[28px] border border-neutral-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Ce qu&apos;AFERIY annonce
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {repereItems.map((item) => (
                <div key={item.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-700">{item.text}</p>
                </div>
              ))}
            </div>
          </aside>
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
        <section id="interet" className="scroll-mt-24 border-b border-neutral-200 pb-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              1
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Pourquoi cette solution est intéressante dans un van
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                La force d&apos;une AFERIY P280, ce n&apos;est pas seulement d&apos;offrir du 230V. C&apos;est de
                regrouper dans un seul boîtier plusieurs briques qui prennent normalement beaucoup de
                place et de temps à câbler : batterie LiFePO4, gestion de recharge, MPPT solaire,
                convertisseur pur sinus et interfaces de sortie.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
                À partir de là, on peut construire un van plus lisible et plus évolutif, sans pour
                autant basculer dans un montage au rabais. Le bon angle, c&apos;est de traiter la P280
                comme le cœur du système, puis d&apos;organiser tout ce qu&apos;il y a autour.
              </p>
            </div>
          </div>
        </section>

        <section id="hypotheses" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              2
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Hypothèses de départ pour rester concret
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Pour que ce guide aide vraiment à se projeter, je pars sur une implantation précise
                et sur des prix d&apos;ordre de grandeur plutôt que sur un montage abstrait.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {planningAssumptions.map((item) => (
                  <div key={item} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm leading-relaxed text-neutral-700">{item}</p>
                  </div>
                ))}
              </div>
              <VoltaGuide variant="tip" pose="action" title="Le point clé que je retiens" className="mt-4">
                Ici, j&apos;écarte la piste d&apos;un gros chargeur DC-DC tiers. La version propre pour ce
                guide, c&apos;est la recharge alternateur officielle AFERIY DC060, documentée pour la
                P280 et plus lisible pour un débutant.
              </VoltaGuide>
            </div>
          </div>
        </section>

        <section id="architecture" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              3
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                L&apos;architecture que je retiendrais
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Dans ce montage, la P280 devient vraiment le centre de l&apos;installation. Les usages
                du quotidien restent en 12V, le 230V reste ponctuel et séparé, et les sources de
                recharge sont clairement réparties entre solaire, roulage et prise de quai.
              </p>
              <div className="mt-4 space-y-3">
                {architectureItems.map((item) => (
                  <div key={item} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm leading-relaxed text-neutral-700">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Ce que le schéma montre bien
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                  Le 12V et le 230V ne se mélangent pas dans un même fourre-tout. Le solaire et le
                  DC060 restent distincts, et le petit réseau fixe 12V part d&apos;une seule sortie XT60
                  protégée proprement.
                </p>
              </div>
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Charge simultanée documentée
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                  AFERIY documente que sur la P280, le DC060 et le solaire peuvent charger en même
                  temps en utilisant chacun leur propre entrée XT90.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="liste" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              4
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Matériel type et longueurs de câble
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Si je transforme ce montage en panier type, je garde un choix volontairement simple
                et cohérent avec la logique débutant à intermédiaire du guide. Les montants restent
                indicatifs et servent surtout à poser un ordre de grandeur réaliste.
              </p>
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {materialSections.map((section) => (
                  <div key={section.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                    <h3 className="text-base font-semibold text-neutral-950">{section.title}</h3>
                    <ul className="mt-3 space-y-2">
                      {section.items.map((item) => (
                        <li key={item} className="text-sm leading-relaxed text-neutral-700">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Longueurs d&apos;achat à prévoir
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {cableRuns.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-neutral-700">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Point de vigilance sur le Blue Sea
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                  Le WeatherDeck 4376 est propre et robuste, mais il travaille avec des circuits
                  15 A. Si vous voulez un calibrage très fin en 5 A, 10 A et 15 A au départ près,
                  un petit tableau à fusibles reste souvent plus souple pour un van.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="solaire" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              5
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Le panneau solaire flexible 200W : cohérent, mais pas magique
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Un panneau flexible 200W reste cohérent dans un projet simple et discret. Il peut
                aider à tenir un frigo, des LED, une pompe à eau et un peu d&apos;USB, surtout si le van
                reste à l&apos;arrêt. En revanche, il ne faut pas lui demander de recharger une grosse
                réserve de 2048Wh à grande vitesse dans des conditions réelles de toit plat, chaleur,
                ombre et météo variable.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  "Bonne base pour les usages quotidiens raisonnables",
                  "Appoint utile quand le van reste posé",
                  "Solution simple, mais pas une promesse d'autonomie illimitée",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm font-medium text-neutral-800">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="xt60" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              6
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Le 12V via la sortie XT60 : très intéressant pour un petit réseau fixe
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                C&apos;est à mes yeux l&apos;une des meilleures idées de cette machine pour un van. La sortie
                XT60 12V / 25A permet d&apos;alimenter un vrai petit tableau 12V, au lieu de dépendre
                uniquement de prises éparpillées.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-neutral-950">Très adapté pour</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {dailyLoads.map((item) => (
                      <div key={item} className="rounded-xl border border-white bg-white px-3 py-2 text-sm text-neutral-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-neutral-950">La limite à garder en tête</p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    25A en 12V, cela représente environ 300W. Tant que vous restez dans une logique
                    services de bord, c&apos;est très cohérent. Si vous ajoutez de gros consommateurs
                    12V, il faut refaire le bilan plus sérieusement.
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="text-sm font-semibold text-neutral-950">
                  Répartition simple que je retiendrais
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {branchPlan.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-neutral-700">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Lecture simple pour débuter
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                  Si vous gardez le WeatherDeck en 15 A, il faut alors vérifier que chaque ligne et
                  chaque section de câble restent compatibles avec cette protection. Si ce point vous
                  gêne, passez directement sur un tableau à fusibles plus fin.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="ac" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              7
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Et les deux prises 230V fixes dans le van ?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                C&apos;est le point où je resterais le plus prudent. D&apos;après la fiche officielle AFERIY
                consultée le <strong>16 août 2026</strong>, la P280 annonce 2800W en sortie AC, 3
                prises 220-240V, ainsi que des protections contre surcharge et court-circuit. En
                revanche, je n&apos;ai pas vu de mention explicite d&apos;un différentiel 30mA intégré dans
                les éléments officiels consultés.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Pour brancher ponctuellement un appareil directement sur la station, les protections
                internes annoncées ont du sens. Pour créer deux prises encastrées permanentes dans le
                mobilier, on change de niveau d&apos;exigence : on parle d&apos;un vrai circuit AC embarqué.
              </p>
              <div className="mt-4 space-y-3">
                {safetyNotes.map((item) => (
                  <div key={item} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm leading-relaxed text-neutral-700">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="text-sm font-semibold text-neutral-950">Ce que je ferais ici</p>
                <div className="mt-3 grid gap-3">
                  {acRules.map((item) => (
                    <div key={item} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-sm leading-relaxed text-neutral-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                  Pourquoi je reste prudent
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                  Le comportement d&apos;un différentiel dépend de la logique neutre / terre du montage.
                  Sans documentation claire et validation réelle pour une installation fixe autour
                  de la P280, je ne supposerais rien sur ce point.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="avis" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              8
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Budget réaliste et avis global
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Pour cette implantation, on reste sur une base sérieuse mais encore lisible. Le plus
                important est de ne pas se raconter d&apos;histoires ni sur le solaire 200W, ni sur le
                230V fixe, ni sur la sortie XT60 limitée à 25A.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {budgetRows.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-700">{item.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="text-sm leading-relaxed text-neutral-700 sm:text-base">
                  Je trouve ce montage très pertinent si l&apos;objectif est d&apos;avoir un van simple,
                  propre et fonctionnel, sans partir sur une usine à gaz. Pour un frigo, de l&apos;eau,
                  de la lumière, des USB et un peu de 230V, la logique tient bien. La version la
                  plus propre à mes yeux reste donc : P280 au centre, solaire 200W, recharge
                  alternateur officielle via DC060, puis petit réseau 12V bien protégé.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="kit" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <LightProjectKit projectCtaHref={projectCtaHref} />
        </section>

        <section id="sources" className="scroll-mt-24 pt-8">
          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
            <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
              Sources vérifiées le 16 août 2026
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Les spécifications produits et les remarques de sécurité ci-dessus s&apos;appuient sur les
              sources officielles suivantes.
            </p>
            <ul className="mt-4 space-y-3">
              {sourceLinks.map((source) => (
                <li key={source.href} className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-700"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </article>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
          <div className="rounded-[28px] border border-neutral-200 bg-neutral-950 p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Passer à l&apos;action
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Repartir de ce montage dans l&apos;éditeur ou demander un schéma plus précis
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-300 sm:text-base">
              J&apos;ai préparé un exemple de schéma AFERIY P280 dans la galerie et dans l&apos;éditeur pour
              partir sur une base claire. Si votre van sort de ce cadre, on peut ensuite affiner.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                {
                  title: "Voir la fiche schéma",
                  text: "Le montage AFERIY P280 expliqué et prêt à imprimer en PDF.",
                  href: "/schemas-electriques/schema-aferiy-p280-van",
                },
                {
                  title: "Modifier dans l'éditeur",
                  text: "Ouvrez directement le template avec les XT90, XT60 et les deux prises AC.",
                  href: "/outils/schema?template=station-aferiy-p280",
                },
                {
                  title: "Être accompagné",
                  text: "Si vous voulez valider le 230V fixe, le bilan global ou l'implantation réelle.",
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
              <Button
                href="/formations"
                variant="secondary"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                Retour aux bases
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

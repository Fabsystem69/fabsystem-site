import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VoltaGuide } from "@/components/volta/VoltaGuide";
import { getCustomerSessionFromCookieOrAnonymous } from "@/lib/server/customer-session";

export const metadata: Metadata = {
  title:
    "Installation electrique de van avec solution Victron legere : comment je m'y prendrais",
  description:
    "Une architecture Victron legere et coherente pour van : batterie LiFePO4 150Ah, SmartSolar MPPT 75/15, MultiPlus Compact 12/800, SmartShunt, solaire 200W et recharge alternateur optionnelle via Orion 18A.",
  alternates: {
    canonical: "/installation-electrique-van-victron-legere",
  },
  keywords: [
    "installation electrique van victron",
    "victron van t5 t6",
    "multiplus compact 12 800 van",
    "smartsolar 75 15 van",
    "smartshunt 300a van",
    "orion 12 12 18a van",
    "batterie lifepo4 150ah van",
  ],
  openGraph: {
    title: "Installation electrique van Victron legere",
    description:
      "Une base propre et evolutive pour van autour d'une batterie 150Ah, d'un MPPT 75/15, d'un MultiPlus 800 et d'un monitoring Bluetooth.",
    url: "https://www.fabsystem.fr/installation-electrique-van-victron-legere",
    type: "article",
    images: [
      {
        url: "/articles/installation-electrique-van-victron-legere.jpg",
        width: 1600,
        height: 1194,
        alt: "Illustration d'une installation electrique de van avec solution Victron legere",
      },
    ],
  },
};

const outlineItems = [
  { id: "interet", label: "Pourquoi cette base" },
  { id: "config", label: "Configuration retenue" },
  { id: "architecture", label: "Architecture" },
  { id: "multiplus", label: "Pourquoi le MultiPlus 800" },
  { id: "batterie", label: "Batterie 150Ah" },
  { id: "solaire", label: "Solaire 200W" },
  { id: "monitoring", label: "Monitoring" },
  { id: "ac", label: "230V et securite" },
  { id: "avis", label: "Avis global" },
  { id: "sources", label: "Sources" },
] as const;

const repereItems = [
  {
    title: "Usage vise",
    text: "Frigo, pompe, USB, LED et deux prises 230V reservees aux petits chargeurs.",
  },
  {
    title: "Batterie service",
    text: "Une LiFePO4 12V 150Ah reste credible sans partir sur une reserve disproportionnee.",
  },
  {
    title: "Charge secteur",
    text: "Le MultiPlus Compact 12/800/35-16 garde le 230V dans une logique legere mais serieuse.",
  },
  {
    title: "Recharge roulage",
    text: "L'Orion-Tr Smart 12/12-18A reste une option propre si la recharge alternateur vous interesse.",
  },
];

const configBlocks = [
  {
    title: "Base que je retiendrais",
    items: [
      "Batterie Eco-Worthy LiFePO4 12V 150Ah Bluetooth",
      "Victron SmartSolar MPPT 75/15",
      "Victron MultiPlus Compact 12/800/35-16",
      "Victron SmartShunt 300A",
      "Panneau solaire souple 200W",
    ],
  },
  {
    title: "Options de confort",
    items: [
      "Victron Orion-Tr Smart 12/12-18A pour la recharge en roulant",
      "VE.Bus Smart Dongle pour faire remonter aussi le MultiPlus dans VictronConnect",
    ],
  },
];

const materialSections = [
  {
    title: "Coeur du systeme",
    items: [
      "1 x Eco-Worthy LiFePO4 12V 150Ah Bluetooth : 349,99 EUR",
      "1 x Victron SmartSolar MPPT 75/15 : des 48,58 EUR",
      "1 x Victron MultiPlus Compact 12/800/35-16 : des 477,00 EUR",
      "1 x Victron SmartShunt 300A : des 72,06 EUR",
      "1 x panneau solaire souple Eco-Worthy 200W : 129,99 EUR",
      "1 x coupe-batterie 275A : 39,00 EUR",
      "1 x protections DC principales (porte-fusibles + fusibles adaptes MultiPlus / MPPT / tableau 12V) : ~45 a 65 EUR",
    ],
  },
  {
    title: "Solaire et pose",
    items: [
      "1 x rallonge solaire 5 m avec MC4 : 29,99 EUR",
      "1 x passe-toit etanche CBE : 19,50 EUR",
      "1 x cartouche Sikaflex 552 blanc : 35,80 EUR",
    ],
  },
  {
    title: "Froid, eau et confort",
    items: [
      "1 x Dometic NRX 50E : 499,00 EUR",
      "1 x pompe Shurflo 10 L/min 12V 30 PSI : 99,90 EUR",
      "1 x filtre Shurflo : 14,90 EUR",
      "1 x vase d'expansion Fiamma A20 : 32,90 EUR",
      "1 x mitigeur / robinet compact Comet Capri Kompakt : 45,99 EUR",
      "1 x prise de douche exterieure Reich avec douchette : 73,99 EUR",
      "8 m de tuyau alimentaire 12/18 mm : 24,00 EUR",
      "1 x lot raccords eau + T + coudes + colliers inox : ~30 a 40 EUR",
    ],
  },
  {
    title: "Distribution 12V et usages",
    items: [
      "1 x tableau de commande Blue Sea WeatherDeck 6 positions : 163,38 EUR",
      "1 x prise USB encastrable USB-A + USB-C : 19,90 EUR",
      "1 x kit ruban LED 12V 5 m : 36,92 EUR",
    ],
  },
  {
    title: "230V et prise de quai",
    items: [
      "1 x prise quai etanche P17 / CEE 16A : 14,90 EUR",
      "1 x interrupteur differentiel 40A 30mA type A : 64,90 EUR",
      "1 x disjoncteur 2P 16A : 23,16 EUR",
      "1 x petit coffret DIN etanche 4 modules IP65 : 21,50 EUR",
      "2 x prises 230V fixes encastrees : ~45 a 55 EUR la paire",
    ],
  },
  {
    title: "Cables et consommables",
    items: [
      "1 x lot cablage base complet : 35 mm2 batterie <-> MultiPlus, 10 mm2 batterie <-> tableau 12V, 6 mm2 MPPT <-> batterie, 4 mm2 frigo / pompe, 2,5 mm2 USB, 1,5 mm2 LED, 3G2,5 mm2 pour le 230V : ~220 a 280 EUR",
      "1 x ligne consommables electriques : cosses, gaines thermo, passe-fils, colliers, presse-etoupes, adhesif tissu, visserie, serre-cables, reperage : ~60 a 90 EUR",
    ],
  },
  {
    title: "Options",
    items: [
      "1 x Victron Orion-Tr Smart 12/12-18A : des 128,96 EUR",
      "cables option Orion 16 mm2 + cosses + protections complementaires : ~60 a 90 EUR selon la longueur et la base de pose",
      "1 x VE.Bus Smart Dongle : des 91,27 EUR",
    ],
  },
] as const;

const architectureItems = [
  "Panneau solaire 200W -> SmartSolar MPPT 75/15 -> batterie LiFePO4 150Ah.",
  "Prise de quai 230V -> MultiPlus Compact 12/800 -> recharge batterie + alimentation 230V.",
  "Batterie -> SmartShunt 300A -> protection principale -> tableau 12V -> frigo, pompe, USB, eclairage LED.",
  "Batterie -> MultiPlus Compact 12/800 -> deux prises 230V pour petits chargeurs.",
  "En option : batterie vehicule -> Orion-Tr Smart 12/12-18A -> batterie service.",
] as const;

const cableRuns = [
  { title: "toit -> MPPT", text: "1 rallonge solaire 5 m." },
  { title: "MPPT -> batterie", text: "2 m rouge + 2 m noir en 6 mm2." },
  { title: "batterie -> MultiPlus", text: "1,5 m rouge + 1,5 m noir en 35 mm2." },
  { title: "batterie -> tableau 12V", text: "2 m rouge + 2 m noir en 10 mm2." },
  { title: "tableau -> frigo", text: "3 m rouge + 3 m noir en 4 mm2." },
  { title: "tableau -> pompe", text: "2,5 m rouge + 2,5 m noir en 4 mm2." },
  { title: "tableau -> USB", text: "2 m rouge + 2 m noir en 2,5 mm2." },
  { title: "tableau -> LED", text: "5 m rouge + 5 m noir en 1,5 mm2." },
  { title: "prise quai + MultiPlus + 2 prises 230V", text: "10 m de 3G2,5 mm2 au total." },
  { title: "option Orion moteur -> batterie auxiliaire", text: "6 m rouge + 6 m noir en 16 mm2." },
] as const;

const usageHighlights = [
  "Garder tout ce qui peut fonctionner en 12V... en 12V.",
  "Limiter le 230V aux chargeurs et a l'electronique legere.",
  "Avoir une architecture lisible, evolutive et defendable techniquement.",
] as const;

const branchPlan = [
  { title: "frigo", text: "15 A" },
  { title: "pompe", text: "10 A" },
  { title: "USB", text: "10 A" },
  { title: "LED", text: "5 A" },
  { title: "reserve", text: "10 a 15 A" },
  { title: "protection principale tableau 12V", text: "~40 A" },
  { title: "protection batterie -> MultiPlus", text: "~100 A" },
  { title: "option Orion 18A", text: "protections selon kit Victron" },
] as const;

const budgetRows = [
  { title: "Base complete hors options", text: "~2 735 a 2 870 EUR" },
  { title: "Option recharge alternateur Victron", text: "+ ~190 a 220 EUR" },
  { title: "Option VE.Bus Smart Dongle", text: "+ ~91 EUR" },
  { title: "Version complete avec toutes options", text: "~3 020 a 3 180 EUR" },
] as const;

const monitoringItems = [
  "De base, VictronConnect peut suivre le SmartSolar MPPT.",
  "Le SmartShunt donne un vrai suivi batterie bien plus propre qu'une simple estimation.",
  "L'Orion-Tr Smart remonte aussi dans l'application si vous l'ajoutez.",
  "Le MultiPlus peut rejoindre l'ensemble avec un VE.Bus Smart Dongle, sans que ce soit obligatoire au bon fonctionnement.",
] as const;

const acChecklist = [
  "Je ne banaliserais jamais deux prises 230V fixes dans le mobilier du van.",
  "Je prevoirais un differentiel 30 mA et des protections AC adaptees.",
  "Je garderais une mise en oeuvre propre du cablage 230V et des terres.",
] as const;

const sourceLinks = [
  {
    label: "Eco-Worthy LiFePO4 12V 150Ah Bluetooth",
    href: "https://fr.eco-worthy.com/products/batterie-lithium-lifepo4-12v-150ah-avec-bluetooth-protection-basse-temperature",
  },
  {
    label: "Eco-Worthy panneau solaire souple 200W",
    href: "https://fr.eco-worthy.com/collections/components/products/panneau-solaire-mono-flexible-200w",
  },
  {
    label: "Comparer les offres Victron SmartSolar MPPT 75/15",
    href: "https://www.idealo.fr/prix/6019083/victron-smartsolar-mppt-75-15.html",
  },
  {
    label: "Comparer les offres Victron MultiPlus Compact 12/800/35-16",
    href: "https://www.laboutiquesolaire.com/victron-energy-convertisseurs-chargeurs-multiplus-compact/1044-victron-energy-convertisseur-chargeur-multiplus-compact-12-800-35-16-8719076053029.html",
  },
  {
    label: "Comparer les offres Victron SmartShunt 300A",
    href: "https://ledenicheur.fr/product.php?p=14880979",
  },
  {
    label: "coupe-batterie 275A",
    href: "https://www.myshop-solaire.com/coupe-batterie-solaire-_r_696_i_3069.html",
  },
  {
    label: "Comparer les offres Orion-Tr Smart 12/12-18A",
    href: "https://www.idealo.fr/prix/202091650/victron-orion-tr-dc-dc-12-12-18-220-w.html",
  },
  {
    label: "Comparer les offres VE.Bus Smart Dongle",
    href: "https://ledenicheur.fr/product.php?p=13245432",
  },
  {
    label: "Dometic NRX 50E",
    href: "https://www.cabesto.com/fr/refrigerateur-nrx-50e-dometic-nu-0021887.html",
  },
  {
    label: "pompe Shurflo 10 L/min",
    href: "https://www.top-accessoires.com/eau-salle-de-bain-toilettes-pompe-shurflo-10l-mn-12v-30-psi/2421.html",
  },
  {
    label: "filtre Shurflo",
    href: "https://www.top-accessoires.com/eau-salle-de-bain-toilettes-filtre-shurflo/1422.html",
  },
  {
    label: "vase d'expansion Fiamma A20",
    href: "https://www.top-accessoires.com/eau-salle-de-bain-toilettes/pompes-a-eau-vase-d-expansion-a20/4750.html",
  },
  {
    label: "mitigeur Comet Capri Kompakt",
    href: "https://www.berger-camping.fr/article/mitigeur-monocommande-capri-kompakt-comet-1953",
  },
  {
    label: "douchette exterieure Reich",
    href: "https://www.mon-camping-car.com/prise-douche-exterieure-blanche.html",
  },
  {
    label: "prise quai P17 Haba",
    href: "https://www.h2r-equipements.com/socle-et-prise-electrique-carrosserie-van-et-camping-car/5737-haba-socle-cee-p17-a-encastrer.html",
  },
  {
    label: "passe-toit CBE",
    href: "https://www.h2r-equipements.com/passe-toit-pour-cable-camping-car/12393-cbe-passe-toit-4-sorties.html",
  },
  {
    label: "Blue Sea WeatherDeck 6 positions",
    href: "https://skysat.fr/en/products/blue-sea-weatherdeck-waterproof-circuit-breaker-panel-6-positions",
  },
  {
    label: "interrupteur differentiel 40A 30mA type A",
    href: "https://www.elecdirect.fr/interrupteurs-differentiels-hager/4265-hager-inter-differentiel-2p-40a-30ma-type-a-cda743f-3250611612551.html",
  },
  {
    label: "disjoncteur 2P 16A",
    href: "https://www.leroymerlin.fr/produits/ic60n-disjoncteur-2p-c-16a-6000a-82796845.html",
  },
  {
    label: "coffret etanche 4 modules",
    href: "https://www.bricozor.com/coffret-etanche-4-12-modules-gris-ip65-bornier-debflex.html",
  },
  {
    label: "prise USB A + C",
    href: "https://www.reimo.com/fr/accessoires-camping-car/electricite-camping-car-batterie-camping-car/prise-12v-allume-cigare-adaptateur-allume-cigare-camping-car/67610/double-prise-de-charge-usb-12v/24v",
  },
  {
    label: "ruban LED 12V",
    href: "https://www.top-24h.com/310-ruban-led-12v-camping-car",
  },
  {
    label: "tuyau alimentaire 12/18 mm",
    href: "https://www.camping-car-plus.com/wc-eau-entretien/circuit-d-eau/tuyaux-d-eau-et-colliers/tuyau-alimentaire-arme-12/18-mm-722.html",
  },
  {
    label: "Sikaflex 552",
    href: "https://www.trigano-service.com/produit.asp?id_prod=X815621",
  },
] as const;

const faqItems = [
  {
    question: "Pourquoi garder un MultiPlus Compact 12/800 dans ce type de van ?",
    answer:
      "Parce qu'ici le 230V reste reserve aux petits chargeurs et a l'electronique legere. Si vous ne cherchez pas a alimenter bouilloire, plaque ou machine a cafe, 800 W restent coherents.",
  },
  {
    question: "Faut-il absolument une batterie Victron pour cette architecture ?",
    answer:
      "Non. Dans ce guide, une LiFePO4 12V 150Ah plus economique garde du sens si l'architecture generale reste propre et que la batterie reste adaptee a l'usage reel.",
  },
  {
    question: "Le 230V fixe dans le van demande-t-il une vraie protection ?",
    answer:
      "Oui. Des prises 230V fixes dans le mobilier ne doivent pas etre traitees comme un simple prolongateur. Je garderais une vraie logique de differentiel, de protections AC et de mise en oeuvre propre.",
  },
] as const;

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Installation electrique de van avec solution Victron legere : comment je m'y prendrais",
  description:
    "Une architecture Victron legere et coherente pour van autour d'une batterie LiFePO4 150Ah, d'un SmartSolar MPPT 75/15, d'un MultiPlus Compact 12/800, d'un SmartShunt et d'un Orion 18A optionnel.",
  mainEntityOfPage: "https://www.fabsystem.fr/installation-electrique-van-victron-legere",
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
  image: ["https://www.fabsystem.fr/articles/installation-electrique-van-victron-legere.jpg"],
  about: [
    "Victron dans un van",
    "MultiPlus Compact 12/800",
    "SmartSolar MPPT 75/15",
    "SmartShunt",
    "Orion-Tr Smart 12/12-18A",
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
      name: "Installation electrique van Victron legere",
      item: "https://www.fabsystem.fr/installation-electrique-van-victron-legere",
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

export default async function InstallationElectriqueVanVictronLegerePage() {
  const session = await getCustomerSessionFromCookieOrAnonymous();
  const convertToProjectParams = new URLSearchParams({
    name: "Van VW T5/T6 - solution Victron legere",
    assetType: "VAN",
    voltage: "V12",
    starter: "victron-light-guide",
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PageIntro
        eyebrow="Guide Les bases"
        title="Installation electrique de van avec solution Victron legere"
        description="Une base propre, fiable et evolutive pour un usage classique en T5 ou T6, sans tomber ni dans la station tout-en-un ni dans le gros montage surdimensionne."
      />

      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[3fr_2fr]">
          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <Badge tone="info">Cas concret</Badge>
              <Badge tone="success">Victron leger</Badge>
              <Badge tone="neutral">T5 / T6</Badge>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-700 sm:text-base">
              Si je voulais equiper un van simple et agreable a vivre, je ne chercherais pas a tout
              faire passer en 230V. Je garderais un vrai reseau 12V pour les usages quotidiens, un
              petit 230V propre pour les chargeurs et une architecture lisible autour d&apos;une
              batterie LiFePO4 150Ah.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {usageHighlights.map((item) => (
                <div key={item} className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm leading-relaxed text-neutral-700">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button href="/schemas-electriques/schema-victron-leger-van" variant="primary">
                Voir le schema Victron
              </Button>
              <Button href="/outils/schema?template=victron-light-van" variant="secondary">
                Ouvrir le template
              </Button>
              {projectCtaHref ? (
                <Button href={projectCtaHref} variant="secondary">
                  Convertir en projet
                </Button>
              ) : null}
            </div>

            <VoltaGuide variant="tip" pose="action" title="Le fil conducteur de Volta" className="mt-5">
              Ici, le bon compromis n&apos;est pas de tout miniaturiser. C&apos;est de garder chaque
              brique a sa juste place : du 12V pour le quotidien, un vrai suivi batterie, et un
              230V limite aux petits usages.
            </VoltaGuide>
          </div>

          <aside className="rounded-[28px] border border-neutral-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Les reperes que je garde
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

        <div className="mx-auto px-6 pb-6">
          <figure className="overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-50">
            <Image
              src="/articles/installation-electrique-van-victron-legere.jpg"
              alt="Illustration d'une architecture Victron legere pour van"
              width={1600}
              height={1194}
              priority
              sizes="100vw"
              className="h-auto w-full"
            />
            <figcaption className="border-t border-neutral-200 bg-white px-5 py-4 text-sm leading-relaxed text-neutral-600">
              Le schema d&apos;intention est simple : un panneau 200W, un SmartSolar MPPT 75/15, une
              batterie LiFePO4 150Ah, un SmartShunt, un MultiPlus 12/800 et une recharge alternateur
              possible via Orion 18A.
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
        <section id="interet" className="scroll-mt-24 border-b border-neutral-200 pb-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              1
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Pourquoi cette approche me parait pertinente
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Ce que j&apos;aime dans cette logique, c&apos;est qu&apos;on ne cherche pas a tout faire passer en
                230V. Dans un van, ce n&apos;est pas l&apos;habitude la plus saine. Tout ce qui peut tourner
                efficacement en 12V doit, selon moi, rester en 12V.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
                On garde ainsi une installation serieuse, mais sans tomber dans un systeme trop lourd
                pour le besoin reel. La batterie stocke, le solaire soutient, le MultiPlus gere le
                secteur et le petit 230V, et le SmartShunt rend l&apos;ensemble vraiment lisible.
              </p>
            </div>
          </div>
        </section>

        <section id="config" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              2
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                La configuration que je retiendrais
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Si je devais partir sur ce montage aujourd&apos;hui, je garderais une base tres claire,
                puis deux options de confort selon l&apos;importance de la recharge roulage et du suivi
                complet dans VictronConnect.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {configBlocks.map((block) => (
                  <div key={block.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                    <h3 className="text-base font-semibold text-neutral-950">{block.title}</h3>
                    <ul className="mt-3 space-y-2">
                      {block.items.map((item) => (
                        <li key={item} className="text-sm leading-relaxed text-neutral-700">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  Point prix du 16 aout 2026
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                  J&apos;ai volontairement recontrole les prix Victron avant publication. Le MPPT et le
                  SmartShunt se trouvent bien moins cher qu&apos;auparavant, mais il faut faire attention
                  au MultiPlus 12/800 standard et au MultiPlus Compact 12/800 qui n&apos;ont ni le meme
                  format, ni la meme reference, ni le meme prix.
                </p>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {materialSections.map((section) => (
                  <div key={section.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
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

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <h3 className="text-base font-semibold text-neutral-950">
                    Longueurs de cables que je prendrais
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {cableRuns.map((item) => (
                      <div key={item.title} className="rounded-2xl border border-neutral-200 bg-white p-4">
                        <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-neutral-700">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-950 p-5 text-white">
                  <h3 className="text-base font-semibold">Budget realiste</h3>
                  <div className="mt-3 space-y-3">
                    {budgetRows.map((row) => (
                      <div key={row.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-semibold text-white">{row.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-white/80">{row.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
                L&apos;architecture generale de l&apos;installation
              </h2>
              <div className="mt-4 space-y-3">
                {architectureItems.map((item) => (
                  <div key={item} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm leading-relaxed text-neutral-700">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Mon repere de cablage principal
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                  Sur les liaisons courtes entre batterie, shunt, protection principale et MultiPlus,
                  je resterais ici sur du 35 mm2, avec des jonctions d&apos;environ 1 a 1,5 m quand
                  c&apos;est possible, puis un fusible principal souvent dans la zone 80 a 100 A selon le
                  montage retenu.
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                  <h3 className="text-base font-semibold text-neutral-950">
                    Repartition conseillee des departs
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {branchPlan.map((item) => (
                      <div key={item.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                        <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-neutral-700">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <h3 className="text-base font-semibold text-neutral-950">
                    Ce que je garderais simple en 230V
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                    Je garderais les deux prises 230V fixes alimentees uniquement par la sortie AC
                    du MultiPlus, avec le quai reserve a la recharge et sans melanger plusieurs
                    sources sans vraie logique d&apos;inversion.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                    Dit autrement : on reste sur un petit reseau embarque propre, pas sur un
                    bricolage hybride difficile a comprendre six mois plus tard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="multiplus" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              4
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Pourquoi je garderais un MultiPlus Compact 12/800
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                C&apos;est probablement le point le plus contre-intuitif de la config. Beaucoup
                imaginent tout de suite qu&apos;il faut un gros convertisseur. En pratique, ce n&apos;est pas
                vrai si le 230V sert seulement aux chargeurs de telephones, d&apos;ordinateurs ou a
                quelques petits appareils electroniques.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Dans ce contexte, le MultiPlus Compact 12/800 fait tres bien le travail. Il ne faut
                simplement pas lui demander ce pour quoi il n&apos;est pas prevu : bouilloire, plaque,
                machine a cafe ou seche-cheveux restent hors sujet ici.
              </p>
            </div>
          </div>
        </section>

        <section id="batterie" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              5
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Une batterie economique, mais pas incoherente
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Je ne prendrais pas forcement une batterie Victron dans un projet comme celui-ci.
                Pas parce qu&apos;elles ne sont pas bonnes, mais parce qu&apos;a ce niveau de besoin je
                prefere mettre le budget dans l&apos;architecture generale plutot que dans une batterie
                premium.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Une LiFePO4 12V 150Ah Bluetooth reste deja une base serieuse pour un frigo a
                compression, une pompe a eau, des prises USB, un eclairage LED et un peu de 230V
                pour les chargeurs.
              </p>
            </div>
          </div>
        </section>

        <section id="solaire" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              6
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Le solaire 200W : utile, mais pas magique
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Le panneau souple 200W reste coherent dans cette logique, surtout si l&apos;on veut
                rester discret et simple sur le toit. Avec le SmartSolar MPPT 75/15, on garde un
                ensemble homogene et facile a comprendre.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  "Un vrai soutien au quotidien",
                  "Un bon complement a l'arret",
                  "Une source utile, mais pas miraculeuse",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm font-medium text-neutral-800">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="monitoring" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              7
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Le monitoring : l&apos;un des vrais points forts
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Pour le coup, je trouve que cette solution devient vraiment agreable a utiliser. Le
                suivi peut se faire en Bluetooth avec VictronConnect, sans ajouter de complexite
                inutile.
              </p>
              <div className="mt-4 space-y-3">
                {monitoringItems.map((item) => (
                  <div key={item} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm leading-relaxed text-neutral-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="ac" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              8
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Le 230V : la ou je ne banaliserais rien
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Tant qu&apos;on branche un appareil directement sur une prise d&apos;un equipement, on reste
                dans une logique simple. Mais des qu&apos;on cree deux prises 230V fixes dans le mobilier
                du van, on passe sur un vrai petit reseau embarque.
              </p>
              <div className="mt-4 space-y-3">
                {acChecklist.map((item) => (
                  <div key={item} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm leading-relaxed text-neutral-700">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                  Le point a ne pas lisser
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                  Le 230V dans un van ne merite pas moins de rigueur qu&apos;ailleurs. A mon sens,
                  c&apos;est meme l&apos;inverse : cablage propre, protections adaptees et validation serieuse
                  restent indispensables.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="avis" className="scroll-mt-24 border-b border-neutral-200 py-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              9
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
                Mon avis global
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Si je voulais un van simple, fiable et agreable a utiliser, cette solution ferait
                clairement partie de mes favorites. Elle reste plus &quot;installation fixe&quot; qu&apos;une
                station tout-en-un, mais beaucoup plus legere qu&apos;un gros systeme surdimensionne.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
                Pour moi, c&apos;est un bon compromis FabSystem : simple, lisible, sans survente, mais
                techniquement propre. Exactement le type de base qui peut ensuite etre personnalisee
                sans repartir de zero.
              </p>

              <div className="mt-5 rounded-[24px] border border-neutral-200 bg-neutral-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Suite logique
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    {
                      title: "Voir la fiche schema",
                      text: "Retrouver cette architecture dans la galerie et l'imprimer si besoin.",
                      href: "/schemas-electriques/schema-victron-leger-van",
                    },
                    {
                      title: "L'ouvrir dans l'editeur",
                      text: "Repartir du template Victron leger pour l'adapter a votre van.",
                      href: "/outils/schema?template=victron-light-van",
                    },
                    {
                      title: "Etre accompagne",
                      text: "Valider le 230V fixe, les sections, l'implantation et les protections.",
                      href: "/prestations/accompagnement",
                    },
                  ].map((item) => (
                    <div key={item.href} className="rounded-2xl border border-neutral-200 bg-white p-4">
                      <h3 className="text-base font-semibold text-neutral-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{item.text}</p>
                      <Link
                        href={item.href}
                        className="mt-4 inline-flex text-sm font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-700"
                      >
                        Ouvrir -&gt;
                      </Link>
                    </div>
                  ))}
                </div>

                {projectCtaHref ? (
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Button href={projectCtaHref} variant="primary">
                      Convertir cette base en projet client
                    </Button>
                    <Button href="/contact" variant="secondary">
                      Demander un avis sur mon projet
                    </Button>
                  </div>
                ) : (
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Button href="/contact" variant="primary">
                      Demander un avis sur mon projet
                    </Button>
                    <Button href="/formations" variant="secondary">
                      Retour aux bases
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="sources" className="scroll-mt-24 pt-8">
          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
            <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
              Sources verifiees le 16 aout 2026
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Les specifications produits et les points techniques cites ci-dessus s&apos;appuient sur
              les sources suivantes. Pour les tarifs Victron, j&apos;ai retenu des prix observes le
              dimanche 16 aout 2026 sur comparateurs ou boutiques specialisees, hors variations de
              stock, frais de port et promotions flash.
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
    </main>
  );
}

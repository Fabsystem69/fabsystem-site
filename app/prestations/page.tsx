import PageHero from "@/components/PageHero";
import ServiceAssurance from "@/components/ServiceAssurance";
import TrackedLink from "@/components/TrackedLink";
import FaqPrestations from "@/components/FaqPrestations";
import { PrestationsDistanceOffers } from "@/components/prestations/PrestationsDistanceOffers";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { getPrestationsPackProductIdBySlug } from "@/lib/services/prestations-packs-catalog";
import Link from "next/link";
import type { Metadata } from "next";

// Page statique par defaut, mais son contenu depend de donnees catalogue
// (packs) et des temoignages publies en base : rafraichie toutes les 5
// minutes pour rester a jour sans devenir entierement dynamique.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Services électricité embarquée — accompagnement à distance et terrain",
  description:
    "FabSystem vous accompagne à distance ou sur le terrain pour concevoir, vérifier et sécuriser votre installation électrique embarquée : bateau, van, camping-car.",
  alternates: {
    canonical: "/prestations",
  },
};

// Contact WhatsApp réel (numéro déjà publié sur /contact et /vcard) — aucun
// numéro ou lien Teams fictif n'est inventé ici.
const WHATSAPP_URL =
  "https://wa.me/33698247722?text=" +
  encodeURIComponent(
    "Bonjour, je souhaite échanger avant de choisir un accompagnement FabSystem."
  );

const avantApres = [
  {
    avant: "Installation câblée à l'époque, personne ne sait vraiment ce qu'il y a dedans",
    apres: "Schéma complet, repérage couleurs, vous comprenez chaque circuit",
  },
  {
    avant: "Batterie plate au mouillage sans raison apparente",
    apres: "Diagnostic précis, charge optimisée, autonomie sereine",
  },
  {
    avant: "Fusible qui saute, câblage chaud au toucher",
    apres: "Protections adaptées, sections correctes, zéro risque d'incendie",
  },
  {
    avant: "Devis d'un chantier naval : 3 000 € pour « reprendre l'électrique »",
    apres: "Intervention ciblée sur ce qui pose problème, pas plus",
  },
];

const deroule = [
  "On comprend votre projet",
  "On identifie les risques et les priorités",
  "On valide l'architecture et le matériel",
  "On vous accompagne pendant les étapes critiques",
  "On contrôle avant mise sous tension",
];

const fieldServices = [
  {
    title: "Diagnostic électrique embarqué",
    points: [
      "Contrôle de l'installation existante",
      "Repérage des risques",
      "Priorités d'intervention",
      "Recommandations claires",
    ],
  },
  {
    title: "Refit / remise au propre 12 V",
    points: ["Tableau électrique", "Protections", "Câblage", "Busbars", "Fusibles", "Coupe-circuit"],
  },
  {
    title: "Batterie lithium, charge et solaire",
    points: [
      "Batterie LiFePO4",
      "DC-DC",
      "MPPT",
      "Chargeur quai",
      "Contrôleur batterie",
      "Cohérence globale",
    ],
  },
  {
    title: "Sécurité 230 V / charge quai",
    points: [
      "Différentiel",
      "Protections",
      "Charge quai",
      "Convertisseur-chargeur",
      "Sécurité d'utilisation",
    ],
  },
  {
    title: "Dépannage / correction d'installation",
    points: [
      "Panne 12 V",
      "Chute de tension",
      "Problème de charge",
      "Fusible qui saute",
      "Installation dangereuse ou incohérente",
    ],
  },
] as const;

export default async function PrestationsPage() {
  const packProductIdBySlug = await getPrestationsPackProductIdBySlug();


  return (
    <main>
      <PageHero
        title="Vous voulez faire vous-même, mais pas seul."
        subtitle="FabSystem vous accompagne à distance ou sur le terrain pour concevoir, vérifier et sécuriser votre installation électrique embarquée : bateau, van ou camping-car."
        micro="L'objectif n'est pas de vendre du matériel inutile, mais de vous aider à faire les bons choix, dans le bon ordre, avec les bonnes protections."
        background="/hero-fabsystem.png"
        overlay="bg-black/55"
        ctas={[
          { href: "#accompagnement-distance", label: "Accompagnement à distance", variant: "primary" },
          { href: "#prestations-terrain", label: "Prestations terrain", variant: "secondary" },
        ]}
        assurance={<ServiceAssurance tone="inverse" />}
      />

      {/* Deux parcours */}
      <section className="border-b border-neutral-200 bg-white py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-6 text-sm sm:gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Deux parcours
          </span>
          <a
            href="#accompagnement-distance"
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:border-yellow-400 hover:text-neutral-950 sm:text-sm"
          >
            À distance
          </a>
          <a
            href="#prestations-terrain"
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:border-yellow-400 hover:text-neutral-950 sm:text-sm"
          >
            Sur place
          </a>
        </div>
      </section>

      {/* A. Accompagnement à distance — fond anthracite, identité marine */}
      <section
        id="accompagnement-distance"
        className="scroll-mt-20 bg-neutral-950 py-12 sm:py-16"
      >
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
            Accompagnement à distance
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Quatre paliers, une seule direction : avancer sans se tromper
          </h2>

          <div className="mt-5 max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold text-brand-400">
              Un accompagnement FabSystem coûte souvent moins cher qu&apos;une seule erreur de
              matériel.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              Un mauvais chargeur, une batterie mal intégrée, des câbles sous-dimensionnés ou une
              installation à reprendre peuvent coûter plusieurs centaines d&apos;euros.
              L&apos;objectif des packs FabSystem n&apos;est pas d&apos;ajouter une dépense, mais
              d&apos;éviter les mauvais choix avant qu&apos;ils ne deviennent chers.
            </p>
          </div>

          <div className="mt-8">
            <PrestationsDistanceOffers packProductIdBySlug={packProductIdBySlug} />
          </div>
        </div>
      </section>

      {/* Comment l'accompagnement se déroule */}
      <section className="border-t border-neutral-200 bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-xl font-bold text-neutral-950 sm:text-2xl">
            Comment l&apos;accompagnement se déroule
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Chaque palier reprend ces étapes générales, avec un niveau d&apos;implication
            FabSystem croissant — voir le détail sous chaque pack ci-dessus.
          </p>
          <ol className="mt-6 space-y-3">
            {deroule.map((step, index) => (
              <li key={step} className="flex items-start gap-3 text-sm text-neutral-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* B. Prestations terrain */}
      <section
        id="prestations-terrain"
        className="scroll-mt-20 border-t border-neutral-200 bg-neutral-50 py-10 sm:py-14"
      >
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Sur place
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
            Prestations terrain
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Les interventions principales réalisées par FabSystem sur bateau, van et
            camping-car — chaque situation étant différente, ces prestations sont sur devis
            après échange.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fieldServices.map((service) => (
              <article
                key={service.title}
                className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-sm font-bold text-neutral-950">{service.title}</h3>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-neutral-700">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-0.5 text-yellow-600">✓</span>
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  <Link
                    href="/contact"
                    className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
                  >
                    Me contacter
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Avant / Après */}
      <section className="border-t border-neutral-200 bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-yellow-600">
            Avant / Après
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
            Ce que change une vraie intervention
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            De l&apos;incertitude à une installation fiable, documentée, et que vous comprenez.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200">
            <div className="grid grid-cols-2 border-b border-neutral-200 bg-neutral-50">
              <div className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-red-600">
                ✗ Avant
              </div>
              <div className="border-l border-neutral-200 px-5 py-3 text-xs font-bold uppercase tracking-wider text-green-700">
                ✓ Après
              </div>
            </div>
            {avantApres.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-2 border-b border-neutral-100 last:border-b-0"
              >
                <div className="bg-red-50/40 px-5 py-4 text-sm text-neutral-700">
                  {item.avant}
                </div>
                <div className="border-l border-neutral-200 bg-green-50/40 px-5 py-4 text-sm font-medium text-neutral-900">
                  {item.apres}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avis clients : uniquement les temoignages publies depuis le dashboard
          (isPublished = true) — aucun avis invente. */}
      <TestimonialsSection />

      {/* FAQ */}
      <section className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Questions fréquentes
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
            Vous avez une question ?
          </h2>
          <div className="mt-6">
            <FaqPrestations />
          </div>
        </div>
      </section>

      {/* Contact à deux niveaux */}
      <section
        id="contact"
        className="scroll-mt-20 border-t border-neutral-200 bg-neutral-950 py-10 sm:py-14"
      >
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Deux façons d&apos;échanger avec FabSystem
          </h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                Niveau 1 — Contact basique
              </p>
              <h3 className="mt-2 text-lg font-bold text-white">Une question ponctuelle</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Pour une question précise, un doute avant de choisir un pack, ou une demande
                d&apos;info sur les prestations terrain. Pas de créneau, pas d&apos;engagement,
                réponse asynchrone.
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-bold text-neutral-900 transition hover:bg-brand-300"
              >
                Me contacter
              </Link>
            </div>

            <div className="rounded-2xl border border-brand-400/50 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
                Niveau 2 — Premier échange
              </p>
              <h3 className="mt-2 text-lg font-bold text-white">Prêt à avancer</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Avant de choisir un pack, on vérifie ensemble si FabSystem peut réellement vous
                aider et quel niveau d&apos;accompagnement est adapté — notamment avant Passerelle
                ou Grand Large. Échange direct par WhatsApp ou Teams.
              </p>
              <TrackedLink
                href={WHATSAPP_URL}
                event="click_whatsapp_prestations"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-bold text-neutral-900 transition hover:bg-brand-300"
              >
                Échanger avec Fabien
              </TrackedLink>
            </div>
          </div>

          <p className="mt-6 max-w-2xl text-xs leading-relaxed text-white/50">
            Si votre besoin ne correspond pas à l&apos;accompagnement proposé, FabSystem vous le
            dira avant de vous vendre un pack.
          </p>

          <p className="mt-6">
            <Link
              href="/realisations"
              className="text-sm font-medium text-neutral-400 underline underline-offset-4 hover:text-white"
            >
              Voir des exemples de réalisations
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

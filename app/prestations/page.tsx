import PageHero from "@/components/PageHero";
import ServiceAssurance from "@/components/ServiceAssurance";
import TrackedLink from "@/components/TrackedLink";
import FaqPrestations from "@/components/FaqPrestations";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prestations électricité embarquée bateau, van, camping-car",
  description:
    "Diagnostic, sécurisation, distribution, autonomie (batteries/solaire/230V) et accompagnement. Prestations en électricité embarquée pour bateau, van et camping-car.",
  alternates: {
    canonical: "/prestations",
  },
};

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

const offers = [
  {
    icon: "🎯",
    title: "Visio conseil",
    tag: "Depuis chez vous",
    audience: "Cadrer un projet, éviter une erreur d'achat, décider de la suite",
    deliverable: "Synthèse écrite + plan d'action",
    pricing: "50 €",
    ctaLabel: "Réserver une visio",
    href: "/visio",
    trackEvent: "click_rdv",
    highlight: false,
  },
  {
    icon: "🔍",
    title: "Diagnostic sur site",
    tag: "Sur rendez-vous",
    audience: "Clarifier une installation existante, identifier les incohérences",
    deliverable: "Rapport priorités sécurité + recommandations",
    pricing: "À partir de 89 €",
    ctaLabel: "Demander un diagnostic",
    href: "/contact",
    highlight: false,
  },
  {
    icon: "⚡",
    title: "Installation / refonte électrique",
    tag: "Le plus complet",
    audience: "Refonte 12V complète, installation neuve ou remise à niveau totale",
    deliverable: "Câblage propre + schéma final + documentation",
    pricing: "Sur devis",
    ctaLabel: "Demander un devis",
    href: "/contact",
    highlight: true,
  },
  {
    icon: "🛡️",
    title: "Sécurisation 12V / 230V",
    tag: "Urgent",
    audience: "Fiabiliser les protections, reprendre la distribution AC/DC",
    deliverable: "Fusibles, disjoncteurs, distribution, contrôle",
    pricing: "Sur devis (après diagnostic)",
    ctaLabel: "Sécuriser mon installation",
    href: "/contact",
    highlight: false,
  },
  {
    icon: "📐",
    title: "Schéma & documentation",
    tag: "À distance possible",
    audience: "Comprendre son installation, la maintenir, faciliter une revente",
    deliverable: "Schéma normalisé + repérage câbles",
    pricing: "Sur devis",
    ctaLabel: "Mettre au propre",
    href: "/contact",
    highlight: false,
  },
  {
    icon: "⚓",
    title: "Audit nautique — Division 240/245",
    tag: "Réglementation",
    audience: "Préparer ou fiabiliser une installation selon la réglementation française",
    deliverable: "Audit documenté + recommandations de mise en conformité",
    pricing: "Sur devis",
    ctaLabel: "Voir l'audit nautique",
    href: "/audit-nautique",
    secondaryCtaLabel: "Demander un audit",
    secondaryHref: "/contact",
    highlight: false,
  },
] as const;

const scenarios = [
  {
    emoji: "🤔",
    situation: "Je ne sais pas par où commencer",
    solution: "Visio conseil",
    href: "/visio",
    detail: "30–60 min pour cadrer votre projet et définir les priorités",
  },
  {
    emoji: "🔧",
    situation: "Mon installation existe déjà mais je ne fais plus confiance",
    solution: "Diagnostic sur site",
    href: "/contact",
    detail: "Analyse complète, mesures réelles, rapport d'état",
  },
  {
    emoji: "🚨",
    situation: "Fusible qui saute, câble chaud, odeur suspecte",
    solution: "Diagnostic urgent → Sécurisation",
    href: "/contact",
    detail: "Intervention prioritaire ciblée sur le problème",
  },
  {
    emoji: "⛵",
    situation: "Je refais ou achète un bateau et repars de zéro",
    solution: "Installation / refonte électrique",
    href: "/contact",
    detail: "Conception + câblage + documentation complète",
  },
];

const stats = [
  { value: "12V / 230V", label: "DC et AC maîtrisés" },
  { value: "Bateaux · Vans · CC", label: "Tous types de véhicules" },
  { value: "24–48h", label: "Délai de réponse" },
];

export default function PrestationsPage() {
  return (
    <main>
      <PageHero
        title="L'électrique embarqué, sans mauvaise surprise."
        subtitle="Diagnostic, sécurisation, refonte ou simple conseil visio — une intervention adaptée à votre situation réelle, pas un devis au forfait."
        micro="Bateau · Van · Camping-car"
        background="/hero-fabsystem.png"
        overlay="bg-black/55"
        ctas={[
          { href: "/visio", label: "Réserver une visio conseil", variant: "primary" },
          { href: "#offres", label: "Voir les prestations", variant: "secondary" },
        ]}
        assurance={<ServiceAssurance tone="inverse" />}
      />

      {/* Stats */}
      <section className="border-b border-neutral-200 bg-neutral-950">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="grid grid-cols-3 divide-x divide-neutral-700">
            {stats.map((s) => (
              <div key={s.value} className="px-4 text-center first:pl-0 last:pr-0">
                <p className="text-base font-bold text-yellow-400 sm:text-xl">{s.value}</p>
                <p className="mt-0.5 text-xs text-neutral-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avant / Après */}
      <section className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-yellow-600">
            Avant / Après
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
            Ce que change une vraie intervention
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            De l'incertitude à une installation fiable, documentée, et que vous comprenez.
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

      {/* Par où commencer */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Par où commencer ?
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
            Choisissez votre situation
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {scenarios.map((s) => (
              <Link
                key={s.situation}
                href={s.href}
                className="group flex gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-yellow-400 hover:shadow-md"
              >
                <span className="text-2xl">{s.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{s.situation}</p>
                  <p className="mt-1 text-xs font-bold text-yellow-600">→ {s.solution}</p>
                  <p className="mt-1 text-xs text-neutral-500">{s.detail}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Les offres */}
      <section id="offres" className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Les prestations
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
            Chaque intervention a un livrable concret
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Pas de forfait standardisé. Chaque situation est différente — le niveau d'intervention aussi.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <article
                key={offer.title}
                className={`relative flex h-full flex-col rounded-2xl border p-5 shadow-sm ${
                  offer.highlight
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-neutral-200 bg-white"
                }`}
              >
                {offer.highlight && (
                  <span className="absolute -top-3 left-5 rounded-full bg-yellow-400 px-3 py-0.5 text-xs font-bold text-neutral-900">
                    Le plus demandé
                  </span>
                )}

                <div className="flex items-start gap-3">
                  <span className="text-2xl">{offer.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-950">{offer.title}</h3>
                    <span className="inline-block mt-0.5 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                      {offer.tag}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-neutral-700">
                  <p>
                    <span className="font-semibold text-neutral-900">Pour :</span>{" "}
                    {offer.audience}
                  </p>
                  <p>
                    <span className="font-semibold text-neutral-900">Livrable :</span>{" "}
                    {offer.deliverable}
                  </p>
                  <p className="text-base font-bold text-neutral-950">{offer.pricing}</p>
                </div>

                <div className="mt-auto space-y-2 pt-5">
                  {"trackEvent" in offer ? (
                    <TrackedLink
                      href={offer.href}
                      event={offer.trackEvent}
                      className={`inline-flex min-h-10 w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        offer.highlight
                          ? "bg-yellow-400 text-neutral-900 hover:bg-yellow-300"
                          : "bg-neutral-900 text-white hover:bg-neutral-800"
                      }`}
                    >
                      {offer.ctaLabel}
                    </TrackedLink>
                  ) : (
                    <Link
                      href={offer.href}
                      className={`inline-flex min-h-10 w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        offer.highlight
                          ? "bg-yellow-400 text-neutral-900 hover:bg-yellow-300"
                          : "bg-neutral-900 text-white hover:bg-neutral-800"
                      }`}
                    >
                      {offer.ctaLabel}
                    </Link>
                  )}

                  {"secondaryCtaLabel" in offer && (
                    <Link
                      href={(offer as { secondaryHref: string }).secondaryHref}
                      className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                    >
                      {(offer as { secondaryCtaLabel: string }).secondaryCtaLabel}
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages placeholder */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Ils ont fait appel à FabSystem
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
            Ce qu'ils en disent
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                name: "Pascal M.",
                boat: "Yacht — Rhone-Alpes",
                text: "Diagnostic rapide et précis. En 2h Fabien avait identifié 4 problèmes que je n'avais pas vus en 3 ans. Schéma livré 48h après.",
                stars: 5,
              },
              {
                name: "Isabelle & François",
                boat: "Van aménagé — Rhone-Alpes",
                text: "Visio conseil avant l'achat du matériel. On a évité une erreur de dimensionnement qui aurait coûté cher. Très pédagogue.",
                stars: 5,
              },
              {
                name: "Thierry D.",
                boat: "Catamaran — La Rochelle",
                text: "Refonte complète du tableau électrique. Travail propre, documenté. Je comprends enfin mon installation.",
                stars: 5,
              },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex gap-0.5 text-yellow-400">
                  {"★".repeat(t.stars).split("").map((s, i) => (
                    <span key={i}>{s}</span>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                  "{t.text}"
                </p>
                <div className="mt-4 border-t border-neutral-100 pt-3">
                  <p className="text-sm font-semibold text-neutral-900">{t.name}</p>
                  <p className="text-xs text-neutral-500">{t.boat}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      {/* CTA final */}
      <section className="border-t border-neutral-200 bg-neutral-950 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Encore une hésitation ?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-300">
            Décrivez votre installation et votre situation. Vous obtenez une réponse claire
            sur la meilleure suite — visio, diagnostic ou intervention directe.
          </p>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <TrackedLink
              href="/visio"
              event="click_rdv"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-neutral-900 hover:bg-yellow-300"
            >
              Réserver une visio conseil — 50 €
            </TrackedLink>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-600 px-6 py-3 text-sm font-semibold text-white hover:border-neutral-400"
            >
              Parler de mon projet
            </Link>
          </div>

          <p className="mt-4 text-xs text-neutral-500">
            Bateau · Van · Camping-car &nbsp;•&nbsp; Réponse sous 24–48h ouvrées &nbsp;•&nbsp; Intervention sur rendez-vous
          </p>
        </div>
      </section>
    </main>
  );
}

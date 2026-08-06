import PageHero from "@/components/PageHero";
import ServiceAssurance from "@/components/ServiceAssurance";
import TrackedLink from "@/components/TrackedLink";
import FaqPrestations from "@/components/FaqPrestations";
import { CalBookingProvider, BookButton } from "@/components/CalBooking";
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
    icon: "🔍",
    title: "Diagnostic sur site",
    tag: "Sur rendez-vous",
    audience: "Clarifier une installation existante, identifier les incohérences",
    deliverable: "Rapport priorités sécurité + recommandations",
    pricing: "À partir de 89 €",
    ctaLabel: "Demander un diagnostic",
    href: "/contact",
    highlight: false,
    pedagogique: true,
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
    pedagogique: false,
    anchorId: "installation",
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
    pedagogique: true,
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
    pedagogique: true,
  },
] as const;

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

      {/* Deux parcours */}
      <section className="border-b border-neutral-200 bg-white py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-6 text-sm sm:gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Deux parcours
          </span>
          <a
            href="#offres"
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:border-yellow-400 hover:text-neutral-950 sm:text-sm"
          >
            🔧 Sur place
          </a>
          <a
            href="#instal"
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:border-yellow-400 hover:text-neutral-950 sm:text-sm"
          >
            💻 À distance
          </a>
        </div>
      </section>

      {/* Les offres */}
      <section id="offres" className="scroll-mt-20 bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            🔧 Sur place
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
            Chaque intervention a un livrable concret
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Pas de forfait standardisé. Chaque situation est différente — le niveau d&apos;intervention aussi.
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Vous n&apos;êtes pas sur place ?{" "}
            <a href="#instal" className="underline underline-offset-2 hover:text-neutral-700">
              Voir l&apos;accompagnement à distance
            </a>
            .
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <article
                key={offer.title}
                id={"anchorId" in offer ? offer.anchorId : undefined}
                className={`relative flex h-full scroll-mt-24 flex-col rounded-2xl border p-5 shadow-sm ${
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
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                        {offer.tag}
                      </span>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                          offer.pedagogique
                            ? "bg-green-50 text-green-700"
                            : "bg-neutral-900 text-white"
                        }`}
                      >
                        {offer.pedagogique ? "🎓 Vous comprenez votre installation" : "🔧 On s'occupe de tout"}
                      </span>
                    </div>
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
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* À distance — Instal' */}
      <section id="instal" className="scroll-mt-20 border-t border-neutral-200 bg-neutral-50 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            💻 À distance
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
            Accompagnement à distance — Instal&apos;
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Pas besoin d&apos;être sur place. Diagnostic, suivi de chantier, mise en service — tout
            se fait par photo, message, vocal et points vidéo.
          </p>
        </div>

        <div className="my-8 bg-neutral-900 py-6">
          <p className="mx-auto max-w-3xl px-6 text-center text-lg font-bold text-yellow-400 sm:text-xl">
            Je vends de la tranquillité, en plus de la technique.
          </p>
        </div>

        <div className="mx-auto max-w-6xl px-6">
          <CalBookingProvider>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Diagnostic & Schéma */}
              <article className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <span className="inline-flex w-fit items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-600">
                  Étape 1
                </span>
                <h3 className="mt-3 text-sm font-bold text-neutral-950">Diagnostic & Schéma</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-700">
                  On part de ton besoin réel, on dimensionne ta batterie et ton solaire, et je te
                  livre un schéma de principe clair pour ton installation.
                </p>
                <p className="mt-3 text-lg font-bold text-neutral-950">
                  99,99 €
                </p>
                <div className="mt-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-xs leading-relaxed text-neutral-700">
                  📖 Tu as déjà{" "}
                  <Link href="/ebook" className="font-semibold underline underline-offset-2">
                    le livre
                  </Link>{" "}
                  ? Le montant réellement payé est déduit — précise-le en réservant.
                </div>
                <BookButton
                  offer="Diagnostic & Schéma"
                  className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  Réserver le diagnostic
                </BookButton>
              </article>

              {/* Accompagnement complet */}
              <article className="relative flex h-full flex-col rounded-2xl border-2 border-yellow-400 bg-yellow-50 p-5 pt-7 shadow-sm">
                <span className="absolute -top-3 left-5 rounded-full bg-yellow-400 px-3 py-0.5 text-xs font-bold text-neutral-900">
                  Étape 2 · la suite logique
                </span>
                <h3 className="text-sm font-bold text-neutral-950">Accompagnement complet</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-700">
                  Suivi pas à pas de ton chantier jusqu&apos;à la mise en service : photo, message,
                  vocal, avec des points vidéo réguliers pour faire le bilan.
                </p>
                <p className="mt-3 text-lg font-bold text-neutral-950">
                  250 € <span className="text-xs font-medium text-neutral-500">/ 2 mois</span>
                </p>
                <BookButton
                  offer="Accompagnement complet"
                  className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-neutral-900 transition hover:bg-yellow-300"
                >
                  Démarrer l&apos;accompagnement
                </BookButton>
              </article>

              {/* Suivi mensuel */}
              <article className="flex h-full flex-col rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-5">
                <span className="inline-flex w-fit items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
                  Si besoin, au-delà de 2 mois
                </span>
                <h3 className="mt-3 text-sm font-bold text-neutral-800">Suivi mensuel</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">
                  Le chantier continue plus longtemps que prévu ? Le même accompagnement se
                  poursuit, mois par mois.
                </p>
                <p className="mt-3 text-lg font-bold text-neutral-800">
                  80 € <span className="text-xs font-medium text-neutral-500">/ mois</span>
                </p>
                <BookButton
                  offer="Suivi mensuel"
                  className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                >
                  Prolonger le suivi
                </BookButton>
              </article>
            </div>

            <p className="mt-6 text-center text-xs text-neutral-500">
              Juste une question ponctuelle, sans engagement ?{" "}
              <Link href="/visio" className="underline underline-offset-2 hover:text-neutral-700">
                La visio conseil à l&apos;unité (50 €/h)
              </Link>{" "}
              reste disponible.
            </p>
          </CalBookingProvider>
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

      {/* Témoignages placeholder */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Ils ont fait appel à FabSystem
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
            Ce qu&apos;ils en disent
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
                  &quot;{t.text}&quot;
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

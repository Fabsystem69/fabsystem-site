import PageHero from "@/components/PageHero";
import ServiceAssurance from "@/components/ServiceAssurance";
import TrackedLink from "@/components/TrackedLink";
import QuizFormations from "@/components/QuizFormations";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apprendre l'électricité embarquée gratuitement — bateau, van, camping-car | FabSystem",
  description:
    "Modules gratuits, ressources pédagogiques et outils pour comprendre votre installation 12V, batteries, solaire et 230V à votre rythme. Aucun achat requis.",
  alternates: {
    canonical: "/formations",
  },
  openGraph: {
    title: "Apprendre l'électricité embarquée gratuitement | FabSystem",
    description:
      "Modules gratuits, ressources pédagogiques et outils pour apprendre l'électricité embarquée à votre rythme.",
    url: "https://www.fabsystem.fr/formations",
  },
};

const modulesGratuits = [
  {
    tag: "Gratuit",
    title: "Les bases du 12V embarqué",
    description:
      "Loi d'Ohm, puissance, résistance des câbles. Tout ce qu'il faut savoir pour dimensionner correctement son installation.",
    duration: "~30 min",
    level: "Débutant",
    href: "/formations/bases-12v",
  },
  {
    tag: "Gratuit",
    title: "Lire un schéma électrique",
    description:
      "Décoder un schéma de distribution, identifier les fusibles, les barres omnibus et les points de masse.",
    duration: "~20 min",
    level: "Débutant",
    href: "/formations/lire-schema",
  },
  {
    tag: "Gratuit",
    title: "Les batteries : AGM, GEL, Lithium",
    description:
      "Série, parallèle, différences de technologie et câblage correct d'un banc de batteries.",
    duration: "~25 min",
    level: "Débutant",
    href: "/formations/types-batteries",
  },
] as const;

const modulesAVenir = [
  {
    title: "Dimensionner un banc de batteries",
    description:
      "Calculer votre bilan de consommation, choisir la capacité, gérer la charge et le BMS.",
    level: "Intermédiaire",
  },
  {
    title: "Architecture de distribution 12V",
    description:
      "Concevoir une distribution claire : barres omnibus, fusibles, sectionneurs, points de masse.",
    level: "Intermédiaire",
  },
  {
    title: "Intégration solaire & alternateur",
    description:
      "MPPT, régulateurs, coupleurs, combineurs — comment tout brancher proprement.",
    level: "Intermédiaire",
  },
  {
    title: "Sécuriser le 230V à bord",
    description:
      "Onduleur, chargeur, disjoncteur différentiel, prise de quai — les règles de sécurité AC.",
    level: "Avancé",
  },
] as const;

const levelColors: Record<string, string> = {
  Débutant: "bg-green-50 text-green-700",
  Intermédiaire: "bg-blue-50 text-blue-700",
  Avancé: "bg-orange-50 text-orange-700",
};

export default function FormationsPage() {
  return (
    <main>
      <PageHero
        title="Apprendre l'électricité embarquée, gratuitement"
        subtitle="Modules gratuits, ressources pédagogiques et outils pour comprendre votre installation 12V — à votre rythme, sans inscription, sans achat requis."
        micro="12V · Batteries · Solaire · 230V — bateau, van, camping-car."
        background="/hero-fabsystem.png"
        overlay="bg-black/55"
        ctas={[
          { href: "#modules-gratuits", label: "Voir les modules gratuits", variant: "primary" },
          { href: "#quiz", label: "Tester mes connaissances", variant: "secondary" },
        ]}
        assurance={<ServiceAssurance tone="inverse" />}
      />

      {/* ── INTRO ── */}
      <section className="border-t border-neutral-200 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
              Comprendre avant d&apos;agir
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              L&apos;électricité embarquée s&apos;apprend. Avec les bons repères, vous dimensionnez
              correctement, évitez les erreurs coûteuses et maintenez votre installation en
              confiance. Les modules sont pensés pour les non-électriciens — avec des exemples
              concrets tirés d&apos;installations réelles.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Modules disponibles", value: "3", desc: "100 % gratuits" },
                { label: "Modules à venir", value: "4+", desc: "en préparation" },
                { label: "Coaching visio", value: "Sur RDV", desc: "sur votre projet réel" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center"
                >
                  <div className="text-xl font-bold text-neutral-900">{stat.value}</div>
                  <div className="text-sm font-medium text-neutral-800">{stat.label}</div>
                  <div className="text-xs text-neutral-500">{stat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MODULES GRATUITS ── */}
      <section
        id="modules-gratuits"
        className="mx-auto max-w-6xl scroll-mt-20 px-6 py-8 sm:py-10"
      >
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            Accès libre · Aucune inscription
          </div>
          <h2 className="mt-3 text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
            Modules disponibles — Les fondamentaux
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            Pour comprendre les bases avant d&apos;aller plus loin. Gratuit, sans compte requis.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modulesGratuits.map((module) => (
            <article
              key={module.title}
              className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  {module.tag}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${levelColors[module.level]}`}
                >
                  {module.level}
                </span>
              </div>

              <h3 className="mt-3 text-sm font-semibold text-neutral-950">{module.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">
                {module.description}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                <span className="text-xs text-neutral-500">{module.duration}</span>
                <span className="text-sm font-bold text-green-700">Gratuit</span>
              </div>

              <div className="mt-3">
                <Link
                  href={module.href}
                  className="inline-flex min-h-9 w-full items-center justify-center rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                >
                  Accéder au module →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── MODULES À VENIR ── */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-8 sm:py-10">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-500">
              ⏳ À venir
            </div>
            <h2 className="mt-3 text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
              Prochains modules en préparation
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Ces modules sont en cours de rédaction. Ils seront disponibles gratuitement
              dès leur mise en ligne.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {modulesAVenir.map((module) => (
              <div
                key={module.title}
                className="flex flex-col rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-4 opacity-70"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
                    À venir
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${levelColors[module.level]}`}
                  >
                    {module.level}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-neutral-700">{module.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  {module.description}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs text-neutral-400">
            Vous souhaitez être notifié à la sortie d&apos;un module ?{" "}
            <Link href="/contact" className="underline underline-offset-4 hover:text-neutral-600">
              Contactez-nous
            </Link>
            .
          </p>
          <p className="mt-2 text-xs text-neutral-400">
            En attendant, la plomberie, la VASP et la mise en service sont déjà traitées en
            détail dans{" "}
            <Link
              href="/ebook"
              className="underline underline-offset-4 hover:text-neutral-600"
            >
              nos ebooks
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── EBOOK ── */}
      <section id="ebook" className="border-t border-neutral-100 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10 lg:gap-16">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                Pour aller plus loin
              </div>
              <h2 className="mt-3 text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
                Envie de tout avoir au même endroit ?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                Les modules gratuits posent les bases. Nos ebooks vont plus loin : dimensionnement,
                ordre de pose, VASP et assurance, plomberie embarquée, mise en service — le tout
                structuré, avec un exemplaire personnalisé à garder sur le chantier. Le premier,{" "}
                <strong>Câbler son van sans se planter</strong>, est disponible dès maintenant —
                d&apos;autres suivront.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-600">
                {[
                  "8 parties, dans l'ordre du chantier",
                  "Version bureau et version poche",
                  "Exemplaire personnalisé à ton nom",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 text-yellow-600">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm sm:min-w-[260px]">
              <div className="w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-200">
                <Image
                  src="/ebook/couverture.jpg"
                  alt="Couverture du livre « Câbler son van sans se planter »"
                  width={200}
                  height={266}
                  className="h-auto w-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Câbler son van</p>
                <p className="text-xs text-neutral-500">+ d&apos;autres ebooks à venir</p>
                <Link
                  href="/ebook"
                  className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-neutral-900 hover:bg-yellow-300"
                >
                  Voir les ebooks
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OUTILS PÉDAGOGIQUES ── */}
      <section id="outils" className="border-t border-neutral-100 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h2 className="text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
                Outils pédagogiques
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                Des calculateurs pour mettre en pratique ce que vous venez d&apos;apprendre :
                section de câble, capacité de batterie, dimensionnement.
              </p>
            </div>
            <Link
              href="/outils"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
            >
              Voir les outils
            </Link>
          </div>
        </div>
      </section>

      {/* ── QUIZ ── */}
      <section id="quiz" className="border-t border-neutral-100 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-5 max-w-xl">
              <h2 className="text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
                Testez vos connaissances
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                10 questions sur les 3 modules — loi d&apos;Ohm, schémas, batteries. Idéal pour
                vérifier vos acquis après avoir parcouru les modules.
              </p>
            </div>
            <QuizFormations />
          </div>
        </div>
      </section>

      {/* ── COACHING DÉCOUVERTE ── */}
      <section id="coaching" className="border-t border-neutral-200 bg-neutral-50 py-8 sm:py-10">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10 lg:gap-16">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Gratuit · Sans engagement
              </div>
              <h2 className="mt-3 text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
                Coaching découverte — 20 min offerts
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                Vous avancez sur les modules et bloquez sur un point, ou vous voulez savoir si
                une visio conseil correspond à votre situation ? On échange 20 minutes
                gratuitement pour faire le point ensemble.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-600">
                {[
                  "100 % en visio, où que vous soyez",
                  "Aucune préparation requise",
                  "Sans engagement — on discute, vous décidez",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-600">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="shrink-0 rounded-2xl border border-green-200 bg-white p-5 shadow-sm sm:min-w-[220px]">
              <p className="text-2xl font-bold text-green-700">Gratuit</p>
              <p className="mt-0.5 text-sm text-neutral-500">20 minutes · Visio</p>
              <TrackedLink
                href="/contact"
                event="click_rdv"
                className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Demander ce point gratuit
              </TrackedLink>
              <Link
                href="/contact"
                className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Poser une question
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

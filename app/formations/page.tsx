import PageHero from "@/components/PageHero";
import ServiceAssurance from "@/components/ServiceAssurance";
import TrackedLink from "@/components/TrackedLink";
import QuizFormations from "@/components/QuizFormations";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formations électricité embarquée — bateau, van, camping-car | FabSystem",
  description:
    "Modules e-learning gratuits et premium + coaching visio en électricité embarquée. Comprenez votre installation 12V, batteries, solaire et 230V à votre rythme.",
  alternates: {
    canonical: "/formations",
  },
  openGraph: {
    title: "Formations électricité embarquée | FabSystem",
    description:
      "Apprenez l'électricité embarquée à votre rythme : modules e-learning (gratuits & premium) + coaching visio personnalisé.",
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

const modulesPremium = [
  {
    tag: "Premium",
    title: "Dimensionner un banc de batteries",
    description:
      "Calculer votre bilan de consommation, choisir la capacité, gérer la charge et le BMS. Exercices inclus.",
    duration: "~1h",
    level: "Intermédiaire",
    price: "29 €",
  },
  {
    tag: "Premium",
    title: "Architecture de distribution 12V",
    description:
      "Concevoir une distribution claire : barres omnibus, fusibles, sectionneurs, points de masse. Exemples réels.",
    duration: "~1h30",
    level: "Intermédiaire",
    price: "39 €",
  },
  {
    tag: "Premium",
    title: "Intégration solaire & alternateur",
    description:
      "MPPT, régulateurs, coupleurs, combineurs — comment tout brancher proprement et éviter les erreurs classiques.",
    duration: "~1h",
    level: "Intermédiaire",
    price: "29 €",
  },
  {
    tag: "Premium",
    title: "Sécuriser le 230V à bord",
    description:
      "Onduleur, chargeur, disjoncteur différentiel, prise de quai — les règles de sécurité AC indispensables.",
    duration: "~45 min",
    level: "Avancé",
    price: "29 €",
  },
  {
    tag: "Premium",
    title: "Pack complet : De zéro à l'installation",
    description:
      "Tous les modules premium + accès prioritaire au coaching visio. Le parcours complet pour une installation maîtrisée.",
    duration: "Accès illimité",
    level: "Tous niveaux",
    price: "99 €",
    highlight: true,
  },
] as const;

const coachingOptions = [
  {
    title: "Coaching e-learning",
    description:
      "Vous avancez sur les modules, j'aide à débloquer les points difficiles. Session 30 min pour clarifier vos questions après un module.",
    duration: "30 min",
    price: "30 €",
    ctaLabel: "Réserver une session",
    href: "/visio",
  },
  {
    title: "Coaching sur votre projet",
    description:
      "On analyse votre installation réelle ensemble. Schéma, dimensionnement, priorités. Adapté à votre bateau ou camping-car.",
    duration: "60 min",
    price: "50 €",
    ctaLabel: "Réserver une visio",
    href: "/visio",
    highlight: true,
  },
] as const;

const levelColors: Record<string, string> = {
  Débutant: "bg-green-50 text-green-700",
  Intermédiaire: "bg-blue-50 text-blue-700",
  Avancé: "bg-orange-50 text-orange-700",
  "Tous niveaux": "bg-neutral-100 text-neutral-700",
};

export default function FormationsPage() {
  return (
    <main>
      <PageHero
        title="Formations électricité embarquée"
        subtitle="Apprenez à votre rythme avec des modules e-learning clairs — ou avancez avec un coaching visio personnalisé."
        micro="12V · Batteries · Solaire · 230V · Sécurité — bateau, van, camping-car."
        background="/hero-fabsystem.png"
        overlay="bg-black/55"
        ctas={[
          { href: "#modules-gratuits", label: "Voir les modules gratuits", variant: "primary" },
          { href: "#coaching", label: "Coaching visio", variant: "secondary" },
        ]}
        assurance={<ServiceAssurance tone="inverse" />}
      />

      {/* ── INTRO ── */}
      <section className="border-t border-neutral-200 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
              Comprendre avant d'agir
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              L'électricité embarquée s'apprend. Avec les bons repères, vous dimensionnez
              correctement, évitez les erreurs coûteuses et maintenez votre installation en
              confiance. Les modules sont pensés pour les non-électriciens — avec des exemples
              concrets tirés d'installations réelles.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Modules gratuits", value: "3", desc: "pour démarrer" },
                { label: "Modules premium", value: "4+", desc: "pour aller plus loin" },
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
            Accès libre
          </div>
          <h2 className="mt-3 text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
            Modules gratuits — Les fondamentaux
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            Pour comprendre les bases avant d'aller plus loin. Aucune inscription requise.
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

      {/* ── MODULES PREMIUM ── */}
      <section
        id="modules-premium"
        className="border-t border-neutral-100 bg-neutral-50 py-8 sm:py-10"
      >
        <div className="mx-auto max-w-6xl scroll-mt-20 px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
              Premium
            </div>
            <h2 className="mt-3 text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
              Modules premium — Aller plus loin
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Des modules approfondis avec exercices, schémas annotés et exemples d'installations
              réelles. Accès à vie après achat.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modulesPremium.map((module) => (
              <article
                key={module.title}
                className={`flex h-full flex-col rounded-2xl border p-4 shadow-sm sm:p-5 ${
                  module.highlight
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      module.highlight
                        ? "bg-white/10 text-white"
                        : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {module.tag}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      module.highlight
                        ? "bg-white/10 text-white"
                        : levelColors[module.level]
                    }`}
                  >
                    {module.level}
                  </span>
                </div>

                <h3
                  className={`mt-3 text-sm font-semibold ${
                    module.highlight ? "text-white" : "text-neutral-950"
                  }`}
                >
                  {module.title}
                </h3>
                <p
                  className={`mt-2 flex-1 text-sm leading-relaxed ${
                    module.highlight ? "text-white/80" : "text-neutral-600"
                  }`}
                >
                  {module.description}
                </p>

                <div
                  className={`mt-4 flex items-center justify-between border-t pt-3 ${
                    module.highlight ? "border-white/10" : "border-neutral-100"
                  }`}
                >
                  <span
                    className={`text-xs ${module.highlight ? "text-white/60" : "text-neutral-500"}`}
                  >
                    {module.duration}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      module.highlight ? "text-white" : "text-neutral-900"
                    }`}
                  >
                    {module.price}
                  </span>
                </div>

                <div className="mt-3">
                  <Link
                    href="/contact"
                    className={`inline-flex min-h-9 w-full items-center justify-center rounded-md px-3 py-2 text-sm font-semibold ${
                      module.highlight
                        ? "bg-white text-neutral-900 hover:bg-neutral-100"
                        : "bg-neutral-900 text-white hover:bg-neutral-800"
                    }`}
                  >
                    {module.highlight ? "Voir le pack complet" : "Accéder au module"}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── COACHING VISIO ── */}
      <section id="coaching" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-8 sm:py-10">
        <div className="max-w-3xl">
          <h2 className="text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
            Coaching visio — Sur votre projet
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            Vous avancez dans les modules et bloquez sur un point précis, ou vous voulez analyser
            votre installation réelle ensemble. Les sessions visio sont courtes, ciblées et
            directement actionnables.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {coachingOptions.map((option) => (
            <article
              key={option.title}
              className={`flex h-full flex-col rounded-2xl border p-4 shadow-sm sm:p-5 ${
                option.highlight
                  ? "border-neutral-900 bg-neutral-900"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${
                    option.highlight ? "text-white/60" : "text-neutral-500"
                  }`}
                >
                  {option.duration}
                </span>
                <span
                  className={`text-base font-bold ${
                    option.highlight ? "text-white" : "text-neutral-900"
                  }`}
                >
                  {option.price}
                </span>
              </div>

              <h3
                className={`mt-3 text-sm font-semibold ${
                  option.highlight ? "text-white" : "text-neutral-950"
                }`}
              >
                {option.title}
              </h3>
              <p
                className={`mt-2 flex-1 text-sm leading-relaxed ${
                  option.highlight ? "text-white/80" : "text-neutral-600"
                }`}
              >
                {option.description}
              </p>

              <div className="mt-4">
                <TrackedLink
                  href={option.href}
                  event="click_rdv"
                  className={`inline-flex min-h-9 w-full items-center justify-center rounded-md px-3 py-2 text-sm font-semibold ${
                    option.highlight
                      ? "bg-white text-neutral-900 hover:bg-neutral-100"
                      : "bg-neutral-900 text-white hover:bg-neutral-800"
                  }`}
                >
                  {option.ctaLabel}
                </TrackedLink>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm text-neutral-700">
            <span className="font-semibold text-neutral-900">Pas sûr par où commencer ?</span>{" "}
            Démarrez par les modules gratuits pour vous situer, puis choisissez le module ou le
            coaching adapté à votre projet.
          </p>
        </div>
      </section>

      {/* ── QUIZ ── */}
      <section id="quiz" className="border-t border-neutral-100 bg-neutral-50 py-8 sm:py-10">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-5 max-w-xl">
              <h2 className="text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
                Testez vos connaissances
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                10 questions sur les 3 modules gratuits — loi d&apos;Ohm, schémas, batteries. Idéal pour
                vérifier vos acquis avant de passer aux modules premium.
              </p>
            </div>
            <QuizFormations />
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
          <div className="max-w-3xl">
            <h2 className="text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
              Une question avant de commencer ?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Si vous ne savez pas quel module correspond à votre niveau ou votre projet, décrivez
              votre situation et vous recevrez une recommandation claire.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
            >
              Poser une question
            </Link>
            <TrackedLink
              href="/visio"
              event="click_rdv"
              className="inline-flex w-full items-center justify-center rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 sm:w-auto"
            >
              Réserver une visio conseil
            </TrackedLink>
          </div>

          <p className="mt-3 text-xs text-neutral-500">
            Bateau · van · camping-car • Réponse sous 24–48h ouvrées
          </p>
        </div>
      </section>
    </main>
  );
}

import PageHero from "@/components/PageHero";
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
        title="AUTODIDACTE"
        subtitle="Apprendre l'électricité embarquée, gratuitement"
        micro="Modules gratuits, ressources pédagogiques et outils pour comprendre votre installation 12V — à votre rythme, sans inscription, sans achat requis."
        background="/hero-fabsystem.png"
        overlay="bg-black/55"
        ctas={[
          { href: "#modules-outils", label: "Voir les modules", variant: "primary" },
          { href: "#outils-essentiels", label: "Voir les outils", variant: "secondary" },
        ]}
      />

      {/* ── MODULES & OUTILS ── */}
      <section
        id="modules-outils"
        className="scroll-mt-20 border-t border-neutral-200 bg-white py-10 sm:py-14"
      >
        <div className="mx-auto max-w-6xl px-6">
          {/* Intro + stats */}
          <div className="max-w-3xl">
            <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
              Comprendre avant d&apos;agir
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              L&apos;électricité embarquée s&apos;apprend. Avec les bons repères, vous dimensionnez
              correctement, évitez les erreurs coûteuses et maintenez votre installation en
              confiance. Les modules sont pensés pour les non-électriciens — avec des exemples
              concrets tirés d&apos;installations réelles.
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:max-w-2xl sm:grid-cols-3">
            {[
              { label: "Modules disponibles", value: "3", desc: "100 % gratuits" },
              { label: "Modules à venir", value: "4+", desc: "en préparation" },
              { label: "Coaching visio", value: "Sur RDV", desc: "sur votre projet réel" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-center"
              >
                <div className="text-lg font-bold text-neutral-900">{stat.value}</div>
                <div className="text-xs font-medium text-neutral-800">{stat.label}</div>
                <div className="text-[11px] text-neutral-500">{stat.desc}</div>
              </div>
            ))}
          </div>

          {/* Deux blocs au même niveau visuel : modules et outils */}
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {/* Bloc modules */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Accès libre · Aucune inscription
              </div>
              <h3 className="mt-3 text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
                Modules disponibles
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                Pour comprendre les bases avant d&apos;aller plus loin. Gratuit, sans compte
                requis.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {modulesGratuits.map((module) => (
                  <article
                    key={module.title}
                    className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
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

                    <h4 className="mt-3 text-sm font-semibold text-neutral-950">
                      {module.title}
                    </h4>
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

                {/* Quiz fusionné comme 4e item de la grille */}
                <a
                  href="#quiz"
                  className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm hover:bg-neutral-100"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
                      Quiz
                    </span>
                    <span className="inline-flex items-center rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                      10 questions
                    </span>
                  </div>
                  <h4 className="mt-3 text-sm font-semibold text-neutral-950">
                    Testez vos connaissances
                  </h4>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">
                    Loi d&apos;Ohm, schémas, batteries — vérifiez vos acquis après avoir parcouru
                    les modules.
                  </p>
                  <div className="mt-4 border-t border-neutral-200 pt-3 text-sm font-semibold text-neutral-900">
                    Lancer le quiz ↓
                  </div>
                </a>
              </div>
            </div>

            {/* Bloc outils */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                Pratique
              </div>
              <h3 className="mt-3 text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
                Outils
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                Des calculateurs pour mettre en pratique ce que vous venez d&apos;apprendre, et le
                matériel physique pour passer à l&apos;action sur le chantier.
              </p>

              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-neutral-950">Outils pédagogiques</h4>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  Section de câble, capacité de batterie, dimensionnement — trois calculateurs
                  gratuits, sans inscription.
                </p>
                <Link
                  href="/outils"
                  className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                >
                  Voir les calculateurs →
                </Link>
              </div>

              {/* Section "Outils essentiels" masquée : contenu pas encore finalisé.
                  Voir components/FormationsEssentialTools.tsx et lib/formations-tools.ts. */}
            </div>
          </div>

          {/* Quiz interactif (ancre stable /formations#quiz, referencee par les modules) */}
          <div id="quiz" className="mt-10 scroll-mt-20 border-t border-neutral-200 pt-8">
            <div className="mx-auto max-w-3xl">
              <h3 className="text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
                Testez vos connaissances
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                10 questions sur les 3 modules — loi d&apos;Ohm, schémas, batteries. Idéal pour
                vérifier vos acquis après avoir parcouru les modules.
              </p>
              <div className="mt-4">
                <QuizFormations />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCHAINS MODULES (compact) ── */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-500">
                ⏳ À venir
              </div>
              <h2 className="mt-2 text-sm font-semibold tracking-tight text-neutral-900">
                Prochains modules en préparation
              </h2>
            </div>
            <p className="text-xs text-neutral-500">
              Notifié à la sortie ?{" "}
              <Link href="/contact" className="underline underline-offset-4 hover:text-neutral-700">
                Contactez-nous
              </Link>
            </p>
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible">
            {modulesAVenir.map((module) => (
              <div
                key={module.title}
                className="flex w-56 shrink-0 flex-col rounded-xl border border-dashed border-neutral-300 bg-white/60 p-3 opacity-70 sm:w-auto"
              >
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${levelColors[module.level]}`}
                >
                  {module.level}
                </span>
                <h3 className="mt-2 text-xs font-semibold text-neutral-700">{module.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  {module.description}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-neutral-400">
            En attendant, la plomberie, la VASP et la mise en service sont déjà traitées en détail
            dans{" "}
            <Link href="/ebook" className="underline underline-offset-4 hover:text-neutral-600">
              nos ebooks
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── POUR ALLER PLUS LOIN (ebook + coaching) ── */}
      <section className="border-t border-neutral-200 bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
              Pour aller plus loin
            </div>
            <h2 className="mt-3 text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
              Envie d&apos;aller plus loin ?
            </h2>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Ebook */}
            <div id="ebook" className="scroll-mt-20 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 shrink-0 overflow-hidden rounded-lg border border-neutral-200">
                  <Image
                    src="/ebook/couverture.jpg"
                    alt="Couverture du livre « Câbler son van sans se planter »"
                    width={160}
                    height={213}
                    className="h-auto w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Câbler son van</p>
                  <p className="text-xs text-neutral-500">+ d&apos;autres ebooks à venir</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                Nos ebooks vont plus loin que les modules gratuits : dimensionnement, ordre de
                pose, VASP et assurance, plomberie embarquée, mise en service — le tout
                structuré, avec un exemplaire personnalisé à garder sur le chantier.
              </p>
              <Link
                href="/ebook"
                className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-neutral-900 hover:bg-yellow-300"
              >
                Voir les ebooks
              </Link>
            </div>

            {/* Coaching découverte */}
            <div id="coaching" className="scroll-mt-20 rounded-2xl border border-green-200 bg-green-50/40 p-5 shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Gratuit · Sans engagement
              </div>
              <p className="mt-3 text-sm font-semibold text-neutral-900">
                Coaching découverte — 20 min offerts
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                Vous bloquez sur un point, ou vous voulez savoir si l&apos;accompagnement à
                distance correspond à votre situation ? On échange 20 minutes gratuitement pour
                faire le point ensemble.
              </p>
              <TrackedLink
                href="/contact"
                event="click_rdv"
                className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Demander ce point gratuit
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

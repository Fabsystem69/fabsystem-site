import type { Metadata } from "next";
import Link from "next/link";
import { PublicTestimonialForm } from "@/components/testimonials/PublicTestimonialForm";
import { PageIntro } from "@/components/public/PageIntro";

export const metadata: Metadata = {
  title: "Laisser un témoignage client",
  description:
    "Partagez votre retour d'expérience avec FabSystem. Chaque avis est relu avant publication.",
  alternates: {
    canonical: "/temoignage",
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: [
    "témoignage client FabSystem",
    "avis client électricité embarquée",
    "avis bateau van camping-car",
    "retour expérience FabSystem",
  ],
  openGraph: {
    title: "Laisser un témoignage client",
    description:
      "Partagez votre retour d'expérience avec FabSystem. Chaque avis est relu avant publication.",
    url: "https://www.fabsystem.fr/temoignage",
    siteName: "FabSystem",
    images: [
      {
        url: "/hero-fabsystem.png",
        width: 1200,
        height: 630,
        alt: "FabSystem - Témoignages clients",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Laisser un témoignage client",
    description:
      "Partagez votre retour d'expérience avec FabSystem. Chaque avis est relu avant publication.",
    images: ["/hero-fabsystem.png"],
  },
};

const PROCESS_STEPS = [
  "Vous laissez un retour simple sur votre projet ou l’accompagnement reçu.",
  "Votre témoignage est transmis à Fabien pour relecture, non publié dans un premier temps.",
  "Il n’est mis en ligne qu’après validation manuelle.",
] as const;

const WRITING_TIPS = [
  "Expliquez d’où vous partiez : débutant, refonte, panne, schéma à valider…",
  "Dites ce qui vous a été utile : clarté, méthode, patience, sécurité, autonomie…",
  "Restez concret : quelques phrases honnêtes valent mieux qu’un long texte vague.",
] as const;

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Laisser un témoignage client",
  description:
    "Page de dépôt de témoignage client FabSystem. Chaque avis est relu avant publication.",
  url: "https://www.fabsystem.fr/temoignage",
  inLanguage: "fr-FR",
  isPartOf: {
    "@type": "WebSite",
    name: "FabSystem",
    url: "https://www.fabsystem.fr",
  },
  about: {
    "@type": "ProfessionalService",
    name: "FabSystem",
    url: "https://www.fabsystem.fr",
    areaServed: ["Rhône", "Auvergne-Rhône-Alpes", "France"],
    knowsAbout: [
      "électricité embarquée",
      "bateau",
      "van aménagé",
      "camping-car",
      "diagnostic électrique",
      "accompagnement technique",
    ],
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: "https://www.fabsystem.fr",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Laisser un témoignage",
        item: "https://www.fabsystem.fr/temoignage",
      },
    ],
  },
};

function toJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default function TemoignagePage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(webPageJsonLd) }}
      />

      <PageIntro
        eyebrow="Avis clients"
        title="Laisser un témoignage"
        description="Votre retour aide les prochains clients à se projeter. Rien n’est publié automatiquement : chaque avis est relu avant mise en ligne."
      />

      <section id="apres-hero" className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-neutral-950">Partager votre retour</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Que vous soyez totalement débutant ou déjà avancé, le plus utile est souvent un
              retour concret sur ce que l’accompagnement vous a permis de faire.
            </p>

            <PublicTestimonialForm />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Publication
              </p>
              <h2 className="mt-2 text-base font-semibold text-neutral-950">
                Comment ça se passe
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700">
                {PROCESS_STEPS.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-400 text-[11px] font-bold text-neutral-950">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Pour aider
              </p>
              <h2 className="mt-2 text-base font-semibold text-neutral-950">
                Trois bons repères
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700">
                {WRITING_TIPS.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <span aria-hidden="true" className="mt-1 text-brand-500">
                      ★
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <h2 className="text-base font-semibold text-neutral-950">Besoin plutôt de me parler ?</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                Si votre retour soulève aussi une nouvelle question technique, la page contact
                reste le meilleur point d’entrée.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="/contact"
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                  Aller au contact
                </Link>
                <Link
                  href="/"
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-white"
                >
                  Retour à l’accueil
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

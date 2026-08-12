import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/public/PageIntro";
import { Deroulement } from "@/components/services/Deroulement";
import { Faq } from "@/components/services/Faq";
import { resolvePrestationsCategorie, prestationsUniversQuery } from "@/lib/prestations-search-params";

// Services V2 (UI-10 §3) — /prestations devient une page d'ORIENTATION,
// plus une page qui empile accompagnement + intervention + réalisations +
// FAQ (jugée trop longue, sections diluées). Deux choix principaux
// immédiatement visibles ; "Je fais seul" reste visible mais secondaire,
// renvoyé vers Outils/Les Bases plutôt que traité comme une offre de
// service à part entière (mission §3 : "ne pas traiter Je fais seul comme
// une vraie offre de service").
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services électricité embarquée — accompagnement à distance et terrain",
  description:
    "Fabien vous accompagne à distance ou sur le terrain pour concevoir, vérifier et sécuriser votre installation électrique embarquée : bateau, van, camping-car.",
  alternates: {
    canonical: "/prestations",
  },
};

export default async function PrestationsPage({
  searchParams,
}: {
  searchParams: Promise<{ univers?: string | string[] }>;
}) {
  const { univers } = await searchParams;
  const query = prestationsUniversQuery(resolvePrestationsCategorie(univers));

  return (
    <main>
      <PageIntro
        title="Vous avez un projet. Comment voulez-vous avancer ?"
        description="Deux façons d'être accompagné par Fabien, selon ce que vous voulez faire vous-même."
      />

      <section className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`/prestations/accompagnement${query}`}
            className="group flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-card transition-colors duration-150 hover:border-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                On fait ensemble
              </p>
              <h2 className="mt-2 text-xl font-bold text-neutral-950">Être accompagné</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Vous réalisez votre projet vous-même. Fabien vous aide à faire les bons choix, à
                vérifier chaque étape et à débloquer les difficultés.
              </p>
            </div>
            <span className="mt-5 inline-flex h-10 items-center gap-1 self-start whitespace-nowrap rounded-lg bg-brand-400 px-4 text-sm font-semibold text-neutral-900 transition-colors duration-150 group-hover:bg-brand-300">
              Découvrir les accompagnements
              <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
            </span>
          </Link>

          <Link
            href={`/prestations/intervention${query}`}
            className="group flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-card transition-colors duration-150 hover:border-neutral-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
                Je confie
              </p>
              <h2 className="mt-2 text-xl font-bold text-white">Confier mon installation</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                Fabien intervient directement sur votre bateau, votre van ou votre camping-car :
                diagnostic, installation, dépannage, refit.
              </p>
            </div>
            <span className="mt-5 inline-flex h-10 items-center gap-1 self-start whitespace-nowrap rounded-lg bg-brand-400 px-4 text-sm font-semibold text-neutral-900 transition-colors duration-150 group-hover:bg-brand-300">
              Découvrir les interventions
              <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
            </span>
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4">
          <p className="text-sm text-neutral-700">
            <span className="font-semibold text-neutral-950">Vous préférez avancer seul ?</span>{" "}
            Les outils et Les Bases restent gratuits, sans compte.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/outils" className="text-sm font-semibold text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900">
              Outils gratuits →
            </Link>
            <Link href="/formations" className="text-sm font-semibold text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900">
              Les bases →
            </Link>
          </div>
        </div>
      </section>

      <Deroulement />
      <Faq />
    </main>
  );
}

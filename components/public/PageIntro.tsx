import type { ReactNode } from "react";

// UI-10 — en-tête compact pour les pages publiques secondaires (Services,
// Boutique, Les Bases, Outils, Contact, À propos, landers SEO). Remplace le
// grand Hero plein cadre (photo + overlay) hérité de UI-9.1 : le constat
// utilisateur est que ces Hero n'apportent pas assez de valeur sur les
// pages secondaires et retardent l'arrivée du contenu réel. Seule la Home
// garde un vrai grand Hero (components/public/PublicHero.tsx) — c'est la
// seule page où ce traitement fort reste justifié.
export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <section className="border-b border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-6xl px-6 py-6 sm:py-8">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={`${eyebrow ? "mt-1.5" : ""} text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl`}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">{description}</p>
        ) : null}
      </div>
    </section>
  );
}

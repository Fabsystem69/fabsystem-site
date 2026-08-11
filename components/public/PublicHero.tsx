import Link from "next/link";
import type { ReactNode } from "react";
import TrackedLink from "@/components/TrackedLink";
import { resolveBackgroundImage } from "@/lib/background-image";

// UI-9.1 — primitive Hero UNIQUE pour tout le site public, Home comprise.
// Avant cette mission, 5 systèmes différents coexistaient (PageHero.tsx,
// home/Hero.tsx, boutique/Hero.tsx, lesbases/Hero.tsx, outils/Hero.tsx, +
// le Hero inline de app/contact/page.tsx avec un min-height arbitraire) —
// voir docs/audits/UI-9.1-HEROS.md, "Inventaire avant". Un seul composant,
// une seule mise en page, mêmes proportions partout : plus de branche
// "variant", plus de mise en page photo-à-côté-du-texte réservée à la
// Home — la Home utilise exactement le même Hero que Services (référence
// visuelle retenue par la mission).

export type PublicHeroAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
  external?: boolean;
  event?: string;
};

const ACTION_BASE =
  "inline-flex min-h-10 w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition-colors duration-150 sm:w-auto";

const ACTION_VARIANT = {
  primary: "bg-brand-400 text-neutral-900 hover:bg-brand-300 shadow-sm",
  secondary: "border border-white/50 text-white hover:bg-white/10",
};

function HeroAction({ action }: { action: PublicHeroAction }) {
  const className = `${ACTION_BASE} ${ACTION_VARIANT[action.variant === "secondary" ? "secondary" : "primary"]}`;

  if (action.external) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer" className={className}>
        {action.label}
      </a>
    );
  }

  if (action.event) {
    return (
      <TrackedLink href={action.href} event={action.event} className={className}>
        {action.label}
      </TrackedLink>
    );
  }

  return (
    <Link href={action.href} className={className}>
      {action.label}
    </Link>
  );
}

// Indicateur de scroll (UI-9.1) : deux chevrons fins, aucun texte, aucun
// emoji, aucune pastille. `<a href="#id">` réel — fonctionne sans JS
// (scroll-behavior: smooth déjà global, app/globals.css) et reste
// navigable au clavier nativement (pas de bouton custom nécessaire).
// L'animation utilise `animate-hero-scroll-hint` (tailwind.config.js,
// mouvement de 6px sur 2.2s) au lieu de `animate-bounce` par défaut, jugé
// trop marqué pour un indicateur permanent ; `prefers-reduced-motion` est
// déjà neutralisé globalement (app/globals.css), aucun code spécifique
// requis ici.
function HeroScrollIndicator({ targetId }: { targetId: string }) {
  return (
    <a
      href={`#${targetId}`}
      aria-label="Voir la suite de la page"
      className="absolute inset-x-0 bottom-8 z-10 mx-auto flex h-10 w-10 items-center justify-center text-white/70 transition-colors duration-150 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:bottom-6"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 20"
        className="h-5 w-6 motion-safe:animate-hero-scroll-hint"
        fill="none"
      >
        <path
          d="M4 2L12 9L20 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />
        <path
          d="M4 10L12 17L20 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

const BACKGROUND = "/hero-fabsystem.png";
const OVERLAY = "bg-black/60";

export function PublicHero({
  eyebrow,
  title,
  description,
  micro,
  primaryAction,
  secondaryAction,
  assurance,
  scrollTargetId,
  showScrollIndicator = true,
}: {
  eyebrow?: string;
  title: ReactNode;
  description: ReactNode;
  /** Ligne secondaire optionnelle, plus discrète que la description. */
  micro?: ReactNode;
  primaryAction?: PublicHeroAction;
  secondaryAction?: PublicHeroAction;
  /** Slot libre (ex. <ServiceAssurance />). */
  assurance?: ReactNode;
  /** id (sans #) de la première section réelle après le Hero — requis pour
   * afficher l'indicateur de scroll (une vraie ancre de page, jamais une
   * cible inventée). */
  scrollTargetId?: string;
  /** Désactive l'indicateur même si scrollTargetId est fourni — à réserver
   * aux Hero anormalement courts ou aux cas d'ambiguïté fonctionnelle
   * (aucun cas de ce type actuellement sur le site public). */
  showScrollIndicator?: boolean;
}) {
  const background = resolveBackgroundImage(BACKGROUND);
  const actions = [primaryAction, secondaryAction].filter(
    (action): action is PublicHeroAction => Boolean(action)
  );
  const indicatorVisible = showScrollIndicator && Boolean(scrollTargetId);

  return (
    <section className="relative bg-cover bg-center" style={{ backgroundImage: background }}>
      <div className={`absolute inset-0 ${OVERLAY}`} />

      <div
        className={`relative z-10 mx-auto max-w-6xl px-6 pt-8 text-white sm:pt-10 ${
          indicatorVisible ? "pb-16 sm:pb-14" : "pb-8 sm:pb-10"
        }`}
      >
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={`${eyebrow ? "mt-3" : ""} text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl`}
        >
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
          {description}
        </p>
        {micro ? (
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/75 sm:text-sm">
            {micro}
          </p>
        ) : null}

        {actions.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {actions.map((action) => (
              <HeroAction key={action.href + action.label} action={action} />
            ))}
          </div>
        ) : null}

        {assurance ? <div className="mt-4">{assurance}</div> : null}
      </div>

      {indicatorVisible ? <HeroScrollIndicator targetId={scrollTargetId!} /> : null}
    </section>
  );
}

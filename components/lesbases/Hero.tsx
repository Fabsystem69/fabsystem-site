import { Button } from "@/components/ui/Button";
import { resolveBackgroundImage } from "@/lib/background-image";

// Les Bases V2 — Hero (docs/refonte-site-public/les-bases/01-HERO-MODULES.md
// §1). Textes repris mot pour mot du CDC. Hero sombre et technique
// (direction visuelle identique à l'ancien Hero, même photo réelle déjà
// utilisée), un seul CTA vers l'ancre Modules — pas de CTA Outils, pas de
// Volta, pas de statistiques.
export function Hero() {
  const background = resolveBackgroundImage("/hero-fabsystem.png");

  return (
    <section className="relative bg-cover bg-center" style={{ backgroundImage: background }}>
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-14 text-white sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
          Les bases
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Comprendre avant de se lancer.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
          Les fondamentaux de l&apos;électricité embarquée, expliqués simplement et gratuitement.
        </p>

        <div className="mt-8">
          <Button href="#modules" variant="primary">
            Commencer par les modules →
          </Button>
        </div>
      </div>
    </section>
  );
}

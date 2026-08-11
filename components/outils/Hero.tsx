import { Button } from "@/components/ui/Button";
import { resolveBackgroundImage } from "@/lib/background-image";

// Outils V2 — Hero (docs/refonte-site-public/Outils/01-HUB-PUBLIC.md §3).
// Texte adapté : le CDC mentionne aussi "dessiner" (schéma électrique
// public), mais cet outil n'existe pas encore dans le dépôt — omis pour ne
// pas présenter une fonctionnalité fictive (voir mission UI-7 et rapport,
// "Outils disponibles"). Un seul CTA, vers l'ancre réelle des
// calculateurs ; pas de CTA "Créer un schéma".
export function Hero() {
  const background = resolveBackgroundImage("/hero-fabsystem.png");

  return (
    <section className="relative bg-cover bg-center" style={{ backgroundImage: background }}>
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-14 text-white sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
          Les outils FabSystem
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Préparez votre installation électrique.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
          Calculez et dimensionnez votre installation 12/24 V avec des outils simples et gratuits.
        </p>

        <div className="mt-8">
          <Button href="#calculateurs" variant="primary">
            Voir les calculateurs
          </Button>
        </div>
      </div>
    </section>
  );
}

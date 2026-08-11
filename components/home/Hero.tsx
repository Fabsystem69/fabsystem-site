import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

// Home V2 — Header + Hero (docs/refonte-site-public/home/01-HEADER-HERO.md
// §10-16). Texte, CTA et photo repris tels quels du CDC — aucun ajout.
// Composition ~50/50 desktop (contenu / photographie), recomposée sur
// mobile (titre → texte → CTA principal → CTA Outils → photo, §14).
// Aucune hauteur 100vh imposée (§15).
export function Hero() {
  return (
    <section className="bg-white">
      <Container size="wide" className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl lg:text-5xl">
            L&apos;électricité embarquée,
            <br />
            sans naviguer à vue.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Bateau, van ou camping-car : apprenez à faire vous-même, avancez avec FabSystem ou
            confiez votre installation.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="#parcours" variant="primary" className="sm:w-auto">
              Comment FabSystem peut m&apos;aider
            </Button>
            <Button href="/outils" variant="secondary" className="sm:w-auto">
              Découvrir les outils gratuits
            </Button>
          </div>
        </div>

        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-neutral-200 sm:aspect-[16/11]">
            <Image
              src="/hero-fabsystem.png"
              alt="Intervention technique FabSystem sur une installation électrique embarquée"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

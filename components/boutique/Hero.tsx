import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

// Boutique V2 — Hero (docs/refonte-site-public/Boutique/01-HERO.md).
// Textes repris mot pour mot du CDC (§2-4, §7) : aucun ajout. Visuel réel
// existant (public/preuves/cable.png — préparation de câblage, sans marque
// imposée) faute d'un visuel Boutique dédié — voir "Visuels nécessaires"
// dans le rapport UI-5.
export function Hero() {
  return (
    <section className="bg-white">
      <Container size="wide" className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Je fais seul
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl lg:text-5xl">
            Votre projet, entre vos mains.
          </h1>
          <p className="mt-2 text-lg font-semibold text-neutral-900 sm:text-xl">
            Les bonnes bases pour bien faire.
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Des guides pratiques conçus à partir du terrain pour comprendre, concevoir et
            fiabiliser votre installation électrique. Bateau, van ou camping-car : choisissez
            votre univers.
          </p>

          <div className="mt-8">
            <Button href="#guides-disponibles" variant="primary">
              Voir les guides
            </Button>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-neutral-600">
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="text-brand-500">✓</span> Concret
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="text-brand-500">✓</span> Accessible
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="text-brand-500">✓</span> Pensé pour le terrain
            </li>
          </ul>
        </div>

        <div className="hidden lg:block">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-neutral-200">
            <Image
              src="/preuves/cable.png"
              alt=""
              fill
              priority
              sizes="50vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

import Image from "next/image";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";

// Home V2 — Accompagnement / "On fait ensemble"
// (docs/refonte-site-public/home/06-ACCOMPAGNEMENT.md). Un seul CTA
// principal, aucun prix, aucun pack commercial. Visuel : vraie photo
// Fabien + client devant un tableau électrique (accompagnement réel),
// fournie par l'utilisateur — remplace l'ancienne photo d'installation
// seule (matériel sans humain). CTA vers l'ancre réelle
// #on-fait-ensemble créée par la refonte Services (UI-4).
const APPORTS = [
  { title: "Préparer", text: "Architecture, matériel, dimensionnement de votre projet." },
  { title: "Vérifier", text: "Schéma, câblage, cohérence de vos choix techniques." },
  { title: "Débloquer", text: "Un doute, une étape difficile, un regard extérieur utile." },
];

export function Accompagnement() {
  return (
    <Section tone="light" containerClassName="max-w-5xl" className="!py-16 sm:!py-20">
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        {/* Contenu — prioritaire sur mobile (§6) */}
        <div className="order-2 max-w-lg lg:order-1">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-[2rem]">
            Vous faites. Je vous accompagne.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600 sm:text-base">
            Vous gardez la main sur votre projet, Fabien vous aide à faire les bons choix,
            vérifier votre installation et avancer sans rester bloqué.
          </p>

          <dl className="mt-5 space-y-3">
            {APPORTS.map((apport) => (
              <div key={apport.title}>
                <dt className="text-sm font-bold text-neutral-950">{apport.title}</dt>
                <dd className="mt-0.5 text-sm leading-relaxed text-neutral-600">{apport.text}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5">
            <Button href="/prestations/accompagnement" variant="primary">
              Découvrir l&apos;accompagnement →
            </Button>
          </div>
        </div>

        {/* Visuel */}
        <div className="order-1 mx-auto w-full max-w-sm lg:order-2 lg:max-w-md">
          <div className="relative aspect-[4/4.6] w-full overflow-hidden rounded-2xl border border-neutral-200">
            <Image
              src="/fab-client-accompagnement.jpg"
              alt="Fabien accompagne un client sur son installation électrique, devant un tableau ouvert"
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

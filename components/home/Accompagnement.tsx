"use client";

import Image from "next/image";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { useHomeUniverse } from "@/components/home/HomeUniverseProvider";

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
  const { selectionQuery, selectedUniverseLabel } = useHomeUniverse();

  return (
    <Section tone="dark" containerClassName="max-w-4xl" className="!py-8 sm:!py-10">
      <div className="grid items-center gap-5 lg:grid-cols-[1.35fr_0.65fr] lg:gap-8">
        {/* Contenu — prioritaire sur mobile (§6) */}
        <div className="order-2 max-w-xl lg:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-400">
            On fait ensemble
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-[1.7rem]">
            Vous faites. Je vous accompagne.
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-300">
            Vous gardez la main sur votre projet, Fabien vous aide à faire les bons choix,
            vérifier votre installation et avancer sans rester bloqué.
          </p>
          {selectedUniverseLabel ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
              Univers actif : {selectedUniverseLabel}
            </p>
          ) : null}

          <dl className="mt-4 grid gap-2 sm:grid-cols-3">
            {APPORTS.map((apport) => (
              <div
                key={apport.title}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <dt className="text-sm font-bold text-brand-300">{apport.title}</dt>
                <dd className="mt-0.5 text-xs leading-relaxed text-neutral-300">{apport.text}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4">
            <Button href={`/prestations/accompagnement${selectionQuery}`} variant="primary">
              Découvrir l&apos;accompagnement →
            </Button>
          </div>
        </div>

        {/* Visuel */}
        <div className="order-1 mx-auto w-full max-w-[220px] lg:order-2 lg:max-w-[240px]">
          <div className="rounded-2xl border border-brand-300/40 bg-brand-50/90 p-2 shadow-[0_16px_42px_rgba(0,0,0,0.24)]">
            <div className="relative aspect-[4/4.35] w-full overflow-hidden rounded-[1rem] border border-neutral-900/10">
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
      </div>
    </Section>
  );
}

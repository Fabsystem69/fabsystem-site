import Image from "next/image";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";

// Home V2 — Accompagnement / "On fait ensemble"
// (docs/refonte-site-public/home/06-ACCOMPAGNEMENT.md). Un seul CTA
// principal, aucun prix, aucun pack commercial. Visuel : une vraie photo
// d'installation (accompagnement personnalisé) plutôt que Volta — aucun
// asset officiel de la mascotte n'existe dans ce dépôt (voir
// docs/audits/UI-3-HOME.md, Visuels nécessaires) ; sa présence n'est
// qu'« éligible », pas obligatoire (§12), donc omise plutôt qu'inventée.
// CTA vers l'ancre réelle #on-fait-ensemble créée par la refonte Services
// (UI-4) — remplace la destination temporaire sans ancre de la Phase UI-3.
const APPORTS = [
  { title: "Préparer", text: "Architecture, matériel, dimensionnement de votre projet." },
  { title: "Vérifier", text: "Schéma, câblage, cohérence de vos choix techniques." },
  { title: "Débloquer", text: "Un doute, une étape difficile, un regard extérieur utile." },
];

export function Accompagnement() {
  return (
    <Section tone="light">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Contenu — prioritaire sur mobile (§6) */}
        <div className="order-2 lg:order-1">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            Vous faites. Je vous accompagne.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-neutral-600">
            Vous gardez la main sur votre projet, Fabien vous aide à faire les bons choix,
            vérifier votre installation et avancer sans rester bloqué.
          </p>

          <dl className="mt-6 space-y-4">
            {APPORTS.map((apport) => (
              <div key={apport.title}>
                <dt className="text-sm font-bold text-neutral-950">{apport.title}</dt>
                <dd className="mt-0.5 text-sm leading-relaxed text-neutral-600">{apport.text}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6">
            <Button href="/prestations/accompagnement" variant="primary">
              Découvrir l&apos;accompagnement →
            </Button>
          </div>
        </div>

        {/* Visuel */}
        <div className="order-1 lg:order-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-neutral-200">
            <Image
              src="/preuves/install-victron.jpg"
              alt="Installation électrique embarquée accompagnée par FabSystem"
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

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { JeConfieUnivers } from "@/components/services/JeConfieUnivers";
import { ContactModalTrigger } from "@/components/services/ContactModal";
import type { PrestationsCategorie } from "@/lib/prestations-packs";

// UI-10 §5 — page dédiée à l'intervention terrain, extraite de
// /prestations. Les deux cartes "J'ai une intervention précise" / "J'ai
// un projet" ouvraient visuellement un CTA sans rien déclencher au clic
// (constat utilisateur : "trompeur") — elles ouvrent désormais une vraie
// prise de contact contextuelle (ContactModalTrigger), message prérempli
// selon la carte cliquée, reste sur le site.
export function JeConfie({ initialCategory }: { initialCategory?: PrestationsCategorie }) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Je confie</p>
        <h1 className="mt-1.5 text-2xl font-bold text-neutral-950 sm:text-3xl">
          Vous préférez que je m&apos;en occupe ?
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
          J&apos;interviens directement sur votre bateau, votre van ou votre camping-car pour
          diagnostiquer, installer, modifier ou refaire votre installation électrique.
        </p>

        <div className="mt-6">
          <JeConfieUnivers initialCategory={initialCategory} />
        </div>

        {/* Deux façons de se reconnaître — désormais réellement interactives */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ContactModalTrigger
            title="J'ai une intervention précise"
            description="Vous savez précisément ce que vous souhaitez faire ou remplacer ? Décrivez-moi votre besoin."
            defaultMessage="J'ai une intervention précise à vous confier : "
            triggerLabel="Décrire mon besoin"
          />
          <ContactModalTrigger
            title="J'ai un projet"
            description="Votre projet touche plusieurs éléments de l'installation ou modifie vos besoins énergétiques ? Présentez-moi votre projet et l'existant."
            defaultMessage="J'ai un projet à vous présenter : "
            triggerLabel="Présenter mon projet"
          />
        </div>

        <p className="mt-4 text-sm text-neutral-500">Sur devis, après qualification de votre besoin.</p>

        <div className="mt-6">
          <Alert tone="info" title="Zone d'intervention">
            Interventions sur site dans le Rhône et les secteurs environnants. Pour un projet plus
            éloigné, contactez-moi : certaines interventions peuvent être étudiées au cas par cas.
          </Alert>
        </div>

        <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:flex-row sm:items-center">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-neutral-200 sm:h-24 sm:w-24">
            <Image
              src="/fab-bateau.png"
              alt="Fabien Lages"
              width={200}
              height={200}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Fabien — FabSystem
            </p>
            <p className="mt-1 text-base font-semibold text-neutral-900">
              J&apos;interviens personnellement sur votre installation.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button href="/contact" variant="primary">
            Parler de mon projet
          </Button>
          <Button href="/realisations" variant="tertiary">
            Voir mes réalisations →
          </Button>
        </div>
      </div>
    </div>
  );
}

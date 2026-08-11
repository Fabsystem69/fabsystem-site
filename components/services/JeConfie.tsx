import Image from "next/image";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { JeConfieUnivers } from "@/components/services/JeConfieUnivers";
import type { PrestationsCategorie } from "@/lib/prestations-packs";

// Services V2 — Je confie (docs/refonte-site-public/services/04-JE-CONFIE.md).
// Branche terrain, accessible directement, jamais conditionnée à un achat
// d'accompagnement à distance (§5). Aucun prix : "sur devis après
// qualification du besoin" (§15) — aucun forfait terrain n'est inventé.
export function JeConfie({ initialCategory }: { initialCategory?: PrestationsCategorie }) {
  return (
    <Section id="je-confie" tone="light" className="scroll-mt-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Je confie</p>
      <h2 className="mt-2 text-2xl font-bold text-neutral-950 sm:text-3xl">
        Vous préférez que je m&apos;en occupe ?
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600">
        J&apos;interviens directement sur votre bateau, votre van ou votre camping-car pour
        diagnostiquer, installer, modifier ou refaire votre installation électrique.
      </p>

      <div className="mt-8">
        <JeConfieUnivers initialCategory={initialCategory} />
      </div>

      {/* Deux façons de se reconnaître (§11) */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h3 className="text-base font-bold text-neutral-950">J&apos;ai une intervention précise</h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Vous savez précisément ce que vous souhaitez faire ou remplacer ? Décrivez-moi votre
            besoin.
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h3 className="text-base font-bold text-neutral-950">J&apos;ai un projet</h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Votre projet touche plusieurs éléments de l&apos;installation ou modifie vos besoins
            énergétiques ? Présentez-moi votre projet et l&apos;existant.
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-neutral-500">Sur devis, après qualification de votre besoin.</p>

      {/* Zone d'intervention (§17, texte exact) */}
      <div className="mt-8">
        <Alert tone="info" title="Zone d'intervention">
          Interventions sur site dans le Rhône et les secteurs environnants. Pour un projet plus
          éloigné, contactez-moi : certaines interventions peuvent être étudiées au cas par cas.
        </Alert>
      </div>

      {/* Présence de Fabien (§19) — portrait réel (UI-9 FINAL, fab-bateau.png
          est une photo de Fabien, corrigé depuis l'audit UI-9A qui l'avait
          mal identifiée comme photo de bateau). */}
      <div className="mt-8 flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:flex-row sm:items-center">
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

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button href="/contact" variant="primary">
          Parler de mon projet
        </Button>
        <Button href="#preuves" variant="tertiary">
          Voir les réalisations →
        </Button>
      </div>
    </Section>
  );
}

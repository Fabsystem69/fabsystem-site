import Link from "next/link";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";

// Home V2 — CTA final (docs/refonte-site-public/home/10-CTA-FINAL.md).
// Texte, CTA et destinations repris tels quels. Aucune photo, aucune
// Volta, aucun formulaire intégré (§10-12). Bloc sombre (tone="dark",
// même token que le Footer) mais visuellement distinct de celui-ci par
// sa structure (une seule ligne titre/CTA très ponctuée, jamais une
// grille de liens) et sa bordure — jamais une masse noire indifférenciée
// avec le Footer qui la suit immédiatement (§16).
//
// CTA secondaire : le CDC vise "/services" ; ce dépôt n'a pas de route
// /services, la page réelle équivalente est /prestations (même route déjà
// utilisée par Parcours.tsx et Accompagnement.tsx pour la même raison) —
// utiliser /services créerait un lien mort.
export function CtaFinal() {
  return (
    <Section tone="dark" className="!py-12 border-t border-neutral-800">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Un projet, une question, un doute ?
          </h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-neutral-400">
            Expliquez-moi où vous en êtes. On trouvera la façon la plus adaptée d&apos;avancer.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Button href="/contact" variant="primary" className="w-full sm:w-auto">
            Parler de mon projet
          </Button>
          <Link
            href="/prestations"
            className="inline-flex h-10 items-center justify-center gap-1 text-sm font-semibold text-neutral-300 transition-colors duration-150 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Voir les services →
          </Link>
        </div>
      </div>
    </Section>
  );
}

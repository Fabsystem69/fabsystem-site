import Link from "next/link";
import { getSchemaExampleHref } from "@/lib/schema-examples";

// Retour utilisateur (comparatif Wireframe) : "Use this calculator with our
// wiring guides" — chez eux, un mur de cartes vers leurs 61 diagrammes
// statiques. On a l'équivalent MIEUX : /schemas-electriques ouvre un vrai
// schéma vivant dans l'éditeur, pas une image. Repris ici en lien simple
// (pas une grille de cartes — décision produit déjà en place dans
// CalculatorPageShell, "jamais un mur de cartes", mission UI-9 §13).
export function CalcGuidesLink({ examples }: { examples: { slug: string; title: string }[] }) {
  if (examples.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Voir ce montage dans un vrai schéma</p>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
        {examples.map((ex) => (
          <Link
            key={ex.slug}
            href={getSchemaExampleHref(ex.slug)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900"
          >
            {ex.title} →
          </Link>
        ))}
      </div>
    </div>
  );
}

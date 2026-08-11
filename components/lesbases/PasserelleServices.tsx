import Link from "next/link";
import { Section } from "@/components/layout/Section";

// Les Bases V2 — Passerelle Services, facultative et très discrète
// (docs/refonte-site-public/les-bases/05-FIN-DE-PAGE-FOOTER.md §2). Pas de
// Hero bis, pas de prix, pas de liste de prestations, pas de formulaire.
export function PasserelleServices() {
  return (
    <Section tone="light" size="narrow" className="py-8 text-center sm:py-10">
      <p className="text-sm text-neutral-600">
        Besoin d&apos;être accompagné dans votre projet ?{" "}
        <Link
          href="/prestations"
          className="font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-700"
        >
          Découvrir les services FabSystem →
        </Link>
      </p>
    </Section>
  );
}

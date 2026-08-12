import type { Metadata } from "next";
import { JeConfie } from "@/components/services/JeConfie";
import { resolvePrestationsCategorie } from "@/lib/prestations-search-params";

// UI-10 §5 — page dédiée à l'intervention terrain, extraite de
// /prestations (devenue une simple page d'orientation). Pas de PageIntro
// séparé : JeConfie porte déjà son propre eyebrow + h1 + description.
export const metadata: Metadata = {
  title: "Intervention terrain — Je confie mon installation",
  description:
    "Fabien intervient directement sur votre bateau, van ou camping-car : diagnostic, installation, dépannage, refit électrique.",
  alternates: {
    canonical: "/prestations/intervention",
  },
};

export default async function InterventionPage({
  searchParams,
}: {
  searchParams: Promise<{ univers?: string | string[] }>;
}) {
  const { univers } = await searchParams;
  const initialCategory = resolvePrestationsCategorie(univers);

  return (
    <main>
      <JeConfie initialCategory={initialCategory} />
    </main>
  );
}

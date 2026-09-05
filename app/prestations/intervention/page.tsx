import type { Metadata } from "next";
import { JeConfie } from "@/components/services/JeConfie";
import { DevisInfos } from "@/components/services/DevisInfos";
import { resolvePrestationsCategorie } from "@/lib/prestations-search-params";

// UI-10 §5 — page dédiée à l'intervention terrain, extraite de
// /prestations (devenue une simple page d'orientation). Pas de PageIntro
// séparé : JeConfie porte déjà son propre eyebrow + h1 + description.
//
// Audit SEO : "devis électricité van/bateau/camping-car" est l'intention de
// recherche transactionnelle la plus chaude et n'était couverte par aucune
// page (208 mots ici auparavant). Plutôt que 3 pages "devis" séparées et
// proches en contenu (risque de contenu fin dupliqué), cette page — déjà le
// point d'entrée "sur devis, après qualification" — est enrichie avec le
// vocabulaire et le contenu réel attendus (processus, facteurs de prix,
// délais, FAQ), sans jamais inventer de tarif fixe.
export const metadata: Metadata = {
  title: "Devis électricité van, bateau, camping-car",
  description:
    "Demandez un devis pour votre installation électrique embarquée : diagnostic, refit, dépannage sur bateau, van ou camping-car. Réponse sous 24–48h, devis après qualification de votre projet.",
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
      <DevisInfos />
    </main>
  );
}

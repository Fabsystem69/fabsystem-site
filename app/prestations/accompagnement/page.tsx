import type { Metadata } from "next";
import { OnFaitEnsemble } from "@/components/services/OnFaitEnsemble";
import { Confiance } from "@/components/home/Confiance";
import { resolvePrestationsCategorie } from "@/lib/prestations-search-params";

// UI-10 §4 — page dédiée à l'accompagnement, extraite de /prestations
// (devenue une simple page d'orientation). Pas de PageIntro séparé :
// OnFaitEnsemble porte déjà son propre eyebrow + h1 + description en tête
// de page, un second bloc d'intro aurait dupliqué le même message.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accompagnement à distance — On fait ensemble",
  description:
    "Fabien vous accompagne à distance pour concevoir, vérifier et sécuriser votre installation électrique embarquée. Vous réalisez, vous restez aux commandes.",
  alternates: {
    canonical: "/prestations/accompagnement",
  },
};

export default async function AccompagnementPage({
  searchParams,
}: {
  searchParams: Promise<{ univers?: string | string[] }>;
}) {
  const { univers } = await searchParams;
  const initialCategory = resolvePrestationsCategorie(univers);

  return (
    <main>
      <OnFaitEnsemble initialCategory={initialCategory} />
      <Confiance />
    </main>
  );
}

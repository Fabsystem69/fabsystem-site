import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { TroisFacons } from "@/components/services/TroisFacons";
import { OnFaitEnsemble } from "@/components/services/OnFaitEnsemble";
import { JeConfie } from "@/components/services/JeConfie";
import { Deroulement } from "@/components/services/Deroulement";
import { Preuves } from "@/components/services/Preuves";
import { Faq } from "@/components/services/Faq";
import { ServicesCtaFinal } from "@/components/services/ServicesCtaFinal";
import type { PrestationsCategorie } from "@/lib/prestations-packs";

// Services V2 (UI-4), conforme à docs/refonte-site-public/services/00-SERVICES-ARCHITECTURE.md
// §3 : Header (global) → Hero → Trois façons d'avancer → On fait ensemble →
// Je confie → Comment ça se passe (Déroulement) → Preuves et réalisations →
// FAQ → CTA final → Footer (global). Catalogue et témoignages lus en base à
// chaque requête (packs déjà vendus, jamais de rendu figé au build).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services électricité embarquée — accompagnement à distance et terrain",
  description:
    "Fabien vous accompagne à distance ou sur le terrain pour concevoir, vérifier et sécuriser votre installation électrique embarquée : bateau, van, camping-car.",
  alternates: {
    canonical: "/prestations",
  },
};

const VALID_CATEGORIES: PrestationsCategorie[] = ["van", "camping-car", "bateau"];

function resolveCategory(value: string | string[] | undefined): PrestationsCategorie | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return VALID_CATEGORIES.find((category) => category === raw);
}

export default async function PrestationsPage({
  searchParams,
}: {
  searchParams: Promise<{ univers?: string | string[] }>;
}) {
  const { univers } = await searchParams;
  const initialCategory = resolveCategory(univers);

  return (
    <main>
      <PageHero
        title="Vous avez un projet. Choisissez jusqu'où vous voulez être accompagné."
        subtitle="À distance ou sur le terrain, Fabien vous aide à concevoir, vérifier et sécuriser votre installation électrique embarquée."
        background="/hero-fabsystem.png"
        overlay="bg-black/60"
        ctas={[{ href: "#parcours", label: "Choisir comment avancer", variant: "primary" }]}
      />

      <TroisFacons />
      <OnFaitEnsemble initialCategory={initialCategory} />
      <JeConfie initialCategory={initialCategory} />
      <Deroulement />
      <Preuves />
      <Faq />
      <ServicesCtaFinal />
    </main>
  );
}

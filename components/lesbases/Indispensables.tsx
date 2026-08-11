import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { listFormationEssentialTools } from "@/lib/formations-tools";

// Les Bases V2 — Le minimum pour travailler proprement
// (docs/refonte-site-public/les-bases/03-BONS-GESTES-INDISPENSABLES.md
// §9-11). Réutilise lib/formations-tools.ts (10 outils déjà rédigés,
// jusqu'ici jamais affichés publiquement — voir components/
// FormationsEssentialTools.tsx, non branché). Contrairement à ce
// composant existant, aucun bouton d'achat ni de recherche marchande
// n'est affiché ici : le CDC §11 interdit tout catalogue marchand,
// affiliation ou bouton "Acheter" en V1. Seul le champ `usage` réel
// (répond déjà à "à quoi ça sert / pourquoi c'est utile") est repris ;
// aucune marque, prix ni critère d'achat n'est inventé pour compléter la
// question "quel point vérifier avant d'acheter" — voir Arbitrages.
export function Indispensables() {
  const tools = listFormationEssentialTools();

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
        Le minimum pour travailler proprement
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        Le matériel physique utile pour débuter correctement — pas les applications numériques
        FabSystem, qui ont leur propre espace dans{" "}
        <Link href="/outils" className="underline underline-offset-4 hover:text-neutral-900">
          Outils
        </Link>
        .
      </p>

      <Card className="mt-6 divide-y divide-neutral-100 p-0">
        {tools.map((tool) => (
          <div key={tool.id} className="p-4">
            <p className="text-sm font-semibold text-neutral-950">{tool.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">{tool.usage}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}

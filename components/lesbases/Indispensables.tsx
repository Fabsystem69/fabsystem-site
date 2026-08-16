import Image from "next/image";
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

      <details className="mt-5 overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
        <summary className="list-none cursor-pointer p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Liste déroulante
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-neutral-950">
                Afficher les {tools.length} outils indispensables
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                Une base simple pour démarrer avec les bons outils, sans surcharger l&apos;atelier ni
                oublier les essentiels qui évitent les erreurs bêtes.
              </p>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                Cliquer pour ouvrir la liste
              </p>
            </div>

            <figure className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
              <Image
                src="/formations/minimum-travailler-proprement.webp"
                alt="Vignette du minimum d'outils pour travailler proprement"
                width={960}
                height={536}
                sizes="(max-width: 640px) 100vw, 220px"
                className="h-36 w-full object-cover object-left sm:h-40"
              />
            </figure>
          </div>
        </summary>

        <div className="border-t border-neutral-200">
          <Card className="divide-y divide-neutral-100 rounded-none border-0 p-0 shadow-none">
            {tools.map((tool, index) => (
              <div key={tool.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-neutral-950">{tool.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">{tool.usage}</p>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </details>
    </div>
  );
}

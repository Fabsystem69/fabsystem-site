import { Section } from "@/components/layout/Section";
import { PrestationsDistanceOffers } from "@/components/prestations/PrestationsDistanceOffers";
import { getPrestationsPackProductIdBySlug } from "@/lib/services/prestations-packs-catalog";
import type { PrestationsCategorie } from "@/lib/prestations-packs";

// Services V2 — On fait ensemble
// (docs/refonte-site-public/services/03-ON-FAIT-ENSEMBLE.md). Réutilise le
// composant réel déjà en production (components/prestations/
// PrestationsDistanceOffers.tsx), qui lit le catalogue réel
// (lib/prestations-packs.ts, prix déjà validés et vendus) — aucun prix
// inventé, aucune règle commerciale modifiée. Voir docs/audits/
// UI-4-SERVICES-UNIVERS.md, Arbitrages, pour l'écart documenté entre les
// douze noms de la matrice CDC et les quatre paliers (Amarrage/Cap/
// Passerelle/Grand Large) réellement déclinés par univers dans le
// catalogue actuel.
const APPORTS = [
  { title: "Préparer", text: "Faire les bons choix avant de commencer." },
  { title: "Vérifier", text: "Contrôler les décisions et les étapes importantes." },
  { title: "Débloquer", text: "Ne pas rester seul lorsqu'une difficulté apparaît." },
];

export async function OnFaitEnsemble({ initialCategory }: { initialCategory?: PrestationsCategorie }) {
  const packProductIdBySlug = await getPrestationsPackProductIdBySlug();

  return (
    <Section id="on-fait-ensemble" tone="dark" className="scroll-mt-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
        On fait ensemble
      </p>
      <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Vous restez aux commandes.</h2>
      <p className="mt-3 max-w-xl text-base leading-relaxed text-neutral-400">
        Vous réalisez. FabSystem vous accompagne là où son expertise vous est utile.
      </p>

      <dl className="mt-8 grid gap-6 sm:grid-cols-3">
        {APPORTS.map((apport) => (
          <div key={apport.title}>
            <dt className="text-sm font-bold text-brand-400">{apport.title}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-neutral-300">{apport.text}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 border-t border-white/10 pt-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Commencez ici
        </p>
        <p className="mt-1 text-lg font-bold text-white">Faisons d&apos;abord le point.</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-400">
          Choisissez votre univers pour découvrir les accompagnements disponibles — de la première
          étape jusqu&apos;au projet complet documenté.
        </p>

        <div className="mt-6">
          <PrestationsDistanceOffers
            packProductIdBySlug={packProductIdBySlug}
            initialCategory={initialCategory}
          />
        </div>

        <p className="mt-6 max-w-xl text-xs leading-relaxed text-neutral-500">
          Vous poursuivez ensuite avec un accompagnement plus poussé ? Le montant éligible déjà
          engagé est pris en compte selon les conditions applicables.
        </p>
      </div>
    </Section>
  );
}

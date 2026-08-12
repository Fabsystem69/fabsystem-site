import { PrestationsDistanceOffers } from "@/components/prestations/PrestationsDistanceOffers";
import { getPrestationsPackProductIdBySlug } from "@/lib/services/prestations-packs-catalog";
import type { PrestationsCategorie } from "@/lib/prestations-packs";

// UI-10 §4 — contenu densifié : sur sa propre page dédiée
// (/prestations/accompagnement), ce bloc n'a plus besoin de "respirer"
// entre deux autres sections. Constat utilisateur : titre trop éloigné de
// l'intro, Préparer/Vérifier/Débloquer trop espacés, "Faisons d'abord le
// point" avec beaucoup de vide avant les offres. Corrections : espacements
// verticaux réduits (mt-8→mt-5, mt-10→mt-6, pt-8→pt-5), Préparer/Vérifier/
// Débloquer en ligne compacte plutôt qu'en grille aérée, offres affichées
// plus tôt.
const APPORTS = [
  { title: "Préparer", text: "Faire les bons choix avant de commencer." },
  { title: "Vérifier", text: "Contrôler les décisions et les étapes importantes." },
  { title: "Débloquer", text: "Ne pas rester seul lorsqu'une difficulté apparaît." },
];

export async function OnFaitEnsemble({ initialCategory }: { initialCategory?: PrestationsCategorie }) {
  const packProductIdBySlug = await getPrestationsPackProductIdBySlug();

  return (
    <div className="bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
          On fait ensemble
        </p>
        <h1 className="mt-1.5 text-2xl font-bold text-white sm:text-3xl">
          Vous restez aux commandes.
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-400 sm:text-base">
          Vous réalisez. Fabien vous accompagne là où son expertise vous est utile.
        </p>

        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
          {APPORTS.map((apport) => (
            <div key={apport.title} className="max-w-[220px]">
              <dt className="text-sm font-bold text-brand-400">{apport.title}</dt>
              <dd className="mt-0.5 text-sm leading-relaxed text-neutral-300">{apport.text}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-lg font-bold text-white">Faisons d&apos;abord le point.</p>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-neutral-400">
            Choisissez votre univers pour découvrir les accompagnements disponibles — de la
            première étape jusqu&apos;au projet complet documenté.
          </p>

          <div className="mt-4">
            <PrestationsDistanceOffers
              packProductIdBySlug={packProductIdBySlug}
              initialCategory={initialCategory}
            />
          </div>

          <p className="mt-5 max-w-xl text-xs leading-relaxed text-neutral-500">
            Vous poursuivez ensuite avec un accompagnement plus poussé ? Le montant éligible déjà
            engagé est pris en compte selon les conditions applicables.
          </p>
        </div>
      </div>
    </div>
  );
}

import PageHero from "@/components/PageHero";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit électrique nautique – Conformité & sécurité | FabSystem",
  description:
    "Audit électrique nautique pédagogique : diagnostic sécurité, conformité (Division 240 / 245), recommandations claires et plan d’action pour fiabiliser votre installation 12V/230V.",
};

export default function AuditNautiquePage() {
  return (
    <main className="bg-white text-neutral-900">
      <PageHero
        title="Audit électrique nautique"
        subtitle="Conformité, sécurité et fiabilité de votre installation à bord."
        micro="Un audit clair et pédagogique pour comprendre votre installation 12V / 230V, identifier les risques, et repartir avec un plan d’action concret."
        background="/hero-fabsystem.png"
        overlay="bg-black/55"
        ctas={[
          { href: "/contact", label: "Demander un audit", variant: "primary" },
          { href: "/visio", label: "Visio conseil", variant: "secondary" },
        ]}
      />

      {/* POUR QUI / QUAND */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">À qui s’adresse l’audit ?</h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-700">
              Propriétaires de bateaux (plaisance), voiliers, vedettes, bateaux habitables…
              L’audit est particulièrement utile si vous avez un doute sur la sécurité,
              si l’installation a été modifiée au fil du temps, ou si vous prévoyez une évolution
              (lithium, panneaux solaires, convertisseur, ajout de prises 230V, etc.).
            </p>

            <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <p className="text-sm font-semibold text-neutral-900">Situations typiques</p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-700">
                <li>• Disjonctions / fusibles qui sautent sans raison claire</li>
                <li>• Ajouts “au fil du temps” sans schéma ni cohérence globale</li>
                <li>• Passage au lithium ou chargeur/alternateur douteux</li>
                <li>• 230V “bricolé” ou protections incertaines</li>
                <li>• Odeurs, échauffements, câbles douteux, oxydation</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-2xl font-semibold">Ce que vous obtenez</h2>

            <div className="mt-6 grid gap-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-5">
                <p className="text-sm font-semibold text-neutral-900">1) Diagnostic</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                  Ce qui est fiable, ce qui est risqué, et les priorités de correction.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-5">
                <p className="text-sm font-semibold text-neutral-900">2) Plan d’action</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                  Recommandations concrètes : protections, sections, organisation, matériel adapté.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-5">
                <p className="text-sm font-semibold text-neutral-900">3) Accompagnement</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                  Mise en conformité / remise à niveau sur place, ou guidage en visio si vous faites vous-même.
                </p>
              </div>
            </div>

            <p className="mt-6 text-xs text-neutral-500">
              L’objectif est de vous rendre autonome : comprendre, décider, et avancer sans risque.
            </p>
          </div>
        </div>
      </section>

      {/* DIVISION 240 / 245 */}
      <section className="border-t border-neutral-200 bg-white py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold">Division 240 / 245 : ce que l’audit vérifie</h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-700">
              Sans transformer votre bateau en “laboratoire”, l’audit vise à vérifier les points de bon sens
              et de sécurité attendus à bord : cohérence des protections, sections, distribution, état des connexions,
              et logique globale d’installation. On vérifie aussi la partie 230V (si présente) avec une attention
              particulière sur les protections différentielles et la séparation des circuits.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <h3 className="text-lg font-semibold text-neutral-900">Contrôles côté 12V / DC</h3>
              <ul className="mt-4 space-y-2 text-sm text-neutral-700">
                <li>• Protections (fusibles/disjoncteurs) cohérentes et bien placées</li>
                <li>• Sections de câbles adaptées (longueur / courant / environnement)</li>
                <li>• Organisation des masses, retours, et points de distribution</li>
                <li>• Qualité des connexions, sertissages, oxydation, échauffements</li>
                <li>• Schéma logique : lisibilité et maintenance possible</li>
              </ul>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <h3 className="text-lg font-semibold text-neutral-900">Contrôles côté 230V / AC</h3>
              <ul className="mt-4 space-y-2 text-sm text-neutral-700">
                <li>• Présence et calibration du différentiel</li>
                <li>• Protection des circuits (disjoncteurs, prises, équipements)</li>
                <li>• Mise à la terre et liaisons équipotentielles (si applicable)</li>
                <li>• Séparation nette 12V / 230V (routage, protection mécanique)</li>
                <li>• Inverseur quai / groupe / convertisseur : logique et sécurité</li>
              </ul>
            </div>
          </div>

          <p className="mt-8 max-w-3xl text-xs text-neutral-500">
            Note : la conformité dépend aussi de votre catégorie de navigation et des équipements présents.
            L’audit s’adapte à votre cas réel (pas une checklist hors-sol).
          </p>
        </div>
      </section>

      {/* LITHIUM & 230V */}
      <section className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-neutral-900">
              Installation lithium et circuit 230V : points de vigilance
            </h2>

            <p className="mt-4 text-neutral-700">
              Les conversions vers batteries lithium ou les modifications du circuit 230V
              sont aujourd’hui fréquentes en plaisance. Mal maîtrisées, elles peuvent
              créer des déséquilibres électriques ou des risques importants.
            </p>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                Batteries lithium (LiFePO4)
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-neutral-700">
                <li>• Compatibilité alternateur / régulateur</li>
                <li>• Protection BMS et coupure d’urgence</li>
                <li>• Sections adaptées aux forts courants</li>
                <li>• Protection contre surcharge et sous-tension</li>
                <li>• Cohérence du système de charge (solaire, quai, DC-DC)</li>
              </ul>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                Circuit 230V à bord
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-neutral-700">
                <li>• Présence et calibration du différentiel</li>
                <li>• Mise à la terre et liaison équipotentielle</li>
                <li>• Séparation claire 12V / 230V</li>
                <li>• Protection des prises et équipements</li>
                <li>• Inverseur quai / groupe / convertisseur sécurisé</li>
              </ul>
            </div>
          </div>

          <p className="mt-8 max-w-3xl text-sm text-neutral-600">
            Un audit permet de vérifier que l’intégration du lithium ou du 230V
            respecte une logique de sécurité et ne crée pas de points faibles invisibles
            lors d’une utilisation normale.
          </p>
        </div>
      </section>

      {/* ERREURS FRÉQUENTES */}
      <section className="border-t border-neutral-200 bg-white py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold">Erreurs fréquentes (et pourquoi c’est un problème)</h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-700">
              Le but n’est pas de faire peur. Le but, c’est d’éviter les “petites erreurs”
              qui deviennent de gros problèmes quand ça chauffe, que ça vibre, et que ça prend l’humidité.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <p className="text-sm font-semibold text-neutral-900">Fusible trop loin</p>
              <p className="mt-2 text-sm text-neutral-700">
                Un câble non protégé proche de la batterie = risque d’échauffement et d’incident en cas de court-circuit.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <p className="text-sm font-semibold text-neutral-900">Section sous-dimensionnée</p>
              <p className="mt-2 text-sm text-neutral-700">
                Chute de tension, pertes, échauffements, pannes intermittentes… et l’installation “vieillit mal”.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <p className="text-sm font-semibold text-neutral-900">Connexions “vite faites”</p>
              <p className="mt-2 text-sm text-neutral-700">
                Sertissage approximatif, dominos, torsades : avec vibrations + humidité, ça finit en faux contact.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <p className="text-sm font-semibold text-neutral-900">Lithium + alternateur sans protection</p>
              <p className="mt-2 text-sm text-neutral-700">
                Un alternateur peut surchauffer ou se dégrader si la stratégie de charge n’est pas adaptée.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <p className="text-sm font-semibold text-neutral-900">230V sans différentiel clair</p>
              <p className="mt-2 text-sm text-neutral-700">
                Le différentiel est un “filet de sécurité”. Sans lui, les défauts d’isolement deviennent critiques.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <p className="text-sm font-semibold text-neutral-900">Masse / retours incohérents</p>
              <p className="mt-2 text-sm text-neutral-700">
                Retours multiples, châssis utilisé “au hasard” : parasites, défauts bizarres, diagnostics impossibles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-neutral-200 bg-white py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 sm:p-10">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold">
                Vous voulez un avis clair sur votre installation ?
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-700">
                Décrivez votre bateau et votre installation (12V, 230V, lithium, solaire…).
                Je vous réponds avec la meilleure approche : audit sur place ou visio conseil.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
                >
                  Demander un audit
                </Link>

                <Link
                  href="/visio"
                  className="inline-flex w-full items-center justify-center rounded-md border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-white sm:w-auto"
                >
                  Visio conseil
                </Link>
              </div>

              <p className="mt-4 text-xs text-neutral-500">
                Réponse rapide, recommandations concrètes, et priorité à la sécurité.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

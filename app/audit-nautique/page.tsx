import PageHero from "@/components/PageHero";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit électrique nautique – Conformité & sécurité | FabSystem",
  description:
    "Audit électrique nautique pédagogique : diagnostic sécurité, conformité (Division 240 / 245), recommandations claires et plan d’action pour fiabiliser votre installation 12V/230V.",
};

const faqItems = [
  {
    q: "Division 240/245 : ça couvre quoi ?",
    a: "Un audit orienté sécurité et conformité, selon la réglementation en vigueur, avec recommandations claires.",
  },
  {
    q: "C’est un contrôle officiel ?",
    a: "Non. C’est un audit technique pour fiabiliser et préparer une mise en conformité.",
  },
  {
    q: "Que contient le livrable ?",
    a: "Constats, priorités, recommandations et points de vigilance.",
  },
  {
    q: "Intervenez-vous à bord ?",
    a: "Oui selon zone et projet, sinon cadrage possible à distance.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function AuditNautiquePage() {
  return (
    <main className="bg-white text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

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

      <section className="mx-auto max-w-6xl px-6 py-6 sm:py-8">
        <div className="mx-auto grid max-w-5xl gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
            <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
              Pour qui
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Propriétaires de bateaux de plaisance qui veulent clarifier une installation 12V / 230V, sécuriser un existant ou préparer une évolution.
            </p>
            <ul className="mt-2 grid gap-1.5 text-xs text-neutral-700 sm:grid-cols-2 sm:text-sm">
              <li>• Doute sur la sécurité</li>
              <li>• Modifications successives</li>
              <li>• Projet lithium / solaire</li>
              <li>• 230V à fiabiliser</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
            <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
              Ce que vous obtenez
            </h2>
            <div className="mt-2 space-y-1.5 text-xs text-neutral-700 sm:text-sm">
              <p>• Diagnostic : ce qui est fiable, ce qui est risqué, et les priorités.</p>
              <p>• Plan d’action : protections, sections, organisation, matériel adapté.</p>
              <p>• Suite recommandée : remise à niveau sur place ou guidage en visio.</p>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Objectif : comprendre, décider, et avancer sans risque.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
              Points vérifiés en détail
            </h2>

            <div className="mt-3 space-y-3">
              <details className="group rounded-xl border border-neutral-200 bg-white p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-neutral-900">
                  <span>Division 240 / 245 : ce que l’audit vérifie</span>
                  <span className="text-neutral-500 transition group-open:rotate-180">
                    ⌄
                  </span>
                </summary>

                <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                  Sans transformer votre bateau en “laboratoire”, l’audit vise à vérifier les points de bon sens et de sécurité attendus à bord : cohérence des protections, sections, distribution, état des connexions, et logique globale d’installation.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Contrôles côté 12V / DC
                    </h3>
                    <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
                      <li>• Protections cohérentes et bien placées</li>
                      <li>• Sections adaptées</li>
                      <li>• Organisation des masses et de la distribution</li>
                      <li>• Connexions, sertissages, oxydation, échauffements</li>
                      <li>• Schéma logique et maintenance possible</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Contrôles côté 230V / AC
                    </h3>
                    <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
                      <li>• Différentiel et protections des circuits</li>
                      <li>• Mise à la terre et liaisons équipotentielles</li>
                      <li>• Séparation nette 12V / 230V</li>
                      <li>• Prises et équipements</li>
                      <li>• Inverseur quai / groupe / convertisseur</li>
                    </ul>
                  </div>
                </div>

                <p className="mt-3 text-xs text-neutral-500">
                  Note : la conformité dépend aussi de votre catégorie de navigation et des équipements présents. L’audit s’adapte à votre cas réel.
                </p>
              </details>

              <details className="group rounded-xl border border-neutral-200 bg-white p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-neutral-900">
                  <span>Installation lithium et circuit 230V : points de vigilance</span>
                  <span className="text-neutral-500 transition group-open:rotate-180">
                    ⌄
                  </span>
                </summary>

                <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                  Les conversions vers batteries lithium ou les modifications du circuit 230V sont fréquentes en plaisance. Mal maîtrisées, elles peuvent créer des déséquilibres électriques ou des risques importants.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Batteries lithium (LiFePO4)
                    </h3>
                    <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
                      <li>• Compatibilité alternateur / régulateur</li>
                      <li>• Protection BMS et coupure d’urgence</li>
                      <li>• Sections adaptées aux forts courants</li>
                      <li>• Protection contre surcharge et sous-tension</li>
                      <li>• Cohérence du système de charge</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Circuit 230V à bord
                    </h3>
                    <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
                      <li>• Différentiel et calibration</li>
                      <li>• Mise à la terre et liaison équipotentielle</li>
                      <li>• Séparation claire 12V / 230V</li>
                      <li>• Protection des prises et équipements</li>
                      <li>• Inverseur sécurisé</li>
                    </ul>
                  </div>
                </div>

                <p className="mt-3 text-sm text-neutral-600">
                  Un audit permet de vérifier que l’intégration du lithium ou du 230V respecte une logique de sécurité et ne crée pas de points faibles invisibles.
                </p>
              </details>

              <details className="group rounded-xl border border-neutral-200 bg-white p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-neutral-900">
                  <span>Erreurs fréquentes (et pourquoi c’est un problème)</span>
                  <span className="text-neutral-500 transition group-open:rotate-180">
                    ⌄
                  </span>
                </summary>

                <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                  Le but n’est pas de faire peur. Le but, c’est d’éviter les “petites erreurs” qui deviennent de gros problèmes quand ça chauffe, que ça vibre, et que ça prend l’humidité.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm font-semibold text-neutral-900">Fusible trop loin</p>
                    <p className="mt-2 text-sm text-neutral-700">
                      Un câble non protégé proche de la batterie = risque d’échauffement et d’incident.
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm font-semibold text-neutral-900">Section sous-dimensionnée</p>
                    <p className="mt-2 text-sm text-neutral-700">
                      Chute de tension, pertes, échauffements et pannes intermittentes.
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm font-semibold text-neutral-900">Connexions “vite faites”</p>
                    <p className="mt-2 text-sm text-neutral-700">
                      Avec vibrations + humidité, ça finit souvent en faux contact.
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm font-semibold text-neutral-900">Lithium + alternateur sans protection</p>
                    <p className="mt-2 text-sm text-neutral-700">
                      Un alternateur peut surchauffer ou se dégrader si la charge n’est pas adaptée.
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm font-semibold text-neutral-900">230V sans différentiel clair</p>
                    <p className="mt-2 text-sm text-neutral-700">
                      Sans différentiel, les défauts d’isolement deviennent critiques.
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm font-semibold text-neutral-900">Masse / retours incohérents</p>
                    <p className="mt-2 text-sm text-neutral-700">
                      Parasites, défauts bizarres et diagnostics impossibles.
                    </p>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
              FAQ
            </h2>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {faqItems.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-neutral-200 bg-white p-3 sm:p-4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-neutral-900">
                    <span>{item.q}</span>
                    <span className="text-neutral-500 transition group-open:rotate-180">
                      ⌄
                    </span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-neutral-200 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-5xl rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-7">
            <div className="max-w-3xl">
              <h2 className="text-lg font-semibold sm:text-xl">
                Vous voulez un avis clair sur votre installation ?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                Décrivez votre bateau et votre installation (12V, 230V, lithium, solaire…).
                Je vous réponds avec la meilleure approche : audit sur place ou visio conseil.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
                >
                  Demander un audit
                </Link>

                <Link
                  href="/visio"
                  className="inline-flex w-full items-center justify-center rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-white sm:w-auto"
                >
                  Visio conseil
                </Link>
              </div>

              <p className="mt-3 text-xs text-neutral-500">
                Réponse rapide, recommandations concrètes, et priorité à la sécurité.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

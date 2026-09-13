import Link from "next/link";

// Maillage entre les 3 pages "service bateau" (audit lecture seule,
// Semaine 1) : elles ne se citaient auparavant qu'indirectement via
// /realisations, elle-même sans aucun lien entrant. Bloc volontairement
// sobre — descriptions courtes, pas de duplication du contenu de chaque
// page, pas de CTA commercial ici (celui-ci reste dans le bloc contact qui
// suit).
type ServicePageKey =
  | "installation-12v-bateau"
  | "probleme-charge-batterie-bateau"
  | "securisation-correction-bateau";

const SERVICE_PAGES: Record<
  ServicePageKey,
  { href: string; label: string; description: string }
> = {
  "installation-12v-bateau": {
    href: "/installation-12v-bateau",
    label: "Installation 12V bateau",
    description: "Refonte complète ou installation neuve.",
  },
  "probleme-charge-batterie-bateau": {
    href: "/probleme-charge-batterie-bateau",
    label: "Problème de charge batterie",
    description: "Batterie qui ne remonte pas, tension instable.",
  },
  "securisation-correction-bateau": {
    href: "/securisation-correction-bateau",
    label: "Sécurisation / correction électrique",
    description: "Protections, distribution et câblage à corriger.",
  },
};

export function SelonVotreSituation({ current }: { current: ServicePageKey }) {
  const otherPages = (Object.keys(SERVICE_PAGES) as ServicePageKey[]).filter(
    (key) => key !== current
  );

  return (
    <section className="border-t border-neutral-200 bg-white py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
            Selon votre situation
          </h2>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {otherPages.map((key) => {
              const page = SERVICE_PAGES[key];
              return (
                <li key={key}>
                  <Link
                    href={page.href}
                    className="block rounded-xl border border-neutral-200 bg-neutral-50 p-3 transition-colors hover:border-neutral-300 hover:bg-white"
                  >
                    <span className="font-semibold text-neutral-950">{page.label}</span>
                    <span className="mt-1 block text-neutral-600">{page.description}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-sm">
            <Link
              href="/realisations"
              className="font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-700"
            >
              Voir des interventions déjà réalisées →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

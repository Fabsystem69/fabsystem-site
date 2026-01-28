export default function RealisationsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Réalisations
      </h1>

      <p className="mt-4 max-w-3xl text-neutral-700">
        Quelques exemples d’interventions réalisées ou typiques.
        L’objectif est toujours le même : sécurité, fiabilité et lisibilité
        de l’installation électrique.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold">
            Reprise tableau électrique 12 V
          </h2>
          <p className="mt-2 text-sm text-neutral-700">
            Nettoyage du câblage, ajout de protections, repérage clair
            et suppression des points de chauffe.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold">
            Gestion d’énergie & batteries
          </h2>
          <p className="mt-2 text-sm text-neutral-700">
            Mise en place d’une architecture cohérente batteries,
            charge et distribution pour une autonomie fiable.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold">
            Préparation avant départ / vente
          </h2>
          <p className="mt-2 text-sm text-neutral-700">
            Sécurisation de l’installation, corrections prioritaires
            et conseils d’utilisation pour navigation ou revente.
          </p>
        </div>
      </div>

      <p className="mt-10 text-sm text-neutral-500">
        Des photos avant / après viendront compléter cette page.
      </p>
    </main>
  );
}
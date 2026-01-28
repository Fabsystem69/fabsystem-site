export default function PrestationsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Prestations
      </h1>

      <p className="mt-4 max-w-3xl text-neutral-700">
        J’interviens sur les installations électriques embarquées pour améliorer
        la sécurité, la fiabilité et la compréhension de ton système.
        Chaque intervention commence par un diagnostic clair.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold">Diagnostic électrique</h2>
          <p className="mt-2 text-sm text-neutral-700">
            Contrôle des protections, sections de câbles, distribution,
            points de chauffe et état général de l’installation.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold">Sécurisation & mise à niveau</h2>
          <p className="mt-2 text-sm text-neutral-700">
            Ajout ou correction des coupe-circuits, fusibles, repérage,
            remise au propre du câblage.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold">Gestion d’énergie</h2>
          <p className="mt-2 text-sm text-neutral-700">
            Batteries plomb ou lithium, charge, DC-DC, solaire,
            optimisation de l’autonomie.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold">Accompagnement projet</h2>
          <p className="mt-2 text-sm text-neutral-700">
            Conseil, schéma simple, priorisation des travaux,
            préparation avant départ ou avant vente.
          </p>
        </div>
      </div>
    </main>
  );
}
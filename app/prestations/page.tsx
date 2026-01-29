export default function PrestationsPage() {
  return (
    <main>
      {/* HERO */}
      <section
        className="relative min-h-[55vh] bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-fabsystem.png')" }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Contenu hero */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-24 text-white sm:py-28">
          <h1 className="text-4xl font-semibold sm:text-5xl">
            Prestations
          </h1>
          <p className="mt-4 max-w-2xl text-white/90">
            Électricité et systèmes embarqués pour bateaux, vans et camping-cars.
            Des interventions pensées pour la sécurité, la fiabilité et la compréhension
            de votre installation.
          </p>
        </div>
      </section>

      {/* CONTENU */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-2">
          {/* Carte 1 */}
          <div className="rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">
              Diagnostic électrique
            </h2>
            <p className="mt-2 text-sm text-neutral-700">
              Analyse de l’installation existante, identification des risques,
              points de chauffe, incohérences de câblage et protections manquantes.
            </p>
          </div>

          {/* Carte 2 */}
          <div className="rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">
              Remise au propre & sécurisation
            </h2>
            <p className="mt-2 text-sm text-neutral-700">
              Réorganisation complète des circuits, ajout de protections adaptées,
              repérage clair et amélioration de l’accessibilité.
            </p>
          </div>

          {/* Carte 3 */}
          <div className="rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">
              Gestion d’énergie & batteries
            </h2>
            <p className="mt-2 text-sm text-neutral-700">
              Architecture batteries, charge, distribution et autonomie
              adaptées à l’usage réel (navigation, vanlife, loisirs).
            </p>
          </div>

          {/* Carte 4 */}
          <div className="rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">
              Préparation avant départ ou vente
            </h2>
            <p className="mt-2 text-sm text-neutral-700">
              Vérifications prioritaires, corrections essentielles et conseils
              pour partir serein ou présenter une installation fiable à la vente.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-xl bg-neutral-900 px-8 py-10 text-white">
          <h3 className="text-2xl font-semibold">
            Un doute sur votre installation ?
          </h3>
          <p className="mt-3 max-w-2xl text-white/90">
            Un diagnostic clair permet d’éviter les pannes, les risques électriques
            et les mauvaises surprises.
          </p>

          <a
            href="/contact"
            className="mt-6 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-black"
          >
            Demander un diagnostic
          </a>
        </div>
      </section>
    </main>
  );
}
export default function RealisationsPage() {
  return (
    <main>
      {/* HERO */}
      <section
        className="relative min-h-[55vh] bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-fabsystem.png')" }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/65" />

        {/* Contenu */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-24 text-white sm:py-28">
          <h1 className="text-4xl font-semibold sm:text-5xl">
            Réalisations
          </h1>
          <p className="mt-4 max-w-2xl text-white/90">
            Exemple de reprise complète d’une installation électrique embarquée :
            sécurisation, organisation et lisibilité.
          </p>
        </div>
      </section>

      {/* CONTENU */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        {/* AVANT */}
        <div className="rounded-xl border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold">Avant</h2>
          <p className="mt-2 max-w-3xl text-sm text-neutral-600">
            Installation difficile à diagnostiquer, câblage désorganisé et protections
            peu lisibles.
          </p>

          <img
            src="/realisations/realisation-avant.jpg"
            alt="Installation électrique avant intervention"
            className="mt-6 w-full rounded-lg border"
          />
        </div>

        {/* APRES */}
        <div className="mt-12 rounded-xl border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold">Après</h2>
          <p className="mt-2 max-w-3xl text-sm text-neutral-600">
            Installation remise au propre, protections visibles, distribution claire
            et architecture sécurisée.
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <img
              src="/realisations/realisation-apres-1.jpg"
              alt="Installation électrique après intervention"
              className="w-full rounded-lg border"
            />
            <img
              src="/realisations/realisation-apres-2.jpg"
              alt="Installation électrique après intervention"
              className="w-full rounded-lg border"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
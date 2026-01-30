import Link from "next/link";

export default function RealisationsPage() {
  return (
    <main>
      {/* HERO */}
      <section
        className="relative min-h-[56vh] bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-fabsystem.png')" }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Contenu */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 text-white sm:py-28">
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Réalisations
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
            Exemple de reprise complète d’une installation électrique embarquée :
            sécurisation, organisation et lisibilité.
          </p>

          {/* CTA mobile-friendly */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 sm:w-auto"
            >
              Demander un diagnostic
            </Link>

            <Link
              href="/visio"
              className="inline-flex w-full items-center justify-center rounded-md border border-white/70 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 sm:w-auto"
            >
              Découvrir la visio conseil
            </Link>
          </div>
        </div>
      </section>

      {/* CONTENU */}
      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
        {/* AVANT */}
        <div className="rounded-xl border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold">Avant</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-700">
            Installation difficile à diagnostiquer, câblage désorganisé et protections
            peu lisibles.
          </p>

          <div className="mt-6 overflow-hidden rounded-lg border bg-neutral-50 shadow-sm">
            <img
              src="/realisations/realisation-avant.jpg"
              alt="Installation électrique avant intervention"
              className="h-auto w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* APRES */}
        <div className="mt-10 rounded-xl border border-neutral-200 p-6 sm:mt-12">
          <h2 className="text-xl font-semibold">Après</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-700">
            Installation remise au propre, protections visibles, distribution claire
            et architecture sécurisée.
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="overflow-hidden rounded-lg border bg-neutral-50 shadow-sm">
              <img
                src="/realisations/realisation-apres-1.jpg"
                alt="Installation électrique après intervention (vue 1)"
                className="h-auto w-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="overflow-hidden rounded-lg border bg-neutral-50 shadow-sm">
              <img
                src="/realisations/realisation-apres-2.jpg"
                alt="Installation électrique après intervention (vue 2)"
                className="h-auto w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Petit rappel conversion en bas */}
          <div className="mt-10 rounded-xl bg-neutral-50 p-6">
            <h3 className="text-base font-semibold text-neutral-900">
              Tu veux une installation propre et sécurisée ?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Je peux te faire un diagnostic clair et te proposer un plan d’action adapté
              à ton usage (bateau, van, camping-car).
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
              >
                Contacter FabSystem
              </Link>

              <Link
                href="/visio"
                className="inline-flex w-full items-center justify-center rounded-md border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 sm:w-auto"
              >
                Découvrir la visio conseil
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
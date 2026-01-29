export default function HomePage() {
  return (
    <main>
      {/* HERO */}
      <section
        className="relative min-h-[85vh] bg-cover bg-center"
        style={{
          backgroundImage: "url('/hero-fabsystem.png')",
        }}
      >
        {/* OVERLAY */}
        <div className="absolute inset-0 bg-black/55" />

        {/* CONTENU */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-32 text-white">
          <p className="text-sm uppercase tracking-wide text-white/80">
            Électricité embarquée
          </p>

          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            FabSystem
          </h1>

          <p className="mt-6 max-w-2xl text-white/90">
            Sécurisation et mise aux normes électriques pour bateaux,
            vans et camping-cars. Diagnostic clair, installation propre,
            solutions fiables.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="/contact"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-black"
            >
              Demander un diagnostic
            </a>

            <a
              href="/prestations"
              className="rounded-md border border-white/70 px-6 py-3 text-sm font-semibold text-white"
            >
              Voir les prestations
            </a>
          </div>
        </div>
      </section>

      {/* CONTENU NORMAL EN DESSOUS */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        {/* ton contenu actuel ici */}
      </section>
    </main>
  );
}
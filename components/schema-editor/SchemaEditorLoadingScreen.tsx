type SchemaEditorLoadingScreenProps = {
  mode?: "landing" | "editor";
};

const loadingSteps = [
  "Preparation de l'espace de travail",
  "Chargement des composants et gabarits",
  "Mise en place du canevas interactif",
];

export function SchemaEditorLoadingScreen({
  mode = "landing",
}: SchemaEditorLoadingScreenProps) {
  const isEditor = mode === "editor";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,214,102,0.24),_transparent_32%),linear-gradient(180deg,_#fffdf7,_#ffffff_46%)] text-neutral-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-card sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
              Chargement de l&apos;editeur
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              {isEditor
                ? "Ouverture de votre schema de travail"
                : "Preparation de l'editeur de schemas electriques"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
              {isEditor
                ? "Le premier chargement peut prendre quelques secondes le temps de compiler l'atelier complet. Ensuite, les ouvertures suivantes sont beaucoup plus rapides."
                : "FabSystem prepare l'atelier complet pour bateau, van et camping-car. Le premier chargement peut etre plus long qu'une page classique, surtout apres un redemarrage local."}
            </p>

            <div className="mt-6 space-y-3">
              {loadingSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900">{step}</p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">
                      <div
                        className="h-full rounded-full bg-brand-400"
                        style={{ width: `${52 + index * 14}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
              Le site repond bien. Cette etape sert seulement a preparer les outils interactifs,
              les gabarits et les exports avant affichage.
            </div>
          </section>

          <aside className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Apercu de l&apos;atelier
            </p>

            <div className="mt-4 overflow-hidden rounded-[24px] border border-neutral-200 bg-neutral-50">
              <div className="border-b border-neutral-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-200" />
                  <div className="h-3 w-3 rounded-full bg-amber-200" />
                  <div className="h-3 w-3 rounded-full bg-emerald-200" />
                </div>
              </div>

              <div className="relative h-[320px] bg-[linear-gradient(to_right,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.14)_1px,transparent_1px)] bg-[size:24px_24px] p-4">
                <div className="absolute left-5 top-5 h-28 w-40 rounded-3xl border-2 border-amber-400/80 bg-amber-50/70" />
                <div className="absolute right-7 top-10 h-24 w-28 rounded-3xl border-2 border-sky-400/80 bg-sky-50/70" />
                <div className="absolute bottom-7 left-10 h-24 w-44 rounded-3xl border-2 border-emerald-400/80 bg-emerald-50/70" />
                <div className="absolute bottom-12 right-12 h-20 w-36 rounded-3xl border-2 border-violet-400/80 bg-violet-50/70" />

                <div className="absolute left-16 top-20 h-16 w-16 rounded-2xl border border-neutral-300 bg-white shadow-sm" />
                <div className="absolute left-[8.25rem] top-[5.6rem] h-1 w-28 rounded-full bg-red-400" />
                <div className="absolute left-[15.25rem] top-[5.4rem] h-2 w-2 rounded-full bg-red-500" />

                <div className="absolute right-24 top-20 h-16 w-16 rounded-2xl border border-neutral-300 bg-white shadow-sm" />
                <div className="absolute right-[8.4rem] top-[6.25rem] h-1 w-24 rounded-full bg-neutral-900" />

                <div className="absolute left-24 bottom-20 h-16 w-16 rounded-2xl border border-neutral-300 bg-white shadow-sm" />
                <div className="absolute left-[9rem] bottom-[5.7rem] h-1 w-32 rounded-full bg-emerald-500" />

                <div className="absolute bottom-20 right-20 h-16 w-16 rounded-2xl border border-neutral-300 bg-white shadow-sm" />
                <div className="absolute right-[8.2rem] bottom-[5.7rem] h-1 w-24 rounded-full bg-violet-500" />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {["Bateau", "Van", "Camping-car"].map((label) => (
                <div
                  key={label}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-center"
                >
                  <div className="mx-auto h-2 w-12 rounded-full bg-neutral-200" />
                  <p className="mt-2 text-xs font-semibold text-neutral-600">{label}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

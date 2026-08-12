// UI-10 §8.1 — Boutique est en `force-dynamic` (catalogue toujours lu en
// base) : sans état de chargement dédié, Next.js n'affiche rien tant que
// la page n'a pas fini de charger (écran blanc silencieux, cause probable
// de la perception "la page bug"). Ce fichier suit la convention native
// Next.js App Router (`loading.tsx`) — s'affiche immédiatement pendant que
// la page réelle se prépare, sans JavaScript supplémentaire à charger.
export default function BoutiqueLoading() {
  return (
    <main className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl animate-pulse px-6 py-6 sm:py-8">
          <div className="h-3 w-24 rounded bg-neutral-200" />
          <div className="mt-3 h-6 w-64 rounded bg-neutral-200" />
          <div className="mt-2 h-4 w-96 max-w-full rounded bg-neutral-200" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl animate-pulse px-6 py-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-card border border-neutral-200 p-5 shadow-card">
              <div className="mb-4 h-44 w-full rounded-xl bg-neutral-200" />
              <div className="h-3 w-16 rounded bg-neutral-200" />
              <div className="mt-2 h-5 w-40 rounded bg-neutral-200" />
              <div className="mt-2 h-4 w-full rounded bg-neutral-200" />
              <div className="mt-2 h-4 w-2/3 rounded bg-neutral-200" />
              <div className="mt-4 h-10 w-full rounded-lg bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

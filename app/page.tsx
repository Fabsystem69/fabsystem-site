import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
      <p className="text-sm font-medium text-neutral-600">
        Électricité embarquée
      </p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        FabSystem
      </h1>

      <p className="mt-4 max-w-2xl text-lg text-neutral-700">
        Sécurisation et mise aux normes électriques pour{" "}
        <strong>bateaux</strong>, <strong>vans</strong> et{" "}
        <strong>camping-cars</strong>. Diagnostic clair, installation propre,
        solutions fiables.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          Demander un diagnostic
        </Link>

        <Link
          href="/prestations"
          className="inline-flex items-center justify-center rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
        >
          Voir les prestations
        </Link>
      </div>
    </main>
  );
}
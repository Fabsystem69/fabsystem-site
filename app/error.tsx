"use client";

import Image from "next/image";
import Link from "next/link";

// Filet de sécurité racine — trouvé par la recette navigateur de
// app/mon-compte/error.tsx : une erreur levée dans un layout imbriqué
// (ex. app/mon-compte/layout.tsx, sa propre garde d'authentification) ne
// peut structurellement pas être rattrapée par le error.tsx du même
// dossier (limitation du App Router) — seul un error.tsx d'un segment
// ANCÊTRE le peut. Ce fichier, à la racine, couvre ce cas pour tout le
// site (pas seulement /mon-compte), en plus de rester le filet par défaut
// pour toute page qui n'a pas son propre error.tsx plus spécifique.
export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
      <Image
        src="/volta/volta-perplexe.png"
        alt="Volta, la mascotte FabSystem, perplexe"
        width={160}
        height={160}
        priority
      />
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Erreur</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
        Un problème est survenu.
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-neutral-600">
        Cette page n&apos;a pas pu s&apos;afficher correctement. Réessayez, ou revenez à l&apos;accueil.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-900"
        >
          Accueil
        </Link>
      </div>

      <p className="mt-10 text-sm text-neutral-500">
        Ça persiste ?{" "}
        <Link href="/contact" className="font-medium text-neutral-900 underline underline-offset-4">
          Contactez FabSystem
        </Link>
        .
      </p>
    </main>
  );
}

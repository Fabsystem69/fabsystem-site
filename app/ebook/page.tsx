import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ebooks FabSystem — électricité et plomberie embarquées",
  description:
    "Les manuels FabSystem pour installer soi-même son électricité et sa plomberie embarquées, écrits par un électricien spécialisé marine et van.",
  alternates: { canonical: "/ebook" },
};

const ebooks = [
  {
    slug: "cabler-son-van",
    title: "Câbler son van sans se planter",
    pitch:
      "Le manuel complet pour installer l'électricité et la plomberie de ton van comme un pro.",
    price: "49,99 €",
    cover: "/ebook/couverture.jpg",
    available: true,
  },
  {
    slug: null,
    title: "Câbler son bateau sans se planter",
    pitch: "Le même niveau d'exigence, adapté aux contraintes marines (VASP, coque, humidité).",
    price: null,
    cover: null,
    available: false,
  },
  {
    slug: null,
    title: "Câbler son camping-car sans se planter",
    pitch: "L'électricité et la plomberie embarquées, spécifiques au camping-car.",
    price: null,
    cover: null,
    available: false,
  },
] as const;

export default function EbookCatalogPage() {
  return (
    <main className="bg-white">
      <section className="border-b border-neutral-200 bg-neutral-950 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-6 text-center text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">
            FabSystem · Ebooks
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Choisis ton ebook
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/80">
            Des manuels écrits par un électricien qui pose ça tous les jours, pas par un
            blogueur qui a lu deux forums. Le van est disponible, les autres arrivent bientôt.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {ebooks.map((ebook) =>
              ebook.available && ebook.slug ? (
                <Link
                  key={ebook.title}
                  href={`/ebook/${ebook.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 shadow-sm transition hover:border-yellow-400 hover:shadow-md"
                >
                  <div className="relative aspect-[3/4] w-full bg-neutral-950">
                    <Image
                      src={ebook.cover!}
                      alt={`Couverture du livre « ${ebook.title} »`}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-sm font-bold text-neutral-950">{ebook.title}</p>
                    <p className="mt-2 flex-1 text-xs leading-relaxed text-neutral-600">
                      {ebook.pitch}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-bold text-neutral-950">{ebook.price}</span>
                      <span className="inline-flex items-center justify-center rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-bold text-neutral-900 transition-colors duration-150 group-hover:bg-yellow-300">
                        Découvrir
                      </span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div
                  key={ebook.title}
                  className="flex flex-col overflow-hidden rounded-2xl border border-dashed border-neutral-300 bg-neutral-50"
                >
                  <div className="relative flex aspect-[3/4] w-full items-center justify-center bg-neutral-100">
                    <span className="text-3xl opacity-40">📘</span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-sm font-bold text-neutral-500">{ebook.title}</p>
                    <p className="mt-2 flex-1 text-xs leading-relaxed text-neutral-500">
                      {ebook.pitch}
                    </p>
                    <div className="mt-4">
                      <span className="inline-flex items-center justify-center rounded-lg bg-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-500">
                        Bientôt disponible
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

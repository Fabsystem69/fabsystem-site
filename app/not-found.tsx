import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page introuvable",
  description: "Cette page n'existe pas ou plus sur FabSystem.",
  robots: { index: false, follow: false },
};

const USEFUL_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/boutique", label: "Boutique" },
  { href: "/outils", label: "Outils" },
  { href: "/formations", label: "Les bases" },
  { href: "/contact", label: "Contact" },
];

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
      <Image
        src="/volta/volta-perplexe.png"
        alt="Volta, la mascotte FabSystem, perplexe"
        width={160}
        height={160}
        priority
      />
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
        Erreur 404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
        Cette page n&apos;existe pas (ou plus).
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-neutral-600">
        Le lien est peut-être obsolète, ou l&apos;adresse comporte une erreur. Voici où aller à la
        place :
      </p>

      <ul className="mt-8 flex flex-wrap justify-center gap-3">
        {USEFUL_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-900"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-neutral-500">
        Besoin d&apos;aide ?{" "}
        <Link href="/contact" className="font-medium text-neutral-900 underline underline-offset-4">
          Contactez FabSystem
        </Link>
        .
      </p>
    </main>
  );
}

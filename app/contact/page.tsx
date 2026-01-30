import Link from "next/link";
import ContactForm from "../../components/ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact électricien embarqué bateau & van | FabSystem",
  description:
    "Contactez FabSystem pour un diagnostic ou un conseil en électricité embarquée pour bateau, van ou camping-car. Réponse claire et rapide.",
};

export default function ContactPage() {
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
          <h1 className="text-4xl font-semibold sm:text-5xl">Contact</h1>
          <p className="mt-4 max-w-2xl text-white/90">
            Un doute sur votre installation électrique ? Parlons-en simplement.
          </p>
        </div>
      </section>

      {/* CONTENU */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-2">
          {/* INFOS */}
          <div>
            <h2 className="text-2xl font-semibold">FabSystem</h2>

            <p className="mt-4 text-neutral-700">
              Électricité et systèmes embarqués pour bateaux, vans et camping-cars.
            </p>

            <ul className="mt-6 space-y-3 text-neutral-700">
              <li>
                📧{" "}
                <a
                  href="mailto:fabien.lages@fabsystem.fr"
                  className="font-medium text-neutral-900 underline"
                >
                  fabien.lages@fabsystem.fr
                </a>
              </li>

              <li>
                📞{" "}
                <a
                  href="tel:+33698247722"
                  className="font-medium text-neutral-900 underline"
                >
                  06 98 24 77 22
                </a>
              </li>
            </ul>

            {/* Bouton visio */}
            <div className="mt-6">
              <Link
                href="/visio"
                className="inline-block rounded-md bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Découvrir la visio conseil
              </Link>
            </div>

            <p className="mt-6 text-sm text-neutral-500">
              Intervention sur rendez-vous. Diagnostic clair et conseils adaptés à votre usage.
            </p>
          </div>

          {/* FORMULAIRE ACTIF */}
          <div className="rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold">Décrire votre besoin</h3>
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
import Link from "next/link";
import VisioForm from "@/components/VisioForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visio conseil en électricité embarquée | Bateau, van, camping-car",
  description:
    "Visio individuelle pour analyser votre installation électrique embarquée. Diagnostic clair, recommandations et plan d’action en 1 heure.",
};

export default function VisioPage() {
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
            Visio conseil en électricité embarquée
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
            Comprendre, sécuriser et décider — en 1 heure.
          </p>

          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-base">
            Batteries, solaire, 230 V, protections, câblage… On fait le point sur
            votre installation (bateau, van, camping-car) pour clarifier la situation,
            éviter les erreurs et définir un plan d’action simple.
          </p>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80">
            Réserve ton créneau puis remplis le formulaire : ça rend la séance bien
            plus efficace.
          </p>

          {/* CTA : lien Cal uniquement ici */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="https://cal.com/fabien-l-typ79a"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 sm:w-auto"
            >
              Réserver une visio
            </a>

            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center rounded-md border border-white/70 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 sm:w-auto"
            >
              Plutôt un diagnostic
            </Link>
          </div>

          <p className="mt-3 text-xs text-white/70">
            Visio individuelle • 1h • Paiement requis (50 €)
          </p>
        </div>
      </section>

      {/* CONTENU */}
      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2">
          {/* Colonne gauche : explications */}
          <div>
            <h2 className="text-2xl font-semibold">Comment ça se passe</h2>

            <div className="mt-4 space-y-4 text-sm leading-relaxed text-neutral-700">
              <p>
                1) Tu réserves un créneau sur Cal.
                <br />
                2) Tu remplis le formulaire ci-dessous.
                <br />
                3) Pendant la visio, on analyse et je te propose une solution adaptée.
              </p>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Ce que tu obtiens
                </h3>
                <ul className="mt-3 space-y-2">
                  <li>• Un diagnostic clair (ce qui est OK / ce qui est risqué)</li>
                  <li>• Une architecture recommandée (protections, distribution)</li>
                  <li>• Une liste de matériel + sections de câbles (si nécessaire)</li>
                  <li>• Un plan d’action simple (étapes)</li>
                </ul>
              </div>

              <div className="rounded-xl border border-neutral-200 p-5">
                <h3 className="text-sm font-semibold text-neutral-900">
                  À préparer si possible
                </h3>
                <ul className="mt-3 space-y-2">
                  <li>• 2–3 photos de ton installation</li>
                  <li>• Les équipements à alimenter (frigo, guindeau, etc.)</li>
                  <li>• Batteries / charge (alternateur, solaire, 230V)</li>
                  <li>• Tes objectifs (autonomie, sécurité, ajout matériel)</li>
                </ul>
              </div>

              {/* Bloc prix / rassurance */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="text-sm font-semibold text-neutral-900">Tarif</h3>
                <p className="mt-2 text-sm text-neutral-700">
                  <strong>50 €</strong> pour une visio individuelle de 1 heure.
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  Paiement sécurisé en ligne avant confirmation du rendez-vous.
                </p>
              </div>
            </div>

            {/* CTA rappel */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="https://cal.com/fabien-l-typ79a"
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
              >
                Réserver maintenant
              </a>

              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center rounded-md border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 sm:w-auto"
              >
                Me contacter
              </Link>
            </div>
          </div>

          {/* Colonne droite : formulaire */}
          <div className="rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold">Formulaire de préparation</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Remplis le minimum ci-dessous. Les détails techniques sont optionnels,
              mais ils font gagner beaucoup de temps pendant la visio.
            </p>

            <div className="mt-6">
              <VisioForm />
            </div>

            <p className="mt-4 text-xs text-neutral-500">
              Astuce : tu peux aussi préparer quelques photos et les avoir sous la
              main pendant la visio.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
"use client";

import Link from "next/link";
import { useState } from "react";
import VisioForm from "@/components/VisioForm";

export default function VisioPage() {
  const [isCalOpen, setIsCalOpen] = useState(false);
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
            Réservez votre créneau puis remplissez le formulaire : ça rend la séance bien
            plus efficace.
          </p>

          
        </div>
      </section>

      {/* CONTENU */}
      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2">
          {/* Colonne gauche : explications */}
          <div>
            <h2 className="text-2xl font-semibold">Comment ça se passe?</h2>

            <div className="mt-4 space-y-4 text-sm leading-relaxed text-neutral-700">
              <p>
                1) Vous réservez un créneau sur Cal.
                <br />
                2) Vous remplissez le formulaire ci-dessous.
                <br />
                3) Pendant la visio, on analyse et je vous propose une solution adaptée.
              </p>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Ce que vous obtenez
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
                  <li>• 2–3 photos de votre installation</li>
                  <li>• Les équipements à alimenter (frigo, guindeau, etc.)</li>
                  <li>• Batteries / charge (alternateur, solaire, 230V)</li>
                  <li>• Vos objectifs (autonomie, sécurité, ajout matériel)</li>
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
              <button
                onClick={() => setIsCalOpen(true)}
                className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
              >
                Réserver maintenant
              </button>

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
              Remplissez le minimum ci-dessous. Les détails techniques sont optionnels,
              mais ils font gagner beaucoup de temps pendant la visio.
            </p>

            <div className="mt-6">
              <VisioForm />
            </div>

            <p className="mt-4 text-xs text-neutral-500">
              Astuce : vous pouvez aussi préparer quelques photos et les avoir sous la
              main pendant la visio.
            </p>
          </div>
        </div>
      </section>

      {/* MODAL CAL */}
      {isCalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-lg max-h-[85vh] overflow-hidden sm:max-h-none">
            {/* Bouton fermer */}
            <button
              onClick={() => setIsCalOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-md bg-neutral-100 p-2 hover:bg-neutral-200"
              aria-label="Fermer le formulaire"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Cal.com iframe */}
            <iframe
              src="https://cal.com/fabien-l-typ79a?embed=true"
              style={{
                width: "100%",
                height: "100%",
                minHeight: "500px",
                border: "none",
                borderRadius: "12px",
              }}
              frameBorder="0"
            />
          </div>
        </div>
      )}
    </main>
  );
}
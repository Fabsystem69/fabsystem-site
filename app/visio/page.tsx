"use client";

import ServiceAssurance from "@/components/ServiceAssurance";
import { resolveBackgroundImage } from "@/lib/background-image";
import { track } from "@/lib/client/track";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import VisioForm from "@/components/VisioForm";

const heroBenefits = [
  "Diagnostic clair (12V / 230V / charge / sécurité).",
  "Priorités + plan d’action adapté à votre usage.",
  "Décisions sûres avant achat ou recâblage.",
];

const visioOptions = [
  {
    id: "decouverte",
    badge: "Gratuit",
    badgeColor: "bg-green-100 text-green-700",
    borderColor: "border-green-200",
    bg: "bg-green-50",
    title: "Coaching découverte",
    duration: "20 minutes",
    price: "Gratuit",
    priceColor: "text-green-700",
    description:
      "Vous avancez sur les modules ou vous hésitez encore sur votre projet. On fait le point ensemble sans engagement.",
    items: [
      "Clarifier une situation ou un doute",
      "Savoir si une visio conseil vous correspond",
      "100 % en visio, sans préparation requise",
    ],
    cta: "Réserver 20 min — Gratuit",
    ctaStyle:
      "bg-green-700 text-white hover:bg-green-600",
    isBooking: true,
  },
  {
    id: "conseil",
    badge: "Recommandé",
    badgeColor: "bg-neutral-900 text-white",
    borderColor: "border-neutral-900",
    bg: "bg-white",
    title: "Visio conseil",
    duration: "1 heure",
    price: "50 €",
    priceColor: "text-neutral-900",
    description:
      "On analyse votre installation en détail. Schéma, dimensionnement, sécurité, liste matériel — vous repartez avec un plan d’action clair.",
    items: [
      "Diagnostic complet 12V / 230V",
      "Architecture recommandée + matériel",
      "Synthèse écrite après la session",
    ],
    cta: "Réserver la visio — 50 €",
    ctaStyle:
      "bg-neutral-900 text-white hover:bg-neutral-800",
    isBooking: true,
  },
] as const;

const faqItems = [
  {
    q: "Que vais-je obtenir à la fin ?",
    a: "Une synthèse claire + priorités + suite recommandée.",
  },
  {
    q: "De quoi avez-vous besoin avant la visio ?",
    a: "Photos, schéma si existant, liste du matériel, usage et symptômes.",
  },
  {
    q: "Et si le problème nécessite une intervention ?",
    a: "La visio sert à cadrer, puis on planifie si nécessaire.",
  },
  {
    q: "Est-ce adapté au 230V / lithium ?",
    a: "Oui, avec un focus sécurité et protections.",
  },
] as const;

export default function VisioPage() {
  const [isCalOpen, setIsCalOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const visioAssuranceItems = [
    "Visio 50 €. Interventions sur devis. Diagnostic sur site à partir de 89 € selon périmètre.",
    "Réponse sous 24–48h ouvrées.",
    "Basé à Neuville-sur-Saône. Déplacements Rhône / Auvergne-Rhône-Alpes sur rendez-vous. Visio partout en France.",
  ];
  const heroBackground = resolveBackgroundImage("/hero-fabsystem.png");
  const openBooking = () => {
    track("click_rdv");
    setIsCalOpen(true);
  };

  useEffect(() => {
    if (!isCalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCalOpen]);

  return (
    <main>
      {/* HERO */}
      <section
        className="relative bg-cover bg-center"
        style={{ backgroundImage: heroBackground }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Contenu */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 text-white sm:py-10">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Visio en électricité embarquée
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Deux formules selon votre situation — 20 min gratuits pour démarrer,
            ou 1 heure pour aller en profondeur.
          </p>

          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/75 sm:text-sm">
            Bateau, van ou camping-car · On clarifie rapidement la situation et la meilleure suite.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openBooking}
              className="inline-flex min-h-9 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Visio conseil — 50 €
            </button>
            <button
              type="button"
              onClick={openBooking}
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Découverte gratuite — 20 min
            </button>
          </div>

          <ul className="mt-3 max-w-2xl space-y-1.5 pl-4 text-xs leading-relaxed text-white/85 sm:text-sm">
            {heroBenefits.map((benefit) => (
              <li key={benefit} className="list-disc">
                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <ServiceAssurance items={visioAssuranceItems} tone="inverse" />
          </div>
        </div>
      </section>

      {/* CHOIX DE VISIO */}
      <section className="border-b border-neutral-200 bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Deux formules disponibles
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
            Quelle visio vous correspond ?
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Choisissez selon votre situation — vous pouvez toujours commencer par la découverte
            gratuite.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {visioOptions.map((option) => (
              <div
                key={option.id}
                className={`flex flex-col rounded-2xl border-2 p-6 shadow-sm ${option.borderColor} ${option.bg}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-0.5 text-xs font-bold ${option.badgeColor}`}
                  >
                    {option.badge}
                  </span>
                  <span className="text-xs text-neutral-400">{option.duration}</span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-neutral-950">{option.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                  {option.description}
                </p>

                <ul className="mt-4 space-y-2">
                  {option.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-neutral-700">
                      <span className="mt-0.5 text-green-600">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4">
                  <span className={`text-2xl font-bold ${option.priceColor}`}>
                    {option.price}
                  </span>
                  <button
                    type="button"
                    onClick={openBooking}
                    className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition ${option.ctaStyle}`}
                  >
                    {option.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                type="button"
                onClick={openBooking}
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

      <section
        aria-labelledby="visio-faq"
        className="border-t border-neutral-200 bg-white py-8 sm:py-10"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-4xl">
            <h2
              id="visio-faq"
              className="text-base font-semibold text-neutral-950 sm:text-lg"
            >
              FAQ
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {faqItems.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-neutral-200 bg-white p-3 sm:p-4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-neutral-900">
                    <span>{item.q}</span>
                    <span className="text-neutral-500 transition group-open:rotate-180">
                      ⌄
                    </span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MODAL CAL */}
      {isCalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Réservation visio FabSystem"
          className="fixed inset-0 z-50 bg-black/50 p-4"
          onClick={() => setIsCalOpen(false)}
        >
          <div className="flex min-h-full items-center justify-center">
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-lg max-h-[85vh] sm:max-h-none"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Bouton fermer */}
            <button
              ref={closeButtonRef}
              type="button"
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
              title="Réservation visio Cal.com"
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
        </div>
      )}
    </main>
  );
}

import Link from "next/link";
import ContactForm from "../../components/ContactForm";
import PhoneReveal from "../../components/PhoneReveal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact électricien embarqué bateau & van | FabSystem",
  description:
    "Contactez FabSystem pour un diagnostic ou un conseil en électricité embarquée pour bateau, van ou camping-car. Réponse claire et rapide.",
};

const FAQ = [
  {
    q: "Combien de temps pour avoir une réponse ?",
    a: "En général sous 24–48h (jours ouvrés). Si c’est un sujet sécurité, précise-le dans “Urgence”.",
  },
  {
    q: "Qu’est-ce que je dois fournir pour un bon diagnostic ?",
    a: "Le support (bateau/van/camping-car), ton objectif, et si possible : type de batteries, source(s) de charge, et les équipements principaux.",
  },
  {
    q: "Tu te déplaces ou tu fais aussi à distance ?",
    a: "Les deux. Pour aller vite, la visio conseil permet déjà de clarifier l’architecture, la liste matériel et les étapes.",
  },
  {
    q: "La visio, c’est pour quel type de besoin ?",
    a: "Pour comprendre une installation, éviter les erreurs, préparer une refonte, dimensionner protections/câbles, ou valider un schéma.",
  },
];

export default function ContactPage() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <section
        className="relative min-h-[48vh] bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-fabsystem.png')" }}
      >
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 text-white sm:py-24">
          <h1 className="text-4xl font-semibold sm:text-5xl">Contact</h1>
          <p className="mt-4 max-w-2xl text-white/90">
            Un doute sur votre installation électrique ? Parlons-en simplement.
          </p>
        </div>
      </section>

      {/* CONTENU */}
      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
        <div className="grid items-start gap-6 sm:grid-cols-12 sm:gap-8">
          {/* COLONNE GAUCHE : INFOS + FAQ */}
          <aside className="sm:col-span-5">
            <div className="space-y-6 sm:sticky sm:top-24">
              {/* Carte infos */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold">FabSystem</h2>
                <p className="mt-3 text-neutral-700 leading-relaxed">
                  Électricité et systèmes embarqués pour bateaux, vans et camping-cars.
                </p>

                <div className="mt-6 space-y-4">
                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <span className="mt-[2px]">📧</span>
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">Email</div>
                      <a
                        href="mailto:fabien.lages@fabsystem.fr"
                        className="text-sm text-neutral-700 underline underline-offset-4 hover:text-neutral-900"
                      >
                        fabien.lages@fabsystem.fr
                      </a>
                    </div>
                  </div>

                  {/* Téléphone (caché) */}
                  <div className="flex items-start gap-3">
                    <span className="mt-[2px]">📞</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-900">
                        Téléphone
                      </div>
                      <PhoneReveal />
                      <p className="mt-2 text-xs text-neutral-500">
                        Appel téléphonique après premier échange si nécessaire.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-6">
                  <Link
                    href="/visio"
                    className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
                  >
                    Prendre un rendez-vous
                  </Link>
                  <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
                    Intervention sur rendez-vous. Diagnostic clair et conseils adaptés à votre usage.
                  </p>
                </div>
              </div>

              {/* Carte FAQ */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold">Mini FAQ</h3>

                <div className="mt-4 divide-y divide-neutral-200">
                  {FAQ.map((item, idx) => (
                    <details key={idx} className="group py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-neutral-900">
                        <span>{item.q}</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 transition group-open:rotate-180">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M6 9l6 6 6-6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </summary>

                      <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>

                <p className="mt-4 text-xs text-neutral-500">
                  Tu ne trouves pas ta réponse ? Envoie ton message via le formulaire, je te réponds clairement.
                </p>
              </div>
            </div>
          </aside>

          {/* COLONNE DROITE : FORMULAIRE */}
          <div className="sm:col-span-7">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm sm:p-8">
              <h3 className="text-lg font-semibold">Décrire votre besoin</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Plus c’est précis, plus la réponse est rapide et utile.
              </p>

              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
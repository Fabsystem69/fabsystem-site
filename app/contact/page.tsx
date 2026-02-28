import Image from "next/image";
import Link from "next/link";
import ContactForm from "../../components/ContactForm";
import PhoneReveal from "../../components/PhoneReveal";
import type { Metadata } from "next";
import { generateQrDataUrl } from "@/lib/server/qrcode";

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
    a: "Le support (bateau/van/camping-car), votre objectif, et si possible : type de batteries, source(s) de charge, et les équipements principaux.",
  },
  {
    q: "Vous vous déplacez ou intervenez-vous à distance ?",
    a: "Les deux. Pour aller vite, la visio conseil permet déjà de clarifier l’architecture, la liste matériel et les étapes.",
  },
  {
    q: "La visio, c’est pour quel type de besoin ?",
    a: "Pour comprendre une installation, éviter les erreurs, préparer une refonte, dimensionner protections/câbles, ou valider un schéma.",
  },
];

const phoneHref = "tel:+33698247722";
const emailHref = "mailto:fabien.lages@fabsystem.fr";
const websiteHref = "https://www.fabsystem.fr";
const vcardPageUrl = "https://www.fabsystem.fr/vcard";

export default async function ContactPage() {
  const qrDataUrl = await generateQrDataUrl(vcardPageUrl, {
    margin: 1,
    width: 240,
  });

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

      <section className="mx-auto mt-12 max-w-3xl px-6">
        <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-950">
              Carte de visite digitale
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white">
              <Image
                src="/logo.png"
                alt="Logo FabSystem"
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="h-px bg-neutral-200" />

          <div className="space-y-2">
            <p className="text-lg font-semibold text-neutral-950">
              Fabien Lages
            </p>
            <p className="font-medium text-neutral-900">FabSystem</p>
            <p className="text-sm text-neutral-500">
              Électricité embarquée • Audit • Formation
            </p>
          </div>

          <div className="space-y-3 text-sm text-neutral-700">
            <p>
              <span className="font-medium text-neutral-900">Téléphone :</span>{" "}
              <a href={phoneHref} className="underline underline-offset-4">
                06 98 24 77 22
              </a>
            </p>
            <p>
              <span className="font-medium text-neutral-900">Email :</span>{" "}
              <a href={emailHref} className="underline underline-offset-4">
                fabien.lages@fabsystem.fr
              </a>
            </p>
            <p>
              <span className="font-medium text-neutral-900">Adresse :</span>{" "}
              48 rue Rey Loras, Bât. E, 69250 Neuville-sur-Saône
            </p>
            <p>
              <span className="font-medium text-neutral-900">Site :</span>{" "}
              <a
                href={websiteHref}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                www.fabsystem.fr
              </a>
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/contact.vcf"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Ajouter à mes contacts
            </a>
            <a
              href="/contact.vcf"
              download
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
            >
              Télécharger la vCard (.vcf)
            </a>
          </div>

          <div className="pt-2 text-center">
            <Image
              src={qrDataUrl}
              alt="QR code vers la carte digitale FabSystem"
              width={128}
              height={128}
              unoptimized
              className="mx-auto h-32 w-32"
            />
            <p className="mt-3 text-sm text-neutral-500">
              Scanner pour enregistrer mes coordonnées
            </p>
          </div>
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
                  Vous ne trouvez pas votre réponse ? Envoyez votre message via le formulaire, je vous réponds clairement.
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

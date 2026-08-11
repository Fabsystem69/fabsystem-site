import Image from "next/image";
import TrackedLink from "@/components/TrackedLink";
import RevealPhone from "@/components/RevealPhone";
import ContactForm from "../../components/ContactForm";
import type { Metadata } from "next";
import ServiceAssurance from "@/components/ServiceAssurance";
import { PublicHero } from "@/components/public/PublicHero";
import { generateQrDataUrl } from "@/lib/server/qrcode";

export const metadata: Metadata = {
  title: "Contact électricien embarqué bateau & van",
  description:
    "Contactez FabSystem pour un diagnostic ou un conseil en électricité embarquée pour bateau, van ou camping-car. Réponse claire et rapide.",
  alternates: {
    canonical: "/contact",
  },
};

const FAQ = [
  {
    q: "Intervenez-vous seulement sur bateaux ?",
    a: "Non. Bateau, van et camping-car : même logique de sécurité et de fiabilité.",
  },
  {
    q: "Intervenez-vous hors Rhône ?",
    a: "Oui selon le projet. Sinon la visio permet déjà de cadrer et sécuriser beaucoup de choses.",
  },
  {
    q: "Travaillez-vous sur lithium / 230V / solaire / DC-DC ?",
    a: "Oui. On valide la cohérence et la sécurité avant modification.",
  },
  {
    q: "Quels délais ?",
    a: "Réponse sous 24–48h ouvrées. Les délais d’intervention sont confirmés après cadrage.",
  },
  {
    q: "La visio suffit-elle ?",
    a: "Pour diagnostiquer, cadrer une refonte ou valider un schéma, souvent oui. Sinon on bascule sur site.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

const emailHref = "mailto:contact@fabsystem.fr";
const websiteHref = "https://www.fabsystem.fr";
const vcardPageUrl = "https://www.fabsystem.fr/vcard";

export default async function ContactPage() {
  const qrDataUrl = await generateQrDataUrl(vcardPageUrl, {
    margin: 1,
    width: 200,
  });

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PublicHero
        title="Contact"
        description="Un doute sur votre installation électrique ? Parlons-en simplement."
        assurance={<ServiceAssurance tone="inverse" />}
        scrollTargetId="apres-hero"
      />

      <section id="apres-hero" className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
        <div className="grid items-start gap-6 sm:grid-cols-12 sm:gap-8">
          <div className="order-1 sm:col-span-7">
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

          <aside
            aria-labelledby="contact-vcard"
            className="order-2 sm:col-span-5"
          >
            <div className="sm:sticky sm:top-24">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2
                      id="contact-vcard"
                      className="text-base font-semibold text-neutral-950"
                    >
                      Carte de visite digitale
                    </h2>
                    <p className="text-sm text-neutral-500">
                      Enregistrez mes coordonnées directement dans vos contacts téléphone.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white">
                    <Image
                      src="/logo.png"
                      alt="Logo FabSystem"
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                <div className="mt-3 h-px bg-neutral-200" />

                <div className="mt-3 space-y-1">
                  <p className="text-base font-semibold text-neutral-950">
                    Fabien Lages
                  </p>
                  <p className="text-sm font-medium text-neutral-900">FabSystem</p>
                  <p className="text-sm text-neutral-500">
                    Électricité embarquée • Diagnostic • Formation
                  </p>
                </div>

                <div className="mt-3 space-y-2 text-sm text-neutral-700">
                  <p>
                    <span className="font-medium text-neutral-900">Email :</span>{" "}
                    <TrackedLink
                      href={emailHref}
                      event="click_email"
                      className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    >
                      contact@fabsystem.fr
                    </TrackedLink>
                  </p>
                  <p>
                    <span className="font-medium text-neutral-900">Téléphone :</span>{" "}
                    <RevealPhone className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20" />
                  </p>
                  <p>
                    <span className="font-medium text-neutral-900">Adresse :</span>{" "}
                    Neuville-sur-Saône
                  </p>
                  <p>
                    <span className="font-medium text-neutral-900">Site :</span>{" "}
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    >
                      www.fabsystem.fr
                    </a>
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                  <TrackedLink
                    href="/contact.vcf"
                    event="download_vcf"
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                  >
                    Ajouter à mes contacts
                  </TrackedLink>
                  <TrackedLink
                    href="/contact.vcf"
                    event="download_vcf"
                    download
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                  >
                    Ajouter à mes contacts
                  </TrackedLink>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-3">
                  <Image
                    src={qrDataUrl}
                    alt="QR code vers la carte digitale FabSystem"
                    width={104}
                    height={104}
                    unoptimized
                    className="h-24 w-24 shrink-0 rounded-lg border border-neutral-200 bg-white p-1 sm:h-28 sm:w-28"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-neutral-900">
                      Scanner pour enregistrer mes coordonnées
                    </p>
                    <p className="text-xs leading-relaxed text-neutral-500">
                      Enregistre directement mes coordonnées dans vos contacts téléphone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

      </section>

      <section
        aria-labelledby="contact-faq"
        className="border-t border-neutral-200 bg-white py-8 sm:py-10"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-4xl">
            <h2
              id="contact-faq"
              className="text-base font-semibold text-neutral-950 sm:text-lg"
            >
              FAQ
            </h2>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {FAQ.map((item) => (
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

            <p className="mt-3 text-xs text-neutral-500">
              Vous ne trouvez pas votre réponse ? Envoyez votre message via le
              formulaire.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import TrackedLink from "@/components/TrackedLink";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { generateQrDataUrl } from "@/lib/server/qrcode";

const phoneHref = "tel:+33698247722";
const emailHref = "mailto:fabien.lages@fabsystem.fr";
const websiteHref = "https://www.fabsystem.fr";
const scheduleHref = "/visio";
const vcardPageUrl = "https://www.fabsystem.fr/vcard";

type ContactRow = {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
  hint?: string;
  icon: ReactNode;
};

const contactRows: ContactRow[] = [
  {
    label: "Téléphone",
    value: "06 98 24 77 22",
    href: phoneHref,
    hint: "Appel après premier échange si nécessaire.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6.6 10.8a15.4 15.4 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24c1.08.36 2.24.54 3.42.54a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.75 21 3 13.25 3 3.6a1 1 0 0 1 1-1H7.5a1 1 0 0 1 1 1c0 1.18.18 2.34.54 3.42a1 1 0 0 1-.24 1z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Email",
    value: "fabien.lages@fabsystem.fr",
    href: emailHref,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v9A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="m5 7 7 5 7-5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Adresse",
    value: "Neuville-sur-Saône",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 21s6-5.33 6-11a6 6 0 1 0-12 0c0 5.67 6 11 6 11Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
  },
  {
    label: "Site",
    value: "www.fabsystem.fr",
    href: websiteHref,
    external: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M3 12h18M12 3c2.5 2.4 4 5.7 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.7-4-9s1.5-6.6 4-9Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const domains = [
  "Diagnostic",
  "Formation",
  "Bateaux",
  "Vans",
  "Camping-cars",
];

const trustPills = [
  "Rhône / déplacements",
  "Réponse 24–48h",
  "Intervention sur RDV",
];

const links = [
  { label: "Réalisations", href: "/realisations" },
  { label: "Page contact", href: "/contact" },
  { label: "Prestations", href: "/prestations" },
];

export const metadata: Metadata = {
  title: "Carte de visite digitale",
  description:
    "Carte digitale FabSystem pour ajouter rapidement les coordonnées de Fabien Lages (électricité embarquée).",
  alternates: {
    canonical: "/vcard",
  },
};

export default async function VCardPage() {
  const qrDataUrl = await generateQrDataUrl(vcardPageUrl, {
    margin: 1,
    width: 220,
  });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f7f5_0%,#ffffff_42%,#f8f8f7_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-[560px]">
        <div className="overflow-hidden rounded-[24px] border border-neutral-200/80 bg-white shadow-[0_20px_60px_-32px_rgba(10,10,10,0.35)]">
          <div className="border-b border-neutral-200/80 bg-[radial-gradient(circle_at_top,#f4f1e8_0%,#faf9f6_45%,#ffffff_100%)] px-6 pb-6 pt-8 sm:px-8 sm:pb-7 sm:pt-9">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-neutral-200 bg-neutral-900 text-2xl font-semibold tracking-[0.18em] text-white shadow-sm">
                  FL
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white bg-white shadow-sm">
                  <Image
                    src="/logo.png"
                    alt="Logo FabSystem"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-neutral-500">
                  FabSystem
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-[2rem]">
                  Fabien Lages
                </h1>
                <p className="text-sm font-medium text-neutral-700 sm:text-[15px]">
                  Électricité embarquée — Diagnostic • Formation
                </p>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-neutral-500">
                  Solutions claires et adaptées à votre usage pour bateaux, vans et camping-cars.
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {trustPills.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-neutral-200 bg-white/70 px-3 py-1.5 text-xs font-semibold tracking-wide text-neutral-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
            <section aria-labelledby="vcard-actions" className="space-y-3">
              <div className="space-y-1">
                <h2
                  id="vcard-actions"
                  className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500"
                >
                  Actions
                </h2>
                <p className="text-sm text-neutral-600">
                  Réponse sous 24–48h ouvrées. Diagnostic clair, conseils adaptés à votre usage.
                </p>
              </div>

              <div className="grid gap-3">
                <TrackedLink
                  href="/contact.vcf"
                  event="download_vcf"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                >
                  Ajouter à mes contacts
                </TrackedLink>

                <div className="grid gap-3 sm:grid-cols-2">
                  <TrackedLink
                    href={scheduleHref}
                    event="click_rdv"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base font-medium text-neutral-900 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                  >
                    Prendre rendez-vous
                  </TrackedLink>
                  <TrackedLink
                    href={emailHref}
                    event="click_email"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base font-medium text-neutral-900 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                  >
                    Envoyer un email
                  </TrackedLink>
                </div>

                <TrackedLink
                  href={phoneHref}
                  event="click_tel"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base font-medium text-neutral-900 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                >
                  Appeler
                </TrackedLink>
              </div>
            </section>

            <section aria-labelledby="vcard-details" className="space-y-3">
              <h2
                id="vcard-details"
                className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500"
              >
                Coordonnées
              </h2>

              <ul className="space-y-3">
                {contactRows.map((row) => (
                  <li
                    key={row.label}
                    className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-[0_10px_30px_-26px_rgba(10,10,10,0.25)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700">
                        {row.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                          {row.label}
                        </p>
                        {row.href ? (
                          <a
                            href={row.href}
                            target={row.external ? "_blank" : undefined}
                            rel={row.external ? "noreferrer" : undefined}
                            className="mt-1 block break-words text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                          >
                            {row.value}
                          </a>
                        ) : (
                          <p className="mt-1 text-sm font-semibold text-neutral-900">
                            {row.value}
                          </p>
                        )}
                        {row.hint ? (
                          <p className="mt-1 text-sm text-neutral-500">{row.hint}</p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="vcard-domains" className="space-y-3">
              <h2
                id="vcard-domains"
                className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500"
              >
                Domaines
              </h2>

              <div className="flex flex-wrap gap-2">
                {domains.map((domain) => (
                  <span
                    key={domain}
                    className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-neutral-700"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </section>

            <section aria-labelledby="vcard-links" className="space-y-3">
              <h2
                id="vcard-links"
                className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500"
              >
                Liens
              </h2>

              <div className="grid gap-3 sm:grid-cols-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </section>

            <details className="group rounded-2xl border border-neutral-200 bg-neutral-50/70 px-4 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    QR code
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Scanner ou partager la carte digitale.
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition group-open:rotate-180">
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

              <div className="mt-4 flex flex-col items-center gap-3 border-t border-neutral-200 pt-4 text-center">
                <Image
                  src={qrDataUrl}
                  alt="QR code vers la carte de visite digitale FabSystem"
                  width={140}
                  height={140}
                  unoptimized
                  className="h-[110px] w-[110px] rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm sm:h-[140px] sm:w-[140px]"
                />
                <p className="text-sm text-neutral-500">
                  Ouvre la carte mobile et le téléchargement de la vCard.
                </p>
              </div>
            </details>

            <p className="border-t border-neutral-200 pt-5 text-center text-sm text-neutral-500">
              www.fabsystem.fr
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

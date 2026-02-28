import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";

const contactUrl = "https://fabsystem.fr/vcard";
const phoneHref = "tel:+33698247722";
const emailHref = "mailto:fabien.lages@fabsystem.fr";
const websiteHref = "https://fabsystem.fr";

export const metadata: Metadata = {
  title: "Carte de visite",
  description:
    "Carte de visite mobile de Fabien Lages, avec téléchargement vCard et QR code.",
  alternates: {
    canonical: "/vcard",
  },
};

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 text-neutral-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.9 3.8h2.5a1.2 1.2 0 0 1 1.2 1l.5 3a1.2 1.2 0 0 1-.7 1.3l-1.7.8a14.7 14.7 0 0 0 5.4 5.4l.8-1.7a1.2 1.2 0 0 1 1.3-.7l3 .5a1.2 1.2 0 0 1 1 1.2v2.5a1.8 1.8 0 0 1-2 1.8A16.5 16.5 0 0 1 5 5.8a1.8 1.8 0 0 1 1.9-2Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 text-neutral-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 text-neutral-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14.5 14.5 0 0 1 0 18" />
      <path d="M12 3a14.5 14.5 0 0 0 0 18" />
    </svg>
  );
}

export default async function VCardPage() {
  const qrDataUrl = await QRCode.toDataURL(contactUrl, {
    margin: 1,
    width: 240,
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#edf2f7_52%,_#e5ebf2_100%)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex max-w-[420px] justify-center">
        <section className="relative w-full overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(255,255,255,0.92)_100%)] p-5 shadow-[0_28px_80px_-36px_rgba(15,23,42,0.55)] backdrop-blur sm:p-6">
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.7),transparent)]" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,_rgba(15,23,42,0.08),_transparent_68%)]" />

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#d7dce2] bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.65)]">
              <Image
                src="/logo.png"
                alt="Logo FabSystem"
                width={64}
                height={64}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-[0.01em] text-neutral-950">
                FabSystem
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
                Fabien Lages
              </h1>
              <p className="mt-1 text-sm leading-5 text-neutral-600">
                Électricité embarquée • Audit • Formation
              </p>
              <p className="mt-2 inline-flex rounded-full border border-[#e6dcc0] bg-[#fbf7ea] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#7a6120]">
                Carte de visite
              </p>
            </div>
          </div>

          <div className="my-5 h-px bg-[linear-gradient(90deg,transparent,#d5d9df,transparent)]" />

          <div className="space-y-3">
            <a
              href={phoneHref}
              className="flex items-center gap-3 rounded-2xl border border-[#e3e7ec] bg-[linear-gradient(180deg,_#fbfcfd_0%,_#f4f6f8_100%)] px-4 py-3 text-sm text-neutral-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
            >
              <PhoneIcon />
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  Téléphone
                </p>
                <span className="font-medium">06 98 24 77 22</span>
              </div>
            </a>
            <a
              href={emailHref}
              className="flex items-center gap-3 rounded-2xl border border-[#e3e7ec] bg-[linear-gradient(180deg,_#fbfcfd_0%,_#f4f6f8_100%)] px-4 py-3 text-sm text-neutral-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
            >
              <MailIcon />
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  Email
                </p>
                <span className="font-medium">fabien.lages@fabsystem.fr</span>
              </div>
            </a>
            <a
              href={websiteHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-[#e3e7ec] bg-[linear-gradient(180deg,_#fbfcfd_0%,_#f4f6f8_100%)] px-4 py-3 text-sm text-neutral-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
            >
              <GlobeIcon />
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  Site
                </p>
                <span className="font-medium">fabsystem.fr</span>
              </div>
            </a>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3">
            <Link
              href="/vcard.vcf"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,_#111827_0%,_#0f172a_100%)] px-4 py-3 text-base font-semibold text-white shadow-[0_18px_30px_-20px_rgba(15,23,42,0.9)] transition-transform transition-colors hover:bg-neutral-800 hover:scale-[0.995]"
            >
              Ajouter au contact
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={phoneHref}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#d9dee5] bg-white px-4 py-3 text-base font-medium text-neutral-900 shadow-[0_8px_18px_-18px_rgba(15,23,42,0.6)] transition-colors hover:bg-neutral-50"
              >
                Appeler
              </a>
              <a
                href={emailHref}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#d9dee5] bg-white px-4 py-3 text-base font-medium text-neutral-900 shadow-[0_8px_18px_-18px_rgba(15,23,42,0.6)] transition-colors hover:bg-neutral-50"
              >
                Email
              </a>
            </div>
            <a
              href={websiteHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#d9dee5] bg-white px-4 py-3 text-base font-medium text-neutral-900 shadow-[0_8px_18px_-18px_rgba(15,23,42,0.6)] transition-colors hover:bg-neutral-50"
            >
              Site
            </a>
          </div>

          <div className="mt-6 rounded-[24px] border border-[#e1e5ea] bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(246,247,249,0.96)_100%)] px-4 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <Image
              src={qrDataUrl}
              alt="QR code vers la carte de visite FabSystem"
              width={140}
              height={140}
              unoptimized
              className="mx-auto h-[140px] w-[140px] rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.7)]"
            />
            <p className="mt-3 text-sm font-medium text-neutral-700">
              Scannez pour enregistrer le contact
            </p>
            <p className="mt-1 text-xs text-neutral-500">{contactUrl}</p>
          </div>
        </section>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const phoneHref = "tel:+33698247722";
const emailHref = "mailto:fabien.lages@fabsystem.fr";

export const metadata: Metadata = {
  title: "Carte de visite",
  description:
    "Carte digitale FabSystem pour ajouter rapidement les coordonnées de Fabien Lages.",
  alternates: {
    canonical: "/vcard",
  },
};

export default function VCardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-6">
      <section className="w-full max-w-[420px] rounded-xl border border-neutral-200 bg-white p-6 shadow-md">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white">
            <Image
              src="/logo.png"
              alt="Logo FabSystem"
              width={56}
              height={56}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <div className="mt-4 space-y-1">
            <h1 className="text-xl font-semibold text-neutral-950">
              Fabien Lages
            </h1>
            <p className="text-base font-medium text-neutral-900">FabSystem</p>
            <p className="text-sm text-neutral-500">
              Électricité embarquée • Audit • Formation
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <Link
            href="/contact.vcf"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-900 px-4 py-3 text-base font-semibold text-white hover:bg-neutral-800"
          >
            Ajouter à mes contacts
          </Link>

          <a
            href={phoneHref}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-300 px-4 py-3 text-base font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Appeler
          </a>

          <a
            href={emailHref}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-300 px-4 py-3 text-base font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Email
          </a>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-500">
          www.fabsystem.fr
        </p>
      </section>
    </main>
  );
}

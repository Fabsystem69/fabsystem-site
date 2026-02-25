import PageHero from "@/components/PageHero";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit électrique nautique – conformité & sécurité | FabSystem",
  description:
    "Audit clair de votre installation électrique à bord : risques, priorités, recommandations concrètes. Visio ou sur place.",
  alternates: { canonical: "https://www.fabsystem.fr/audit-nautique" },
};

export default function AuditNautiquePage() {
  return (
    <main>
      <PageHero
        title="Audit électrique nautique – conformité & sécurité"
        subtitle="Diagnostic clair de votre installation à bord : risques, priorités et recommandations."
        background="/hero-fabsystem.png"
        overlay="bg-black/50"
        ctas={[
          { href: "/contact", label: "Demander un audit", variant: "primary" },
          { href: "/visio", label: "Découvrir la visio conseil", variant: "secondary" },
        ]}
      />

      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
        <h2 className="sr-only">Détails de l'audit</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-neutral-700 sm:text-base">
          Un diagnostic clair de votre installation électrique à bord : points sûrs,
          risques identifiés, priorités de correction et recommandations concrètes.
        </p>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16 mt-8 grid gap-6 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-xl border border-neutral-200">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/preuves/cable.png')" }} />
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative p-6 text-white">
            <h2 className="text-lg font-semibold">Ce que nous vérifions</h2>
            <ul className="mt-3 space-y-2 text-sm text-white">
              <li>• Sécurité générale (câbles, connexions, protections)</li>
              <li>• Points à risque (échauffements, surintensités, sections)</li>
              <li>• Architecture (batteries, charge, distribution)</li>
              <li>• 230V à bord (si présent)</li>
            </ul>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-neutral-200">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/preuves/victronbaylinermini.png')" }} />
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative p-6 text-white">
            <h2 className="text-lg font-semibold">Ce que vous recevez</h2>
            <ul className="mt-3 space-y-2 text-sm text-white">
              <li>• Bilan clair : OK / à surveiller / à corriger</li>
              <li>• Corrections priorisées (urgent → confort)</li>
              <li>• Recos matériel si nécessaire</li>
              <li>• Plan d’action simple</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/contact"
          className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
        >
          Demander un audit
        </Link>
        <Link
          href="/visio"
          className="inline-flex w-full items-center justify-center rounded-md border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 sm:w-auto"
        >
          Découvrir la visio conseil
        </Link>
      </div>
    </main>
  );
}

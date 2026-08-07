import type { Metadata } from "next";
import { PrestationsNeedsForm } from "@/components/prestations/PrestationsNeedsForm";

export const metadata: Metadata = {
  title: "Votre projet",
  description: "Parlez-nous de votre projet avant de finaliser votre accompagnement FabSystem.",
  robots: {
    index: false,
  },
};

export default function PanierProjetPage() {
  return (
    <main className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Avant le paiement
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Parlez-nous de votre projet
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
            Quelques informations rapides pour que Fabien puisse vous recontacter avec le bon
            niveau de préparation, dès votre paiement confirmé.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
        <PrestationsNeedsForm />
      </section>
    </main>
  );
}

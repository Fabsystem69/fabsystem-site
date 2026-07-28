import type { Metadata } from "next";
import EbookCheckoutForm from "@/components/EbookCheckoutForm";

export const metadata: Metadata = {
  title: "Ebook « Câbler son van sans se planter » — FabSystem",
  description:
    "Le guide pas à pas pour câbler l'électricité de votre van aménagé sans risque : sections de câble, protections, schémas.",
  alternates: { canonical: "/ebook" },
};

export default function EbookPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Câbler son van sans se planter</h1>
      <p className="mt-4 text-neutral-600">
        Le guide pas à pas pour dimensionner et câbler l&apos;installation
        électrique de votre van, sans mettre en danger vos batteries ni votre
        sécurité. Format interactif (quiz inclus), en version bureau et
        version poche, avec un exemplaire personnalisé à votre nom.
      </p>

      <div className="mt-10 rounded-lg border border-neutral-200 p-6">
        <EbookCheckoutForm />
      </div>
    </main>
  );
}

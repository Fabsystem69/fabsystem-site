import type { Metadata } from "next";
import { ConnexionClientForms } from "@/app/connexion-client/ConnexionClientForms";

export const metadata: Metadata = {
  title: "Connexion client",
  description: "Connectez-vous à votre espace client FabSystem.",
  alternates: {
    canonical: "/connexion-client",
  },
  robots: { index: false, follow: false },
};

export default function ConnexionClientPage() {
  return (
    <main className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Accès client
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Connexion client
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
              Accédez à votre espace client FabSystem avec votre email et votre mot de passe.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
        <ConnexionClientForms />
      </section>
    </main>
  );
}

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

// Chemin relatif uniquement (jamais un domaine externe) — evite qu'un lien
// returnTo fabrique par un tiers redirige un client vers un site externe
// apres connexion (open redirect).
function sanitizeReturnTo(value: string | undefined) {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export default async function ConnexionClientPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo: rawReturnTo } = await searchParams;
  const returnTo = sanitizeReturnTo(rawReturnTo);

  return (
    <main className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Accès client
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Créer ou accéder à votre compte
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
              {returnTo
                ? "Connectez-vous (ou créez votre compte) pour accéder à votre téléchargement — vous y serez ramené automatiquement."
                : "Retrouvez vos projets, achats, téléchargements et futurs accompagnements depuis un espace FabSystem unique."}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
        <ConnexionClientForms returnTo={returnTo} />
      </section>
    </main>
  );
}

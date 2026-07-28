import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merci pour votre achat — FabSystem",
  robots: { index: false, follow: false },
};

export default function EbookMerciPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">Merci pour votre achat !</h1>
      <p className="mt-4 text-neutral-600">
        Votre paiement a bien été reçu. Vous allez recevoir un email dans
        quelques minutes avec un lien personnel pour télécharger votre
        exemplaire de l&apos;ebook.
      </p>
      <p className="mt-2 text-sm text-neutral-500">
        Pensez à vérifier vos spams si vous ne le voyez pas rapidement.
      </p>
    </main>
  );
}

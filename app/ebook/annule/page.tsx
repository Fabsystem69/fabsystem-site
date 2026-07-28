import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Achat annulé — FabSystem",
  robots: { index: false, follow: false },
};

export default function EbookAnnulePage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">Achat annulé</h1>
      <p className="mt-4 text-neutral-600">
        Votre paiement n&apos;a pas été finalisé, vous n&apos;avez rien été
        débité.
      </p>
      <Link href="/ebook" className="mt-6 inline-block underline">
        Retourner à la page de l&apos;ebook
      </Link>
    </main>
  );
}

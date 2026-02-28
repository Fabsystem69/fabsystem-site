import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

async function findQuote(id: string) {
  return prisma.quote.findUnique({
    where: { id },
    select: {
      id: true,
      number: true,
    },
  });
}

export default async function DashboardQuotePdfViewerPage({ params }: Params) {
  const { id } = await params;
  let quote: Awaited<ReturnType<typeof findQuote>> = null;

  try {
    quote = await findQuote(id);
  } catch (error) {
    return (
      <main className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {getDatabaseErrorMessage(error)}
      </main>
    );
  }

  if (!quote) {
    notFound();
  }

  const pdfUrl = `/api/internal/quotes/${quote.id}/pdf`;
  const backUrl = `/dashboard/quotes/${quote.id}`;

  return (
    <main className="flex min-h-[100dvh] flex-col bg-white">
      <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link
            href={backUrl}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-900"
          >
            Retour au devis
          </Link>
          <Link
            href={pdfUrl}
            target="_blank"
            className="inline-flex min-h-9 items-center justify-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white"
          >
            Ouvrir le PDF
          </Link>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 px-4 py-4">
        <div className="flex w-full flex-1 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
          <div className="border-b border-neutral-200 px-4 py-3 text-sm text-neutral-600">
            {quote.number} — aperçu mobile. Utilisez “Retour au devis” pour fermer.
          </div>
          <iframe
            title={`PDF ${quote.number}`}
            src={pdfUrl}
            className="min-h-[75dvh] w-full flex-1 bg-white"
          />
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import type { Customer, Quote, QuoteItem } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";

function formatEuroFromCents(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value / 100);
}

export default async function DashboardQuotesPage() {
  let quotes: Array<
    Quote & {
      customer: Customer;
      items: QuoteItem[];
    }
  > = [];
  let databaseError: string | null = null;

  try {
    quotes = await prisma.quote.findMany({
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    databaseError = getDatabaseErrorMessage(error);
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">Devis</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Liste minimale des devis enregistrés en base.
          </p>
        </div>
        <Link
          href="/dashboard/quotes/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Nouveau devis
        </Link>
      </div>

      {databaseError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {databaseError}
        </div>
      ) : null}

      <section className="rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Numéro</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Lignes</th>
              <th className="px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-neutral-500">
                  Aucun devis pour l’instant.
                </td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {quote.number}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {quote.customer.name}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{quote.status}</td>
                  <td className="px-4 py-3 text-neutral-600">{quote.items.length}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatEuroFromCents(quote.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

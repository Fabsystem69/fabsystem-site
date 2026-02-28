import Link from "next/link";
import type { Quote } from "@/lib/generated/prisma/client";
import {
  DOCUMENTS_PAGE_SIZE,
  getQuotesPage,
  normalizeSearchQuery,
  parsePageParam,
} from "@/lib/document-list";
import { formatEuroFromCents } from "@/lib/format";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";
import { formatServiceBadge } from "@/lib/service-meta";

type SearchParams = Promise<{
  page?: string;
  q?: string;
}>;

function buildPageHref(page: number, query: string) {
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  if (page > 1) {
    params.set("page", String(page));
  }

  const search = params.toString();
  return `/dashboard/quotes${search ? `?${search}` : ""}`;
}

export default async function DashboardQuotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = normalizeSearchQuery(params.q);
  const page = parsePageParam(params.page);
  let quotes: Array<
    Quote & {
      customer: {
        id: string;
        name: string;
        email: string | null;
      };
      _count: {
        items: number;
      };
    }
  > = [];
  let currentPage = page;
  let totalPages = 1;
  let totalCount = 0;
  let databaseError: string | null = null;

  try {
    const result = await getQuotesPage(query, page);
    quotes = result.quotes;
    currentPage = result.currentPage;
    totalPages = result.totalPages;
    totalCount = result.totalCount;
  } catch (error) {
    databaseError = getDatabaseErrorMessage(error);
  }

  return (
    <main className="space-y-6 pb-24 md:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <form className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label
              htmlFor="quote-search"
              className="mb-2 block text-sm font-medium text-neutral-700"
            >
              Recherche
            </label>
            <input
              id="quote-search"
              name="q"
              defaultValue={query}
              placeholder="Rechercher un client…"
              className="h-11 w-full rounded-md border border-neutral-300 px-3 text-base"
            />
          </div>
          <input type="hidden" name="page" value="1" />
          <button
            type="submit"
            className="h-11 rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white"
          >
            Rechercher
          </button>
          <Link
            href="/dashboard/quotes"
            className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900"
          >
            Réinitialiser
          </Link>
        </form>
        {!databaseError ? (
          <p className="mt-3 text-sm text-neutral-500">
            {totalCount} résultat{totalCount > 1 ? "s" : ""} affiché
            {totalCount > 1 ? "s" : ""} • {DOCUMENTS_PAGE_SIZE} par page
          </p>
        ) : null}
      </section>

      {databaseError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {databaseError}
        </div>
      ) : null}

      <section className="hidden rounded-lg border border-neutral-200 bg-white md:block">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Numéro</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Lignes</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-neutral-500">
                  {query ? "Aucun résultat." : "Aucun devis pour l’instant."}
                </td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    <Link
                      href={`/dashboard/quotes/${quote.id}`}
                      className="underline underline-offset-2"
                    >
                      {quote.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <div>
                      <p>{quote.customer.name}</p>
                      <p className="text-xs text-neutral-500">
                        {formatServiceBadge(quote.serviceType, quote.deliveryMode)}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{quote.status}</td>
                  <td className="px-4 py-3 text-neutral-600">{quote._count.items}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatEuroFromCents(quote.total)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <Link
                      href={`/dashboard/quotes/${quote.id}/edit`}
                      className="underline underline-offset-2"
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="space-y-3 md:hidden">
        {quotes.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
            {query ? "Aucun résultat." : "Aucun devis pour l’instant."}
          </div>
        ) : (
          quotes.map((quote) => (
            <article key={quote.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/dashboard/quotes/${quote.id}`}
                    className="text-base font-semibold text-neutral-900 underline underline-offset-2"
                  >
                    {quote.number}
                  </Link>
                  <p className="mt-1 text-sm text-neutral-600">{quote.customer.name}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatServiceBadge(quote.serviceType, quote.deliveryMode)}
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                  {quote.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-neutral-600">
                <div className="rounded-lg bg-neutral-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Lignes</p>
                  <p className="mt-1 font-medium text-neutral-900">{quote._count.items}</p>
                </div>
                <div className="rounded-lg bg-neutral-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Total</p>
                  <p className="mt-1 font-medium text-neutral-900">
                    {formatEuroFromCents(quote.total)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Link
                  href={`/dashboard/quotes/${quote.id}`}
                  className="flex-1 rounded-md border border-neutral-300 px-4 py-3 text-center text-sm font-semibold text-neutral-900"
                >
                  Ouvrir
                </Link>
                <Link
                  href={`/dashboard/quotes/${quote.id}/edit`}
                  className="flex-1 rounded-md bg-neutral-900 px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Modifier
                </Link>
              </div>
            </article>
          ))
        )}
      </section>

      {!databaseError && totalPages > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-neutral-600">
            Page {currentPage} / {totalPages}
          </span>
          <div className="flex gap-3">
            <Link
              href={buildPageHref(Math.max(1, currentPage - 1), query)}
              aria-disabled={currentPage <= 1}
              className={`inline-flex h-10 items-center justify-center rounded-md border px-4 font-semibold ${
                currentPage <= 1
                  ? "pointer-events-none border-neutral-200 text-neutral-400"
                  : "border-neutral-300 text-neutral-900"
              }`}
            >
              Précédent
            </Link>
            <Link
              href={buildPageHref(Math.min(totalPages, currentPage + 1), query)}
              aria-disabled={currentPage >= totalPages}
              className={`inline-flex h-10 items-center justify-center rounded-md border px-4 font-semibold ${
                currentPage >= totalPages
                  ? "pointer-events-none border-neutral-200 text-neutral-400"
                  : "border-neutral-300 text-neutral-900"
              }`}
            >
              Suivant
            </Link>
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 p-4 backdrop-blur md:hidden">
        <Link
          href="/dashboard/quotes/new"
          className="mx-auto flex h-11 w-full max-w-6xl items-center justify-center rounded-md bg-neutral-900 px-4 text-base font-semibold text-white"
        >
          Nouveau devis
        </Link>
      </div>
    </main>
  );
}

import Link from "next/link";
import type { Invoice, Remise } from "@/lib/generated/prisma/client";
import {
  DOCUMENTS_PAGE_SIZE,
  getInvoicesPage,
  getRemisesPage,
  normalizeSearchQuery,
  parsePageParam,
} from "@/lib/document-list";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";
import { formatServiceBadge } from "@/lib/service-meta";

type SearchParams = Promise<{
  page?: string;
  q?: string;
  tab?: string;
}>;

function buildPageHref(page: number, query: string, tab: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  if (tab === "remises") params.set("tab", "remises");
  const search = params.toString();
  return `/dashboard/invoices${search ? `?${search}` : ""}`;
}

function TabNav({ activeTab }: { activeTab: string }) {
  const base =
    "inline-flex h-10 items-center border-b-2 px-4 text-sm font-semibold transition-colors";
  const active = "border-neutral-900 text-neutral-900";
  const inactive =
    "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700";

  return (
    <div className="flex border-b border-neutral-200">
      <Link
        href="/dashboard/invoices"
        className={`${base} ${activeTab === "factures" ? active : inactive}`}
      >
        Factures
      </Link>
      <Link
        href="/dashboard/invoices?tab=remises"
        className={`${base} ${activeTab === "remises" ? active : inactive}`}
      >
        Remises
      </Link>
    </div>
  );
}

export default async function DashboardInvoicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = normalizeSearchQuery(params.q);
  const page = parsePageParam(params.page);
  const tab = params.tab === "remises" ? "remises" : "factures";

  if (tab === "remises") {
    return <RemisesTab query={query} page={page} />;
  }

  return <FacturesTab query={query} page={page} />;
}

async function FacturesTab({
  query,
  page,
}: {
  query: string;
  page: number;
}) {
  let invoices: Array<
    Invoice & {
      customer: { id: string; name: string; email: string | null };
      _count: { items: number };
    }
  > = [];
  let currentPage = page;
  let totalPages = 1;
  let totalCount = 0;
  let databaseError: string | null = null;

  try {
    const result = await getInvoicesPage(query, page);
    invoices = result.invoices;
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
          <h1 className="text-3xl font-semibold text-neutral-900">Factures</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Liste minimale des factures enregistrées en base.
          </p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Nouvelle facture
        </Link>
      </div>

      <TabNav activeTab="factures" />

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <form className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label
              htmlFor="invoice-search"
              className="mb-2 block text-sm font-medium text-neutral-700"
            >
              Recherche
            </label>
            <input
              id="invoice-search"
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
            href="/dashboard/invoices"
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
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-neutral-500">
                  {query ? "Aucun résultat." : "Aucune facture pour l'instant."}
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    <Link
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="underline underline-offset-2"
                    >
                      {invoice.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <div>
                      <p>{invoice.customer.name}</p>
                      <p className="text-xs text-neutral-500">
                        {formatServiceBadge(
                          invoice.serviceType,
                          invoice.deliveryMode
                        )}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {invoice.status}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {invoice._count.items}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatEuroFromCents(invoice.total)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <Link
                      href={`/dashboard/invoices/${invoice.id}/edit`}
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
        {invoices.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
            {query ? "Aucun résultat." : "Aucune facture pour l'instant."}
          </div>
        ) : (
          invoices.map((invoice) => (
            <article
              key={invoice.id}
              className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="text-base font-semibold text-neutral-900 underline underline-offset-2"
                  >
                    {invoice.number}
                  </Link>
                  <p className="mt-1 text-sm text-neutral-600">
                    {invoice.customer.name}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatServiceBadge(
                      invoice.serviceType,
                      invoice.deliveryMode
                    )}
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                  {invoice.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-neutral-600">
                <div className="rounded-lg bg-neutral-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Lignes
                  </p>
                  <p className="mt-1 font-medium text-neutral-900">
                    {invoice._count.items}
                  </p>
                </div>
                <div className="rounded-lg bg-neutral-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Total
                  </p>
                  <p className="mt-1 font-medium text-neutral-900">
                    {formatEuroFromCents(invoice.total)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Link
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="flex-1 rounded-md border border-neutral-300 px-4 py-3 text-center text-sm font-semibold text-neutral-900"
                >
                  Ouvrir
                </Link>
                <Link
                  href={`/dashboard/invoices/${invoice.id}/edit`}
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
              href={buildPageHref(
                Math.max(1, currentPage - 1),
                query,
                "factures"
              )}
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
              href={buildPageHref(
                Math.min(totalPages, currentPage + 1),
                query,
                "factures"
              )}
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
          href="/dashboard/invoices/new"
          className="mx-auto flex h-11 w-full max-w-6xl items-center justify-center rounded-md bg-neutral-900 px-4 text-base font-semibold text-white"
        >
          Nouvelle facture
        </Link>
      </div>
    </main>
  );
}

async function RemisesTab({ query, page }: { query: string; page: number }) {
  let remises: Array<
    Remise & {
      customer: { id: string; name: string; email: string | null };
      invoice: { id: string; number: string } | null;
    }
  > = [];
  let currentPage = page;
  let totalPages = 1;
  let totalCount = 0;
  let databaseError: string | null = null;

  try {
    const result = await getRemisesPage(query, page);
    remises = result.remises;
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
          <h1 className="text-3xl font-semibold text-neutral-900">Factures</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Remises et avoirs enregistrés en base.
          </p>
        </div>
        <Link
          href="/dashboard/invoices/remises/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Nouvelle remise
        </Link>
      </div>

      <TabNav activeTab="remises" />

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <form className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label
              htmlFor="remise-search"
              className="mb-2 block text-sm font-medium text-neutral-700"
            >
              Recherche
            </label>
            <input
              id="remise-search"
              name="q"
              defaultValue={query}
              placeholder="Rechercher un client ou un motif…"
              className="h-11 w-full rounded-md border border-neutral-300 px-3 text-base"
            />
          </div>
          <input type="hidden" name="tab" value="remises" />
          <input type="hidden" name="page" value="1" />
          <button
            type="submit"
            className="h-11 rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white"
          >
            Rechercher
          </button>
          <Link
            href="/dashboard/invoices?tab=remises"
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
              <th className="px-4 py-3 font-medium">Montant</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Facture liée</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {remises.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-neutral-500">
                  {query ? "Aucun résultat." : "Aucune remise pour l'instant."}
                </td>
              </tr>
            ) : (
              remises.map((remise) => (
                <tr key={remise.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {remise.number}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {remise.customer.name}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {remise.status}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatEuroFromCents(remise.amount)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatDate(remise.date)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {remise.invoice ? (
                      <Link
                        href={`/dashboard/invoices/${remise.invoice.id}`}
                        className="underline underline-offset-2"
                      >
                        {remise.invoice.number}
                      </Link>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="space-y-3 md:hidden">
        {remises.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
            {query ? "Aucun résultat." : "Aucune remise pour l'instant."}
          </div>
        ) : (
          remises.map((remise) => (
            <article
              key={remise.id}
              className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-neutral-900">
                    {remise.number}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {remise.customer.name}
                  </p>
                  {remise.reason ? (
                    <p className="mt-1 text-xs text-neutral-500">
                      {remise.reason}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                  {remise.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-neutral-600">
                <div className="rounded-lg bg-neutral-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Montant
                  </p>
                  <p className="mt-1 font-medium text-neutral-900">
                    {formatEuroFromCents(remise.amount)}
                  </p>
                </div>
                <div className="rounded-lg bg-neutral-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Date
                  </p>
                  <p className="mt-1 font-medium text-neutral-900">
                    {formatDate(remise.date)}
                  </p>
                </div>
              </div>
              {remise.invoice ? (
                <div className="mt-3">
                  <Link
                    href={`/dashboard/invoices/${remise.invoice.id}`}
                    className="text-sm underline underline-offset-2"
                  >
                    Facture liée : {remise.invoice.number}
                  </Link>
                </div>
              ) : null}
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
              href={buildPageHref(
                Math.max(1, currentPage - 1),
                query,
                "remises"
              )}
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
              href={buildPageHref(
                Math.min(totalPages, currentPage + 1),
                query,
                "remises"
              )}
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
          href="/dashboard/invoices/remises/new"
          className="mx-auto flex h-11 w-full max-w-6xl items-center justify-center rounded-md bg-neutral-900 px-4 text-base font-semibold text-white"
        >
          Nouvelle remise
        </Link>
      </div>
    </main>
  );
}

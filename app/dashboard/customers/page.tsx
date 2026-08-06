import Link from "next/link";
import { CustomerCreateForm } from "@/components/dashboard/CustomerCreateForm";
import { formatCustomerAssetSummary } from "@/lib/customer-asset";
import { formatCustomerDisplayName } from "@/lib/format";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";
import {
  getCustomersPage,
  normalizeCustomerSearchQuery,
  parseCustomerLimitParam,
  parseCustomerPageParam,
} from "@/lib/services/customers";

export default async function DashboardCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    new?: string;
    search?: string;
    page?: string;
    limit?: string;
  }>;
}) {
  const params = await searchParams;
  let customers: Awaited<ReturnType<typeof getCustomersPage>>["customers"] = [];
  let databaseError: string | null = null;
  let totalCount = 0;
  let totalPages = 1;
  let currentPage = 1;
  let pageSize = 20;
  const search = normalizeCustomerSearchQuery(params.search);
  const requestedPage = parseCustomerPageParam(params.page);
  const requestedLimit = parseCustomerLimitParam(params.limit);

  try {
    ({
      customers,
      totalCount,
      totalPages,
      currentPage,
      pageSize,
    } = await getCustomersPage({
      search,
      page: requestedPage,
      limit: requestedLimit,
    }));
  } catch (error) {
    databaseError = getDatabaseErrorMessage(error);
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">Clients</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Base clients paginée pour devis, factures et suivi matériel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form className="flex items-center gap-2" method="get">
            <input type="hidden" name="limit" value={String(pageSize)} />
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Rechercher un client"
              className="h-10 rounded-md border border-neutral-300 px-3 text-sm text-neutral-900"
            />
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            >
              Rechercher
            </button>
          </form>
          <Link
            href={`/dashboard/customers?new=1${search ? `&search=${encodeURIComponent(search)}` : ""}`}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Nouveau client
          </Link>
        </div>
      </div>

      {databaseError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {databaseError}
        </div>
      ) : null}

      {params.new === "1" && !databaseError ? <CustomerCreateForm /> : null}

      {!databaseError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-600">
          <p>
            {totalCount} client{totalCount > 1 ? "s" : ""} au total
            {search ? ` pour “${search}”` : ""}.
          </p>
          <div className="flex items-center gap-2">
            <span>Page</span>
            <span className="rounded-md border border-neutral-200 px-2 py-1 text-neutral-900">
              {currentPage} / {totalPages}
            </span>
          </div>
        </div>
      ) : null}

      <section className="rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Téléphone</th>
              <th className="px-4 py-3 font-medium">Équipement</th>
              <th className="px-4 py-3 font-medium">Créé le</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-neutral-500">
                  Aucun client pour l’instant.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="underline underline-offset-2"
                    >
                      {formatCustomerDisplayName(customer)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {customer.email || "-"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {customer.phone || "-"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatCustomerAssetSummary(customer) || "-"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Intl.DateTimeFormat("fr-FR").format(customer.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <Link
                      href={`/dashboard/customers/${customer.id}/edit`}
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

      {!databaseError ? (
        <div className="flex items-center justify-between gap-3">
          {currentPage > 1 ? (
            <Link
              href={`/dashboard/customers?page=${currentPage - 1}&limit=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900"
            >
              Page précédente
            </Link>
          ) : (
            <span />
          )}
          {currentPage < totalPages ? (
            <Link
              href={`/dashboard/customers?page=${currentPage + 1}&limit=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900"
            >
              Page suivante
            </Link>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}

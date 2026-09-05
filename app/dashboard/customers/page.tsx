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
import {
  DashboardPageShell,
  AdminAlert,
  AdminButton,
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminSearchInput,
  AdminTable,
  adminTableBodyClass,
  adminTableCellClass,
  adminTableCellStrongClass,
  adminTableHeadCellClass,
  adminTableHeadClass,
  adminTableRowClass,
} from "@/components/dashboard/ui";

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
    <DashboardPageShell>
        <AdminPageHeader
          title="Clients"
          backHref="/dashboard"
          backLabel="Retour au dashboard"
          description={
            search
              ? `Résultats pour "${search}".`
              : "Commandes, accès aux téléchargements et suivi matériel des clients."
          }
          actions={
            <>
              <form className="flex items-center gap-2" method="get">
                <input type="hidden" name="limit" value={String(pageSize)} />
                <AdminSearchInput type="search" name="search" defaultValue={search} placeholder="Rechercher un client" />
                <AdminButton type="submit">Rechercher</AdminButton>
              </form>
              <AdminButton
                variant="primary"
                href={`/dashboard/customers?new=1${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              >
                Nouveau client
              </AdminButton>
            </>
          }
        />

        {databaseError ? <AdminAlert tone="warning">{databaseError}</AdminAlert> : null}

        {params.new === "1" && !databaseError ? <CustomerCreateForm /> : null}

        {!databaseError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-500">
            <p>
              {totalCount} client{totalCount > 1 ? "s" : ""} au total
              {search ? ` pour "${search}"` : ""}.
            </p>
            <div className="flex items-center gap-2">
              <span>Page</span>
              <span className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-200">
                {currentPage} / {totalPages}
              </span>
            </div>
          </div>
        ) : null}

        {customers.length === 0 && !databaseError ? (
          <AdminEmptyState title="Aucun client pour l'instant." />
        ) : !databaseError ? (
          <AdminTable>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeadCellClass}>Nom</th>
                <th className={adminTableHeadCellClass}>Email</th>
                <th className={adminTableHeadCellClass}>Téléphone</th>
                <th className={adminTableHeadCellClass}>Équipement</th>
                <th className={adminTableHeadCellClass}>Créé le</th>
                <th className={adminTableHeadCellClass}>Actions</th>
              </tr>
            </thead>
            <tbody className={adminTableBodyClass}>
              {customers.map((customer) => (
                <tr key={customer.id} className={adminTableRowClass}>
                  <td className={adminTableCellStrongClass}>
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="underline underline-offset-2 hover:text-brand-300"
                    >
                      {formatCustomerDisplayName(customer)}
                    </Link>
                  </td>
                  <td className={adminTableCellClass}>{customer.email || "-"}</td>
                  <td className={adminTableCellClass}>{customer.phone || "-"}</td>
                  <td className={adminTableCellClass}>{formatCustomerAssetSummary(customer) || "-"}</td>
                  <td className={adminTableCellClass}>{new Intl.DateTimeFormat("fr-FR").format(customer.createdAt)}</td>
                  <td className={adminTableCellClass}>
                    <Link
                      href={`/dashboard/customers/${customer.id}/edit`}
                      className="underline underline-offset-2 hover:text-brand-300"
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : null}

        {!databaseError ? (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            buildHref={(page) =>
              `/dashboard/customers?page=${page}&limit=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ""}`
            }
          />
        ) : null}
  </DashboardPageShell>
  );
}

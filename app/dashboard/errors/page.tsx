import Link from "next/link";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";
import { formatCustomerDisplayName } from "@/lib/format";
import { getErrorReportsPage, parseErrorReportPageParam } from "@/lib/services/error-reports";
import {
  AdminAlert,
  AdminButton,
  AdminEmptyState,
  AdminPageHeader,
  AdminTable,
  adminTableBodyClass,
  adminTableCellClass,
  adminTableCellStrongClass,
  adminTableHeadCellClass,
  adminTableHeadClass,
  adminTableRowClass,
} from "@/components/dashboard/ui";

// Retour utilisateur : "avoir les remontées d'erreur avec l'id du client
// directement dans mon dashboard" — jusqu'ici les erreurs serveur (5xx)
// n'existaient que dans les logs Vercel, sans lien vers le compte concerné
// (voir l'audit du 19/08 : il a fallu recouper IP + horodatage + une
// requête SQL manuelle sur Neon pour identifier un client). Lecture seule,
// même principe que le reste du dashboard admin — voir lib/services/error-reports.ts
// pour ce qui est réellement journalisé ici (uniquement les 5xx, pas les 4xx
// attendus comme la validation ou le rate-limit).
export default async function DashboardErrorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const requestedPage = parseErrorReportPageParam(params.page);

  let reports: Awaited<ReturnType<typeof getErrorReportsPage>>["reports"] = [];
  let databaseError: string | null = null;
  let totalCount = 0;
  let totalPages = 1;
  let currentPage = 1;

  try {
    ({ reports, totalCount, totalPages, currentPage } = await getErrorReportsPage({ page: requestedPage }));
  } catch (error) {
    databaseError = getDatabaseErrorMessage(error);
  }

  return (
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Erreurs"
          description="Erreurs serveur (5xx) survenues sur le site, avec le client concerné quand une session était identifiée."
        />

        {databaseError ? <AdminAlert tone="warning">{databaseError}</AdminAlert> : null}

        {!databaseError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-500">
            <p>
              {totalCount} erreur{totalCount > 1 ? "s" : ""} au total.
            </p>
            <div className="flex items-center gap-2">
              <span>Page</span>
              <span className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-200">
                {currentPage} / {totalPages}
              </span>
            </div>
          </div>
        ) : null}

        {reports.length === 0 && !databaseError ? (
          <AdminEmptyState title="Aucune erreur enregistrée." />
        ) : !databaseError ? (
          <AdminTable>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeadCellClass}>Date</th>
                <th className={adminTableHeadCellClass}>Route</th>
                <th className={adminTableHeadCellClass}>Message</th>
                <th className={adminTableHeadCellClass}>Statut</th>
                <th className={adminTableHeadCellClass}>Client</th>
              </tr>
            </thead>
            <tbody className={adminTableBodyClass}>
              {reports.map((report) => (
                <tr key={report.id} className={adminTableRowClass}>
                  <td className={adminTableCellClass}>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium" }).format(report.createdAt)}</td>
                  <td className={adminTableCellClass}>
                    <code className="text-xs">{report.route}</code>
                  </td>
                  <td className={`${adminTableCellClass} max-w-md`}>{report.message}</td>
                  <td className={adminTableCellClass}>{report.statusCode}</td>
                  <td className={adminTableCellStrongClass}>
                    {report.customer ? (
                      <Link
                        href={`/dashboard/customers/${report.customer.id}`}
                        className="underline underline-offset-2 hover:text-brand-300"
                      >
                        {formatCustomerDisplayName(report.customer)}
                      </Link>
                    ) : (
                      <span className="text-neutral-500">Anonyme</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : null}

        {!databaseError ? (
          <div className="flex items-center justify-between gap-3">
            {currentPage > 1 ? (
              <AdminButton href={`/dashboard/errors?page=${currentPage - 1}`}>Page précédente</AdminButton>
            ) : (
              <span />
            )}
            {currentPage < totalPages ? (
              <AdminButton href={`/dashboard/errors?page=${currentPage + 1}`}>Page suivante</AdminButton>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}

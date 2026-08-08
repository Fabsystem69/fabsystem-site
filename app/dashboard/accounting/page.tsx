import Link from "next/link";
import { getUrssafSummary, parseAccountingYear } from "@/lib/accounting";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";
import {
  AdminAlert,
  AdminCard,
  AdminPageHeader,
  AdminTable,
  adminTableBodyClass,
  adminTableCellClass,
  adminTableHeadCellClass,
  adminTableHeadClass,
  adminTableRowClass,
} from "@/components/dashboard/ui";

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const linkButtonClass =
  "inline-flex h-10 items-center rounded-lg border border-neutral-700 bg-neutral-900 px-4 text-sm font-semibold text-neutral-200 transition-colors duration-150 hover:bg-neutral-800";
const primaryLinkButtonClass =
  "inline-flex h-10 items-center rounded-lg bg-brand-400 px-4 text-sm font-semibold text-neutral-950 transition-colors duration-150 hover:bg-brand-300";

export default async function DashboardAccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = parseAccountingYear(params.year);
  let summary: Awaited<ReturnType<typeof getUrssafSummary>> | null = null;
  let databaseError: string | null = null;

  try {
    summary = await getUrssafSummary(year);
  } catch (error) {
    databaseError = getDatabaseErrorMessage(error);
  }

  return (
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Récap URSSAF"
          description="Chiffre d'affaires encaissé et livre des recettes pour la micro-entreprise."
          actions={
            <form className="flex items-end gap-3">
              <div>
                <label htmlFor="year" className="mb-2 block text-sm font-medium text-neutral-400">
                  Année
                </label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  min="2000"
                  max="2100"
                  defaultValue={year}
                  className="h-10 w-28 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100 outline-none focus:border-neutral-500"
                />
              </div>
              <button type="submit" className={primaryLinkButtonClass}>
                Charger
              </button>
            </form>
          }
        />

        {databaseError ? <AdminAlert tone="warning">{databaseError}</AdminAlert> : null}

        {summary ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5">
                <p className="text-sm text-neutral-400">CA encaissé</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatEuroFromCents(summary.totals.paidCents)}</p>
              </div>
              <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5">
                <p className="text-sm text-neutral-400">Nb encaissements</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.totals.paidCount}</p>
              </div>
              <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5">
                <p className="text-sm text-neutral-400">CA facturé</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatEuroFromCents(summary.totals.billedCents)}</p>
              </div>
            </section>

            <AdminCard title="Exports">
              <div className="flex flex-wrap gap-3">
                <Link href={`/api/internal/accounting/urssaf.csv?year=${year}`} className={linkButtonClass}>
                  CSV livre des recettes
                </Link>
                <Link href={`/api/internal/accounting/urssaf-quarters.csv?year=${year}`} className={linkButtonClass}>
                  CSV trimestres
                </Link>
                <Link href={`/api/internal/accounting/urssaf.pdf?year=${year}`} target="_blank" className={primaryLinkButtonClass}>
                  PDF récap
                </Link>
              </div>
            </AdminCard>

            <AdminCard title="CA encaissé (URSSAF) par trimestre">
              <div className="grid gap-3 md:grid-cols-4">
                {summary.quarters.map((quarter) => (
                  <article key={quarter.quarter} className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-4">
                    <p className="text-sm text-neutral-500">T{quarter.quarter}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatEuroFromCents(quarter.paidCents)}</p>
                    <p className="mt-1 text-sm text-neutral-400">
                      {quarter.paidCount} encaissement{quarter.paidCount > 1 ? "s" : ""}
                    </p>
                  </article>
                ))}
              </div>
            </AdminCard>

            <section className="grid gap-4 md:grid-cols-2">
              <AdminCard title="CA encaissé par type">
                <div className="space-y-3">
                  {summary.totalsByServiceType.map((item) => (
                    <div
                      key={item.serviceType}
                      className="flex items-center justify-between rounded-xl border border-neutral-800/80 bg-neutral-950/40 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-white">{item.serviceType}</p>
                        <p className="text-sm text-neutral-500">{item.paidCount} encaissement(s)</p>
                      </div>
                      <p className="font-semibold text-neutral-100">{formatEuroFromCents(item.paidCents)}</p>
                    </div>
                  ))}
                </div>
              </AdminCard>

              <AdminCard title="CA encaissé par mode">
                <div className="space-y-3">
                  {summary.totalsByDeliveryMode.map((item) => (
                    <div
                      key={item.deliveryMode}
                      className="flex items-center justify-between rounded-xl border border-neutral-800/80 bg-neutral-950/40 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-white">{item.deliveryMode}</p>
                        <p className="text-sm text-neutral-500">{item.paidCount} encaissement(s)</p>
                      </div>
                      <p className="font-semibold text-neutral-100">{formatEuroFromCents(item.paidCents)}</p>
                    </div>
                  ))}
                </div>
              </AdminCard>
            </section>

            <div>
              <h2 className="mb-3 text-base font-semibold text-white">Mensuel</h2>
              <AdminTable>
                <thead className={adminTableHeadClass}>
                  <tr>
                    <th className={adminTableHeadCellClass}>Mois</th>
                    <th className={adminTableHeadCellClass}>CA encaissé</th>
                    <th className={adminTableHeadCellClass}>Nb encaissements</th>
                  </tr>
                </thead>
                <tbody className={adminTableBodyClass}>
                  {summary.months.map((month, index) => (
                    <tr key={month.month} className={adminTableRowClass}>
                      <td className={adminTableCellClass}>{MONTH_LABELS[index]}</td>
                      <td className={adminTableCellClass}>{formatEuroFromCents(month.paidCents)}</td>
                      <td className={adminTableCellClass}>{month.paidCount}</td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            </div>

            <div>
              <h2 className="mb-3 text-base font-semibold text-white">Livre des recettes</h2>
              <AdminTable>
                <thead className={adminTableHeadClass}>
                  <tr>
                    <th className={adminTableHeadCellClass}>Date encaissement</th>
                    <th className={adminTableHeadCellClass}>Client</th>
                    <th className={adminTableHeadCellClass}>N° facture</th>
                    <th className={adminTableHeadCellClass}>Montant encaissé</th>
                    <th className={adminTableHeadCellClass}>Mode</th>
                    <th className={adminTableHeadCellClass}>Référence</th>
                  </tr>
                </thead>
                <tbody className={adminTableBodyClass}>
                  {summary.receipts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-neutral-500">
                        Aucun encaissement pour cette année.
                      </td>
                    </tr>
                  ) : (
                    summary.receipts.map((receipt) => (
                      <tr key={`${receipt.invoiceNumber}-${receipt.paidAt.toISOString()}`} className={adminTableRowClass}>
                        <td className={adminTableCellClass}>{formatDate(receipt.paidAt)}</td>
                        <td className={adminTableCellClass}>{receipt.customerName}</td>
                        <td className={adminTableCellClass}>{receipt.invoiceNumber}</td>
                        <td className={adminTableCellClass}>{formatEuroFromCents(receipt.totalCents)}</td>
                        <td className={adminTableCellClass}>{receipt.paymentMethod || "-"}</td>
                        <td className={adminTableCellClass}>{receipt.paymentRef || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </AdminTable>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
